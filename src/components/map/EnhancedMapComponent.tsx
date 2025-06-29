import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Map as MapLibreMap, 
  NavigationControl, 
  FullscreenControl, 
  GeolocateControl, 
  Marker, 
  Popup, 
  LngLatBounds
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';
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
  Route,
  Clock,
  Fuel
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RouteResult } from '@/lib/store/app-store';
import { offlineMapService } from '@/lib/services/offline-map-service';
import { routingService } from '@/lib/services/routing-service';

interface EnhancedMapComponentProps {
  routeResults: RouteResult[];
  startAddress: string;
  startCoordinates: { lat: number; lng: number };
  onMarkerClick?: (route: RouteResult) => void;
  onRouteRecalculate?: (routeId: string, newRoute: RouteResult) => void;
}

const EnhancedMapComponent: React.FC<EnhancedMapComponentProps> = ({
  routeResults,
  startAddress,
  startCoordinates,
  onMarkerClick,
  onRouteRecalculate
}) => {
  console.log('🗺️ EnhancedMapComponent erhält', routeResults.length, 'Routen');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeVisibility, setRouteVisibility] = useState<Record<string, boolean>>(
    routeResults.reduce((acc, route) => ({ ...acc, [route.id]: true }), {})
  );
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('streets');
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [clustersEnabled, setClustersEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [routingProfile, setRoutingProfile] = useState<'fastest' | 'shortest' | 'eco'>('fastest');
  const [showRouteDetails, setShowRouteDetails] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<string | null>(null);

  // Map styles mit Offline-Unterstützung
  const mapStyles = {
    streets: {
      name: 'Straßen',
      url: offlineMode 
        ? '/styles/offline-streets.json'
        : 'https://api.maptiler.com/maps/streets-v2/style.json?key=QSdqT57jTC1C80kuBccz'
    },
    satellite: {
      name: 'Satellit',
      url: offlineMode 
        ? '/styles/offline-satellite.json'
        : 'https://api.maptiler.com/maps/hybrid/style.json?key=QSdqT57jTC1C80kuBccz'
    },
    terrain: {
      name: 'Gelände',
      url: offlineMode 
        ? '/styles/offline-terrain.json'
        : 'https://api.maptiler.com/maps/landscape/style.json?key=QSdqT57jTC1C80kuBccz'
    },
    police: {
      name: 'Polizei',
      url: offlineMode 
        ? '/styles/offline-police.json'
        : '/styles/police-style.json'
    }
  };

  // Offline-Status überwachen
  useEffect(() => {
    const checkOfflineStatus = () => {
      const capabilities = offlineMapService.getCapabilities();
      const networkStatus = offlineMapService.getNetworkStatus();
      setOfflineMode(!networkStatus.online || capabilities.routing);
    };

    checkOfflineStatus();
    const interval = setInterval(checkOfflineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Routen neu berechnen
  const recalculateRoute = useCallback(async (routeId: string) => {
    if (!onRouteRecalculate) return;

    setIsRecalculating(routeId);
    try {
      const route = routeResults.find(r => r.id === routeId);
      if (!route) return;

      let newRoute: RouteResult;

      if (offlineMode) {
        // Offline-Routing verwenden
        const offlineRoute = await offlineMapService.calculateOfflineRoute(
          startCoordinates,
          route.coordinates,
          routingProfile
        );
        if (offlineRoute) {
          newRoute = { ...route, ...offlineRoute };
        } else {
          throw new Error('Offline-Routing fehlgeschlagen');
        }
      } else {
        // Online-Routing verwenden
        const onlineRoute = await routingService.calculateSingleRoute(
          startCoordinates,
          route.coordinates,
          { profile: routingProfile }
        );
        newRoute = {
          ...route,
          distance: onlineRoute.distance / 1000,
          duration: Math.round(onlineRoute.duration / 60),
          route: {
            coordinates: onlineRoute.coordinates,
            distance: onlineRoute.distance,
            duration: onlineRoute.duration
          },
          provider: onlineRoute.provider as "OSRM" | "Valhalla" | "GraphHopper" | "Direct" | "Offline-OSRM"
        };
      }

      onRouteRecalculate(routeId, newRoute);
      toast.success(`Route zu ${route.destinationName} neu berechnet`);
    } catch (error) {
      console.error('Route-Recalculation failed:', error);
      toast.error('Route konnte nicht neu berechnet werden');
    } finally {
      setIsRecalculating(null);
    }
  }, [routeResults, startCoordinates, offlineMode, routingProfile, onRouteRecalculate]);

  // Map initialisieren
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        let styleUrl = mapStyles[mapStyle as keyof typeof mapStyles].url;
        
        // Offline-Style laden falls verfügbar
        if (offlineMode) {
          try {
            const offlineStyle = await offlineMapService.getOfflineMapStyle(mapStyle);
            styleUrl = offlineStyle;
          } catch (error) {
            console.warn('Offline-Style konnte nicht geladen werden, verwende Online-Style');
          }
        }

        map.current = new MapLibreMap({
          container: mapContainer.current!,
          style: styleUrl,
          center: [startCoordinates.lng, startCoordinates.lat],
          zoom: 10,
          pitch: 0,
          bearing: 0,
          maxPitch: 60
        });

        // GPU-Optimierung
        map.current.getCanvas().style.transform = 'translateZ(0)';

        // Controls hinzufügen
        map.current.addControl(new NavigationControl({
          showCompass: true,
          visualizePitch: true
        }), 'top-left');

        map.current.addControl(new FullscreenControl(), 'top-left');
        
        map.current.addControl(new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
            timeout: 10000
          },
          trackUserLocation: true
        }), 'top-left');

        // Event-Handler
        map.current.on('load', () => {
          setMapLoaded(true);
          setupMapSources();
          addMarkers();
          fitToRoutes();
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
          if (offlineMode) {
            toast.error('Kartenfehler im Offline-Modus - prüfen Sie Ihre gespeicherten Karten');
          }
        });

        // Responsive Handling
        const resizeObserver = new ResizeObserver(() => {
          map.current?.resize();
        });
        resizeObserver.observe(mapContainer.current);

        return () => {
          resizeObserver.disconnect();
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        };
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast.error('Karte konnte nicht geladen werden');
      }
    };

    initializeMap();
  }, [startCoordinates, mapStyle, offlineMode]);

  // Map-Sources einrichten
  const setupMapSources = useCallback(() => {
    if (!map.current) return;

    console.log('🗺️ Setup Map Sources für', routeResults.length, 'Routen');

    // Start-Marker hinzufügen
    if (map.current.getSource('start-marker')) {
      map.current.removeSource('start-marker');
    }
    map.current.addSource('start-marker', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [startCoordinates.lng, startCoordinates.lat]
        }
      }
    });

    // Route-Sources für jede Route
    routeResults.forEach((route) => {
      if (!route.id || route.id === 'undefined' || route.id === 'null') {
        console.warn('Invalid route ID:', route.id);
        return;
      }

      const coordinates = route.route?.coordinates || [
        [startCoordinates.lng, startCoordinates.lat],
        [route.coordinates.lng, route.coordinates.lat]
      ];

      const sourceId = `route-${route.id}`;

      // Vorherige Layer/Source entfernen
      if (map.current!.getSource(sourceId)) {
        if (map.current!.getLayer(`route-line-${route.id}`)) {
          map.current!.removeLayer(`route-line-${route.id}`);
        }
        if (map.current!.getLayer(`route-outline-${route.id}`)) {
          map.current!.removeLayer(`route-outline-${route.id}`);
        }
        map.current!.removeSource(sourceId);
      }

      // Neue Source hinzufügen
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeId: route.id,
            distance: route.distance,
            duration: route.duration,
            color: route.color
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Route-Outline Layer
      map.current!.addLayer({
        id: `route-outline-${route.id}`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#000000',
          'line-width': 8,
          'line-opacity': 0.3
        }
      });

      // Route-Line Layer
      map.current!.addLayer({
        id: `route-line-${route.id}`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': route.color,
          'line-width': 6,
          'line-opacity': 0.8,
          'line-dasharray': route.provider === 'Offline-OSRM' ? [2, 2] : [1]
        }
      });

      // Route-Click-Handler
      map.current!.on('click', `route-line-${route.id}`, () => {
        showRoutePopup(route);
      });
    });
  }, [routeResults, startCoordinates]);

  // Marker hinzufügen
  const addMarkers = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    // Start-Marker
    const startMarkerElement = document.createElement('div');
    startMarkerElement.className = 'custom-marker start-marker';
    startMarkerElement.innerHTML = `
      <div class="marker-content">
        <div class="marker-icon start">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="marker-label">Start</div>
      </div>
    `;

    const startPopup = new Popup({ offset: 25 }).setHTML(`
      <div class="p-4 max-w-xs">
        <div class="flex items-center space-x-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 class="font-bold text-gray-800">Startadresse</h3>
        </div>
        <p class="text-sm text-gray-600">${startAddress}</p>
        <div class="mt-2 text-xs text-gray-500">
          📍 ${startCoordinates.lat.toFixed(6)}, ${startCoordinates.lng.toFixed(6)}
        </div>
      </div>
    `);

    new Marker({ element: startMarkerElement })
      .setLngLat([startCoordinates.lng, startCoordinates.lat])
      .setPopup(startPopup)
      .addTo(map.current);

    // Ziel-Marker
    routeResults.forEach((route) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker destination-marker';
      markerElement.innerHTML = `
        <div class="marker-content">
          <div class="marker-icon destination" style="background-color: ${route.color}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="marker-label">${route.destinationName}</div>
        </div>
      `;

      const popup = new Popup({ offset: 25 }).setHTML(`
        <div class="p-4 max-w-xs">
          <div class="flex items-center space-x-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background-color: ${route.color}"></div>
            <h3 class="font-bold text-gray-800">${route.destinationName}</h3>
          </div>
          <p class="text-sm text-gray-600 mb-3">${route.address}</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="font-medium text-gray-700">Entfernung:</span>
              <span class="text-gray-600"> ${route.distance.toFixed(1)} km</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Fahrzeit:</span>
              <span class="text-gray-600"> ${route.duration} min</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Kraftstoff:</span>
              <span class="text-gray-600"> ${route.estimatedFuel.toFixed(1)} L</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Kosten:</span>
              <span class="text-gray-600"> €${route.estimatedCost.toFixed(2)}</span>
            </div>
          </div>
          <div class="mt-2 text-xs">
            <span class="inline-block px-2 py-1 rounded-full text-white text-xs font-medium" 
                  style="background-color: ${route.color}">
              ${route.routeType}
            </span>
            <span class="ml-2 text-gray-500">${route.provider}</span>
          </div>
          ${offlineMode ? `
            <div class="mt-2">
              <button 
                onclick="window.recalculateRoute('${route.id}')"
                class="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                ${isRecalculating === route.id ? 'disabled' : ''}
              >
                ${isRecalculating === route.id ? 'Berechne...' : 'Route neu berechnen'}
              </button>
            </div>
          ` : ''}
        </div>
      `);

      new Marker({ element: markerElement })
        .setLngLat([route.coordinates.lng, route.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current);
    });

    // Global function für Popup-Buttons
    (window as any).recalculateRoute = recalculateRoute;
  }, [map, mapLoaded, routeResults, startCoordinates, startAddress, offlineMode, isRecalculating, recalculateRoute]);

  // Route-Popup anzeigen
  const showRoutePopup = (route: RouteResult) => {
    if (!map.current) return;

    const lngLat: [number, number] = [route.coordinates.lng, route.coordinates.lat];

    const popup = new Popup({ closeButton: true, closeOnClick: false })
      .setLngLat(lngLat)
      .setHTML(`
        <div class="p-4 max-w-sm">
          <div class="flex items-center space-x-2 mb-3">
            <div class="w-4 h-4 rounded-full" style="background-color: ${route.color}"></div>
            <h3 class="font-bold text-gray-800">Route zu ${route.destinationName}</h3>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="text-center p-2 bg-blue-50 rounded-lg">
              <div class="text-lg font-bold text-blue-600">${route.distance.toFixed(1)} km</div>
              <div class="text-xs text-blue-500">Entfernung</div>
            </div>
            <div class="text-center p-2 bg-green-50 rounded-lg">
              <div class="text-lg font-bold text-green-600">${route.duration} min</div>
              <div class="text-xs text-green-500">Fahrzeit</div>
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Kraftstoffverbrauch:</span>
              <span class="font-medium">${route.estimatedFuel.toFixed(1)} L</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Geschätzte Kosten:</span>
              <span class="font-medium">€${route.estimatedCost.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Optimierung:</span>
              <span class="inline-block px-2 py-1 rounded-full text-white text-xs font-medium" 
                    style="background-color: ${route.color}">
                ${route.stationType || route.routeType}
              </span>
            </div>
          </div>
          
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              🟢 Verkehrssituation: Normal<br>
              🛣️ Routentyp: Straße/Autobahn<br>
              📍 Zieltyp: ${route.destinationType === 'station' ? 'Polizeistation' : 'Eigene Adresse'}<br>
              🔧 Routing-Engine: ${route.provider}
            </div>
          </div>
        </div>
      `)
      .addTo(map.current);
  };

  // Karte an Routen anpassen
  const fitToRoutes = useCallback(() => {
    if (!map.current || routeResults.length === 0) return;

    const bounds = routeResults.reduce((bounds, route) => {
      return bounds.extend([route.coordinates.lng, route.coordinates.lat]);
    }, new LngLatBounds())
      .extend([startCoordinates.lng, startCoordinates.lat]);

    map.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15
    });
  }, [map, routeResults, startCoordinates]);

  // Route-Sichtbarkeit umschalten
  const toggleRouteVisibility = (routeId: string) => {
    if (!map.current || !routeId || routeId === 'undefined' || routeId === 'null') {
      console.warn('Invalid route ID for visibility toggle:', routeId);
      return;
    }

    const newVisibility = !routeVisibility[routeId];
    setRouteVisibility(prev => ({ ...prev, [routeId]: newVisibility }));

    const visibility = newVisibility ? 'visible' : 'none';
    
    try {
      map.current.setLayoutProperty(`route-line-${routeId}`, 'visibility', visibility);
      map.current.setLayoutProperty(`route-outline-${routeId}`, 'visibility', visibility);
    } catch (error) {
      console.error(`Error toggling visibility for route ${routeId}:`, error);
    }
  };

  // Kartenstil ändern
  const changeMapStyle = async (styleId: string) => {
    if (!map.current) return;

    try {
      let styleUrl = mapStyles[styleId as keyof typeof mapStyles].url;
      
      if (offlineMode) {
        const offlineStyle = await offlineMapService.getOfflineMapStyle(styleId);
        styleUrl = offlineStyle;
      }

      map.current.setStyle(styleUrl);
      setMapStyle(styleId);

      // Custom layers nach Style-Change neu hinzufügen
      map.current.once('styledata', () => {
        setupMapSources();
        addMarkers();
      });

      toast.success(`Kartenstil geändert zu ${mapStyles[styleId as keyof typeof mapStyles]?.name}`);
    } catch (error) {
      console.error('Failed to change map style:', error);
      toast.error('Kartenstil konnte nicht geändert werden');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full"
    >
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden shadow-lg" />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Offline-Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            {offlineMode ? (
              <WifiOff className="h-4 w-4 text-orange-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {offlineMode ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>

        {/* Style Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium mb-2">Kartenstil</div>
          <div className="space-y-1">
            {Object.entries(mapStyles).map(([id, style]) => (
              <button
                key={id}
                onClick={() => changeMapStyle(id)}
                className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                  mapStyle === id 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Routing Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium mb-2">Routing-Profil</div>
          <div className="space-y-1">
            {[
              { id: 'fastest', name: 'Schnellste', icon: Clock },
              { id: 'shortest', name: 'Kürzeste', icon: Route },
              { id: 'eco', name: 'Ökonomisch', icon: Fuel }
            ].map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setRoutingProfile(id as any)}
                className={`w-full flex items-center space-x-2 px-2 py-1 text-xs rounded transition-colors ${
                  routingProfile === id 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Route Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg max-h-64 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Routen</div>
          <div className="space-y-2">
            {routeResults.map(route => (
              <div key={route.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <button
                    onClick={() => toggleRouteVisibility(route.id)}
                    className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {routeVisibility[route.id] ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {route.destinationName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {route.distance.toFixed(1)}km • {route.duration}min • {route.provider}
                    </div>
                  </div>
                </div>
                {offlineMode && (
                  <button
                    onClick={() => recalculateRoute(route.id)}
                    disabled={isRecalculating === route.id}
                    className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`h-3 w-3 ${isRecalculating === route.id ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Karte wird geladen...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedMapComponent;