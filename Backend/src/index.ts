import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from './middleware';

// --- INITIALIZATION ---
dotenv.config();
const prisma = new PrismaClient();
const app = express();

// RENDER FIX: Use the PORT provided by Render, or 10000 as a fallback (Render default)
const PORT = process.env.PORT || 10000; 

// --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://triage-teal.vercel.app" // Ensure this matches your Vercel URL exactly
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// --- HELPERS ---
const logActivity = async (dashboardId: string, text: string, type: string) => {
  await prisma.activity.create({
    data: { dashboardId, text, type }
  });
};

// ==========================================
// 1. AUTHENTICATION
// ==========================================

app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    } else {
      isNewUser = true;
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: email.split('@')[0],
          avatarUrl: `https://ui-avatars.com/api/?name=${email}`
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    return res.json({ message: "Login successful", user, token, newUser: isNewUser });
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
});

// ==========================================
// 2. DASHBOARD MANAGEMENT
// ==========================================

app.get('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    const data = await prisma.user.findUnique({ where: { id: userId }, include: { dashboards: true } });
    return res.json(data?.dashboards || []);
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
});

app.get('/dashboards/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: { 
        members: { select: { id: true, name: true, avatarUrl: true, email: true } },
        activities: { take: 15, orderBy: { createdAt: 'desc' } }
      }
    });
    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
});

app.post('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = (req as AuthRequest).user?.id;
  if (!name || !userId) return res.status(400).json({ error: "Data missing" });

  try {
    const accessKey = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dashboard = await prisma.dashboard.create({
      data: { name, accessKey, members: { connect: { id: userId } } }
    });
    await logActivity(dashboard.id, `Workspace "${name}" initialized.`, "SYSTEM_INIT");
    return res.json({ message: "Created", dashboard });
  } catch (error) {
    return res.status(500).json({ error: "Creation failed" });
  }
});

app.post('/dashboards/join', authenticateToken, async (req: Request, res: Response) => {
  const { accessKey } = req.body;
  const userId = (req as AuthRequest).user?.id;
  const userEmail = (req as AuthRequest).user?.email;

  try {
    const dashboard = await prisma.dashboard.findUnique({ where: { accessKey } });
    if (!dashboard) return res.status(404).json({ error: "Key invalid" });

    await prisma.dashboard.update({
      where: { id: dashboard.id },
      data: { members: { connect: { id: userId } } }
    });
    await logActivity(dashboard.id, `${userEmail} joined.`, "USER_JOIN");
    return res.json({ message: "Joined", dashboardId: dashboard.id });
  } catch (error) {
    return res.status(500).json({ error: "Join failed" });
  }
});

// ==========================================
// 3. BUG MANAGEMENT (WITH SMART RETRY AI)
// ==========================================

app.post('/bugs', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, dashboardId } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!title || !description || !dashboardId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 1. Permission Check
  const isMember = await prisma.dashboard.findFirst({
    where: { id: dashboardId, members: { some: { id: userId } } }
  });
  if (!isMember) return res.status(403).json({ error: "Forbidden" });

  // 2. AI Logic with Aggressive Retry Loop
  let severity: "High" | "Normal" | "Low" = "High"; 
  const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/classify';
  
  const maxAttempts = 12; // Try for ~60 seconds total
  let attempt = 0;
  let aiSuccess = false;

  while (attempt < maxAttempts && !aiSuccess) {
    attempt++;
    try {
      console.log(`[AI ATTEMPT ${attempt}]: Calling ${AI_URL}...`);
      
      const aiRes = await axios.post(AI_URL, { title, description }, { 
        timeout: 45000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      severity = aiRes.data.severity;
      aiSuccess = true;
      console.log(`[AI SUCCESS]: Result: ${severity}`);

    } catch (err: any) {
      const statusCode = err.response?.status;
      
      // FIX: Added 429 and 504 to the "Waking Up" signals
      const isRetryableError = 
        [429, 502, 503, 504].includes(statusCode) || 
        err.code === 'ECONNREFUSED' || 
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT';

      if (isRetryableError && attempt < maxAttempts) {
        // If it's a 429, we wait a bit longer (6s instead of 5s) to let the rate limit reset
        const waitTime = statusCode === 429 ? 6000 : 5000;
        console.log(`[AI RETRYABLE ERROR ${statusCode || err.code}]: Service not ready. Retrying in ${waitTime/1000}s...`);
        await new Promise(r => setTimeout(r, waitTime)); 
      } else {
        // This is a 400, 401, 404, etc. - No point in retrying
        console.error(`[AI FATAL ERROR]: ${err.message} (Status: ${statusCode})`);
        break; 
      }
    }
  }

  if (!aiSuccess) {
    console.log("[AI FALLBACK]: All retries exhausted. Using High Severity safety protocol.");
  }

  // 3. Save to Database
  try {
    const bug = await prisma.bug.create({
      data: { 
        title, 
        description, 
        severity: severity as any, 
        dashboardId 
      }
    });
    await logActivity(dashboardId, `New bug: ${title} (${severity})`, "BUG_CREATED");
    return res.json({ message: "Bug reported", bug });
  } catch (error) {
    return res.status(500).json({ error: "Database save failed" });
  }
});

app.get('/dashboards/:id/bugs', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  try {
    const bugs = await prisma.bug.findMany({
      where: { dashboardId: id },
      include: { comments: { include: { user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(bugs);
  } catch (error) { return res.status(500).json({ error: "Fetch failed" }); }
});

app.patch('/bugs/:id/resolve', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  try {
    const bug = await prisma.bug.update({ where: { id }, data: { status: 'RESOLVED' } });
    await logActivity(bug.dashboardId, `Resolved: ${bug.title}`, "BUG_RESOLVED");
    return res.json(bug);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.post('/bugs/:id/comments', authenticateToken, async (req: Request, res: Response) => {
  const bugId = req.params.id as string; // FIX: Explicit cast
  try {
    const comment = await prisma.comment.create({
      data: { 
        text: req.body.text, 
        bugId: bugId, 
        userId: (req as AuthRequest).user!.id 
      }
    });
    return res.json(comment);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.delete('/bugs/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  try {
    await prisma.bug.delete({ where: { id } });
    return res.json({ message: "Deleted" });
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.get('/', (req, res) => res.json({ status: "Online" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 DEPLOYED: Triage Backend is listening on port ${PORT}`);
});