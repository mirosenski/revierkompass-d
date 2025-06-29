import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, NavigationControl, FullscreenControl, GeolocateControl, Marker, Popup, LngLatBounds } from 'maplibre-gl';
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
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RouteResult } from '@/lib/store/app-store';

interface InteractiveMapProps {
  routeResults: RouteResult[];
  startAddress: string;
  startCoordinates: { lat: number; lng: number };
  onMarkerClick?: (route: RouteResult) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  routeResults,
  startAddress,
  startCoordinates,
  onMarkerClick
}) => {
  console.log('🗺️ InteractiveMap erhält', routeResults.length, 'Routen');
  
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

  // Map styles
  const mapStyles = {
    streets: {
      name: 'Streets',
      url: 'https://api.maptiler.com/maps/streets-v2/style.json?key=QSdqT57jTC1C80kuBccz'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://api.maptiler.com/maps/hybrid/style.json?key=QSdqT57jTC1C80kuBccz'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://api.maptiler.com/maps/landscape/style.json?key=QSdqT57jTC1C80kuBccz'
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new MapLibreMap({
      container: mapContainer.current,
      style: mapStyles.streets.url,
      center: [startCoordinates.lng, startCoordinates.lat],
      zoom: 11,
      pitch: 0,
      bearing: 0
    });

    // Add controls
    map.current.addControl(new NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true
    }), 'top-right');

    map.current.addControl(new FullscreenControl(), 'top-right');
    
    map.current.addControl(new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      setupMapSources();
      addMarkers();
      addRoutes();
      fitToRoutes();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const setupMapSources = () => {
    if (!map.current) return;

    console.log('🗺️ Setup Map Sources für', routeResults.length, 'Routen');

    // Test-Linie hinzufügen
    const testCoordinates = [
      [startCoordinates.lng, startCoordinates.lat],
      [9.2195, 48.7309]
    ];

    // Test-Linie: Vorherige Layer/Source entfernen, falls vorhanden
    if (map.current!.getSource('test-route')) {
      if (map.current!.getLayer('test-line')) {
        map.current!.removeLayer('test-line');
      }
      map.current!.removeSource('test-route');
    }
    map.current!.addSource('test-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: testCoordinates
        }
      }
    });
    map.current!.addLayer({
      id: 'test-line',
      type: 'line',
      source: 'test-route',
      paint: {
        'line-color': '#ff0000',
        'line-width': 5
      }
    });

    // Add route sources for each route
    routeResults.forEach((route) => {
      // Sicherstellen, dass die Route-ID gültig ist
      if (!route.id || route.id === 'undefined' || route.id === 'null' || isNaN(Number(route.id))) {
        console.warn('Invalid route ID:', route.id, 'for route:', route.destinationName);
        return;
      }

      console.log('🗺️ Route-Koordinaten:', route.route?.coordinates);
      const coordinates =
        route.route?.coordinates || [
          [startCoordinates.lng, startCoordinates.lat],
          [route.coordinates.lng, route.coordinates.lat]
        ];

      console.log('🗺️ Adding route:', route.destinationName, 'with', coordinates.length, 'coordinates');

      const sourceId = `route-${route.id}`;

      // Vorherige Layer/Source entfernen, falls vorhanden
      if (map.current!.getSource(sourceId)) {
        if (map.current!.getLayer(`route-line-${route.id}`)) {
          map.current!.removeLayer(`route-line-${route.id}`);
        }
        if (map.current!.getLayer(`route-outline-${route.id}`)) {
          map.current!.removeLayer(`route-outline-${route.id}`);
        }
        map.current!.removeSource(sourceId);
      }

      try {
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              routeId: route.id,
              color: route.color,
              distance: route.distance,
              duration: route.duration
            },
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        });

        // Add route line layer
        map.current!.addLayer({
          id: `route-line-${route.id}`,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': route.color,
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              6,
              4
            ],
            'line-opacity': 0.8
          }
        });

        // Add route line outline for better visibility
        map.current!.addLayer({
          id: `route-outline-${route.id}`,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              8,
              6
            ],
            'line-opacity': 0.5
          }
        }, `route-line-${route.id}`);

        // Add click handlers for routes
        map.current!.on('click', `route-line-${route.id}`, (e) => {
          if (e.features && e.features[0]) {
            showRoutePopup(route, e.lngLat);
          }
        });

        // Add hover effects
        map.current!.on('mouseenter', `route-line-${route.id}`, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', `route-line-${route.id}`, () => {
          map.current!.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error(`Error adding source for route ${route.id}:`, error);
      }
    });
  };

  const generateRouteGeometry = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    // Simple route simulation - in production, use OSRM/GraphHopper/etc.
    const coordinates = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      
      // Add some curve variation for more realistic routes
      const variation = Math.sin(ratio * Math.PI) * 0.01;
      coordinates.push([lng + variation, lat + variation]);
    }
    
    return coordinates;
  };

  const addMarkers = () => {
    if (!map.current) return;

    // Add start marker with pulse animation
    const startMarkerElement = document.createElement('div');
    startMarkerElement.className = 'start-marker';
    startMarkerElement.innerHTML = `
      <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg relative">
        <div class="w-6 h-6 bg-green-600 rounded-full animate-ping absolute"></div>
        <div class="w-4 h-4 bg-white rounded-full relative z-10"></div>
      </div>
    `;

    new Marker({ element: startMarkerElement })
      .setLngLat([startCoordinates.lng, startCoordinates.lat])
      .setPopup(new Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-bold text-green-600">Startadresse</h3>
          <p class="text-sm text-gray-600">${startAddress}</p>
        </div>
      `))
      .addTo(map.current);

    // Add destination markers
    routeResults.forEach((route) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'destination-marker';
      
      const iconColor = route.destinationType === 'station' 
        ? (route.destinationName.includes('Präsidium') ? '#8b5cf6' : '#3b82f6')
        : '#f97316';
      
      const IconComponent = route.destinationType === 'station'
        ? (route.destinationName.includes('Präsidium') ? 'badge' : 'shield')
        : 'home';

      markerElement.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white" 
             style="background-color: ${iconColor}">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            ${getIconSVG(IconComponent)}
          </svg>
        </div>
      `;

      // NEU: Klick-Handler für Marker
      if (onMarkerClick) {
        markerElement.style.cursor = 'pointer';
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick(route);
        });
      }

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
          </div>
        </div>
      `);

      new Marker({ element: markerElement })
        .setLngLat([route.coordinates.lng, route.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current);
    });
  };

  const getIconSVG = (iconType: string) => {
    const icons = {
      badge: '<path d="M8.252 4.75H5.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h13a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75h-2.752M8.252 4.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75v-.5Z"/>',
      shield: '<path d="M12 2C12 2 4 4 4 12s8 10 8 10 8-2 8-10S12 2 12 2z"/>',
      home: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>'
    };
    return icons[iconType as keyof typeof icons] || icons.home;
  };

  const addRoutes = () => {
    // Routes are already added in setupMapSources
  };

  const showRoutePopup = (route: RouteResult, lngLat: any) => {
    if (!map.current) return;

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

  const fitToRoutes = () => {
    if (!map.current || routeResults.length === 0) return;

    const bounds = routeResults.reduce((bounds, route) => {
      return bounds.extend([route.coordinates.lng, route.coordinates.lat]);
    }, new LngLatBounds())
      .extend([startCoordinates.lng, startCoordinates.lat]);

    map.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15
    });
  };

  const toggleRouteVisibility = (routeId: string) => {
    if (!map.current || !routeId || routeId === 'undefined' || routeId === 'null' || isNaN(Number(routeId))) {
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

  const changeMapStyle = (styleKey: string) => {
    if (!map.current) return;
    
    setMapStyle(styleKey);
    map.current.setStyle(mapStyles[styleKey as keyof typeof mapStyles].url);
    
    // Re-add sources and layers after style change
    map.current.once('style.load', () => {
      setupMapSources();
      addMarkers();
    });
  };

  return (
    <div className="space-y-6">
      {/* Moderne Status-Anzeige für Kartenansicht */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Karten-Status */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              {routeResults.length > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {routeResults.length}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Interaktive Kartenansicht
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {routeResults.length === 0 
                  ? 'Klicken Sie auf Marker um Stationen auszuwählen' 
                  : `${routeResults.length} Stationen auf der Karte sichtbar`
                }
              </p>
            </div>
          </div>

          {/* Karten-Aktionen */}
          <div className="flex items-center space-x-3">
            <button
              onClick={fitToRoutes}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <Maximize className="h-4 w-4" />
              <span className="text-sm font-medium">Alle anzeigen</span>
            </button>
          </div>
        </div>

        {/* Karten-Statistiken */}
        {routeResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{routeResults.length}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Stationen</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {routeResults.reduce((sum, r) => sum + r.distance, 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Gesamt km</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">
                {routeResults.reduce((sum, r) => sum + r.duration, 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Gesamt min</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-600">
                {routeResults.reduce((sum, r) => sum + r.estimatedFuel, 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Liter</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Map Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Style Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kartenansicht:</span>
            <div className="flex space-x-1">
              {Object.entries(mapStyles).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => changeMapStyle(key)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mapStyle === key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Map Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={fitToRoutes}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Maximize className="h-4 w-4" />
              <span className="text-sm">Alle anzeigen</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="relative">
          <div
            ref={mapContainer}
            className="w-full h-[600px] rounded-2xl"
            style={{ minHeight: '600px' }}
          />

          {/* Route Legend */}
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Routen-Übersicht</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {routeResults
                .filter(route => route.id && route.id !== 'undefined' && route.id !== 'null' && !isNaN(Number(route.id)))
                .map(route => (
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
                        {route.distance.toFixed(1)}km • {route.duration}min • {route.stationType || route.provider}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
        </div>
      </motion.div>

      {/* Map Features Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Interaktive Karten-Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Präzise Marker</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">±0.11m Genauigkeit</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Straßenrouting</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Kein Luftlinie</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Route-Toggle</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ein/Ausblenden</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">3D-Ansicht</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">0-60° Pitch</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveMap; 