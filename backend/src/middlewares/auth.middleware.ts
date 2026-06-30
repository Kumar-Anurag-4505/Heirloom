import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'heirloom-super-secret-key-change-in-production';

export interface UserRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export const requireAuth = (req: UserRequest, res: Response, next: NextFunction): void => {
  let token = req.cookies?.heirloom_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No active session token found.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: ''
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Session token is invalid or expired.',
      data: null,
      timestamp: new Date().toISOString(),
      requestId: ''
    });
  }
};
