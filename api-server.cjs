const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5179;

// Datenbank-Datei
const DB_FILE = path.join(__dirname, 'database.json');

// In-Memory-Datenbank (wird beim Start geladen)
let database = {
  stations: [],
  addresses: [],
  lastModified: new Date().toISOString()
};

// Datenbank laden
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    database = JSON.parse(data);
    console.log('✅ Datenbank geladen:', database.stations.length, 'Stationen');
  } catch (error) {
    console.log('📝 Erstelle neue Datenbank...');
    await saveDatabase();
  }
}

// Datenbank speichern
async function saveDatabase() {
  try {
    database.lastModified = new Date().toISOString();
    await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2));
    console.log('💾 Datenbank gespeichert');
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Datenbank:', error);
  }
}

// CORS aktivieren
app.use(cors());

// JSON-Parsing
app.use(express.json());

// Health Check Endpunkt
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      osrm: 'available',
      nominatim: 'available',
      tileserver: 'available'
    }
  });
});

// Proxy für OSRM
app.use('/api/maps/route', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/maps/route': '/route'
  },
  logLevel: 'debug'
}));

// Proxy für Nominatim mit Fallback
app.use('/api/maps/geocoding', createProxyMiddleware({
  target: 'http://localhost:7070',
  changeOrigin: true,
  pathRewrite: {
    '^/api/maps/geocoding': ''
  },
  onError: (err, req, res) => {
    console.log('Nominatim Proxy Fehler, verwende Online-Fallback:', err.message);
    // Fallback zu Online-Nominatim
    const onlineUrl = `https://nominatim.openstreetmap.org${req.url}`;
    fetch(onlineUrl, {
      headers: {
        'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
      }
    })
    .then(response => response.json())
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      console.error('Online-Nominatim auch fehlgeschlagen:', error);
      res.status(500).json({ error: 'Geocoding service unavailable' });
    });
  }
}));

// Proxy für TileServer
app.use('/api/maps/tiles', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/maps/tiles': ''
  }
}));

// Capabilities-Endpunkt
app.get('/api/maps/capabilities', (req, res) => {
  res.json({
    routing: true,
    geocoding: true,
    tiles: true,
    search: true,
    vectorTiles: true,
    is3dTerrain: false,
    pois: true
  });
});

// Routing-Profile
app.get('/api/maps/profiles', (req, res) => {
  res.json([
    {
      id: 'driving',
      name: 'Auto',
      mode: 'driving',
      costing: 'auto',
      description: 'Schnellste Route mit dem Auto',
      icon: '🚗',
      useCase: 'Standard-Autofahrt'
    },
    {
      id: 'walking',
      name: 'Zu Fuß',
      mode: 'walking',
      costing: 'pedestrian',
      description: 'Route für Fußgänger',
      icon: '🚶',
      useCase: 'Spaziergänge'
    },
    {
      id: 'cycling',
      name: 'Fahrrad',
      mode: 'cycling',
      costing: 'bicycle',
      description: 'Route für Radfahrer',
      icon: '🚴',
      useCase: 'Radtouren'
    }
  ]);
});

// Map-Styles
app.get('/api/maps/styles', (req, res) => {
  res.json({
    'streets': {
      name: 'Straßen',
      description: 'Standard-Straßenkarte',
      thumbnail: '/images/streets-thumb.jpg',
      minZoom: 0,
      maxZoom: 18
    },
    'satellite': {
      name: 'Satellit',
      description: 'Satellitenbilder',
      thumbnail: '/images/satellite-thumb.jpg',
      minZoom: 0,
      maxZoom: 18
    },
    'terrain': {
      name: 'Gelände',
      description: 'Topographische Karte',
      thumbnail: '/images/terrain-thumb.jpg',
      minZoom: 0,
      maxZoom: 18
    },
    'bw-police': {
      name: 'Polizei BW',
      description: 'Spezialkarte für Polizei Baden-Württemberg',
      thumbnail: '/images/police-thumb.jpg',
      minZoom: 0,
      maxZoom: 18
    }
  });
});

