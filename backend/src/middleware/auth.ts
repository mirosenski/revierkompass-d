import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token erforderlich' });
    }

    // Verify token
    const payload = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden oder deaktiviert' });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentifizierung erforderlich' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Unzureichende Berechtigung',
        required: allowedRoles,
        current: req.user.role 
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

// Log user actions for audit trail
export const logAction = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action,
            entity,
            entityId: req.params.id || 'unknown',
            details: {
              method: req.method,
              path: req.path,
              body: req.body,
              query: req.query,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          },
        });
      } catch (error) {
        console.error('Audit log error:', error);
        // Don't fail the request if audit logging fails
      }
    }
    next();
  };
};
