import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin, logAction } from '../middleware/auth';
import { validate, createUserSchema, updateUserSchema } from '../middleware/validation';

const router = express.Router();

// GET /api/users - Admin only
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20',
      search,
      role,
      isActive 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (search) {
      where.email = { contains: search as string, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: parseInt(limit as string),
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              addresses: true,
              auditLogs: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
  }
});

// GET /api/users/:id - Admin only
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            name: true,
            city: true,
            isVerified: true,
            createdAt: true,
          },
          where: { isActive: true },
        },
        _count: {
          select: {
            addresses: true,
            auditLogs: true,
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Benutzers' });
  }
});

// POST /api/users - Admin only
router.post('/', 
  authenticateToken, 
  requireAdmin,
  validate(createUserSchema),
  logAction('create', 'user'),
  async (req, res) => {
    try {
      const { email, password, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Benutzer mit dieser E-Mail existiert bereits' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

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
          isActive: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        message: 'Benutzer erfolgreich erstellt',
        user,
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen des Benutzers' });
    }
  }
);

// PUT /api/users/:id - Admin only
router.put('/:id', 
  authenticateToken, 
  requireAdmin,
  validate(updateUserSchema),
  logAction('update', 'user'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData: any = { ...req.body };

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // Check email uniqueness if updating email
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          return res.status(400).json({ error: 'E-Mail wird bereits verwendet' });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
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

      res.json({
        message: 'Benutzer erfolgreich aktualisiert',
        user,
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Benutzers' });
    }
  }
);

// DELETE /api/users/:id - Admin only (Soft delete by deactivating)
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  logAction('delete', 'user'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user!.userId) {
        return res.status(400).json({ error: 'Sie können Ihr eigenes Konto nicht löschen' });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Soft delete - deactivate user
      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      res.json({
        message: 'Benutzer erfolgreich deaktiviert',
        user,
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
    }
  }
);

// GET /api/users/admin/stats - Admin only
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
      recentLogins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers,
      recentLogins,
      registrationTrend: userRegistrations.length,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer-Statistiken' });
  }
});

export default router;