// Map-Style-Details
app.get('/api/maps/styles/:styleId', (req, res) => {
  const { styleId } = req.params;
  
  const styles = {
    'streets': {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['http://localhost:8080/styles/streets/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    },
    'satellite': {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: ['http://localhost:8080/styles/satellite/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'satellite',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    },
    'terrain': {
      version: 8,
      sources: {
        'terrain': {
          type: 'raster',
          tiles: ['http://localhost:8080/styles/terrain/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'terrain',
          type: 'raster',
          source: 'terrain',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    },
    'bw-police': {
      version: 8,
      sources: {
        'police': {
          type: 'raster',
          tiles: ['http://localhost:8080/styles/police/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'police',
          type: 'raster',
          source: 'police',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    }
  };
  
  const style = styles[styleId];
  if (style) {
    res.json(style);
  } else {
    res.status(404).json({ error: 'Style nicht gefunden' });
  }
});

// Route-Berechnung
app.post('/api/maps/route', async (req, res) => {
  try {
    const { start, end, profile = 'driving' } = req.body;
    
    // Proxy zur OSRM-API
    const osrmUrl = `http://localhost:5000/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}`;
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true'
    });
    
    const response = await fetch(`${osrmUrl}?${params}`);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      res.json({
        id: `route-${Date.now()}`,
        destinationId: 'offline',
        destinationName: 'Offline-Route',
        destinationType: 'custom',
        address: 'Offline berechnet',
        distance: route.distance / 1000,
        duration: Math.round(route.duration / 60),
        estimatedFuel: (route.distance / 1000) * 0.095,
        estimatedCost: (route.distance / 1000) * 0.095 * 1.75,
        routeType: 'Schnellste',
        coordinates: { lat: end.lat, lng: end.lng },
        color: '#3b82f6',
        route: {
          coordinates: route.geometry.coordinates,
          distance: route.distance,
          duration: route.duration
        },
        provider: 'Offline-OSRM'
      });
    } else {
      res.status(404).json({ error: 'Keine Route gefunden' });
    }
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Route-Berechnung fehlgeschlagen' });
  }
});

// Geocoding mit Fallback
app.get('/api/maps/geocoding', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    // Zuerst versuchen, lokalen Nominatim zu verwenden
    try {
      const localUrl = `http://localhost:7070/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=de`;
      const localResponse = await fetch(localUrl, { timeout: 3000 });
      
      if (localResponse.ok) {
        const data = await localResponse.json();
        console.log('✅ Lokaler Nominatim erfolgreich');
        return res.json(data);
      }
    } catch (localError) {
      console.log('⚠️ Lokaler Nominatim nicht verfügbar, verwende Online-Fallback');
    }
    
    // Fallback zu Online-Nominatim
    const onlineUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=de`;
    const onlineResponse = await fetch(onlineUrl, {
      headers: {
        'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
      },
      timeout: 5000
    });
    
    if (onlineResponse.ok) {
      const data = await onlineResponse.json();
      console.log('✅ Online-Nominatim erfolgreich');
      res.json(data);
    } else {
      throw new Error(`Online-Nominatim Fehler: ${onlineResponse.status}`);
    }
    
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding fehlgeschlagen' });
  }
});

// Stationen API - Echte Datenbank-Integration
app.get('/api/stationen', (req, res) => {
  res.json(database.stations);
});

app.post('/api/stationen', async (req, res) => {
  try {
    const newStation = {
      id: Date.now().toString(),
      ...req.body,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    database.stations.push(newStation);
    await saveDatabase();
    
    res.status(201).json(newStation);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Station:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Station' });
  }
});

app.put('/api/stationen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stationIndex = database.stations.findIndex(s => s.id === id);
    
    if (stationIndex === -1) {
      return res.status(404).json({ error: 'Station nicht gefunden' });
    }
    
    database.stations[stationIndex] = {
      ...database.stations[stationIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await saveDatabase();
    res.json(database.stations[stationIndex]);
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Station:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Station' });
  }
});

app.delete('/api/stationen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stationIndex = database.stations.findIndex(s => s.id === id);
    
    if (stationIndex === -1) {
      return res.status(404).json({ error: 'Station nicht gefunden' });
    }
    
    database.stations.splice(stationIndex, 1);
    await saveDatabase();
    
    res.json({ message: 'Station erfolgreich gelöscht' });
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Station:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Station' });
  }
});

// Alle Stationen löschen
app.delete('/api/stationen', async (req, res) => {
  try {
    database.stations = [];
    await saveDatabase();
    res.json({ message: 'Alle Stationen erfolgreich gelöscht' });
  } catch (error) {
    console.error('❌ Fehler beim Löschen aller Stationen:', error);
    res.status(500).json({ error: 'Fehler beim Löschen aller Stationen' });
  }
});

// Stationen importieren
app.post('/api/stationen/import', async (req, res) => {
  try {
    const { stations } = req.body;
    
    if (!Array.isArray(stations)) {
      return res.status(400).json({ error: 'Stations-Daten müssen ein Array sein' });
    }
    
    // Neue IDs für importierte Stationen
    const importedStations = stations.map(station => ({
      ...station,
      id: station.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date().toISOString()
    }));
    
    database.stations = importedStations;
    await saveDatabase();
    
    res.json({ 
      message: `${importedStations.length} Stationen erfolgreich importiert`,
      count: importedStations.length
    });
  } catch (error) {
    console.error('❌ Fehler beim Importieren der Stationen:', error);
    res.status(500).json({ error: 'Fehler beim Importieren der Stationen' });
  }
});

// Adressen API
app.get('/api/addresses', (req, res) => {
  res.json(database.addresses);
});

app.delete('/api/addresses', async (req, res) => {
  try {
    database.addresses = [];
    await saveDatabase();
    res.json({ message: 'Alle Adressen erfolgreich gelöscht' });
  } catch (error) {
    console.error('❌ Fehler beim Löschen aller Adressen:', error);
    res.status(500).json({ error: 'Fehler beim Löschen aller Adressen' });
  }
});

// Health Check
app.get('/api/maps/health', (req, res) => {
  res.json({ status: 'healthy', services: { routing: true, geocoding: true, tiles: true } });
});

app.listen(PORT, async () => {
  // Datenbank beim Start laden
  await loadDatabase();
  
  console.log(`🗺️ API-Server läuft auf Port ${PORT}`);
  console.log(`📡 Verfügbare Endpunkte:`);
  console.log(`   - GET  /api/maps/capabilities`);
  console.log(`   - GET  /api/maps/profiles`);
  console.log(`   - GET  /api/maps/styles`);
  console.log(`   - GET  /api/maps/styles/:styleId`);
  console.log(`   - POST /api/maps/route`);
  console.log(`   - GET  /api/maps/geocoding`);
  console.log(`   - GET  /api/maps/health`);
  console.log(`   - GET  /api/stationen`);
  console.log(`   - POST /api/stationen`);
  console.log(`   - PUT  /api/stationen/:id`);
  console.log(`   - DELETE /api/stationen/:id`);
  console.log(`   - DELETE /api/stationen (alle löschen)`);
  console.log(`   - POST /api/stationen/import`);
}); 