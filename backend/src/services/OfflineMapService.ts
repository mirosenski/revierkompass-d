import axios from 'axios';
import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { getProfileDisplayName } from '../../../shared/offline-map/profiles';

interface RoutingProfile {
  mode: 'auto' | 'bicycle' | 'pedestrian' | 'bus' | 'emergency';
  costing: string;
  costing_options?: any;
}

interface RouteRequest {
  locations: Array<{ lat: number; lon: number }>;
  costing: string;
  directions_options?: {
    units: 'kilometers';
    language: 'de-DE';
  };
  alternates?: number;
}

interface RouteResponse {
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
}

interface TileRequest {
  z: number;
  x: number;
  y: number;
  format?: 'pbf' | 'png' | 'jpg' | 'webp';
  style?: string;
}

export class OfflineMapService {
  private osrmUrl: string;
  private valhallaUrl: string;
  private tileServerUrl: string;
  private nominatimUrl: string;
  private isOfflineMode: boolean = false;

  constructor() {
    this.osrmUrl = process.env.OSRM_URL || 'http://localhost:5000';
    this.valhallaUrl = process.env.VALHALLA_URL || 'http://localhost:8002';
    this.tileServerUrl = process.env.TILESERVER_URL || 'http://localhost:8080';
    this.nominatimUrl = process.env.NOMINATIM_URL || 'http://localhost:8001';
  }

  /**
   * Check if all offline services are available
   */
  async checkOfflineCapabilities(): Promise<{
    osrm: boolean;
    valhalla: boolean;
    tileserver: boolean;
    nominatim: boolean;
    offline_mode: boolean;
  }> {
    const checks = await Promise.allSettled([
      this.pingService(`${this.osrmUrl}/route/v1/driving/9.1,48.7;9.2,48.8`),
      this.pingService(`${this.valhallaUrl}/route`),
      this.pingService(`${this.tileServerUrl}/styles.json`),
      this.pingService(`${this.nominatimUrl}/search?q=Stuttgart&format=json&limit=1`)
    ]);

    const [osrm, valhalla, tileserver, nominatim] = checks.map(
      check => check.status === 'fulfilled'
    );

    this.isOfflineMode = osrm && valhalla && tileserver && nominatim;

    return {
      osrm,
      valhalla,
      tileserver,
      nominatim,
      offline_mode: this.isOfflineMode
    };
  }

  /**
   * Get routing profiles optimized for different use cases
   */
  getRoutingProfiles(): Record<string, RoutingProfile> {
    return {
      emergency_fast: {
        mode: 'emergency',
        costing: 'auto',
        costing_options: {
          auto: {
            maneuver_penalty: 5,
            gate_cost: 30,
            toll_booth_cost: 15,
            use_highways: 1.0,
            use_tolls: 1.0,
            use_ferry: 0.5,
            top_speed: 150 // Emergency vehicles
          }
        }
      },
      police_patrol: {
        mode: 'auto',
        costing: 'auto',
        costing_options: {
          auto: {
            maneuver_penalty: 10,
            use_highways: 0.8,
            use_tolls: 0.9,
            use_tracks: 0.3,
            top_speed: 130
          }
        }
      },
      pedestrian_safe: {
        mode: 'pedestrian',
        costing: 'pedestrian',
        costing_options: {
          pedestrian: {
            walking_speed: 4.0,
            walkway_factor: 1.0,
            sidewalk_factor: 1.5,
            alley_factor: 0.1,
            driveway_factor: 0.2,
            step_penalty: 30
          }
        }
      },
      bicycle_patrol: {
        mode: 'bicycle',
        costing: 'bicycle',
        costing_options: {
          bicycle: {
            cycling_speed: 20.0,
            use_roads: 0.8,
            use_hills: 0.3,
            avoid_bad_surfaces: 0.8
          }
        }
      },
      public_transport: {
        mode: 'bus',
        costing: 'bus',
        costing_options: {
          bus: {
            maneuver_penalty: 15,
            use_highways: 0.3,
            use_tolls: 0.1
          }
        }
      }
    };
  }

  /**
   * Calculate route using Valhalla (preferred) or OSRM (fallback)
   */
  async calculateRoute(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    profile: string = 'police_patrol',
    alternatives: number = 0
  ): Promise<RouteResponse> {
    const profiles = this.getRoutingProfiles();
    const routingProfile = profiles[profile] || profiles.police_patrol;

    try {
      // Try Valhalla first (more advanced routing)
      const valhallaRequest: RouteRequest = {
        locations: [
          { lat: start.lat, lon: start.lon },
          { lat: end.lat, lon: end.lon }
        ],
        costing: routingProfile.costing,
        directions_options: {
          units: 'kilometers',
          language: 'de-DE'
        },
        alternates: alternatives
      };

      if (routingProfile.costing_options) {
        (valhallaRequest as any).costing_options = routingProfile.costing_options;
      }

      const valhallaResponse = await axios.post(
        `${this.valhallaUrl}/route`,
        valhallaRequest,
        { timeout: 15000 }
      );

      return valhallaResponse.data;

    } catch (valhallaError) {
      console.warn('Valhalla routing failed, falling back to OSRM:', valhallaError);
      
      // Fallback to OSRM
      try {
        const osrmResponse = await axios.get(
          `${this.osrmUrl}/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}`,
          {
            params: {
              overview: 'full',
              geometries: 'geojson',
              alternatives: alternatives > 0 ? 'true' : 'false',
              steps: 'true',
              annotations: 'true'
            },
            timeout: 10000
          }
        );

        // Convert OSRM format to Valhalla-like format
        const osrmData = osrmResponse.data;
        const route = osrmData.routes[0];
        
        return {
          trip: {
            legs: route.legs.map((leg: any) => ({
              shape: this.encodePolyline(route.geometry.coordinates),
              distance: leg.distance / 1000, // Convert to km
              time: leg.duration / 60, // Convert to minutes
              summary: {
                length: leg.distance / 1000,
                time: leg.duration / 60
              }
            })),
            summary: {
              length: route.distance / 1000,
              time: route.duration / 60
            }
          }
        };

      } catch (osrmError) {
        console.error('Both Valhalla and OSRM routing failed:', osrmError);
        throw new Error('Routing services unavailable');
      }
    }
  }

