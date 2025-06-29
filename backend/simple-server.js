const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy für IP-Erkennung
app.set('trust proxy', 1);

// CORS konfigurieren - dynamisch alle localhost Ports erlauben (für Entwicklung)
const corsOptions = {
  origin: function (origin, callback) {
    // Erlaube alle localhost Ports für Entwicklung
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('CORS nicht erlaubt'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files mit korrektem Content-Type für JSON
app.use('/data', express.static(path.join(__dirname, 'data'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.get('/api/stationen', async (req, res) => {
  try {
    const stations = await prisma.policeStation.findMany();
    
    // Koordinaten von JSON-String zu Array konvertieren
    const processedStations = stations.map(station => ({
      ...station,
      coordinates: station.coordinates ? JSON.parse(station.coordinates) : null
    }));
    
    res.json(processedStations);
  } catch (error) {
    console.error('Datenbankfehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Stationen' });
  }
});

// Neue Station erstellen
app.post('/api/stationen', async (req, res) => {
  try {
    // ID aus dem Request-Body entfernen, damit Prisma automatisch generiert
    const { id, ...stationData } = req.body;
    
    const newStation = await prisma.policeStation.create({
      data: {
        ...stationData,
        coordinates: stationData.coordinates ? JSON.stringify(stationData.coordinates) : null
      }
    });
    
    // Koordinaten von JSON-String zu Array konvertieren
    const processedStation = {
      ...newStation,
      coordinates: newStation.coordinates ? JSON.parse(newStation.coordinates) : null
    };
    
    res.status(201).json(processedStation);
  } catch (error) {
    console.error('Erstellungsfehler:', error);
    res.status(500).json({ error: 'Station konnte nicht erstellt werden' });
  }
});

// Station aktualisieren
app.put('/api/stationen/:id', async (req, res) => {
  try {
    const updated = await prisma.policeStation.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null
      }
    });
    
    // Koordinaten von JSON-String zu Array konvertieren
    const processedStation = {
      ...updated,
      coordinates: updated.coordinates ? JSON.parse(updated.coordinates) : null
    };
    
    res.json(processedStation);
  } catch (error) {
    console.error('Updatefehler:', error);
    res.status(500).json({ error: 'Station konnte nicht aktualisiert werden' });
  }
});

// Station löschen
app.delete('/api/stationen/:id', async (req, res) => {
  try {
    await prisma.policeStation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Löschfehler:', error);
    res.status(500).json({ error: 'Station konnte nicht gelöscht werden' });
  }
});

// Alle Stationen löschen (für Datenbank-Bereinigung)
app.delete('/api/stationen', async (req, res) => {
  try {
    const deletedCount = await prisma.policeStation.deleteMany({});
    console.log(`🧹 ${deletedCount.count} Stationen gelöscht`);
    res.json({ 
      message: `${deletedCount.count} Stationen erfolgreich gelöscht`,
      deletedCount: deletedCount.count 
    });
  } catch (error) {
    console.error('Fehler beim Löschen aller Stationen:', error);
    res.status(500).json({ error: 'Stationen konnten nicht gelöscht werden' });
  }
});

// ===== ADDRESS ROUTES =====

// POST /api/addresses - Create any address (temporary or permanent)
app.post('/api/addresses', async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      userId: req.body.userId || null,
      isAnonymous: req.body.isAnonymous || false,
      reviewStatus: req.body.reviewStatus || 'pending',
      addressType: req.body.addressType || 'permanent',
      parentId: req.body.parentId || null,
      coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null,
      isActive: true
    };

    const address = await prisma.customAddress.create({
      data: addressData,
    });

    res.status(201).json({
      message: 'Adresse erfolgreich erstellt',
      address: {
        ...address,
        coordinates: address.coordinates ? JSON.parse(address.coordinates) : null
      }
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Adresse' });
  }
});

// POST /api/addresses/anonymous - Create anonymous address for review (Legacy)
app.post('/api/addresses/anonymous', async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      userId: null,
      isAnonymous: true,
      reviewStatus: 'pending',
      addressType: req.body.addressType || 'permanent',
      parentId: req.body.parentId || null,
      coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null
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
});

