import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Define custom type so TypeScript knows 'req.user' exists
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// 2. The Guard Function
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) {
    res.status(401).json({ error: "Access Denied: No Token Provided" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid Token" });
      return;
    }
    
    // Attach user to request
    (req as AuthRequest).user = user;
    next();
  });
};