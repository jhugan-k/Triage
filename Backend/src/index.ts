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

const PORT = process.env.PORT || 4001; 

// --- FIXED CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://triage-teal.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
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

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    let isNewUser = false;
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      isNewUser = true;
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: email,
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
    console.error("[AUTH ERROR]:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

// ==========================================
// 2. WORKSPACE MANAGEMENT (DASHBOARDS)
// ==========================================

app.get('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    const data = await prisma.user.findUnique({
      where: { id: userId },
      include: { dashboards: true }
    });
    return res.json(data?.dashboards || []);
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
});

app.get('/dashboards/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: id },
      include: { 
        members: { select: { id: true, name: true, avatarUrl: true, email: true } },
        activities: { take: 15, orderBy: { createdAt: 'desc' } }
      }
    });
    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ error: "Could not fetch dashboard" });
  }
});

app.post('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!name || !userId) {
    return res.status(400).json({ error: "Name and User ID required" });
  }

  try {
    const accessKey = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dashboard = await prisma.dashboard.create({
      data: {
        name: name,
        accessKey: accessKey,
        members: { connect: { id: userId } }
      }
    });
    await logActivity(dashboard.id, `Workspace "${name}" initialized.`, "SYSTEM_INIT");
    return res.json({ message: "Dashboard created!", dashboard });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create dashboard" });
  }
});

app.post('/dashboards/join', authenticateToken, async (req: Request, res: Response) => {
  const { accessKey } = req.body;
  const userId = (req as AuthRequest).user?.id;
  const userEmail = (req as AuthRequest).user?.email;

  if (!accessKey || !userId) {
    return res.status(400).json({ error: "Access Key required" });
  }

  try {
    const dashboard = await prisma.dashboard.findUnique({ where: { accessKey: accessKey } });
    if (!dashboard) {
      return res.status(404).json({ error: "Invalid Access Key" });
    }
    await prisma.dashboard.update({
      where: { id: dashboard.id },
      data: { members: { connect: { id: userId } } }
    });
    await logActivity(dashboard.id, `${userEmail} joined the workspace.`, "USER_JOIN");
    return res.json({ message: `Joined ${dashboard.name}`, dashboardId: dashboard.id });
  } catch (error) {
    return res.status(500).json({ error: "Failed to join" });
  }
});

app.delete('/purge-workspace/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.activity.deleteMany({ where: { dashboardId: id } });
    await prisma.bug.deleteMany({ where: { dashboardId: id } });
    await prisma.dashboard.delete({ where: { id: id } });
    return res.json({ message: "Purged" });
  } catch (e) {
    return res.status(500).json({ error: "Purge failed" });
  }
});

// ==========================================
// 3. BUG MANAGEMENT (AI INTEGRATION)
// ==========================================

app.post('/bugs', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, dashboardId } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!title || !description || !dashboardId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const isMember = await prisma.dashboard.findFirst({
      where: { id: dashboardId, members: { some: { id: userId } } }
    });
    if (!isMember) {
      return res.status(403).json({ error: "Unauthorized access to dashboard" });
    }

    let severity = "Normal";
    try {
      const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/classify';
      const aiRes = await axios.post(AI_URL, { title, description });
      severity = aiRes.data.severity;
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

    await logActivity(dashboardId, `New bug reported: ${title} (${severity})`, "BUG_CREATED");
    return res.json({ message: "Bug reported", bug });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create bug" });
  }
});

app.get('/dashboards/:id/bugs', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const bugs = await prisma.bug.findMany({
      where: { dashboardId: id },
      include: { comments: { include: { user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(bugs);
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
});

app.patch('/bugs/:id/resolve', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const bug = await prisma.bug.update({
      where: { id: id },
      data: { status: 'RESOLVED' }
    });
    await logActivity(bug.dashboardId, `Bug resolved: ${bug.title}`, "BUG_RESOLVED");
    return res.json(bug);
  } catch (error) {
    return res.status(500).json({ error: "Resolution failed" });
  }
});

app.post('/bugs/:id/comments', authenticateToken, async (req: Request, res: Response) => {
  const { text } = req.body;
  const userId = (req as AuthRequest).user?.id;
  const bugId = req.params.id as string;

  if (!text || !userId) {
    return res.status(400).json({ error: "Comment text required" });
  }

  try {
    const comment = await prisma.comment.create({
      data: { text, bugId: bugId, userId: userId }
    });
    return res.json(comment);
  } catch (error) {
    return res.status(500).json({ error: "Comment failed" });
  }
});

app.delete('/bugs/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.bug.delete({ where: { id: id } });
    return res.json({ message: "Bug deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Delete failed" });
  }
});

// --- SYSTEM ROUTES ---
app.get('/', (req: Request, res: Response) => { 
  res.json({ status: "Triage Backend Online" });
});

app.listen(PORT, () => {
  console.log(`🚀 DEPLOYED: Triage Backend is listening at http://localhost:${PORT}`);
});