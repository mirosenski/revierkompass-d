import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

export interface TrafficSegment {
  id: string;
  coordinates: [number, number][];
  level: TrafficLevel;
  speed: number;
  delay: number;
  timestamp: number;
  description?: string;
}

export enum TrafficLevel {
  FREE = 0,
  SLOW = 1,
  CONGESTED = 2,
  BLOCKED = 3
}

export interface TrafficLevelConfig {
  level: TrafficLevel;
  name: string;
  color: string;
  opacity: number;
  icon?: string;
  description: string;
}

export const TRAFFIC_LEVELS: Record<TrafficLevel, TrafficLevelConfig> = {
  [TrafficLevel.FREE]: {
    level: TrafficLevel.FREE,
    name: 'Frei',
    color: '#22c55e',
    opacity: 0.6,
    description: 'Verkehr fließt normal'
  },
  [TrafficLevel.SLOW]: {
    level: TrafficLevel.SLOW,
    name: 'Zäh',
    color: '#f59e0b',
    opacity: 0.7,
    description: 'Verkehr ist verlangsamt'
  },
  [TrafficLevel.CONGESTED]: {
    level: TrafficLevel.CONGESTED,
    name: 'Stau',
    color: '#ef4444',
    opacity: 0.8,
    description: 'Stau auf der Strecke'
  },
  [TrafficLevel.BLOCKED]: {
    level: TrafficLevel.BLOCKED,
    name: 'Gesperrt',
    color: '#7f1d1d',
    opacity: 0.9,
    icon: '🚧',
    description: 'Straße gesperrt oder blockiert'
  }
};

export interface TrafficViewport {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
}

export class RealTimeTrafficService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connected = false;
  private currentViewport: TrafficViewport | null = null;
  private trafficData: Map<string, TrafficSegment> = new Map();
  private listeners: Set<(data: TrafficSegment[]) => void> = new Set();

  constructor(private serverUrl: string = 'http://localhost:3001') {}

  async connect(viewport?: TrafficViewport): Promise<void> {
    if (this.socket?.connected) {
      console.log('🚦 Traffic-Service bereits verbunden');
      return;
    }

    try {
      console.log('🚦 Verbinde mit Traffic-Server...');
      
      this.socket = io(`${this.serverUrl}/traffic`, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupSocketHandlers();
      
      if (viewport) {
        this.updateViewport(viewport);
      }

      toast.success('🚦 Echtzeit-Verkehrsdaten verbunden');
    } catch (error) {
      console.error('🚦 Traffic-Service Verbindungsfehler:', error);
      toast.error('Verbindung zu Verkehrsdaten fehlgeschlagen');
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🚦 Traffic-Socket verbunden');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🚦 Traffic-Socket getrennt:', reason);
      this.connected = false;
      this.stopHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server hat Verbindung getrennt, versuche Reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚦 Traffic-Socket Verbindungsfehler:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Verbindung zu Verkehrsdaten konnte nicht hergestellt werden');
      }
    });

    this.socket.on('traffic_update', (data: TrafficSegment[]) => {
      console.log('🚦 Traffic-Update erhalten:', data.length, 'Segmente');
      this.updateTrafficData(data);
    });

    this.socket.on('traffic_alert', (alert: { type: string; message: string; severity: string }) => {
      console.log('🚦 Traffic-Alert:', alert);
      
      switch (alert.severity) {
        case 'high':
          toast.error(`🚨 ${alert.message}`);
          break;
        case 'medium':
          toast(`⚠️ ${alert.message}`, { icon: '⚠️' });
          break;
        case 'low':
          toast.success(`ℹ️ ${alert.message}`);
          break;
      }
    });

    this.socket.on('error', (error) => {
      console.error('🚦 Traffic-Socket Fehler:', error);
      toast.error('Fehler bei Verkehrsdaten');
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', {
          timestamp: Date.now(),
          viewport: this.currentViewport
        });
      }
    }, 30000); // 30 Sekunden
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  updateViewport(viewport: TrafficViewport): void {
    this.currentViewport = viewport;
    
    if (this.socket?.connected) {
      this.socket.emit('viewport_update', viewport);
    }
  }

  private updateTrafficData(segments: TrafficSegment[]): void {
    // Aktualisiere lokale Daten
    segments.forEach(segment => {
      this.trafficData.set(segment.id, segment);
    });

    // Benachrichtige Listener
    const allSegments = Array.from(this.trafficData.values());
    this.listeners.forEach(listener => {
      try {
        listener(allSegments);
      } catch (error) {
        console.error('🚦 Fehler beim Benachrichtigen des Listeners:', error);
      }
    });
  }

  subscribe(callback: (data: TrafficSegment[]) => void): () => void {
    this.listeners.add(callback);
    
    // Sofortige Daten senden falls verfügbar
    if (this.trafficData.size > 0) {
      const segments = Array.from(this.trafficData.values());
      callback(segments);
    }

    // Cleanup-Funktion zurückgeben
    return () => {
      this.listeners.delete(callback);
    };
  }

  getTrafficData(): TrafficSegment[] {
    return Array.from(this.trafficData.values());
  }

  getTrafficLevel(segmentId: string): TrafficLevel | null {
    const segment = this.trafficData.get(segmentId);
    return segment?.level ?? null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    this.trafficData.clear();
    this.listeners.clear();
    console.log('🚦 Traffic-Service getrennt');
  }

  // Simulierte Traffic-Daten für Entwicklung
  generateMockTrafficData(bounds: { north: number; south: number; east: number; west: number }): TrafficSegment[] {
    const segments: TrafficSegment[] = [];
    const numSegments = Math.floor(Math.random() * 10) + 5; // 5-15 Segmente

    for (let i = 0; i < numSegments; i++) {
      const lat1 = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng1 = bounds.west + Math.random() * (bounds.east - bounds.west);
      const lat2 = lat1 + (Math.random() - 0.5) * 0.01;
      const lng2 = lng1 + (Math.random() - 0.5) * 0.01;

      const level = Math.floor(Math.random() * 4) as TrafficLevel;
      const speed = 30 + Math.random() * 70; // 30-100 km/h
      const delay = Math.random() * 15; // 0-15 Minuten

      segments.push({
        id: `mock-${i}`,
        coordinates: [[lng1, lat1], [lng2, lat2]],
        level,
        speed,
        delay,
        timestamp: Date.now(),
        description: TRAFFIC_LEVELS[level].description
      });
    }

    return segments;
  }
}

// Singleton-Instanz
export const realTimeTrafficService = new RealTimeTrafficService(); 