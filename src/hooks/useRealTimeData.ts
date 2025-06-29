import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeTrafficService, TrafficSegment, TrafficViewport } from '@/lib/services/real-time-traffic-service';
import { poiStreamingService, POI, POIViewport, POIFilter, POICategory } from '@/lib/services/poi-streaming-service';
import { buildings3DService, Building3D, BuildingsViewport, BuildingsConfig } from '@/lib/services/3d-buildings-service';
import { toast } from 'react-hot-toast';

export interface RealTimeDataConfig {
  traffic: boolean;
  pois: POICategory[] | boolean;
  buildings3d: boolean | 'auto';
  updateInterval: number;
  autoConnect: boolean;
  performanceMode: boolean;
}

export interface RealTimeDataState {
  traffic: {
    enabled: boolean;
    connected: boolean;
    data: TrafficSegment[];
    lastUpdate: number | null;
  };
  pois: {
    enabled: boolean;
    data: POI[];
    filter: POIFilter;
    lastUpdate: number | null;
  };
  buildings3d: {
    enabled: boolean;
    data: Building3D[];
    config: BuildingsConfig;
    lastUpdate: number | null;
  };
  performance: {
    fps: number;
    memory: number;
    networkUsage: number;
  };
}

export interface RealTimeDataActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  updateViewport: (viewport: { bounds: any; zoom: number; center: [number, number] }) => void;
  toggleTraffic: () => void;
  togglePOIs: () => void;
  toggleBuildings3D: () => void;
  updatePOIFilter: (filter: POIFilter) => void;
  updateBuildingsConfig: (config: Partial<BuildingsConfig>) => void;
  clearCache: () => void;
}

const DEFAULT_CONFIG: RealTimeDataConfig = {
  traffic: true,
  pois: [POICategory.POLICE, POICategory.PARKING, POICategory.CHARGING_STATION],
  buildings3d: 'auto',
  updateInterval: 5000,
  autoConnect: true,
  performanceMode: false
};

