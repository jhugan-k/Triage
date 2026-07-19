import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { authenticateToken, AuthRequest } from './middleware';

// --- INITIALIZATION ---
dotenv.config();
const prisma = new PrismaClient();
const app = express();

// Fail fast rather than silently signing tokens with a guessable fallback secret.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

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

// Render/Vercel put us behind a proxy; without this the rate limiter would see
// the proxy's IP for every request and throttle all users as one.
app.set('trust proxy', 1);

// --- RATE LIMITS ---
// Credential endpoints: slow brute force without punishing normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

// Access keys are only 6 hex chars, so an unthrottled /join is enumerable.
const joinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many join attempts. Try again shortly." },
});

// --- HELPERS ---
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const logActivity = async (dashboardId: string, text: string, type: string) => {
  await prisma.activity.create({
    data: { dashboardId, text, type }
  });
};

// Returns the bug only if the requesting user is a member of its dashboard.
const findBugForMember = async (bugId: string, userId?: string) => {
  if (!userId) return null;
  return prisma.bug.findFirst({
    where: { id: bugId, dashboard: { members: { some: { id: userId } } } }
  });
};

// ==========================================
// 1. AUTHENTICATION
// ==========================================

const signToken = (user: { id: string; email: string }) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

// Registration is explicit. Login no longer creates accounts, so a typo'd email
// fails loudly instead of silently stranding the user in a new empty account.
app.post('/auth/register', authLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "An account with that email already exists. Try signing in." });

    const displayName = (typeof name === 'string' && name.trim()) || email.split('@')[0];
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        name: displayName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
      }
    });

    const { password: _password, ...safeUser } = user;
    return res.status(201).json({ message: "Account created", user: safeUser, token: signToken(user), newUser: true });
  } catch (error) {
    console.error("[REGISTER ERROR]:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Same message for unknown email and wrong password: don't leak which emails exist.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { password: _password, ...safeUser } = user;
    return res.json({ message: "Login successful", user: safeUser, token: signToken(user), newUser: false });
  } catch (error) {
    console.error("[AUTH ERROR]:", error);
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
  const userId = (req as AuthRequest).user?.id;
  try {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id, members: { some: { id: userId } } },
      include: {
        members: { select: { id: true, name: true, avatarUrl: true, email: true } },
        activities: { take: 15, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!dashboard) return res.status(404).json({ error: "Not found" });
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
      data: { name, accessKey, ownerId: userId, members: { connect: { id: userId } } }
    });
    await logActivity(dashboard.id, `Workspace "${name}" initialized.`, "SYSTEM_INIT");
    return res.json({ message: "Created", dashboard });
  } catch (error) {
    return res.status(500).json({ error: "Creation failed" });
  }
});

app.post('/dashboards/join', joinLimiter, authenticateToken, async (req: Request, res: Response) => {
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

// Only the owner may destroy a workspace — anyone can hold the access key.
app.delete('/dashboards/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as AuthRequest).user?.id;

  try {
    const dashboard = await prisma.dashboard.findUnique({ where: { id } });
    if (!dashboard) return res.status(404).json({ error: "Not found" });
    if (dashboard.ownerId !== userId) {
      return res.status(403).json({ error: "Only the workspace owner can delete it. You can leave instead." });
    }

    const bugs = await prisma.bug.findMany({ where: { dashboardId: id }, select: { id: true } });
    const bugIds = bugs.map(b => b.id);

    // Children hold FKs to the workspace; clear them first or the delete fails.
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { bugId: { in: bugIds } } }),
      prisma.bug.deleteMany({ where: { dashboardId: id } }),
      prisma.activity.deleteMany({ where: { dashboardId: id } }),
      prisma.dashboard.delete({ where: { id } })
    ]);
    return res.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("[DELETE DASHBOARD]:", error);
    return res.status(500).json({ error: "Delete failed" });
  }
});

