import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimiter';
import { offlineMapService } from '../services/OfflineMapService';

const router = Router();

// Rate limiters for different operations
const standardLimiter = createLimiter(100, 15); // 100 requests per 15 minutes
const routingLimiter = createLimiter(30, 5);    // 30 requests per 5 minutes
const tileLimiter = createLimiter(500, 5);      // 500 tile requests per 5 minutes

/**
 * GET /api/maps/capabilities - Check offline capabilities
 */
router.get('/capabilities', standardLimiter, async (req: Request, res: Response) => {
  try {
    const capabilities = await offlineMapService.checkOfflineCapabilities();
    res.json(capabilities);
  } catch (error) {
    console.error('Failed to check capabilities:', error);
    res.status(500).json({ error: 'Failed to check offline capabilities' });
  }
});

/**
 * GET /api/maps/styles/:styleId - Get map style configuration
 */
router.get('/styles/:styleId', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { styleId } = req.params;
    const style = await offlineMapService.getMapStyle(styleId);
    res.json(style);
  } catch (error) {
    console.error('Failed to get map style:', error);
    res.status(404).json({ error: 'Map style not found' });
  }
});

/**
 * GET /api/maps/styles - List available map styles
 */
router.get('/styles', standardLimiter, async (req: Request, res: Response) => {
  try {
    const styles = {
      'bw-basic': {
        name: 'Baden-Württemberg Basic',
        description: 'Einfacher Kartenstil für Baden-Württemberg',
        thumbnail: '/api/maps/thumbnails/bw-basic.png'
      },
      'bw-satellite': {
        name: 'Baden-Württemberg Satellite',
        description: 'Satellitenkarte mit Straßen-Overlay',
        thumbnail: '/api/maps/thumbnails/bw-satellite.png'
      },
      'bw-police': {
        name: 'Baden-Württemberg Police',
        description: 'Polizei-optimierte Karte mit NBAN-Zonen',
        thumbnail: '/api/maps/thumbnails/bw-police.png'
      }
    };
    res.json(styles);
  } catch (error) {
    console.error('Failed to list styles:', error);
    res.status(500).json({ error: 'Failed to list map styles' });
  }
});

/**
 * GET /api/maps/tiles/:style/:z/:x/:y.:format - Proxy map tiles
 */
router.get('/tiles/:style/:z/:x/:y.:format', tileLimiter, async (req: Request, res: Response) => {
  try {
    const { style, z, x, y, format } = req.params;
    
    const tileRequest = {
      style,
      z: parseInt(z),
      x: parseInt(x),
      y: parseInt(y),
      format: format as 'pbf' | 'png' | 'jpg' | 'webp'
    };

    await offlineMapService.proxyTile(tileRequest, res);
  } catch (error) {
    console.error('Tile proxy error:', error);
    res.status(404).send('Tile not found');
  }
});

/**
 * POST /api/maps/route - Calculate route with different profiles
 */
router.post('/route', routingLimiter, async (req: Request, res: Response) => {
  try {
    const { start, end, profile = 'police_patrol', alternatives = 0 } = req.body;

    if (!start || !end || !start.lat || !start.lon || !end.lat || !end.lon) {
      return res.status(400).json({ error: 'Start and end coordinates are required' });
    }

    const route = await offlineMapService.calculateRoute(start, end, profile, alternatives);
    res.json(route);
  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ error: 'Routing calculation failed' });
  }
});

/**
 * POST /api/maps/route/alternatives - Get multiple route alternatives
 */
router.post('/route/alternatives', routingLimiter, async (req: Request, res: Response) => {
  try {
    const { start, end, profiles } = req.body;

    if (!start || !end || !start.lat || !start.lon || !end.lat || !end.lon) {
      return res.status(400).json({ error: 'Start and end coordinates are required' });
    }

    const routes = await offlineMapService.calculateAlternativeRoutes(start, end, profiles);
    res.json(routes);
  } catch (error) {
    console.error('Alternative routing error:', error);
    res.status(500).json({ error: 'Alternative routing calculation failed' });
  }
});

/**
 * GET /api/maps/profiles - Get available routing profiles
 */
router.get('/profiles', standardLimiter, async (req: Request, res: Response) => {
  try {
    const profiles = offlineMapService.getRoutingProfiles();
    
    // Add human-readable descriptions
    const profilesWithDescriptions = Object.entries(profiles).map(([key, profile]) => ({
      id: key,
      name: getProfileDisplayName(key),
      mode: profile.mode,
      costing: profile.costing,
      description: getProfileDescription(key),
      icon: getProfileIcon(key),
      useCase: getProfileUseCase(key)
    }));

    res.json(profilesWithDescriptions);
  } catch (error) {
    console.error('Failed to get profiles:', error);
    res.status(500).json({ error: 'Failed to get routing profiles' });
  }
});

/**
 * GET /api/maps/geocode - Geocode address using offline Nominatim
 */
