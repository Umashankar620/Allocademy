import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../lib/auth.js';

export type AuthLocals = { user: TokenPayload };

export function authMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const authHeader = _req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    (res as Response & { locals: AuthLocals }).locals = { user: payload };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireStudent(_req: Request, res: Response, next: NextFunction): void {
  const locals = (res as Response & { locals: AuthLocals }).locals;
  if (!locals?.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (locals.user.role !== 'student') {
    res.status(403).json({ error: 'Student access only' });
    return;
  }
  next();
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  const locals = (res as Response & { locals: AuthLocals }).locals;
  if (!locals?.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access only' });
    return;
  }
  next();
}