// Leaving only drops your own membership. If the owner leaves, ownership passes
// to the earliest remaining member; if nobody is left, the workspace is removed
// rather than orphaned.
app.post('/dashboards/:id/leave', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as AuthRequest).user?.id;
  const userEmail = (req as AuthRequest).user?.email;

  try {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id, members: { some: { id: userId } } },
      include: { members: { orderBy: { createdAt: 'asc' }, select: { id: true } } }
    });
    if (!dashboard) return res.status(404).json({ error: "Not a member of this workspace" });

    await prisma.dashboard.update({
      where: { id },
      data: { members: { disconnect: { id: userId } } }
    });

    const remaining = dashboard.members.filter(m => m.id !== userId);
    if (remaining.length === 0) {
      const bugs = await prisma.bug.findMany({ where: { dashboardId: id }, select: { id: true } });
      await prisma.$transaction([
        prisma.comment.deleteMany({ where: { bugId: { in: bugs.map(b => b.id) } } }),
        prisma.bug.deleteMany({ where: { dashboardId: id } }),
        prisma.activity.deleteMany({ where: { dashboardId: id } }),
        prisma.dashboard.delete({ where: { id } })
      ]);
      return res.json({ message: "Left workspace; it was empty and has been removed" });
    }

    if (dashboard.ownerId === userId) {
      await prisma.dashboard.update({ where: { id }, data: { ownerId: remaining[0].id } });
    }
    await logActivity(id, `${userEmail} left the workspace.`, "USER_LEAVE");
    return res.json({ message: "Left workspace" });
  } catch (error) {
    console.error("[LEAVE DASHBOARD]:", error);
    return res.status(500).json({ error: "Leave failed" });
  }
});

// ==========================================
// 3. BUG MANAGEMENT (WITH SMART RETRY AI)
// ==========================================

const VALID_SEVERITIES = ["High", "Normal", "Low"] as const;

/**
 * Classifies a bug after it has already been saved and returned to the client.
 * Runs detached, so a cold AI service delays the severity label, never the report.
 * On exhaustion the bug stays `Pending` — we no longer pretend everything is High.
 */
