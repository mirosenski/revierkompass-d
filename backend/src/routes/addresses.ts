import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin, logAction } from '../middleware/auth';
import { validate, createAddressSchema, updateAddressSchema } from '../middleware/validation';
import { createLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// GET /api/addresses - User's own addresses or admin sees all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20',
      search,
      isVerified 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const isAdmin = req.user!.role === 'admin';

    const where: any = {};

    // Non-admin users can only see their own addresses
    if (!isAdmin) {
      where.userId = req.user!.userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { street: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    where.isActive = true;

    const [addresses, total] = await Promise.all([
      prisma.customAddress.findMany({
        where,
        skip: offset,
        take: parseInt(limit as string),
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customAddress.count({ where }),
    ]);

    res.json({
      addresses,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adressen' });
  }
});

// GET /api/addresses/:id - User's own address or admin
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === 'admin';

    const where: any = { id };
    if (!isAdmin) {
      where.userId = req.user!.userId;
    }

    const address = await prisma.customAddress.findFirst({
      where,
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Adresse nicht gefunden' });
    }

    res.json(address);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adresse' });
  }
});

// POST /api/addresses - Create new address (authenticated)
router.post('/', 
  authenticateToken,
  createLimiter,
  validate(createAddressSchema),
  logAction('create', 'address'),
  async (req, res) => {
    try {
      const addressData = {
        ...req.body,
        userId: req.user!.userId,
      };

      const address = await prisma.customAddress.create({
        data: addressData,
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
      });

      res.status(201).json({
        message: 'Adresse erfolgreich erstellt',
        address,
      });
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Adresse' });
    }
  }
);

// POST /api/addresses/anonymous - Create anonymous address for review
router.post('/anonymous', 
  createLimiter,
  validate(createAddressSchema),
  async (req, res) => {
    try {
      const addressData = {
        ...req.body,
        userId: null,
        isAnonymous: true,
        reviewStatus: 'pending',
        addressType: req.body.addressType || 'permanent',
        parentId: req.body.parentId || null,
      };

      const address = await prisma.customAddress.create({
        data: addressData,
      });

      res.status(201).json({
        message: 'Adresse zur Überprüfung eingereicht',
        address: {
          id: address.id,
          name: address.name,
          reviewStatus: address.reviewStatus,
          addressType: address.addressType,
        },
      });
    } catch (error) {
      console.error('Create anonymous address error:', error);
      res.status(500).json({ error: 'Fehler beim Einreichen der Adresse' });
    }
  }
);

// PUT /api/addresses/:id - Update own address or admin
router.put('/:id', 
  authenticateToken,
  validate(updateAddressSchema),
  logAction('update', 'address'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const isAdmin = req.user!.role === 'admin';

      // Check ownership
      const existingAddress = await prisma.customAddress.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ error: 'Adresse nicht gefunden' });
      }

      if (!isAdmin && existingAddress.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diese Adresse' });
      }

      const address = await prisma.customAddress.update({
        where: { id },
        data: req.body,
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
      });

      res.json({
        message: 'Adresse erfolgreich aktualisiert',
        address,
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Adresse' });
    }
  }
);

// DELETE /api/addresses/:id - Soft delete own address or admin
router.delete('/:id', 
  authenticateToken,
  logAction('delete', 'address'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const isAdmin = req.user!.role === 'admin';

      // Check ownership
      const existingAddress = await prisma.customAddress.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ error: 'Adresse nicht gefunden' });
      }

      if (!isAdmin && existingAddress.userId !== req.user!.userId) {
        return res.status(403).json({ error: 'Keine Berechtigung für diese Adresse' });
      }

      // Soft delete
      const address = await prisma.customAddress.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        message: 'Adresse erfolgreich gelöscht',
        address,
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Adresse' });
    }
  }
);

// PUT /api/addresses/:id/verify - Admin only: Verify address
router.put('/:id/verify', 
  authenticateToken,
  requireAdmin,
  logAction('verify', 'address'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified = true } = req.body;

      const address = await prisma.customAddress.update({
        where: { id },
        data: { isVerified },
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
      });

      res.json({
        message: `Adresse erfolgreich ${isVerified ? 'verifiziert' : 'unverifiziert'}`,
        address,
      });
    } catch (error) {
      console.error('Verify address error:', error);
      res.status(500).json({ error: 'Fehler beim Verifizieren der Adresse' });
    }
  }
);

