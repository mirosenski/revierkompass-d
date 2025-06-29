import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { generateTokens, verifyRefreshToken, revokeRefreshToken } from '../lib/jwt';
import { validate, loginSchema, registerSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Ungültige Anmeldedaten oder Konto deaktiviert' 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Generate tokens
    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      message: 'Erfolgreich angemeldet',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Anmeldefehler' });
  }
});

// POST /api/auth/register (Admin only)
router.post('/register', authenticateToken, validate(registerSchema), async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzer existiert bereits' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Benutzer erfolgreich erstellt',
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registrierungsfehler' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh-Token erforderlich' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database and is not revoked
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: {
          select: { id: true, email: true, role: true, isActive: true }
        }
      },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Refresh-Token' });
    }

    if (!tokenRecord.user.isActive) {
      return res.status(401).json({ error: 'Benutzer deaktiviert' });
    }

    // Generate new tokens
    const tokens = await generateTokens({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    res.json({
      message: 'Token erfolgreich erneuert',
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Token-Erneuerung fehlgeschlagen' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Erfolgreich abgemeldet' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Abmeldefehler' });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Profils' });
  }
});

export default router;