const classifyBugInBackground = async (bugId: string, title: string, description: string, dashboardId: string) => {
  const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/classify';
  const maxAttempts = 12; // ~60s of cold-start tolerance

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[AI ATTEMPT ${attempt}] bug=${bugId} -> ${AI_URL}`);
      const aiRes = await axios.post(AI_URL, { title, description }, {
        timeout: 45000,
        headers: { 'Content-Type': 'application/json' }
      });

      const severity = aiRes.data?.severity;
      if (!VALID_SEVERITIES.includes(severity)) {
        console.error(`[AI BAD RESPONSE] bug=${bugId} severity=${severity}`);
        break;
      }

      await prisma.bug.update({ where: { id: bugId }, data: { severity } });
      await logActivity(dashboardId, `Triage AI classified "${title}" as ${severity}`, "BUG_CLASSIFIED");
      console.log(`[AI SUCCESS] bug=${bugId} -> ${severity}`);
      return;
    } catch (err: any) {
      const statusCode = err.response?.status;
      const retryable =
        [429, 502, 503, 504].includes(statusCode) ||
        ['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'].includes(err.code);

      if (!retryable || attempt === maxAttempts) {
        console.error(`[AI FATAL] bug=${bugId}: ${err.message} (status ${statusCode})`);
        break;
      }
      const waitTime = statusCode === 429 ? 6000 : 5000;
      console.log(`[AI RETRY ${statusCode || err.code}] bug=${bugId}: waiting ${waitTime / 1000}s`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }

  // Left Pending on purpose: an unclassified bug is visible as such and can be
  // set by hand, which is honest in a way that a fake "High" is not.
  await logActivity(dashboardId, `Triage AI could not classify "${title}" — needs manual severity`, "BUG_UNCLASSIFIED");
  console.log(`[AI GAVE UP] bug=${bugId} left Pending`);
};

app.post('/bugs', authenticateToken, async (req: Request, res: Response) => {
  const { title, description, dashboardId } = req.body;
  const userId = (req as AuthRequest).user?.id;

  if (!title || !description || !dashboardId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const isMember = await prisma.dashboard.findFirst({
    where: { id: dashboardId, members: { some: { id: userId } } }
  });
  if (!isMember) return res.status(403).json({ error: "Forbidden" });

  try {
    const bug = await prisma.bug.create({
      data: { title, description, severity: 'Pending', dashboardId }
    });
    await logActivity(dashboardId, `New bug reported: ${title}`, "BUG_CREATED");

    // Respond first; classification catches up in the background.
    res.status(202).json({ message: "Bug reported", bug });

    void classifyBugInBackground(bug.id, title, description, dashboardId)
      .catch(err => console.error(`[AI TASK CRASH] bug=${bug.id}:`, err));
    return;
  } catch (error) {
    return res.status(500).json({ error: "Database save failed" });
  }
});

app.get('/dashboards/:id/bugs', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  const userId = (req as AuthRequest).user?.id;
  try {
    const isMember = await prisma.dashboard.findFirst({
      where: { id, members: { some: { id: userId } } }
    });
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

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
  const userId = (req as AuthRequest).user?.id;
  try {
    if (!await findBugForMember(id, userId)) return res.status(403).json({ error: "Forbidden" });

    const bug = await prisma.bug.update({ where: { id }, data: { status: 'RESOLVED' } });
    await logActivity(bug.dashboardId, `Resolved: ${bug.title}`, "BUG_RESOLVED");
    return res.json(bug);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.patch('/bugs/:id/reopen', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as AuthRequest).user?.id;
  try {
    if (!await findBugForMember(id, userId)) return res.status(403).json({ error: "Forbidden" });

    const bug = await prisma.bug.update({ where: { id }, data: { status: 'OPEN' } });
    await logActivity(bug.dashboardId, `Reopened: ${bug.title}`, "BUG_REOPENED");
    return res.json(bug);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

// Edit title/description, and set severity by hand — the escape hatch when the
// AI leaves a bug Pending.
app.patch('/bugs/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as AuthRequest).user?.id;
  const { title, description, severity } = req.body;

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  if (description !== undefined && !String(description).trim()) {
    return res.status(400).json({ error: "Description cannot be empty" });
  }
  if (severity !== undefined && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: "Invalid severity" });
  }

  try {
    if (!await findBugForMember(id, userId)) return res.status(403).json({ error: "Forbidden" });

    const bug = await prisma.bug.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(severity !== undefined && { severity }),
      },
      include: { comments: { include: { user: { select: { name: true, avatarUrl: true } } } } }
    });
    if (severity !== undefined) {
      await logActivity(bug.dashboardId, `Severity of "${bug.title}" set to ${severity}`, "BUG_SEVERITY_SET");
    } else {
      await logActivity(bug.dashboardId, `Updated: ${bug.title}`, "BUG_UPDATED");
    }
    return res.json(bug);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.post('/bugs/:id/comments', authenticateToken, async (req: Request, res: Response) => {
  const bugId = req.params.id as string; // FIX: Explicit cast
  const userId = (req as AuthRequest).user?.id;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Comment text is required" });

  try {
    if (!await findBugForMember(bugId, userId)) return res.status(403).json({ error: "Forbidden" });

    const comment = await prisma.comment.create({
      data: { text, bugId, userId: userId! },
      include: { user: { select: { name: true, avatarUrl: true } } }
    });
    return res.json(comment);
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.delete('/bugs/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string; // FIX: Explicit cast
  const userId = (req as AuthRequest).user?.id;
  try {
    if (!await findBugForMember(id, userId)) return res.status(403).json({ error: "Forbidden" });

    // Comments hold an FK to the bug; clear them first or the delete violates the constraint.
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { bugId: id } }),
      prisma.bug.delete({ where: { id } })
    ]);
    return res.json({ message: "Deleted" });
  } catch (error) { return res.status(500).json({ error: "Failed" }); }
});

app.get('/', (req, res) => res.json({ status: "Online" }));

app.get("/health", (req, res) => {
  console.log("[HEALTH PING]: received at", new Date().toISOString());
  res.json({ status: "ok" });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 DEPLOYED: Triage Backend is listening on port ${PORT}`);
});