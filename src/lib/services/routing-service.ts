import { Coordinates, Address, RouteResult, Station, CustomAddress } from '../store/app-store';

export interface RouteRequest {
  start: Coordinates;
  end: Coordinates;
  profile?: 'driving' | 'walking' | 'cycling' | 'police';
}

export interface RouteResponse {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  steps?: RouteStep[];
  traffic?: TrafficInfo;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export interface TrafficInfo {
  congestion: 'low' | 'medium' | 'high';
  delay: number; // in seconds
}

// Korrektur für Valhalla-Response
interface ValhallaLeg {
  summary: {
    length: number; // in km
    time: number; // in minutes
  };
  shape: string; // encoded polyline
}

// Cache-Eintrag Interface
interface CacheEntry {
  data: RouteResponse;
  timestamp: number;
}

// Metrics Interface
interface RoutingMetrics {
  provider: string;
  success: boolean;
  duration: number;
  error?: string;
}

class RoutingService {
  // Erweiterte API-URLs mit Prioritätsreihenfolge
  private readonly ROUTING_PROVIDERS = [
    {
      name: 'OSRM-Main',
      url: 'https://router.project-osrm.org/route/v1',
      priority: 1
    },
    {
      name: 'OSRM-Alt',
      url: 'https://osrm.router.place/route/v1',
      priority: 2
    },
    {
      name: 'OSRM-DE',
      url: 'https://routing.openstreetmap.de/routed-car/route/v1',
      priority: 3
    },
    {
      name: 'Valhalla',
      url: 'https://valhalla1.openstreetmap.de',
      priority: 4
    },
    {
      name: 'GraphHopper',
      url: 'https://graphhopper.com/api/1',
      priority: 5
    }
  ];

  // Erweiterte Cache-Strategie
  private readonly routeCache: Map<string, CacheEntry> = new Map();
  private readonly MAX_CACHE_SIZE = 200;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

  // Offline-Routing mit OSRM-Daten
  private readonly OFFLINE_ROUTING_URL = 'http://localhost:5000'; // Lokaler OSRM-Server
  private offlineRoutingAvailable = false;

  // Metrics für Performance-Tracking
  private readonly metrics: RoutingMetrics[] = [];

  // Standard-Headers für alle API-Calls
  private readonly DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Revierkompass/1.0'
  };

  constructor() {
    this.checkOfflineRouting();
  }

