const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Konfiguration
const config = {
  osrm: {
    baseUrl: process.env.OSRM_URL || 'http://localhost:5000',
    timeout: 10000
  },
  nominatim: {
    baseUrl: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
    timeout: 10000
  },
  tileserver: {
    baseUrl: process.env.TILESERVER_URL || 'http://localhost:8080',
    timeout: 10000
  }
};

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      osrm: config.osrm.baseUrl,
      nominatim: config.nominatim.baseUrl,
      tileserver: config.tileserver.baseUrl
    }
  });
});

// OSRM Routing Proxy
app.get('/route/v1/:profile/:coordinates', async (req, res) => {
  try {
    const { profile, coordinates } = req.params;
    const query = req.query;
    
    console.log(`[OSRM] Routing request: ${profile} - ${coordinates}`);
    
    const response = await axios.get(`${config.osrm.baseUrl}/route/v1/${profile}/${coordinates}`, {
      params: query,
      timeout: config.osrm.timeout
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[OSRM] Error:', error.message);
    
    // Fallback: Verwende Online OSRM
    try {
      console.log('[OSRM] Trying online fallback...');
      const response = await axios.get(`https://router.project-osrm.org/route/v1/${req.params.profile}/${req.params.coordinates}`, {
        params: req.query,
        timeout: config.osrm.timeout
      });
      res.json(response.data);
    } catch (fallbackError) {
      console.error('[OSRM] Fallback also failed:', fallbackError.message);
      res.status(500).json({ 
        error: 'Routing service unavailable',
        message: 'Both local and online routing services are down'
      });
    }
  }
});

// Nominatim Geocoding Proxy (Online Fallback)
app.get('/search', async (req, res) => {
  try {
    console.log(`[Nominatim] Search request: ${req.query.q}`);
    
    // Verwende Online Nominatim als Fallback
    const response = await axios.get(`${config.nominatim.baseUrl}/search`, {
      params: {
        ...req.query,
        format: 'json',
        limit: req.query.limit || 10,
        addressdetails: 1,
        'accept-language': 'de,en'
      },
      timeout: config.nominatim.timeout,
      headers: {
        'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Nominatim] Error:', error.message);
    res.status(500).json({ 
      error: 'Geocoding service unavailable',
      message: 'Online geocoding service is down'
    });
  }
});

// Nominatim Reverse Geocoding Proxy
app.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, format = 'json' } = req.query;
    console.log(`[Nominatim] Reverse request: ${lat},${lon}`);
    
    const response = await axios.get(`${config.nominatim.baseUrl}/reverse`, {
      params: {
        lat,
        lon,
        format,
        addressdetails: 1,
        'accept-language': 'de,en'
      },
      timeout: config.nominatim.timeout,
      headers: {
        'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Nominatim] Reverse error:', error.message);
    res.status(500).json({ 
      error: 'Reverse geocoding service unavailable',
      message: 'Online reverse geocoding service is down'
    });
  }
});

// TileServer Proxy
app.get('/tiles/:z/:x/:y.pbf', async (req, res) => {
  try {
    const { z, x, y } = req.params;
    console.log(`[TileServer] Tile request: ${z}/${x}/${y}`);
    
    const response = await axios.get(`${config.tileserver.baseUrl}/tiles/${z}/${x}/${y}.pbf`, {
      responseType: 'arraybuffer',
      timeout: config.tileserver.timeout
    });
    
    res.set('Content-Type', 'application/x-protobuf');
    res.set('Content-Length', response.data.length);
    res.send(response.data);
  } catch (error) {
    console.error('[TileServer] Error:', error.message);
    res.status(500).json({ 
      error: 'Tile service unavailable',
      message: 'Local tile server is down'
    });
  }
});

// TileServer Styles Proxy
app.get('/styles/:style.json', async (req, res) => {
  try {
    const { style } = req.params;
    console.log(`[TileServer] Style request: ${style}`);
    
    const response = await axios.get(`${config.tileserver.baseUrl}/styles/${style}.json`, {
      timeout: config.tileserver.timeout
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[TileServer] Style error:', error.message);
    res.status(500).json({ 
      error: 'Style service unavailable',
      message: 'Local tile server is down'
    });
  }
});

// Statische Dateien für React App
app.use(express.static(path.join(__dirname, '../build')));

// Catch-all für React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 API Server läuft auf Port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🗺️  OSRM: ${config.osrm.baseUrl}`);
  console.log(`🔍 Nominatim: ${config.nominatim.baseUrl}`);
  console.log(`🧩 TileServer: ${config.tileserver.baseUrl}`);
});

module.exports = app; 