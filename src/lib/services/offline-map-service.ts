import { toast } from 'react-hot-toast';
import { DEFAULT_ROUTE_PROFILES } from '../../../shared/offline-map/profiles';

interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface OfflineCapabilities {
  osrm: boolean;
  valhalla: boolean;
  tileserver: boolean;
  nominatim: boolean;
  offline_mode: boolean;
}

interface RouteProfile {
  id: string;
  name: string;
  mode: string;
  costing: string;
  description: string;
  icon: string;
  useCase: string;
}

interface RouteRequest {
  start: { lat: number; lon: number };
  end: { lat: number; lon: number };
  profile?: string;
  alternatives?: number;
}

interface RouteResult {
  trip: {
    legs: Array<{
      shape: string;
      distance: number;
      time: number;
      summary: {
        length: number;
        time: number;
      };
    }>;
    summary: {
      length: number;
      time: number;
    };
  };
  profile?: string;
  name?: string;
}

interface MapStyle {
  name: string;
  description: string;
  thumbnail: string;
}

export class OfflineMapService {
  private baseUrl: string;
  private networkStatus: NetworkStatus = { online: navigator.onLine };
  private offlineCapabilities: OfflineCapabilities | null = null;
  private tileCache: Map<string, Blob> = new Map();
  private routeCache: Map<string, RouteResult> = new Map();
  private isInitialized = false;

  constructor(baseUrl: string = '/api/maps') {
    this.baseUrl = baseUrl;
    this.initializeNetworkMonitoring();
    this.loadCachedData();
  }