  /**
   * Get multiple alternative routes
   */
  async calculateAlternativeRoutes(
    start: { lat: number; lon: number },
    end: { lat: number; lon: number },
    profiles: string[] = ['emergency_fast', 'police_patrol', 'pedestrian_safe']
  ): Promise<Array<RouteResponse & { profile: string; name: string }>> {
    const routes = await Promise.allSettled(
      profiles.map(async (profile) => {
        const route = await this.calculateRoute(start, end, profile);
        return {
          ...route,
          profile,
          name: getProfileDisplayName(profile)
        };
      })
    );

    return routes
      .filter((result): result is PromiseFulfilledResult<RouteResponse & { profile: string; name: string }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Proxy map tiles from local tile server
   */
  async proxyTile(req: TileRequest, res: Response): Promise<void> {
    const { z, x, y, format = 'pbf', style = 'bw-police' } = req;
    
    try {
      const tileUrl = `${this.tileServerUrl}/styles/${style}/${z}/${x}/${y}.${format}`;
      
      const response = await axios.get(tileUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'Accept': format === 'pbf' ? 'application/x-protobuf' : `image/${format}`
        }
      });

      res.set({
        'Content-Type': format === 'pbf' ? 'application/x-protobuf' : `image/${format}`,
        'Content-Encoding': format === 'pbf' ? 'gzip' : undefined,
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'Access-Control-Allow-Origin': '*'
      });

      res.send(response.data);

    } catch (error) {
      console.error('Tile proxy error:', error);
      res.status(404).send('Tile not found');
    }
  }

  /**
   * Get map style configuration
   */
  async getMapStyle(styleId: string = 'bw-police'): Promise<any> {
    try {
      const response = await axios.get(`${this.tileServerUrl}/styles/${styleId}.json`, {
        timeout: 5000
      });

      // Modify URLs to point to our proxy
      const style = response.data;
      
      // Update source URLs to use our backend proxy
      Object.keys(style.sources).forEach(sourceId => {
        const source = style.sources[sourceId];
        if (source.url && source.url.startsWith('mbtiles://')) {
          source.url = source.url.replace('mbtiles://', `/api/tiles/source/`);
        }
      });

      // Update sprite and glyph URLs
      if (style.sprite) {
        style.sprite = style.sprite.replace('http://localhost:8080', '/api/tiles');
      }
      if (style.glyphs) {
        style.glyphs = style.glyphs.replace('http://localhost:8080', '/api/tiles');
      }

      return style;

    } catch (error) {
      console.error('Failed to fetch map style:', error);
      throw new Error('Map style unavailable');
    }
  }

  /**
   * Geocode address using local Nominatim
   */
  async geocodeAddress(query: string): Promise<Array<{
    lat: number;
    lon: number;
    display_name: string;
    importance: number;
    place_id: string;
  }>> {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          countrycodes: 'de',
          bounded: 1,
          viewbox: '7.5,47.5,10.5,50.0', // Baden-Württemberg bounding box
          addressdetails: 1
        },
        timeout: 8000
      });

      return response.data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        importance: result.importance || 0.5,
        place_id: result.place_id
      }));

    } catch (error) {
      console.error('Geocoding failed:', error);
      throw new Error('Geocoding service unavailable');
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
    // This would normally load from a local database or file
    // For now, return mock data for demonstration
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            type: 'security_zone',
            name: 'Stuttgart Hauptbahnhof Sicherheitszone',
            level: 'high',
            restrictions: ['no_weapons', 'enhanced_patrol']
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [9.1800, 48.7840],
              [9.1820, 48.7840],
              [9.1820, 48.7860],
              [9.1800, 48.7860],
              [9.1800, 48.7840]
            ]]
          }
        },
        {
          type: 'Feature', 
          properties: {
            type: 'school_zone',
            name: 'Grundschule Mitte',
            hours: '07:00-17:00',
            speed_limit: 30
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [9.1750, 48.7750],
              [9.1770, 48.7750],
              [9.1770, 48.7770],
              [9.1750, 48.7770],
              [9.1750, 48.7750]
            ]]
          }
        }
      ]
    };
  }

  /**
   * Generate offline data package
   */
  async generateOfflinePackage(
    bounds: { north: number; south: number; east: number; west: number },
    minZoom: number = 8,
    maxZoom: number = 16
  ): Promise<string> {
    // This would generate an MBTiles package for the specified area
    // Implementation would involve:
    // 1. Extract tiles from the specified bounds and zoom levels
    // 2. Package routing data for the area
    // 3. Include NBAN and police station data
    // 4. Create a zip file with all offline resources
    
    const packageInfo = {
      bounds,
      minZoom,
      maxZoom,
      generated: new Date().toISOString(),
      services: await this.checkOfflineCapabilities()
    };

    // For demonstration, return a mock package ID
    return `bw-offline-package-${Date.now()}`;
  }

  // Private helper methods

  private async pingService(url: string): Promise<boolean> {
    try {
      const response = await axios.get(url, { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private encodePolyline(coordinates: number[][]): string {
    // Simple polyline encoding (you might want to use a proper library)
    // This is a placeholder implementation
    return coordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
  }

}

export const offlineMapService = new OfflineMapService();
