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

// Render sets the PORT environment variable automatically
const PORT = process.env.PORT || 4001; 

// --- MIDDLEWARE ---
// Configure CORS to allow your local environment and your future Vercel URL
// --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://triage-teal.vercel.app" // Your specific Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS Blocked Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

console.log("-----------------------------------------");
console.log(`SYSTEM: Initializing Triage Engine on Port ${PORT}`);
console.log("-----------------------------------------");

// ==========================================
// 1. AUTHENTICATION
// ==========================================

app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    // 1. Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (user) {
      // 2. User exists, verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
    } else {
      // 3. User doesn't exist, create new account (Signup on first login)
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: email.split('@')[0], // Default name from email
          avatarUrl: `https://ui-avatars.com/api/?name=${email}`
        }
      });
      console.log(`[AUTH] New account created for: ${email}`);
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", user, token });
    console.log(`[AUTH] Session initialized for: ${email}`);

  } catch (error) {
    console.error("[AUTH ERROR]:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// ==========================================
// 2. WORKSPACE MANAGEMENT (DASHBOARDS)
// ==========================================

// Get All User Dashboards
app.get('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    const data = await prisma.user.findUnique({
      where: { id: userId },
      include: { dashboards: true }
    });
    res.json(data?.dashboards || []);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// Get Specific Dashboard Details
app.get('/dashboards/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id as string }
    });
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch dashboard" });
  }
});

// Create New Dashboard
app.post('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!name || !userId) return;

  try {
    const accessKey = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dashboard = await prisma.dashboard.create({
      data: {
        name: name,
        accessKey: accessKey,
        members: { connect: { id: userId } }
      }
    });
    res.json({ message: "Dashboard created!", dashboard });
    console.log(`[DB] Created Workspace: ${name} (${accessKey})`);
  } catch (error) {
    res.status(500).json({ error: "Failed to create dashboard" });
  }
});

// Join Existing Dashboard via Key
app.post('/dashboards/join', authenticateToken, async (req: Request, res: Response) => {
  const { accessKey } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!accessKey || !userId) return;

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { accessKey: accessKey }
    });

    if (!dashboard) {
      res.status(404).json({ error: "Invalid Access Key" });
      return;
    }

    await prisma.dashboard.update({
      where: { id: dashboard.id },
      data: { members: { connect: { id: userId } } }
    });

    res.json({ message: `Joined ${dashboard.name}`, dashboardId: dashboard.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to join" });
  }
});

// Full Workspace Purge (Dashboard + Bugs)
app.delete('/purge-workspace/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.bug.deleteMany({ where: { dashboardId: id } });
    await prisma.dashboard.delete({ where: { id: id } });
    console.log(`[DB] Purged Workspace: ${id}`);
    res.json({ message: "Purged" });
  } catch (e) {
    res.status(500).json({ error: "Purge failed" });
  }
});

// ==========================================
// 3. BUG MANAGEMENT (AI INTEGRATION)
// ==========================================

// Create Bug with AI Classification
app.post('/bugs', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, dashboardId } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!title || !description || !dashboardId) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  try {
    const isMember = await prisma.dashboard.findFirst({
      where: { id: dashboardId, members: { some: { id: userId } } }
    });
    if (!isMember) {
      res.status(403).json({ error: "Unauthorized access to dashboard" });
      return;
    }

    // Call Cloud/Local AI Service
    let severity = "Normal";
    try {
      const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/classify';
      const aiRes = await axios.post(AI_URL, { title, description });
      severity = aiRes.data.severity;
      console.log(`[AI] Analyzed: ${title} -> Predicted: ${severity}`);
    } catch (err) {
      console.error("[AI ERROR]: Service offline, using fallback.");
    }

    const bug = await prisma.bug.create({
      data: {
        title,
        description,
        severity: severity as any,
        dashboardId
      }
    });

    res.json({ message: "Bug reported", bug });
  } catch (error) {
    res.status(500).json({ error: "Failed to create bug" });
  }
});

// Get All Bugs for a Dashboard
app.get('/dashboards/:id/bugs', authenticateToken, async (req: Request, res: Response) => {
  const dashboardId = req.params.id as string;
  try {
    const bugs = await prisma.bug.findMany({
      where: { dashboardId: dashboardId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bugs);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// Update Bug Status to Resolved
app.patch('/bugs/:id/resolve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bug = await prisma.bug.update({
      where: { id: req.params.id as string },
      data: { status: 'RESOLVED' }
    });
    res.json(bug);
  } catch (error) {
    res.status(500).json({ error: "Resolution failed" });
  }
});

// Delete Specific Bug
app.delete('/bugs/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await prisma.bug.delete({
      where: { id: req.params.id as string }
    });
    res.json({ message: "Bug deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// 4. SYSTEM ROUTES
// ==========================================

app.get('/', (req: Request, res: Response) => { 
  res.json({ status: "Triage Backend Online", environment: process.env.NODE_ENV || "development" });
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.user.count();
    res.json({ status: "OK", database: "CONNECTED" });
  } catch (e) {
    res.status(500).json({ status: "ERROR", database: "DISCONNECTED" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 DEPLOYED: Triage Backend is listening at http://localhost:${PORT}`);
});