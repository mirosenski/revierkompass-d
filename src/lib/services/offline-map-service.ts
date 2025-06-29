import { toast } from 'react-hot-toast';
import { DEFAULT_ROUTE_PROFILES } from '../../../shared/offline-map/profiles';
import { Coordinates, RouteResult } from '../store/app-store';

// Typ-Definitionen mit erweiterten Details
export interface OfflineMapConfig {
  tileServerUrl: string;
  routingServerUrl: string;
  geocodingServerUrl: string;
  onlineGeocodingUrl: string;
  dataPath: string;
  maxCacheSize?: number; // Optionale Cache-Konfiguration
  tileCacheStrategy?: 'memory' | 'indexeddb' | 'both'; // Erweiterte Cache-Strategien
}

export interface OfflineCapabilities {
  routing: boolean;
  geocoding: boolean;
  tiles: boolean;
  search: boolean;
  // Erweiterte Fähigkeiten
  vectorTiles?: boolean;
  is3dTerrain?: boolean;
  pois?: boolean;
}

export interface NetworkStatus {
  online: boolean;
  lastCheck: number;
  bandwidth?: number; // Optionale Bandbreiten-Schätzung
}

interface RouteProfile {
  id: string;
  name: string;
  mode: string;
  costing: string;
  description: string;
  icon: string;
  useCase: string;
  // Erweiterte Profile-Informationen
  minZoom?: number;
  maxZoom?: number;
  restrictions?: string[];
}

interface RouteRequest {
  start: { lat: number; lon: number };
  end: { lat: number; lon: number };
  profile?: string;
  alternatives?: number;
  // Erweiterte Routing-Optionen
  avoid?: string[]; // z.B. ['highways', 'tolls']
  preference?: 'fastest' | 'shortest' | 'eco';
  departure?: Date; // Für zeitabhängiges Routing
}

interface MapStyle {
  name: string;
  description: string;
  thumbnail: string;
  // Erweiterte Style-Informationen
  minZoom?: number;
  maxZoom?: number;
  attribution?: string;
  is3d?: boolean;
}

// Hauptklasse mit verbesserten Typen
export class OfflineMapService {
  private config: OfflineMapConfig;
  private capabilities: OfflineCapabilities;
  private networkStatus: NetworkStatus;
  private tileCache: Map<string, any>;
  private searchIndex: Map<string, any>;
  private baseUrl: string;
  private routeCache: Map<string, RouteResult> = new Map();
  private isInitialized = false;

  constructor() {
    this.config = {
      tileServerUrl: 'http://localhost:8080',
      routingServerUrl: 'http://localhost:5000',
      geocodingServerUrl: 'http://localhost:7070',
      onlineGeocodingUrl: 'https://nominatim.openstreetmap.org',
      dataPath: '/data'
    };
    
    this.capabilities = {
      tiles: false,
      routing: false,
      geocoding: false,
      search: false
    };
    
    this.networkStatus = {
      online: navigator.onLine,
      lastCheck: Date.now()
    };
    
    this.tileCache = new Map();
    this.searchIndex = new Map();
    this.baseUrl = '/api/maps';
    
    this.initializeOfflineCapabilities();
    this.setupNetworkMonitoring();
    this.loadCachedData();
  }

  /**
   * Initialisiert den Offline-Kartendienst
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
   * Prüft, ob Offline-Dienste verfügbar sind
   */
  async checkCapabilities(): Promise<OfflineCapabilities> {
    try {
      const response = await fetch(`${this.baseUrl}/capabilities`);
      const capabilities = await response.json();
      this.capabilities = capabilities;
      return capabilities;
    } catch (error) {
      console.error('Failed to check offline capabilities:', error);
      this.capabilities = {
        routing: false,
        geocoding: false,
        tiles: false,
        search: false
      };
      return this.capabilities;
    }
  }

  /**
   * Gibt den aktuellen Netzwerkstatus zurück
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Prüft, ob wir im Offline-Modus sind
   */
  isOfflineMode(): boolean {
    return !this.networkStatus.online;
  }

