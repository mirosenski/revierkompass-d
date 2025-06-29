import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, NavigationControl, FullscreenControl, GeolocateControl, Marker, Popup, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Home, 
  Shield, 
  Badge, 
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Route,
  Navigation2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { offlineMapService } from '@/lib/services/offline-map-service';
import { RouteResult } from '@/lib/store/app-store';

interface OfflineMapComponentProps {
  routeResults: RouteResult[];
  startAddress: string;
  startCoordinates: { lat: number; lng: number };
  showOfflineControls?: boolean;
  onRouteRecalculate?: (routeId: string, profile: string) => void;
}

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

const OfflineMapComponent: React.FC<OfflineMapComponentProps> = ({
  routeResults,
  startAddress,
  startCoordinates,
  showOfflineControls = true,
  onRouteRecalculate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeVisibility, setRouteVisibility] = useState<Record<string, boolean>>(
    routeResults.reduce((acc, route) => ({ ...acc, [route.id]: true }), {})
  );
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('bw-police');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ online: navigator.onLine });
  const [offlineCapabilities, setOfflineCapabilities] = useState<OfflineCapabilities | null>(null);
  const [isPreloadingTiles, setIsPreloadingTiles] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [nbanData, setNbanData] = useState<any>(null);

  // Map styles configuration
  const mapStyles = {
    'bw-basic': {
      name: 'BW Basic',
      description: 'Grundkarte Baden-Württemberg'
    },
    'bw-police': {
      name: 'BW Police',
      description: 'Polizei-optimierte Karte'
    },
    'bw-satellite': {
      name: 'BW Satellite',
      description: 'Satellitenkarte'
    }
  };

  // Initialize offline map service and network monitoring
  useEffect(() => {
    const initializeOfflineService = async () => {
      try {
        await offlineMapService.initialize();
        const capabilities = await offlineMapService.checkCapabilities();
        setOfflineCapabilities(capabilities);
        
        const profiles = await offlineMapService.getRoutingProfiles();
        setAvailableProfiles(profiles);
      } catch (error) {
        console.error('Failed to initialize offline service:', error);
      }
    };

    initializeOfflineService();

    // Monitor network status
    const updateNetworkStatus = () => {
      const status = offlineMapService.getNetworkStatus();
      setNetworkStatus(status);
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        // Get map style configuration
        const styleConfig = await offlineMapService.getMapStyle(mapStyle);
        
        // Initialize map
        map.current = new MapLibreMap({
          container: mapContainer.current!,
          style: styleConfig,
          center: [startCoordinates.lng, startCoordinates.lat],
          zoom: 10,
          pitch: 0,
          bearing: 0
        });

        // Add controls
        map.current.addControl(new NavigationControl(), 'top-left');
        map.current.addControl(new FullscreenControl(), 'top-left');
        map.current.addControl(new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }), 'top-left');

        map.current.on('load', () => {
          setMapLoaded(true);
          loadNBANData();
          addRouteMarkers();
          addRouteLines();
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
          if (!networkStatus.online) {
            toast.error('Kartenfehler im Offline-Modus - prüfen Sie Ihre gespeicherten Karten');
          }
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast.error('Karte konnte nicht geladen werden');
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [startCoordinates, mapStyle]);

  // Load NBAN data
  const loadNBANData = useCallback(async () => {
    if (!map.current || !mapLoaded) return;

    try {
      const bounds = map.current.getBounds();
      const nban = await offlineMapService.getNBANData({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      setNbanData(nban);

      // Add NBAN data to map
      if (map.current.getSource('nban-data')) {
        (map.current.getSource('nban-data') as any).setData(nban);
      } else {
        map.current.addSource('nban-data', {
          type: 'geojson',
          data: nban
        });

        // Add NBAN layers
        map.current.addLayer({
          id: 'nban-security-zones',
          type: 'fill',
          source: 'nban-data',
          filter: ['==', ['get', 'type'], 'security_zone'],
          paint: {
            'fill-color': '#ff7675',
            'fill-opacity': 0.3
          }
        });

        map.current.addLayer({
          id: 'nban-school-zones',
          type: 'fill',
          source: 'nban-data',
          filter: ['==', ['get', 'type'], 'school_zone'],
          paint: {
            'fill-color': '#fdcb6e',
            'fill-opacity': 0.3
          }
        });
      }
    } catch (error) {
      console.error('Failed to load NBAN data:', error);
    }
  }, [map, mapLoaded]);

  // Add route markers
  const addRouteMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    // Add start marker
    const startMarker = new Marker({
      color: '#00ff00',
      scale: 1.2
    })
      .setLngLat([startCoordinates.lng, startCoordinates.lat])
      .setPopup(new Popup().setHTML(`
        <div class="p-3">
          <h3 class="font-semibold text-gray-900">Startadresse</h3>
          <p class="text-sm text-gray-600">${startAddress}</p>
        </div>
      `))
      .addTo(map.current);

    // Add destination markers
    routeResults.forEach((route) => {
      const marker = new Marker({
        color: route.color,
        scale: 1.0
      })
        .setLngLat([route.coordinates.lng, route.coordinates.lat])
        .setPopup(new Popup().setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-gray-900">${route.destinationName}</h3>
            <p class="text-sm text-gray-600">${route.address}</p>
            <div class="mt-2 space-y-1">
              <p class="text-sm"><strong>Entfernung:</strong> ${route.distance.toFixed(1)} km</p>
              <p class="text-sm"><strong>Fahrzeit:</strong> ${route.duration} min</p>
              <p class="text-sm"><strong>Routentyp:</strong> ${route.routeType}</p>
            </div>
          </div>
        `))
        .addTo(map.current);
    });

    // Fit map to show all markers
    if (routeResults.length > 0) {
      const bounds = new LngLatBounds();
      bounds.extend([startCoordinates.lng, startCoordinates.lat]);
      routeResults.forEach(route => {
        bounds.extend([route.coordinates.lng, route.coordinates.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [map, mapLoaded, routeResults, startCoordinates, startAddress]);

  // Add route lines
  const addRouteLines = useCallback(async () => {
    if (!map.current || !mapLoaded) return;

    for (const route of routeResults) {
      try {
        // Calculate route using offline service
        const routeData = await offlineMapService.calculateRoute({
          start: { lat: startCoordinates.lat, lon: startCoordinates.lng },
          end: { lat: route.coordinates.lat, lon: route.coordinates.lng },
          profile: route.profile || 'police_patrol'
        });

        // Convert route shape to GeoJSON
        const routeGeoJSON = {
          type: 'Feature' as const,
          properties: {
            routeId: route.id,
            color: route.color
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: parseRouteShape(routeData.trip.legs[0].shape)
          }
        };

        // Add route source and layer
        if (!map.current.getSource(`route-${route.id}`)) {
          map.current.addSource(`route-${route.id}`, {
            type: 'geojson',
            data: routeGeoJSON
          });

          map.current.addLayer({
            id: `route-line-${route.id}`,
            type: 'line',
            source: `route-${route.id}`,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': route.color,
              'line-width': 4,
              'line-opacity': routeVisibility[route.id] ? 0.8 : 0.3
            }
          });

          // Add route click handler
          map.current.on('click', `route-line-${route.id}`, () => {
            setActivePopup(route.id);
          });
        }
      } catch (error) {
        console.error(`Failed to add route line for ${route.id}:`, error);
      }
    }
  }, [map, mapLoaded, routeResults, startCoordinates, routeVisibility]);

  // Parse route shape (simple implementation)
  const parseRouteShape = (shape: string): number[][] => {
    try {
      return shape.split(';').map(point => {
        const [lat, lng] = point.split(',').map(Number);
        return [lng, lat]; // GeoJSON uses [lng, lat] format
      });
    } catch (error) {
      console.error('Failed to parse route shape:', error);
      return [];
    }
  };

  // Toggle route visibility
  const toggleRouteVisibility = (routeId: string) => {
    setRouteVisibility(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));

    if (map.current) {
      const visible = !routeVisibility[routeId];
      map.current.setPaintProperty(`route-line-${routeId}`, 'line-opacity', visible ? 0.8 : 0.3);
    }
  };

  // Change map style
  const changeMapStyle = async (styleId: string) => {
    if (!map.current) return;

    try {
      const styleConfig = await offlineMapService.getMapStyle(styleId);
      map.current.setStyle(styleConfig);
      setMapStyle(styleId);

      // Re-add custom layers after style change
      map.current.once('styledata', () => {
        loadNBANData();
        addRouteLines();
      });

      toast.success(`Kartenstil geändert zu ${mapStyles[styleId as keyof typeof mapStyles]?.name}`);
    } catch (error) {
      console.error('Failed to change map style:', error);
      toast.error('Kartenstil konnte nicht geändert werden');
    }
  };

  // Preload tiles for offline use
  const preloadTiles = async () => {
    if (!map.current) return;

    setIsPreloadingTiles(true);
    setPreloadProgress(0);

    try {
      const bounds = map.current.getBounds();
      const boundsObj = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };

      await offlineMapService.preloadTiles(
        mapStyle,
        boundsObj,
        8,
        16,
        (progress) => setPreloadProgress(progress)
      );

      toast.success('Kacheln erfolgreich für Offline-Nutzung geladen');
    } catch (error) {
      console.error('Tile preload failed:', error);
      toast.error('Fehler beim Laden der Kacheln');
    } finally {
      setIsPreloadingTiles(false);
      setPreloadProgress(0);
    }
  };

  // Recalculate route with different profile
  const recalculateRoute = async (routeId: string, profileId: string) => {
    const route = routeResults.find(r => r.id === routeId);
    if (!route || !onRouteRecalculate) return;

    try {
      toast.loading('Route wird neu berechnet...', { id: `route-${routeId}` });
      
      onRouteRecalculate(routeId, profileId);
      
      toast.success('Route erfolgreich neu berechnet', { id: `route-${routeId}` });
    } catch (error) {
      console.error('Route recalculation failed:', error);
      toast.error('Fehler bei der Routenneuberechnung', { id: `route-${routeId}` });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Network Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute top-4 right-4 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
          networkStatus.online 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        }`}
      >
        {networkStatus.online ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        )}
      </motion.div>

      {/* Offline Capabilities Status */}
      {showOfflineControls && offlineCapabilities && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Offline-Dienste
          </h4>
          <div className="space-y-1">
            {[
              { key: 'tileserver', label: 'Karten', icon: MapPin },
              { key: 'osrm', label: 'Routing', icon: Route },
              { key: 'nominatim', label: 'Geocoding', icon: Navigation2 },
              { key: 'valhalla', label: 'Erweitert', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center space-x-2">
                <Icon className="h-3 w-3" />
                <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
                {offlineCapabilities[key as keyof OfflineCapabilities] ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
        <div className="flex flex-col space-y-2">
          {/* Style Selector */}
          <select
            value={mapStyle}
            onChange={(e) => changeMapStyle(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {Object.entries(mapStyles).map(([id, style]) => (
              <option key={id} value={id}>
                {style.name}
              </option>
            ))}
          </select>

          {/* Offline Controls */}
          {showOfflineControls && (
            <div className="flex space-x-1">
              <button
                onClick={preloadTiles}
                disabled={isPreloadingTiles}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                title="Kacheln für Offline-Nutzung laden"
              >
                {isPreloadingTiles ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => setShowOfflinePanel(!showOfflinePanel)}
                className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                title="Offline-Einstellungen"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Preload Progress */}
        {isPreloadingTiles && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            />
            <div className="text-xs text-center mt-1 text-gray-600">
              {Math.round(preloadProgress)}%
            </div>
          </div>
        )}
      </div>

      {/* Route Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Routen-Legende
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {routeResults.map((route) => (
            <div key={route.id} className="flex items-center space-x-3">
              <button
                onClick={() => toggleRouteVisibility(route.id)}
                className="flex items-center space-x-2 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
              >
                {routeVisibility[route.id] ? (
                  <Eye className="h-4 w-4 text-gray-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: route.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {route.destinationName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {route.distance.toFixed(1)} km • {route.duration} min
                  </p>
                </div>
              </button>

              {/* Route Profile Selector */}
              {availableProfiles.length > 0 && (
                <select
                  value={route.profile || 'police_patrol'}
                  onChange={(e) => recalculateRoute(route.id, e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Routing-Profil ändern"
                >
                  {availableProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.icon} {profile.name.split('(')[0]}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Offline Panel */}
      <AnimatePresence>
        {showOfflinePanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Offline-Einstellungen
              </h3>
              <button
                onClick={() => setShowOfflinePanel(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Network Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Netzwerkstatus
                </h4>
                <div className="flex items-center space-x-2">
                  {networkStatus.online ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm">Online</span>
                      {networkStatus.effectiveType && (
                        <span className="text-xs text-gray-500">
                          ({networkStatus.effectiveType})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-sm">Offline</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tile Preload */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Kacheln-Download
                </h4>
                <button
                  onClick={preloadTiles}
                  disabled={isPreloadingTiles}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isPreloadingTiles ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Lädt... {Math.round(preloadProgress)}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Sichtbare Kacheln laden</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cache Management */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Cache-Verwaltung
                </h4>
                <button
                  onClick={() => offlineMapService.clearOfflineCache()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Cache leeren</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineMapComponent;
