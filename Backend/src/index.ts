import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { authenticateToken, AuthRequest } from './middleware'; // Import from file 1

// --- CONFIG ---
dotenv.config();
const prisma = new PrismaClient();
const app = express();
// Use 4001 to avoid conflicts with previous runs
const PORT = process.env.PORT || 4001; 

app.use(cors());
app.use(express.json());

console.log("-----------------------------------------");
console.log(`STARTING SERVER ON PORT ${PORT}...`);

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// Dev Login (No Google required)
app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const user = await prisma.user.upsert({
      where: { email: email },
      update: { name: name || "Anonymous" },
      create: { 
        email: email, 
        name: name || "Anonymous",
        avatarUrl: `https://ui-avatars.com/api/?name=${name || "User"}`
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", user, token });
    console.log(`-> Login: ${email}`);

  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ==========================================
// 2. DASHBOARD ROUTES
// ==========================================

// Create Dashboard
app.post('/dashboards', authenticateToken, async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!name || !userId) return; // TS guard

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
    console.log(`-> New Dashboard: ${name} (${accessKey})`);
  } catch (error) {
    res.status(500).json({ error: "Failed to create dashboard" });
  }
});

// Join Dashboard
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
    console.log(`-> User ${userId} joined ${dashboard.id}`);
  } catch (error) {
    res.status(500).json({ error: "Failed to join" });
  }
});

// Get My Dashboards
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

// ==========================================
// 3. BUG ROUTES (AI INTEGRATION)
// ==========================================

app.post('/bugs', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, dashboardId } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!title || !description || !dashboardId) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  try {
    // Check Membership
    const isMember = await prisma.dashboard.findFirst({
      where: { id: dashboardId, members: { some: { id: userId } } }
    });
    if (!isMember) {
      res.status(403).json({ error: "Not a member" });
      return;
    }

    // Call Python AI
    let severity = "Normal";
    try {
      const aiRes = await axios.post('http://127.0.0.1:8000/classify', {
        title, description
      });
      severity = aiRes.data.severity;
      console.log(`-> AI Predicted: ${severity}`);
    } catch (err) {
      console.error("-> AI Offline. Defaulting to Normal.");
    }

    // Save Bug
    const bug = await prisma.bug.create({
      data: {
        title,
        description,
        severity: severity as any, // Cast string to Enum
        dashboardId
      }
    });

    res.json({ message: "Bug created", bug });

  } catch (error) {
    console.error("Bug Error:", error);
    res.status(500).json({ error: "Failed to create bug" });
  }
});

// Get Bugs
app.get('/dashboards/:id/bugs', authenticateToken, async (req: Request, res: Response) => {
  // FIX: Force cast to string to satisfy Prisma
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

// ==========================================
// 4. SYSTEM ROUTES
// ==========================================
app.get('/', (req, res) => res.json({ status: "Triage Backend Online" }));
app.get('/health', async (req, res) => {
  try {
    await prisma.user.count();
    res.json({ status: "Database Connected" });
  } catch (e) {
    res.status(500).json({ status: "Database Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});