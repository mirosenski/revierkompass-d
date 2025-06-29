const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5179;

// CORS aktivieren
app.use(cors());

// JSON-Parsing
app.use(express.json());

// Proxy für OSRM
app.use('/api/maps/route', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/maps/route': '/route'
  }
}));

// Proxy für Nominatim
app.use('/api/maps/geocoding', createProxyMiddleware({
  target: 'http://localhost:7070',
  changeOrigin: true,
  pathRewrite: {
    '^/api/maps/geocoding': ''
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

// Geocoding
app.get('/api/maps/geocoding', async (req, res) => {
  try {
    const { q } = req.query;
    
    const nominatimUrl = `http://localhost:7070/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=de`;
    const response = await fetch(nominatimUrl);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding fehlgeschlagen' });
  }
});

// Stationen API
app.get('/api/stationen', (req, res) => {
  // Statische Polizeistationen für Baden-Württemberg
  const stations = [
    {
      id: '1',
      name: 'Polizeipräsidium Stuttgart',
      address: 'Taubenheimstraße 85, 70372 Stuttgart',
      coordinates: [9.1829, 48.7758],
      phone: '0711 8990-0',
      email: 'poststelle.pp.stuttgart@polizei.bwl.de',
      type: 'praesidium',
      isActive: true
    },
    {
      id: '2',
      name: 'Polizeipräsidium Karlsruhe',
      address: 'Erbprinzenstraße 96, 76133 Karlsruhe',
      coordinates: [8.4037, 49.0069],
      phone: '0721 666-0',
      email: 'poststelle.pp.karlsruhe@polizei.bwl.de',
      type: 'praesidium',
      isActive: true
    },
    {
      id: '3',
      name: 'Polizeipräsidium Mannheim',
      address: 'Collinistraße 1, 68161 Mannheim',
      coordinates: [8.4660, 49.4875],
      phone: '0621 174-0',
      email: 'poststelle.pp.mannheim@polizei.bwl.de',
      type: 'praesidium',
      isActive: true
    },
    {
      id: '4',
      name: 'Polizeipräsidium Freiburg',
      address: 'Basler Landstraße 113, 79111 Freiburg',
      coordinates: [7.8421, 47.9990],
      phone: '0761 882-0',
      email: 'poststelle.pp.freiburg@polizei.bwl.de',
      type: 'praesidium',
      isActive: true
    },
    {
      id: '5',
      name: 'Polizeipräsidium Heilbronn',
      address: 'Cäcilienstraße 56, 74072 Heilbronn',
      coordinates: [9.2185, 49.1406],
      phone: '07131 104-0',
      email: 'poststelle.pp.heilbronn@polizei.bwl.de',
      type: 'praesidium',
      isActive: true
    },
    {
      id: '6',
      name: 'Polizeirevier Stuttgart-Mitte',
      address: 'Dorotheenstraße 4, 70173 Stuttgart',
      coordinates: [9.1770, 48.7758],
      phone: '0711 8990-1000',
      email: 'revier.mitte.stuttgart@polizei.bwl.de',
      type: 'revier',
      parentId: '1',
      isActive: true
    },
    {
      id: '7',
      name: 'Polizeirevier Karlsruhe-Mitte',
      address: 'Kaiserstraße 146, 76133 Karlsruhe',
      coordinates: [8.4037, 49.0069],
      phone: '0721 666-1000',
      email: 'revier.mitte.karlsruhe@polizei.bwl.de',
      type: 'revier',
      parentId: '2',
      isActive: true
    }
  ];
  
  res.json(stations);
});

app.post('/api/stationen', (req, res) => {
  // Neue Station erstellen (simuliert)
  const newStation = {
    id: Date.now().toString(),
    ...req.body,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newStation);
});

// Health Check
app.get('/api/maps/health', (req, res) => {
  res.json({ status: 'healthy', services: { routing: true, geocoding: true, tiles: true } });
});

app.listen(PORT, () => {
  console.log(`🗺️ API-Server läuft auf Port ${PORT}`);
  console.log(`📡 Verfügbare Endpunkte:`);
  console.log(`   - GET  /api/maps/capabilities`);
  console.log(`   - GET  /api/maps/profiles`);
  console.log(`   - GET  /api/maps/styles`);
  console.log(`   - GET  /api/maps/styles/:styleId`);
  console.log(`   - POST /api/maps/route`);
  console.log(`   - GET  /api/maps/geocoding`);
  console.log(`   - GET  /api/maps/health`);
}); 