// GET /api/addresses/stats - Get address statistics
app.get('/api/addresses/stats', async (req, res) => {
  try {
    const total = await prisma.customAddress.count({ where: { isActive: true } });
    const pending = await prisma.customAddress.count({ where: { reviewStatus: 'pending', isActive: true } });
    const approved = await prisma.customAddress.count({ where: { reviewStatus: 'approved', isActive: true } });
    const rejected = await prisma.customAddress.count({ where: { reviewStatus: 'rejected' } });
    const temporary = await prisma.customAddress.count({ where: { addressType: 'temporary', isActive: true } });
    const permanent = await prisma.customAddress.count({ where: { addressType: 'permanent', isActive: true } });

    res.json({
      total,
      pending,
      approved,
      rejected,
      temporary,
      permanent,
      byStatus: { pending, approved, rejected },
      byType: { temporary, permanent }
    });
  } catch (error) {
    console.error('Get address stats error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adress-Statistiken' });
  }
});

// GET /api/addresses - Get all addresses (for admin)
app.get('/api/addresses', async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    
    const where = { isActive: true };
    
    if (status) {
      where.reviewStatus = status;
    }
    
    if (type) {
      where.addressType = type;
    }

    const addresses = await prisma.customAddress.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });
    
    // Koordinaten von JSON-String zu Array konvertieren
    const processedAddresses = addresses.map(address => ({
      ...address,
      coordinates: address.coordinates ? JSON.parse(address.coordinates) : null
    }));
    
    res.json(processedAddresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adressen' });
  }
});

// GET /api/addresses/:id - Get specific address
app.get('/api/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await prisma.customAddress.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Adresse nicht gefunden' });
    }

    const processedAddress = {
      ...address,
      coordinates: address.coordinates ? JSON.parse(address.coordinates) : null
    };

    res.json(processedAddress);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Adresse' });
  }
});

// PUT /api/addresses/:id - Update address
app.put('/api/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateData = {
      ...req.body,
      coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null
    };

    const address = await prisma.customAddress.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    const processedAddress = {
      ...address,
      coordinates: address.coordinates ? JSON.parse(address.coordinates) : null
    };

    res.json({
      message: 'Adresse erfolgreich aktualisiert',
      address: processedAddress,
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Adresse' });
  }
});

// PUT /api/addresses/:id/review - Admin review action
app.put('/api/addresses/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes, reviewedBy } = req.body;
    
    let updateData = {
      reviewedBy: reviewedBy || 'admin',
      reviewedAt: new Date()
    };

    switch (action) {
      case 'approve':
        updateData.reviewStatus = 'approved';
        updateData.isVerified = true;
        break;
      case 'reject':
        updateData.reviewStatus = 'rejected';
        updateData.isActive = false;
        break;
      case 'archive':
        updateData.isActive = false;
        break;
      default:
        return res.status(400).json({ error: 'Ungültige Aktion' });
    }

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    const address = await prisma.customAddress.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    const processedAddress = {
      ...address,
      coordinates: address.coordinates ? JSON.parse(address.coordinates) : null
    };

    res.json({
      message: `Adresse erfolgreich ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : 'archiviert'}`,
      address: processedAddress,
    });
  } catch (error) {
    console.error('Review address error:', error);
    res.status(500).json({ error: 'Fehler bei der Adress-Überprüfung' });
  }
});

// DELETE /api/addresses/:id - Delete address (hard delete)
app.delete('/api/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customAddress.delete({ where: { id } });
    res.json({ message: 'Adresse vollständig gelöscht' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Adresse' });
  }
});

// Alle Adressen löschen (für Datenbank-Bereinigung)
app.delete('/api/addresses', async (req, res) => {
  try {
    const deletedCount = await prisma.customAddress.deleteMany({});
    console.log(`🧹 ${deletedCount.count} Adressen gelöscht`);
    res.json({ 
      message: `${deletedCount.count} Adressen erfolgreich gelöscht`,
      deletedCount: deletedCount.count 
    });
  } catch (error) {
    console.error('Fehler beim Löschen aller Adressen:', error);
    res.status(500).json({ error: 'Adressen konnten nicht gelöscht werden' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint nicht gefunden',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ 
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 SQLite-Backend läuft auf Port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Stationen API: http://localhost:${PORT}/api/stationen`);
  console.log(`📁 Static files: http://localhost:${PORT}/data/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 