  // Verbesserte Offline-Routing-Prüfung
  private async checkOfflineRouting(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      // Verwende eine gültige Test-Routenabfrage statt /status
      const response = await fetch(`${this.OFFLINE_ROUTING_URL}/route/v1/driving/9.18,48.78;9.19,48.79?overview=false`, {
        signal: controller.signal,
        headers: this.DEFAULT_HEADERS
      });
      
      clearTimeout(timeout);
      this.offlineRoutingAvailable = response.ok;
      console.log('🗺️ Offline-Routing verfügbar:', this.offlineRoutingAvailable);
    } catch (error) {
      console.log('🗺️ Offline-Routing nicht verfügbar:', error);
      this.offlineRoutingAvailable = false;
    }
  }

  // Verbesserte Routenberechnung mit mehreren Profilen
  async calculateMultipleRoutes(
    startAddress: Address,
    selectedStationIds: string[],
    selectedCustomAddressIds: string[],
    allStations: Station[],
    customAddresses: CustomAddress[],
    routingProfile: 'fastest' | 'shortest' | 'eco' = 'fastest'
  ): Promise<RouteResult[]> {
    const results: RouteResult[] = [];
    const batchSize = 5; // Parallel-Berechnung in Batches
    
    // Alle Ziele sammeln
    const destinations = [
      ...selectedStationIds.map(id => ({ id, type: 'station' as const })),
      ...selectedCustomAddressIds.map(id => ({ id, type: 'custom' as const }))
    ];

    // Batch-weise verarbeiten für bessere Performance
    for (let i = 0; i < destinations.length; i += batchSize) {
      const batch = destinations.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ id, type }) => {
        const destination = type === 'station' 
          ? allStations.find(s => s.id === id)
          : customAddresses.find(a => a.id === id);

        if (!destination) return null;

        try {
          const route = await this.calculateSingleRoute(
            startAddress.coordinates,
            destination.coordinates,
            { profile: this.mapProfileToProvider(routingProfile) }
          );

          if (route) {
            return {
              id: `${type}-${destination.id}`,
              destinationId: destination.id,
              destinationName: destination.name,
              destinationType: type,
              address: destination.address,
              distance: route.distance / 1000,
              duration: Math.round(route.duration / 60),
              estimatedFuel: this.calculateFuelConsumption(route.distance / 1000, routingProfile),
              estimatedCost: this.calculateCost(route.distance / 1000, routingProfile),
              routeType: this.mapProfileToRouteType(routingProfile),
              coordinates: destination.coordinates,
              color: this.generateRouteColor(results.length),
              route: {
                coordinates: route.coordinates,
                distance: route.distance,
                duration: route.duration
              },
              provider: route.provider || 'OSRM',
              stationType: type === 'station' ? (destination as any).type : undefined
            };
          }
        } catch (error) {
          console.error(`Fehler bei Routenberechnung zu ${destination.name}:`, error);
          this.trackRoutingError('Batch-Processing', error);
          return this.createFallbackRoute(startAddress, destination, type);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as RouteResult[]);
    }

    return results.sort((a, b) => a.distance - b.distance);
  }

  // Verbesserte Einzelroutenberechnung mit Fallback-Kette
  async calculateSingleRoute(
    start: Coordinates,
    end: Coordinates,
    options: { profile?: string } = {}
  ): Promise<RouteResponse & { provider: string }> {
    const cacheKey = this.getCacheKey(start, end, options.profile);

    // Cache prüfen
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, provider: 'Cached' };
    }

    // Offline-Routing zuerst versuchen (falls verfügbar)
    if (this.offlineRoutingAvailable) {
      try {
        const startTime = Date.now();
        const offlineRoute = await this.calculateWithOfflineOSRM(start, end, options.profile);
        const duration = Date.now() - startTime;
        
        this.trackRoutingMetrics('Offline-OSRM', true, duration);
        this.saveToCache(cacheKey, offlineRoute);
        return { ...offlineRoute, provider: 'Offline-OSRM' };
      } catch (error) {
        console.warn('Offline-Routing fehlgeschlagen:', error);
        this.trackRoutingError('Offline-OSRM', error);
      }
    }

    // Online-Provider in Prioritätsreihenfolge versuchen
    for (const provider of this.ROUTING_PROVIDERS) {
      try {
        const startTime = Date.now();
        let route: RouteResponse;
        
        switch (provider.name) {
          case 'OSRM-Main':
          case 'OSRM-Alt':
          case 'OSRM-DE':
            route = await this.calculateWithOSRM(start, end, provider.url, options.profile);
            break;
          case 'Valhalla':
            route = await this.calculateWithValhalla(start, end, options.profile);
            break;
          case 'GraphHopper':
            route = await this.calculateWithGraphHopper(start, end, options.profile);
            break;
          default:
            continue;
        }

        const duration = Date.now() - startTime;
        this.trackRoutingMetrics(provider.name, true, duration);
        this.saveToCache(cacheKey, route);
        return { ...route, provider: provider.name };
      } catch (error) {
        console.warn(`${provider.name} fehlgeschlagen:`, error);
        this.trackRoutingError(provider.name, error);
        continue;
      }
    }

    // Fallback auf direkte Route mit realistischer Schätzung
    const fallbackRoute = this.createRealisticFallbackRoute(start, end, options.profile);
    this.saveToCache(cacheKey, fallbackRoute);
    return { ...fallbackRoute, provider: 'Fallback' };
  }

  // Offline OSRM-Routing
  private async calculateWithOfflineOSRM(
    start: Coordinates,
    end: Coordinates,
    profile: string = 'driving'
  ): Promise<RouteResponse> {
    const url = `${this.OFFLINE_ROUTING_URL}/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Offline OSRM error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseOSRMResponse(data);
  }

  // Verbesserte OSRM-Implementierung
  private async calculateWithOSRM(
    start: Coordinates,
    end: Coordinates,
    baseUrl: string,
    profile: string = 'driving'
  ): Promise<RouteResponse> {
    const url = `${baseUrl}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}`;
    
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'true',
      continue_straight: 'true'
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: this.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseOSRMResponse(data);
  }

  // OSRM-Response parsen
  private parseOSRMResponse(data: any): RouteResponse {
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Keine Route gefunden');
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]]);

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      steps: route.legs?.[0]?.steps?.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        coordinates: step.geometry?.coordinates || []
      }))
    };
  }

  // Verbesserte Valhalla-Routing
  private async calculateWithValhalla(
    start: Coordinates,
    end: Coordinates,
    profile: string = 'auto'
  ): Promise<RouteResponse> {
    const request = {
      locations: [
        { lat: start.lat, lon: start.lng },
        { lat: end.lat, lon: end.lng }
      ],
      costing: profile,
      directions_options: {
        units: 'kilometers',
        language: 'de-DE'
      }
    };

    const response = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: {
        ...this.DEFAULT_HEADERS,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Valhalla API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseValhallaResponse(data);
  }

  // Verbesserte Valhalla-Response-Parsing
  private parseValhallaResponse(data: any): RouteResponse {
    if (!data.trip?.legs?.[0]) {
      throw new Error('Keine Route gefunden');
    }

    const leg: ValhallaLeg = data.trip.legs[0];
    const coordinates = this.decodePolyline(leg.shape);

    return {
      coordinates,
      distance: leg.summary.length * 1000, // km → m
      duration: leg.summary.time * 60 // min → sec
    };
  }

  // GraphHopper-Routing
  private async calculateWithGraphHopper(
    start: Coordinates,
    end: Coordinates,
    profile: string = 'car'
  ): Promise<RouteResponse> {
    const url = 'https://graphhopper.com/api/1/route';
    const params = new URLSearchParams();
    params.append('point', `${start.lat},${start.lng}`);
    params.append('point', `${end.lat},${end.lng}`);
    params.append('vehicle', profile);
    params.append('locale', 'de');
    params.append('instructions', 'true');
    params.append('calc_points', 'true');
    params.append('points_encoded', 'false');

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: this.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseGraphHopperResponse(data);
  }

  // GraphHopper-Response parsen
  private parseGraphHopperResponse(data: any): RouteResponse {
    if (!data.paths || data.paths.length === 0) {
      throw new Error('Keine Route gefunden');
    }

    const path = data.paths[0];
    const coordinates = path.points.coordinates.map((coord: number[]) => [coord[0], coord[1]]);

    return {
      coordinates,
      distance: path.distance,
      duration: path.time / 1000 // Convert to seconds
    };
  }

  // Realistische Fallback-Route (nicht nur Luftlinie)
  private createRealisticFallbackRoute(
    start: Coordinates,
    end: Coordinates,
    profile: string = 'driving'
  ): RouteResponse {
    const directDistance = this.calculateDirectDistance(start, end);
    
    // Realistische Straßenentfernung (ca. 1.3x Luftlinie)
    const roadDistance = directDistance * 1.3;
    
    // Realistische Fahrzeit basierend auf Profil
    const avgSpeed = profile === 'driving' ? 50 : 30; // km/h
    const duration = (roadDistance / avgSpeed) * 3600; // in Sekunden

    // Einfache Route mit Zwischenpunkten für realistischere Darstellung
    const coordinates = this.generateRealisticRoute(start, end, roadDistance);

    return {
      coordinates,
      distance: roadDistance * 1000, // Convert to meters
      duration
    };
  }

  // Realistische Route mit Zwischenpunkten generieren
  private generateRealisticRoute(start: Coordinates, end: Coordinates, distance: number): [number, number][] {
    const points: [number, number][] = [];
    const numPoints = Math.max(3, Math.floor(distance / 2)); // Mindestens 3 Punkte

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      
      // Leichte Abweichung für realistischere Route
      const deviation = Math.sin(t * Math.PI) * 0.001;
      points.push([lng + deviation, lat + deviation]);
    }

    return points;
  }

  // Verbesserte Hilfsfunktionen
  private mapProfileToProvider(profile: string): string {
    const mapping: Record<string, string> = {
      'fastest': 'driving',
      'shortest': 'driving',
      'eco': 'driving',
      'police': 'emergency' // Spezialprofil für Polizei
    };
    return mapping[profile] || 'driving';
  }

  private mapProfileToRouteType(profile: string): 'Schnellste' | 'Kürzeste' | 'Ökonomisch' {
    const mapping: Record<string, 'Schnellste' | 'Kürzeste' | 'Ökonomisch'> = {
      'fastest': 'Schnellste',
      'shortest': 'Kürzeste',
      'eco': 'Ökonomisch'
    };
    return mapping[profile] || 'Schnellste';
  }

  private calculateFuelConsumption(distance: number, profile: string): number {
    const baseConsumption = 9.5; // L/100km
    const multiplier = profile === 'eco' ? 0.8 : profile === 'fastest' ? 1.2 : 1.0;
    return (distance * baseConsumption * multiplier) / 100;
  }

  private calculateCost(distance: number, profile: string): number {
    const fuelPrice = 1.75; // €/L
    const fuelConsumption = this.calculateFuelConsumption(distance, profile);
    return fuelConsumption * fuelPrice;
  }

  // Verbesserte Cache-Funktionen
  private getCacheKey(start: Coordinates, end: Coordinates, profile?: string): string {
    return `${start.lng.toFixed(6)}-${start.lat.toFixed(6)}-${end.lng.toFixed(6)}-${end.lat.toFixed(6)}-${profile || 'driving'}`;
  }

  private getFromCache(key: string): RouteResponse | null {
    const cached = this.routeCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.routeCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private saveToCache(key: string, route: RouteResponse): void {
    if (this.routeCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.routeCache.keys().next().value;
      this.routeCache.delete(oldestKey);
    }

    this.routeCache.set(key, {
      data: route,
      timestamp: Date.now()
    });
  }

  // Metrics-Tracking
  private trackRoutingMetrics(provider: string, success: boolean, duration: number, error?: string): void {
    this.metrics.push({
      provider,
      success,
      duration,
      error
    });

    // Metrics auf 100 Einträge begrenzen
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  private trackRoutingError(provider: string, error: any): void {
    this.trackRoutingMetrics(provider, false, 0, error.message);
  }

  // Metrics abrufen
  getRoutingMetrics(): RoutingMetrics[] {
    return [...this.metrics];
  }

  // Cache-Statistiken
  getCacheStats(): { size: number; hitRate: number } {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.provider === 'Cached').length;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    return {
      size: this.routeCache.size,
      hitRate
    };
  }

  // Fallback-Route für fehlgeschlagene Berechnungen
  private createFallbackRoute(
    startAddress: Address,
    destination: any,
    type: 'station' | 'custom'
  ): RouteResult {
    const directDistance = this.calculateDirectDistance(startAddress.coordinates, destination.coordinates);
    const roadDistance = directDistance * 1.3; // Realistische Schätzung

    return {
      id: `${type}-${destination.id}`,
      destinationId: destination.id,
      destinationName: destination.name,
      destinationType: type,
      address: destination.address,
      distance: roadDistance,
      duration: Math.round(roadDistance * 1.5), // Realistische Fahrzeit
      estimatedFuel: this.calculateFuelConsumption(roadDistance, 'fastest'),
      estimatedCost: this.calculateCost(roadDistance, 'fastest'),
      routeType: 'Kürzeste',
      coordinates: destination.coordinates,
      color: this.generateRouteColor(0),
      route: {
        coordinates: this.generateRealisticRoute(startAddress.coordinates, destination.coordinates, roadDistance),
        distance: roadDistance * 1000,
        duration: roadDistance * 1.5 * 60
      },
      provider: 'Direct',
      stationType: type === 'station' ? destination.type : undefined
    };
  }

  // Generate unique colors for routes
  private generateRouteColor(index: number): string {
    const colors = [
      '#3B82F6', // blue-500
      '#EF4444', // red-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#8B5CF6', // violet-500
      '#06B6D4', // cyan-500
      '#84CC16', // lime-500
      '#F97316', // orange-500
      '#EC4899', // pink-500
      '#6366F1'  // indigo-500
    ];
    return colors[index % colors.length];
  }

  // Direct distance calculation (Haversine formula)
  calculateDirectDistance(start: Coordinates, end: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(end.lat - start.lat);
    const dLng = this.degreesToRadians(end.lng - start.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(start.lat)) * 
      Math.cos(this.degreesToRadians(end.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Decode polyline (simplified implementation)
  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const routingService = new RoutingService();
