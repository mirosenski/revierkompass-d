import axios from 'axios'
import { Station } from '@/types/station.types'

// Verwende Vite Proxy statt direkter Backend-URL
const API_URL = '/api/stationen'

// Fallback-Daten importieren (TypeScript statt JSON)
import { localStationsData } from '@/data/stations'

// Hilfsfunktion zum Token holen
function getAuthToken(): string | null {
  try {
    // Token aus localStorage holen (Zustand-Store persistiert dort)
    const authData = localStorage.getItem('revierkompass-v2-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.token) {
        console.log('🔑 Token gefunden:', parsed.token.substring(0, 20) + '...');
        return parsed.token;
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Token abrufen:', error);
  }
  console.warn('⚠️ Kein Token im localStorage gefunden');
  return null;
}

export const fetchStations = async (params = {}): Promise<Station[]> => {
  try {
    console.log('🔄 Lade Stationen vom Backend-Server...');
    
    // Zuerst Health Check
    try {
      await axios.get('/api/health', { timeout: 2000 });
      console.log('✅ Backend ist erreichbar');
    } catch (healthError) {
      console.warn('⚠️ Backend Health Check fehlgeschlagen:', healthError.message);
    }
    
    const response = await axios.get(API_URL, { 
      params,
      timeout: 10000, // Längeres Timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Stationen erfolgreich geladen:', response.data.length, 'Stationen');
    return response.data.stations || response.data;
  } catch (error) {
    console.error('❌ Backend nicht erreichbar:', error.message);
    
    // Fallback zu statischen Daten
    console.log('🔄 Verwende Fallback-Daten...');
    return localStationsData;
  }
}

export const createStation = async (station: Omit<Station, 'id' | 'lastModified'>): Promise<Station> => {
  const token = getAuthToken();
  // Temporär auskommentiert für Tests
  // if (!token) throw new Error('Kein Authentifizierungs-Token gefunden. Bitte einloggen.');
  try {
    console.log('🔄 Erstelle neue Station...', station);
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Stelle sicher, dass Koordinaten korrekt formatiert sind
    const stationData = {
      ...station,
      coordinates: Array.isArray(station.coordinates) 
        ? station.coordinates 
        : [(station.coordinates as any).lat || 0, (station.coordinates as any).lng || 0]
    };
    
    console.log('📤 Sende Station-Daten:', stationData);
    const response = await axios.post(API_URL, stationData, { headers });
    console.log('✅ Station erfolgreich erstellt:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Station:', error);
    throw error;
  }
}

export const updateStation = async (id: string, station: Partial<Station>): Promise<Station> => {
  const token = getAuthToken();
  // Temporär auskommentiert für Tests
  // if (!token) throw new Error('Kein Authentifizierungs-Token gefunden. Bitte einloggen.');
  try {
    console.log('🔄 Aktualisiere Station:', id);
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await axios.put(`${API_URL}/${id}`, station, { headers });
    console.log('✅ Station erfolgreich aktualisiert:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Station:', error);
    throw error;
  }
}

export const deleteStation = async (id: string): Promise<void> => {
  const token = getAuthToken();
  // Temporär auskommentiert für Tests
  // if (!token) throw new Error('Kein Authentifizierungs-Token gefunden. Bitte einloggen.');
  try {
    console.log('🔄 Lösche Station:', id);
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await axios.delete(`${API_URL}/${id}`, { headers });
    console.log('✅ Station erfolgreich gelöscht');
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Station:', error);
    throw error;
  }
}

// Neue Funktion für Geocoding mit Fallback
export const geocodeAddress = async (query: string): Promise<any[]> => {
  try {
    console.log('🔍 Geocoding für:', query);
    
    // Zuerst versuchen, lokalen Nominatim zu verwenden
    try {
      const localResponse = await axios.get(`/api/maps/geocoding`, {
        params: { q: query },
        timeout: 3000
      });
      
      console.log('✅ Lokaler Nominatim erfolgreich');
      return localResponse.data;
    } catch (localError) {
      console.log('⚠️ Lokaler Nominatim nicht verfügbar, verwende Online-Fallback');
    }
    
    // Fallback zu Online-Nominatim
    const onlineResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        countrycodes: 'de'
      },
      timeout: 5000,
      headers: {
        'User-Agent': 'Revierkompass/1.0 (https://revierkompass.de)'
      }
    });
    
    console.log('✅ Online-Nominatim erfolgreich');
    return onlineResponse.data;
    
  } catch (error) {
    console.error('❌ Geocoding fehlgeschlagen:', error.message);
    throw new Error('Geocoding service unavailable');
  }
}