export function useRealTimeData(config: Partial<RealTimeDataConfig> = {}): [RealTimeDataState, RealTimeDataActions] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<RealTimeDataState>({
    traffic: {
      enabled: finalConfig.traffic,
      connected: false,
      data: [],
      lastUpdate: null
    },
    pois: {
      enabled: Array.isArray(finalConfig.pois) ? finalConfig.pois.length > 0 : finalConfig.pois,
      data: [],
      filter: {
        categories: Array.isArray(finalConfig.pois) ? finalConfig.pois : Object.values(POICategory)
      },
      lastUpdate: null
    },
    buildings3d: {
      enabled: finalConfig.buildings3d === true || finalConfig.buildings3d === 'auto',
      data: [],
      config: {
        enabled: true,
        minZoom: 15,
        maxZoom: 18,
        opacity: 0.7,
        shadowEnabled: true,
        shadowMinZoom: 16,
        lodLevels: [
          { zoom: 15, name: 'Simple Boxes', detail: 'simple', maxBuildings: 1000 },
          { zoom: 16, name: 'With Texture', detail: 'textured', maxBuildings: 2000 },
          { zoom: 17, name: 'Detailed Roofs', detail: 'detailed', maxBuildings: 5000 },
          { zoom: 18, name: 'Window Details', detail: 'full', maxBuildings: 10000 }
        ],
        performanceCheck: true,
        cityWhitelist: [
          'Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg',
          'Heilbronn', 'Ulm', 'Pforzheim', 'Reutlingen', 'Ludwigsburg'
        ]
      },
      lastUpdate: null
    },
    performance: {
      fps: 60,
      memory: 0,
      networkUsage: 0
    }
  });

  const currentViewport = useRef<{ bounds: any; zoom: number; center: [number, number] } | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Traffic-Service Integration
  useEffect(() => {
    if (!state.traffic.enabled) return;

    const unsubscribe = realTimeTrafficService.subscribe((data) => {
      setState(prev => ({
        ...prev,
        traffic: {
          ...prev.traffic,
          data,
          lastUpdate: Date.now()
        }
      }));
    });

    return unsubscribe;
  }, [state.traffic.enabled]);

  // POI-Service Integration
  useEffect(() => {
    if (!state.pois.enabled) return;

    const unsubscribe = poiStreamingService.subscribe((data) => {
      setState(prev => ({
        ...prev,
        pois: {
          ...prev.pois,
          data,
          lastUpdate: Date.now()
        }
      }));
    });

    return unsubscribe;
  }, [state.pois.enabled]);

  // Buildings3D-Service Integration
  useEffect(() => {
    if (!state.buildings3d.enabled) return;

    const unsubscribe = buildings3DService.subscribe((data) => {
      setState(prev => ({
        ...prev,
        buildings3d: {
          ...prev.buildings3d,
          data,
          lastUpdate: Date.now()
        }
      }));
    });

    return unsubscribe;
  }, [state.buildings3d.enabled]);

  // Performance Monitoring
  useEffect(() => {
    if (!finalConfig.performanceMode) return;

    performanceIntervalRef.current = setInterval(() => {
      const stats = buildings3DService.getPerformanceStats();
      setState(prev => ({
        ...prev,
        performance: {
          fps: stats.fps.average,
          memory: stats.memory.average,
          networkUsage: 0 // TODO: Implement network usage tracking
        }
      }));
    }, 1000);

    return () => {
      if (performanceIntervalRef.current) {
        clearInterval(performanceIntervalRef.current);
      }
    };
  }, [finalConfig.performanceMode]);

  // Auto-Connect
  useEffect(() => {
    if (finalConfig.autoConnect && state.traffic.enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [finalConfig.autoConnect, state.traffic.enabled]);

  const connect = useCallback(async () => {
    try {
      if (state.traffic.enabled) {
        await realTimeTrafficService.connect();
        setState(prev => ({
          ...prev,
          traffic: {
            ...prev.traffic,
            connected: true
          }
        }));
      }
    } catch (error) {
      console.error('Real-Time-Daten Verbindungsfehler:', error);
      toast.error('Verbindung zu Echtzeit-Daten fehlgeschlagen');
    }
  }, [state.traffic.enabled]);

  const disconnect = useCallback(() => {
    realTimeTrafficService.disconnect();
    setState(prev => ({
      ...prev,
      traffic: {
        ...prev.traffic,
        connected: false
      }
    }));
  }, []);

  const updateViewport = useCallback((viewport: { bounds: any; zoom: number; center: [number, number] }) => {
    currentViewport.current = viewport;

    // Traffic Viewport Update
    if (state.traffic.enabled && state.traffic.connected) {
      const trafficViewport: TrafficViewport = {
        bounds: viewport.bounds,
        zoom: viewport.zoom
      };
      realTimeTrafficService.updateViewport(trafficViewport);
    }

    // POI Viewport Update
    if (state.pois.enabled) {
      const poiViewport: POIViewport = {
        bounds: viewport.bounds,
        zoom: viewport.zoom
      };
      poiStreamingService.loadPOIs(poiViewport, state.pois.filter);
    }

    // Buildings3D Viewport Update
    if (state.buildings3d.enabled) {
      const buildingsViewport: BuildingsViewport = {
        bounds: viewport.bounds,
        zoom: viewport.zoom,
        center: viewport.center
      };
      buildings3DService.loadBuildings(buildingsViewport);
    }
  }, [state.traffic.enabled, state.traffic.connected, state.pois.enabled, state.pois.filter, state.buildings3d.enabled]);

  const toggleTraffic = useCallback(() => {
    setState(prev => ({
      ...prev,
      traffic: {
        ...prev.traffic,
        enabled: !prev.traffic.enabled
      }
    }));

    if (state.traffic.enabled) {
      disconnect();
    } else {
      connect();
    }
  }, [state.traffic.enabled, connect, disconnect]);

  const togglePOIs = useCallback(() => {
    setState(prev => ({
      ...prev,
      pois: {
        ...prev.pois,
        enabled: !prev.pois.enabled
      }
    }));
  }, []);

  const toggleBuildings3D = useCallback(() => {
    setState(prev => ({
      ...prev,
      buildings3d: {
        ...prev.buildings3d,
        enabled: !prev.buildings3d.enabled
      }
    }));

    if (state.buildings3d.enabled) {
      buildings3DService.disable();
    } else {
      buildings3DService.enable();
    }
  }, [state.buildings3d.enabled]);

  const updatePOIFilter = useCallback((filter: POIFilter) => {
    setState(prev => ({
      ...prev,
      pois: {
        ...prev.pois,
        filter
      }
    }));

    poiStreamingService.updateFilter(filter);

    // Reload POIs if viewport is available
    if (currentViewport.current && state.pois.enabled) {
      const poiViewport: POIViewport = {
        bounds: currentViewport.current.bounds,
        zoom: currentViewport.current.zoom
      };
      poiStreamingService.loadPOIs(poiViewport, filter);
    }
  }, [state.pois.enabled]);

  const updateBuildingsConfig = useCallback((config: Partial<BuildingsConfig>) => {
    setState(prev => ({
      ...prev,
      buildings3d: {
        ...prev.buildings3d,
        config: {
          ...prev.buildings3d.config,
          ...config
        }
      }
    }));

    buildings3DService.updateConfig(config);
  }, []);

  const clearCache = useCallback(() => {
    poiStreamingService.clearCache();
    buildings3DService.clearCache();
    toast.success('Cache geleert');
  }, []);

  const actions: RealTimeDataActions = {
    connect,
    disconnect,
    updateViewport,
    toggleTraffic,
    togglePOIs,
    toggleBuildings3D,
    updatePOIFilter,
    updateBuildingsConfig,
    clearCache
  };

  return [state, actions];
} 