  /**
   * Initialize the offline map service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await this.checkCapabilities();
      await this.registerServiceWorker();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize offline map service:', error);
      return false;
    }
  }

  /**
   * Check if offline services are available
   */
  async checkCapabilities(): Promise<OfflineCapabilities> {
    try {
      const response = await fetch(`${this.baseUrl}/capabilities`);
      const capabilities = await response.json();
      this.offlineCapabilities = capabilities;
      return capabilities;
    } catch (error) {
      console.error('Failed to check offline capabilities:', error);
      this.offlineCapabilities = {
        osrm: false,
        valhalla: false,
        tileserver: false,
        nominatim: false,
        offline_mode: false
      };
      return this.offlineCapabilities;
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Check if we're in offline mode
   */
  isOfflineMode(): boolean {
    return !this.networkStatus.online || (this.offlineCapabilities?.offline_mode === true);
  }

  /**
   * Get available map styles
   */
  async getMapStyles(): Promise<Record<string, MapStyle>> {
    const cacheKey = 'map-styles';
    
    // Try to use cached version if offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/styles`);
      const styles = await response.json();
      
      // Cache for offline use
      localStorage.setItem(cacheKey, JSON.stringify(styles));
      
      return styles;
    } catch (error) {
      console.error('Failed to get map styles:', error);
      
      // Fallback to cached version
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Get map style configuration
   */
  async getMapStyle(styleId: string): Promise<any> {
    const cacheKey = `map-style-${styleId}`;
    
    // Try to use cached version if offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/styles/${styleId}`);
      const style = await response.json();
      
      // Update URLs to point to our service worker for offline caching
      if ('serviceWorker' in navigator) {
        style.sources = this.updateSourceUrlsForOffline(style.sources);
      }
      
      // Cache for offline use
      localStorage.setItem(cacheKey, JSON.stringify(style));
      
      return style;
    } catch (error) {
      console.error('Failed to get map style:', error);
      
      // Fallback to cached version
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Calculate route using offline or online services
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    const cacheKey = `route-${JSON.stringify(request)}`;
    
    // Check cache first
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Route calculation failed: ${response.statusText}`);
      }

      const route = await response.json();
      
      // Cache the result
      this.routeCache.set(cacheKey, route);
      
      return route;
    } catch (error) {
      console.error('Route calculation error:', error);
      
      // Try to use fallback routing if available
      if (this.isOfflineMode()) {
        return this.calculateFallbackRoute(request);
      }
      
      throw error;
    }
  }

  /**
   * Get multiple route alternatives
   */
  async calculateAlternativeRoutes(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    profiles?: string[]
  ): Promise<RouteResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/route/alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, profiles }),
      });

      if (!response.ok) {
        throw new Error(`Alternative routes calculation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Alternative routes calculation error:', error);
      
      // Fallback to single route if alternatives fail
      const mainRoute = await this.calculateRoute({ start, end });
      return [mainRoute];
    }
  }

  /**
   * Get available routing profiles
   */
  async getRoutingProfiles(): Promise<RouteProfile[]> {
    const cacheKey = 'routing-profiles';
    
    // Try to use cached version if offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/profiles`);
      const profiles = await response.json();
      
      // Cache for offline use
      localStorage.setItem(cacheKey, JSON.stringify(profiles));
      
      return profiles;
    } catch (error) {
      console.error('Failed to get routing profiles:', error);
      
      // Fallback to cached version or default profiles
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      return DEFAULT_ROUTE_PROFILES;
    }
  }

  /**
   * Geocode address using offline Nominatim
   */
  async geocodeAddress(query: string): Promise<Array<{
    lat: number;
    lon: number;
    display_name: string;
    importance: number;
    place_id: string;
  }>> {
    const cacheKey = `geocode-${query}`;
    
    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached && this.isOfflineMode()) {
      return JSON.parse(cached);
    }

    try {
      const response = await fetch(`${this.baseUrl}/geocode?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      
      // Cache results
      localStorage.setItem(cacheKey, JSON.stringify(results));
      
      return results;
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Try cached version
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Get NBAN (special zones) data
   */
  async getNBANData(bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (bounds) {
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());
      }

      const response = await fetch(`${this.baseUrl}/nban?${params}`);
      return await response.json();
    } catch (error) {
      console.error('NBAN data error:', error);
      
      // Return empty feature collection if offline
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Preload tiles for offline use
   */
  async preloadTiles(
    style: string,
    bounds: { north: number; south: number; east: number; west: number },
    minZoom: number = 8,
    maxZoom: number = 16,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const tiles = this.calculateTileList(bounds, minZoom, maxZoom);
    let completed = 0;

    toast.loading(`Lade ${tiles.length} Kacheln für Offline-Nutzung...`, {
      id: 'tile-preload'
    });

    for (const tile of tiles) {
      try {
        await this.preloadSingleTile(style, tile.z, tile.x, tile.y);
        completed++;
        
        const progress = (completed / tiles.length) * 100;
        onProgress?.(progress);
        
        if (completed % 50 === 0) {
          toast.loading(`${completed}/${tiles.length} Kacheln geladen...`, {
            id: 'tile-preload'
          });
        }
      } catch (error) {
        console.warn(`Failed to preload tile ${tile.z}/${tile.x}/${tile.y}:`, error);
      }
    }

    toast.success(`${completed} Kacheln erfolgreich geladen!`, {
      id: 'tile-preload'
    });
  }

  /**
   * Clear offline cache
   */
  async clearOfflineCache(): Promise<void> {
    try {
      // Clear tile cache
      this.tileCache.clear();
      
      // Clear route cache
      this.routeCache.clear();
      
      // Clear localStorage cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('map-') || key.startsWith('route-') || key.startsWith('geocode-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear service worker cache
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('revierkompass'))
            .map(name => caches.delete(name))
        );
      }
      
      toast.success('Offline-Cache erfolgreich geleert');
    } catch (error) {
      console.error('Failed to clear offline cache:', error);
      toast.error('Fehler beim Leeren des Offline-Cache');
    }
  }

  // Private methods

  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkStatus.online = true;
      toast.success('Internetverbindung wieder hergestellt');
      this.checkCapabilities();
    });

    window.addEventListener('offline', () => {
      this.networkStatus.online = false;
      toast('Offline-Modus aktiviert', { icon: '📡' });
    });

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateNetworkInfo = () => {
        this.networkStatus = {
          online: navigator.onLine,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-maps.js');
        console.log('Maps Service Worker registered:', registration);
      } catch (error) {
        console.warn('Maps Service Worker registration failed:', error);
      }
    }
  }

  private loadCachedData(): void {
    // Load any cached data that needs to be available immediately
    try {
      const cachedRoutes = localStorage.getItem('cached-routes');
      if (cachedRoutes) {
        const routes = JSON.parse(cachedRoutes);
        Object.entries(routes).forEach(([key, value]) => {
          this.routeCache.set(key, value as RouteResult);
        });
      }
    } catch (error) {
      console.warn('Failed to load cached route data:', error);
    }
  }

  private updateSourceUrlsForOffline(sources: any): any {
    const updatedSources = { ...sources };
    
    Object.keys(updatedSources).forEach(sourceId => {
      const source = updatedSources[sourceId];
      if (source.url && source.url.startsWith('/api/tiles/')) {
        // URLs are already configured for our backend
        return;
      }
      
      if (source.tiles) {
        source.tiles = source.tiles.map((tileUrl: string) => {
          if (tileUrl.includes('localhost:8080')) {
            return tileUrl.replace('http://localhost:8080', '/api/maps/tiles');
          }
          return tileUrl;
        });
      }
    });
    
    return updatedSources;
  }

  private async calculateFallbackRoute(request: RouteRequest): Promise<RouteResult> {
    // Simple straight-line distance calculation as fallback
    const distance = this.calculateDistance(request.start, request.end);
    const estimatedTime = distance / 50; // Assume 50 km/h average speed
    
    return {
      trip: {
        legs: [{
          shape: `${request.start.lat},${request.start.lon};${request.end.lat},${request.end.lon}`,
          distance,
          time: estimatedTime,
          summary: {
            length: distance,
            time: estimatedTime
          }
        }],
        summary: {
          length: distance,
          time: estimatedTime
        }
      }
    };
  }

  private calculateDistance(start: { lat: number; lon: number }, end: { lat: number; lon: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }


  private calculateTileList(
    bounds: { north: number; south: number; east: number; west: number },
    minZoom: number,
    maxZoom: number
  ): Array<{ z: number; x: number; y: number }> {
    const tiles = [];
    
    for (let z = minZoom; z <= maxZoom; z++) {
      const nw = this.deg2tile(bounds.north, bounds.west, z);
      const se = this.deg2tile(bounds.south, bounds.east, z);
      
      for (let x = nw.x; x <= se.x; x++) {
        for (let y = nw.y; y <= se.y; y++) {
          tiles.push({ z, x, y });
        }
      }
    }
    
    return tiles;
  }

  private deg2tile(lat: number, lon: number, zoom: number): { x: number; y: number } {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  private async preloadSingleTile(style: string, z: number, x: number, y: number): Promise<void> {
    const tileUrl = `${this.baseUrl}/tiles/${style}/${z}/${x}/${y}.pbf`;
    const cacheKey = `tile-${style}-${z}-${x}-${y}`;
    
    try {
      const response = await fetch(tileUrl);
      if (response.ok) {
        const blob = await response.blob();
        this.tileCache.set(cacheKey, blob);
      }
    } catch (error) {
      throw new Error(`Failed to preload tile: ${error}`);
    }
  }
}

// Create singleton instance
export const offlineMapService = new OfflineMapService();
