import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables (just to be safe)
dotenv.config();

// Initialize Prisma - NO ARGUMENTS needed now
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: "API is running", service: "Triage Backend" });
});

// Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Try to count users to prove DB connection works
    await prisma.user.count(); 
    res.json({ database: "Connected", status: "OK" });
  } catch (error) {
    res.status(500).json({ database: "Disconnected", error: String(error) });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});