// GET /api/addresses/admin/unverified - Admin only: Get unverified addresses
router.get('/admin/unverified', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const addresses = await prisma.customAddress.findMany({
      where: {
        isVerified: false,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(addresses);
  } catch (error) {
    console.error('Get unverified addresses error:', error);
    res.status(500).json({ error: 'Fehler beim Laden unverifizierter Adressen' });
  }
});

// GET /api/addresses/admin/pending - Admin only: Get pending review addresses
router.get('/admin/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingAddresses = await prisma.customAddress.findMany({
      where: {
        reviewStatus: 'pending',
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(pendingAddresses);
  } catch (error) {
    console.error('Get pending addresses error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der ausstehenden Adressen' });
  }
});

// PUT /api/addresses/:id/review - Admin only: Review address
router.put('/:id/review', 
  authenticateToken,
  requireAdmin,
  logAction('review', 'address'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action, notes } = req.body; // action: "approve" | "reject"

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Ungültige Aktion' });
      }

      const address = await prisma.customAddress.update({
        where: { id },
        data: {
          reviewStatus: action === 'approve' ? 'approved' : 'rejected',
          isVerified: action === 'approve',
          reviewedBy: req.user!.userId,
          reviewedAt: new Date(),
          reviewNotes: notes || null,
        },
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
      });

      res.json({
        message: `Adresse erfolgreich ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`,
        address,
      });
    } catch (error) {
      console.error('Review address error:', error);
      res.status(500).json({ error: 'Fehler beim Überprüfen der Adresse' });
    }
  }
);

// GET /api/addresses/admin/stats - Admin only: Get address statistics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalAddresses,
      verifiedAddresses,
      activeAddresses,
      pendingReview,
      anonymousAddresses,
      addressesByCity,
    ] = await Promise.all([
      prisma.customAddress.count(),
      prisma.customAddress.count({ where: { isVerified: true } }),
      prisma.customAddress.count({ where: { isActive: true } }),
      prisma.customAddress.count({ where: { reviewStatus: 'pending' } }),
      prisma.customAddress.count({ where: { isAnonymous: true } }),
      prisma.customAddress.groupBy({
        by: ['city'],
        _count: { city: true },
        where: { isActive: true },
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      totalAddresses,
      verifiedAddresses,
      unverifiedAddresses: totalAddresses - verifiedAddresses,
      activeAddresses,
      inactiveAddresses: totalAddresses - activeAddresses,
      pendingReview,
      anonymousAddresses,
      topCities: addressesByCity.map(city => ({
        city: city.city,
        count: city._count.city,
      })),
    });
  } catch (error) {
    console.error('Get address stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adress-Statistiken' });
  }
});

// PUT /api/addresses/anonymous/:id - Update anonymous address (no auth required)
router.put('/anonymous/:id', 
  createLimiter,
  validate(updateAddressSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sessionId } = req.body; // Session-ID für anonyme Benutzer

      // Check if address exists and is anonymous
      const existingAddress = await prisma.customAddress.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ error: 'Adresse nicht gefunden' });
      }

      if (!existingAddress.isAnonymous) {
        return res.status(403).json({ error: 'Nur anonyme Adressen können bearbeitet werden' });
      }

      // Optional: Session-ID Validierung für zusätzliche Sicherheit
      // if (sessionId && existingAddress.sessionId !== sessionId) {
      //   return res.status(403).json({ error: 'Keine Berechtigung für diese Adresse' });
      // }

      const address = await prisma.customAddress.update({
        where: { id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
      });

      res.json({
        message: 'Adresse erfolgreich aktualisiert',
        address,
      });
    } catch (error) {
      console.error('Update anonymous address error:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Adresse' });
    }
  }
);

// DELETE /api/addresses/anonymous/:id - Delete anonymous address (no auth required)
router.delete('/anonymous/:id', 
  createLimiter,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sessionId } = req.body; // Session-ID für anonyme Benutzer

      // Check if address exists and is anonymous
      const existingAddress = await prisma.customAddress.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        return res.status(404).json({ error: 'Adresse nicht gefunden' });
      }

      if (!existingAddress.isAnonymous) {
        return res.status(403).json({ error: 'Nur anonyme Adressen können gelöscht werden' });
      }

      // Optional: Session-ID Validierung für zusätzliche Sicherheit
      // if (sessionId && existingAddress.sessionId !== sessionId) {
      //   return res.status(403).json({ error: 'Keine Berechtigung für diese Adresse' });
      // }

      // Soft delete
      const address = await prisma.customAddress.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        message: 'Adresse erfolgreich gelöscht',
        address,
      });
    } catch (error) {
      console.error('Delete anonymous address error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Adresse' });
    }
  }
);

export default router;