  /**
   * Gibt verfügbare Kartenstile zurück
   */
  async getMapStyles(): Promise<Record<string, MapStyle>> {
    const cacheKey = 'map-styles';
    
    // Versuche, die zwischengespeicherte Version zu verwenden, wenn offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/styles`);
      const styles = await response.json();
      
      // Für Offline-Caching zwischenspeichern
      localStorage.setItem(cacheKey, JSON.stringify(styles));
      
      return styles;
    } catch (error) {
      console.error('Failed to get map styles:', error);
      
      // Auf zwischengespeicherte Version zurückgreifen
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Gibt Kartenstil-Konfiguration zurück
   */
  async getMapStyle(styleId: string): Promise<any> {
    const cacheKey = `map-style-${styleId}`;
    
    // Versuche, die zwischengespeicherte Version zu verwenden, wenn offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/styles/${styleId}`);
      const style = await response.json();
      
      // URLs aktualisieren, um auf unseren Service Worker für Offline-Caching zu verweisen
      if ('serviceWorker' in navigator) {
        style.sources = this.updateSourceUrlsForOffline(style.sources);
      }
      
      // Für Offline-Caching zwischenspeichern
      localStorage.setItem(cacheKey, JSON.stringify(style));
      
      return style;
    } catch (error) {
      console.error('Failed to get map style:', error);
      
      // Auf zwischengespeicherte Version zurückgreifen
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Berechnet Route mit Offline- oder Online-Diensten
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResult> {
    const cacheKey = `route-${JSON.stringify(request)}`;
    
    // Zuerst Cache prüfen
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
      
      // Ergebnis zwischenspeichern
      this.routeCache.set(cacheKey, route);
      
      return route;
    } catch (error) {
      console.error('Route calculation error:', error);
      
      // Versuchen, Fallback-Routing zu verwenden, wenn verfügbar
      if (this.isOfflineMode()) {
        return this.calculateFallbackRoute(request);
      }
      
      throw error;
    }
  }

  /**
   * Berechnet mehrere Routenalternativen
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
      
      // Bei Fehlschlag auf einzelne Route zurückgreifen
      const mainRoute = await this.calculateRoute({ start, end });
      return [mainRoute];
    }
  }

  /**
   * Gibt verfügbare Routing-Profile zurück
   */
  async getRoutingProfiles(): Promise<RouteProfile[]> {
    const cacheKey = 'routing-profiles';
    
    // Versuche, die zwischengespeicherte Version zu verwenden, wenn offline
    if (this.isOfflineMode()) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/profiles`);
      const profiles = await response.json();
      
      // Für Offline-Caching zwischenspeichern
      localStorage.setItem(cacheKey, JSON.stringify(profiles));
      
      return profiles;
    } catch (error) {
      console.error('Failed to get routing profiles:', error);
      
      // Auf zwischengespeicherte Version oder Standard-Profile zurückgreifen
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      return DEFAULT_ROUTE_PROFILES;
    }
  }

  /**
   * Geocodiert Adresse mit Offline Nominatim oder Online-Fallback
   */
  async geocodeAddress(query: string): Promise<Array<{
    lat: number;
    lon: number;
    display_name: string;
    importance: number;
    place_id: string;
  }>> {
    const cacheKey = `geocode-${query}`;
    
    // Zuerst Cache prüfen
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Zuerst versuchen, Offline-Nominatim zu verwenden
      if (this.capabilities.geocoding) {
        console.log('🔍 Verwende Offline-Nominatim für:', query);
        const response = await fetch(`${this.config.geocodingServerUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=de`);
        
        if (response.ok) {
          const results = await response.json();
          
          // Ergebnisse zwischenspeichern
          localStorage.setItem(cacheKey, JSON.stringify(results));
          
          return results;
        }
      }
      
      // Fallback zu Online-Nominatim
      console.log('🌐 Verwende Online-Nominatim als Fallback für:', query);
      const onlineResponse = await fetch(`${this.config.onlineGeocodingUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=de`, {
        headers: {
          'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
        }
      });
      
      if (onlineResponse.ok) {
        const results = await onlineResponse.json();
        
        // Ergebnisse zwischenspeichern
        localStorage.setItem(cacheKey, JSON.stringify(results));
        
        return results;
      }
      
      throw new Error('Geocoding fehlgeschlagen');
      
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Auf zwischengespeicherte Version zurückgreifen
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw error;
    }
  }

  /**
   * Ruft NBAN-Daten (spezielle Zonen) ab
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
      
      // Leere Feature-Collection zurückgeben, wenn offline
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Lädt Kacheln für Offline-Nutzung vor
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
   * Löscht Offline-Cache
   */
  async clearOfflineCache(): Promise<void> {
    try {
      // Kachel-Cache löschen
      this.tileCache.clear();
      
      // Routen-Cache löschen
      this.routeCache.clear();
      
      // localStorage-Cache löschen
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('map-') || key.startsWith('route-') || key.startsWith('geocode-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Service Worker Cache löschen
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

  // Private Methoden

  private async initializeOfflineCapabilities(): Promise<void> {
    try {
      // Routing-Fähigkeit prüfen
      const routingResponse = await fetch(`${this.config.routingServerUrl}/route/v1/driving/9.18,48.78;9.19,48.79`, {
        signal: AbortSignal.timeout(3000)
      });
      this.capabilities.routing = routingResponse.ok;

      // Geocoding-Fähigkeit prüfen
      const geocodingResponse = await fetch(`${this.config.geocodingServerUrl}/search?q=Stuttgart&format=json&limit=1`, {
        signal: AbortSignal.timeout(3000)
      });
      this.capabilities.geocoding = geocodingResponse.ok;

      // Tile-Server prüfen
      const tileResponse = await fetch(`${this.config.tileServerUrl}/styles/streets/0/0/0.png`, {
        signal: AbortSignal.timeout(3000)
      });
      this.capabilities.tiles = tileResponse.ok;

      console.log('🗺️ Offline-Capabilities:', this.capabilities);
    } catch (error) {
      console.warn('Offline-Capabilities konnten nicht initialisiert werden:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.networkStatus.online = true;
      this.networkStatus.lastCheck = Date.now();
      console.log('🌐 Online-Modus aktiviert');
    });

    window.addEventListener('offline', () => {
      this.networkStatus.online = false;
      this.networkStatus.lastCheck = Date.now();
      console.log('📴 Offline-Modus aktiviert');
    });
  }

  private loadCachedData(): void {
    // Zwischengespeicherte Daten laden, die sofort verfügbar sein müssen
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
        // URLs sind bereits für unseren Backend konfiguriert
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
    // Einfache Luftlinienentfernung als Fallback
    const distance = this.calculateDistance(request.start, request.end);
    const estimatedTime = distance / 50; // Annahme: 50 km/h Durchschnittsgeschwindigkeit
    
    return {
      id: `fallback-${Date.now()}`,
      destinationId: 'fallback',
      destinationName: 'Fallback-Route',
      destinationType: 'custom',
      address: 'Berechnet ohne Online-Verbindung',
      distance: distance / 1000, // in km
      duration: Math.round(estimatedTime * 60), // in minutes
      estimatedFuel: (distance / 1000) * 0.095,
      estimatedCost: (distance / 1000) * 0.095 * 1.75,
      routeType: 'Schnellste',
      coordinates: { lat: request.end.lat, lng: request.end.lon },
      color: '#3b82f6', // Standardfarbe
      route: {
        coordinates: [[request.start.lon, request.start.lat], [request.end.lon, request.end.lat]],
        distance: distance * 1000, // in meters
        duration: estimatedTime * 60 // in seconds
      },
      provider: 'Direct'
    };
  }

  private calculateDistance(start: { lat: number; lon: number }, end: { lat: number; lon: number }): number {
    const R = 6371; // Erdradius in km
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // in meters
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
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
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

  // Offline-Routing mit lokaler OSRM-Instanz
  async calculateOfflineRoute(
    start: Coordinates,
    end: Coordinates,
    profile: string = 'driving'
  ): Promise<RouteResult | null> {
    if (!this.capabilities.routing) {
      console.warn('Offline-Routing nicht verfügbar');
      return null;
    }

    try {
      const url = `${this.config.routingServerUrl}/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}`;
      const params = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'true'
      });

      const response = await fetch(`${url}?${params}`, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Offline-Routing Fehler: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOfflineRouteResponse(data, start, end);
    } catch (error) {
      console.error('Offline-Routing fehlgeschlagen:', error);
      return null;
    }
  }

  private parseOfflineRouteResponse(data: any, start: Coordinates, end: Coordinates): RouteResult {
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Keine Route gefunden');
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]]);

    return {
      id: `offline-${Date.now()}`,
      destinationId: 'offline',
      destinationName: 'Offline-Route',
      destinationType: 'custom',
      address: 'Offline berechnet',
      distance: route.distance / 1000,
      duration: Math.round(route.duration / 60),
      estimatedFuel: (route.distance / 1000) * 0.095,
      estimatedCost: (route.distance / 1000) * 0.095 * 1.75,
      routeType: 'Schnellste',
      coordinates: end,
      color: '#3b82f6',
      route: {
        coordinates,
        distance: route.distance,
        duration: route.duration
      },
      provider: 'Offline-OSRM'
    };
  }

  // Offline-Geocoding mit lokaler Nominatim-Instanz
  async geocodeOfflineAddress(query: string): Promise<Array<{
    lat: number;
    lng: number;
    display_name: string;
    importance: number;
  }>> {
    if (!this.capabilities.geocoding) {
      console.warn('Offline-Geocoding nicht verfügbar');
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        countrycodes: 'de',
        bounded: '1',
        viewbox: '7.5,47.5,10.5,50.0' // Baden-Württemberg
      });

      const response = await fetch(`${this.config.geocodingServerUrl}/search?${params}`, {
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`Offline-Geocoding Fehler: ${response.status}`);
      }

      const data = await response.json();
      return data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        importance: result.importance || 0.5
      }));
    } catch (error) {
      console.error('Offline-Geocoding fehlgeschlagen:', error);
      return [];
    }
  }

  // Offline-Kartenstile laden
  async getOfflineMapStyle(styleName: string): Promise<any> {
    const styleMap: Record<string, string> = {
      'streets': '/styles/offline-streets.json',
      'satellite': '/styles/offline-satellite.json',
      'terrain': '/styles/offline-terrain.json',
      'police': '/styles/offline-police.json'
    };

    const stylePath = styleMap[styleName] || styleMap.streets;

    try {
      const response = await fetch(stylePath);
      if (!response.ok) {
        throw new Error(`Style nicht gefunden: ${stylePath}`);
      }

      const style = await response.json();
      
      // Tile-URLs auf lokalen Server umleiten
      if (this.capabilities.tiles) {
        this.replaceTileUrls(style);
      }

      return style;
    } catch (error) {
      console.error('Offline-Style konnte nicht geladen werden:', error);
      return this.getDefaultStyle();
    }
  }

  private replaceTileUrls(style: any): void {
    if (style.sources) {
      Object.keys(style.sources).forEach(sourceKey => {
        const source = style.sources[sourceKey];
        if (source.url && source.url.includes('maptiler.com')) {
          source.url = `${this.config.tileServerUrl}/styles/${sourceKey}/tiles.json`;
        }
        if (source.tiles) {
          source.tiles = source.tiles.map((tile: string) => 
            tile.replace(/https:\/\/api\.maptiler\.com/, this.config.tileServerUrl)
          );
        }
      });
    }
  }

  private getDefaultStyle(): any {
    return {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: [`${this.config.tileServerUrl}/tile/{z}/{x}/{y}.png`],
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
    };
  }

  // Offline-Suche mit lokalem Index
  async searchOffline(query: string): Promise<Array<{
    id: string;
    name: string;
    address: string;
    coordinates: Coordinates;
    type: 'station' | 'address' | 'poi';
  }>> {
    if (!this.capabilities.search) {
      return [];
    }

    const results: Array<{
      id: string;
      name: string;
      address: string;
      coordinates: Coordinates;
      type: 'station' | 'address' | 'poi';
    }> = [];

    // Lokalen Suchindex durchsuchen
    for (const [key, item] of this.searchIndex) {
      if (key.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.address.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
    }

    return results.slice(0, 10); // Maximal 10 Ergebnisse
  }

  // Suchindex laden
  async loadSearchIndex(): Promise<void> {
    try {
      const response = await fetch('/data/search-index.json');
      if (response.ok) {
        const data = await response.json();
        this.searchIndex.clear();
        
        data.forEach((item: any) => {
          this.searchIndex.set(item.id, item);
          this.searchIndex.set(item.name, item);
          this.searchIndex.set(item.address, item);
        });

        this.capabilities.search = true;
        console.log('🔍 Suchindex geladen:', this.searchIndex.size, 'Einträge');
      }
    } catch (error) {
      console.warn('Suchindex konnte nicht geladen werden:', error);
    }
  }

  // Tile-Caching
  async cacheTile(z: number, x: number, y: number, tileData: ArrayBuffer): Promise<void> {
    const key = `${z}/${x}/${y}`;
    this.tileCache.set(key, {
      data: tileData,
      timestamp: Date.now()
    });

    // Cache-Größe begrenzen
    if (this.tileCache.size > (this.config.maxCacheSize || 1000)) {
      const oldestKey = this.tileCache.keys().next().value;
      this.tileCache.delete(oldestKey);
    }
  }

  async getCachedTile(z: number, x: number, y: number): Promise<ArrayBuffer | null> {
    const key = `${z}/${x}/${y}`;
    const cached = this.tileCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.data;
    }
    
    return null;
  }

  // Status-Informationen
  getCapabilities(): OfflineCapabilities {
    return { ...this.capabilities };
  }

  // Offline-Daten vorbereiten
  async prepareOfflineData(area: {
    bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
    zoomLevels: number[];
  }): Promise<void> {
    console.log('📦 Offline-Daten werden vorbereitet...');
    
    const { bounds, zoomLevels } = area;
    const [minLng, minLat, maxLng, maxLat] = bounds;

    for (const zoom of zoomLevels) {
      const tiles = this.getTilesForBounds(minLng, minLat, maxLng, maxLat, zoom);
      
      for (const [x, y] of tiles) {
        try {
          const tileUrl = `${this.config.tileServerUrl}/tile/${zoom}/${x}/${y}.png`;
          const response = await fetch(tileUrl);
          
          if (response.ok) {
            const tileData = await response.arrayBuffer();
            await this.cacheTile(zoom, x, y, tileData);
          }
        } catch (error) {
          console.warn(`Tile ${zoom}/${x}/${y} konnte nicht geladen werden:`, error);
        }
      }
    }

    console.log('✅ Offline-Daten vorbereitet');
  }

  private getTilesForBounds(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    zoom: number
  ): Array<[number, number]> {
    const tiles: Array<[number, number]> = [];
    
    const minTile = this.lngLatToTile(minLng, minLat, zoom);
    const maxTile = this.lngLatToTile(maxLng, maxLat, zoom);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = maxTile.y; y <= minTile.y; y++) {
        tiles.push([x, y]);
      }
    }
    
    return tiles;
  }

  private lngLatToTile(lng: number, lat: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
  }

  /**
   * Registriert den Service Worker für Offline-Funktionalität
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker erfolgreich registriert');
      } catch (error) {
        console.warn('Service Worker konnte nicht registriert werden:', error);
      }
    }
  }
}

// Standard-Konfiguration
export const defaultOfflineConfig: OfflineMapConfig = {
  tileServerUrl: 'http://localhost:8080',
  routingServerUrl: 'http://localhost:5000',
  geocodingServerUrl: 'http://localhost:7070',
  onlineGeocodingUrl: 'https://nominatim.openstreetmap.org',
  dataPath: '/data',
  maxCacheSize: 2000, // Erhöhte Cache-Kapazität
  tileCacheStrategy: 'both' // Memory + IndexedDB
};

// Singleton-Instanz
export const offlineMapService = new OfflineMapService();