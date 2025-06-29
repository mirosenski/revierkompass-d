// services/geocodingService.ts
interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
}

export class GeocodingService {
  private static NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  private static CACHE_KEY = 'geocoding_cache';
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 Tage

  // Cache für Geocoding-Ergebnisse
  private static getCache(): Map<string, GeocodingResult> {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      try {
        return new Map(JSON.parse(cached));
      } catch {
        return new Map();
      }
    }
    return new Map();
  }

  private static saveCache(cache: Map<string, GeocodingResult>): void {
    localStorage.setItem(
      this.CACHE_KEY,
      JSON.stringify(Array.from(cache.entries()))
    );
  }

  // Adresse zu Koordinaten
  static async geocodeAddress(
    street: string,
    zipCode: string,
    city: string,
    country: string = 'Deutschland'
  ): Promise<GeocodingResult | null> {
    const fullAddress = `${street}, ${zipCode} ${city}, ${country}`;
    const cacheKey = fullAddress.toLowerCase();

    // Cache prüfen
    const cache = this.getCache();
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        q: fullAddress,
        format: 'json',
        limit: '1',
        countrycodes: 'de',
        addressdetails: '1'
      });

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`, {
        headers: {
          'User-Agent': 'Revierkompass/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Geocoding fehlgeschlagen');
      }

      const data = await response.json();

      if (data.length === 0) {
        return null;
      }

      const result: GeocodingResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formatted_address: data[0].display_name,
        confidence: parseFloat(data[0].importance || 0.5)
      };

      // In Cache speichern
      cache.set(cacheKey, result);
      this.saveCache(cache);

      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Reverse Geocoding: Koordinaten zu Adresse
  static async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{
    street?: string;
    zipCode?: string;
    city?: string;
    formatted?: string;
  } | null> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            'User-Agent': 'Revierkompass/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding fehlgeschlagen');
      }

      const data = await response.json();

      return {
        street: `${data.address.road || ''} ${data.address.house_number || ''}`.trim(),
        zipCode: data.address.postcode,
        city: data.address.city || data.address.town || data.address.village,
        formatted: data.display_name
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Validiere Adresse mit Geocoding
  static async validateAddressWithGeocoding(
    street: string,
    zipCode: string,
    city: string
  ): Promise<{
    isValid: boolean;
    coordinates?: [number, number];
    confidence?: number;
    suggestion?: string;
  }> {
    const result = await this.geocodeAddress(street, zipCode, city);

    if (!result) {
      return { isValid: false };
    }

    // Confidence-Schwelle für Validierung
    const isValid = result.confidence > 0.3;

    return {
      isValid,
      coordinates: isValid ? [result.lat, result.lng] : undefined,
      confidence: result.confidence,
      suggestion: result.formatted_address
    };
  }
}

// hooks/useGeocoding.ts
import { useState, useCallback } from 'react';
import { GeocodingService } from '../services/geocodingService';
import { toast } from 'react-hot-toast';

export function useGeocoding() {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastResult, setLastResult] = useState<{
    coordinates?: [number, number];
    confidence?: number;
  } | null>(null);

  const geocodeAddress = useCallback(async (
    street: string,
    zipCode: string,
    city: string
  ) => {
    setIsGeocoding(true);
    try {
      const result = await GeocodingService.validateAddressWithGeocoding(
        street,
        zipCode,
        city
      );

      if (result.isValid && result.coordinates) {
        setLastResult({
          coordinates: result.coordinates,
          confidence: result.confidence
        });
        toast.success('Koordinaten gefunden!');
        return result.coordinates;
      } else {
        toast.error('Adresse konnte nicht gefunden werden');
        return null;
      }
    } catch (error) {
      toast.error('Fehler bei der Adresssuche');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const result = await GeocodingService.reverseGeocode(lat, lng);
      if (result) {
        toast.success('Adresse gefunden!');
        return result;
      } else {
        toast.error('Keine Adresse gefunden');
        return null;
      }
    } catch (error) {
      toast.error('Fehler bei der Koordinatensuche');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  return {
    geocodeAddress,
    reverseGeocode,
    isGeocoding,
    lastResult
  };
}