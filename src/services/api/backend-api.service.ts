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
    const response = await axios.get(API_URL, { 
      params,
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Stationen erfolgreich geladen:', response.data.length, 'Stationen');
    return response.data.stations || response.data;
  } catch (error) {
    // Kein Fallback mehr auf lokale Daten!
    console.error('❌ Backend nicht erreichbar, keine Stationen geladen!');
    throw new Error('Stationen konnten nicht geladen werden');
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