router.get('/geocode', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await offlineMapService.geocodeAddress(query);
    res.json(results);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

/**
 * GET /api/maps/nban - Get NBAN (special zones) data
 */
router.get('/nban', standardLimiter, async (req: Request, res: Response) => {
  try {
    const { north, south, east, west } = req.query;
    
    let bounds;
    if (north && south && east && west) {
      bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
    }

    const nbanData = await offlineMapService.getNBANData(bounds);
    res.json(nbanData);
  } catch (error) {
    console.error('NBAN data error:', error);
    res.status(500).json({ error: 'Failed to get NBAN data' });
  }
});

/**
 * POST /api/maps/offline-package - Generate offline data package (Admin only)
 */
router.post('/offline-package', 
  authenticateToken, 
  createLimiter(5, 60), // Very limited: 5 requests per hour
  async (req: Request, res: Response) => {
    try {
      const { bounds, minZoom = 8, maxZoom = 16 } = req.body;

      if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
        return res.status(400).json({ error: 'Bounds are required' });
      }

      const packageId = await offlineMapService.generateOfflinePackage(bounds, minZoom, maxZoom);
      
      res.json({
        packageId,
        status: 'generating',
        estimatedSize: '~500MB',
        estimatedTime: '10-15 minutes',
        downloadUrl: `/api/maps/offline-package/${packageId}/download`,
        statusUrl: `/api/maps/offline-package/${packageId}/status`
      });
    } catch (error) {
      console.error('Offline package generation error:', error);
      res.status(500).json({ error: 'Failed to generate offline package' });
    }
  }
);

/**
 * GET /api/maps/offline-package/:packageId/status - Check package generation status
 */
router.get('/offline-package/:packageId/status', 
  authenticateToken,
  standardLimiter,
  async (req: Request, res: Response) => {
    try {
      const { packageId } = req.params;
      
      // Mock status for demonstration
      res.json({
        packageId,
        status: 'ready', // 'generating', 'ready', 'error'
        progress: 100,
        size: '487MB',
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
    } catch (error) {
      console.error('Package status error:', error);
      res.status(500).json({ error: 'Failed to get package status' });
    }
  }
);

/**
 * GET /api/maps/offline-package/:packageId/download - Download offline package
 */
router.get('/offline-package/:packageId/download',
  authenticateToken,
  createLimiter(3, 60), // 3 downloads per hour
  async (req: Request, res: Response) => {
    try {
      const { packageId } = req.params;
      
      // This would serve the actual offline package file
      res.status(501).json({ 
        error: 'Download not implemented yet',
        message: 'Offline package download will be available soon'
      });
    } catch (error) {
      console.error('Package download error:', error);
      res.status(500).json({ error: 'Failed to download package' });
    }
  }
);

// Helper functions
function getProfileDisplayName(profile: string): string {
  const names: Record<string, string> = {
    emergency_fast: 'Einsatzfahrt (Schnellste)',
    police_patrol: 'Polizei-Streife (Standard)',
    pedestrian_safe: 'Fußweg (Sicherste)',
    bicycle_patrol: 'Fahrrad-Streife',
    public_transport: 'ÖPNV'
  };
  return names[profile] || profile;
}

function getProfileDescription(profile: string): string {
  const descriptions: Record<string, string> = {
    emergency_fast: 'Optimiert für Einsatzfahrten mit hoher Geschwindigkeit und Priorität auf Autobahnen',
    police_patrol: 'Standard-Routing für Polizeistreifen mit ausgewogener Geschwindigkeit und Sicherheit',
    pedestrian_safe: 'Sichere Fußwege mit Priorität auf Gehwege und verkehrsberuhigte Zonen',
    bicycle_patrol: 'Fahrradrouten mit Berücksichtigung von Radwegen und Steigungen',
    public_transport: 'ÖPNV-Routen mit Bus- und Bahnverbindungen'
  };
  return descriptions[profile] || 'Spezialisiertes Routing-Profil';
}

function getProfileIcon(profile: string): string {
  const icons: Record<string, string> = {
    emergency_fast: '🚨',
    police_patrol: '🚔',
    pedestrian_safe: '🚶',
    bicycle_patrol: '🚴',
    public_transport: '🚌'
  };
  return icons[profile] || '🗺️';
}

function getProfileUseCase(profile: string): string {
  const useCases: Record<string, string> = {
    emergency_fast: 'Notfall-Einsätze, dringende Fahrten',
    police_patrol: 'Routine-Patrouillen, Allgemeine Fahrten',
    pedestrian_safe: 'Fußstreife, Objektschutz zu Fuß',
    bicycle_patrol: 'Fahrradstreife, Umweltfreundliche Patrouille',
    public_transport: 'ÖPNV-Kontrollen, Bahnhofssicherheit'
  };
  return useCases[profile] || 'Allgemeine Nutzung';
}

export default router;
