import {
	FullscreenControl,
	GeolocateControl,
	LngLatBounds,
	Map as MapLibreMap,
	Marker,
	NavigationControl,
	Popup,
} from "maplibre-gl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	Building,
	Car,
	Eye,
	EyeOff,
	MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { POIFilterPanel } from "@/components/real-time/POIFilterPanel";
import { RealTimeToggle } from "@/components/real-time/RealTimeToggle";
import { TrafficLegend } from "@/components/real-time/TrafficLegend";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { offlineMapService } from "@/lib/services/offline-map-service";
import {
	POI_CATEGORIES,
	POICategory,
} from "@/lib/services/poi-streaming-service";
import { TRAFFIC_LEVELS } from "@/lib/services/real-time-traffic-service";
import type { RouteResult } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

interface RealTimeMapComponentProps {
	routeResults: RouteResult[];
	startAddress: string;
	startCoordinates: { lat: number; lng: number };
	onMarkerClick?: (route: RouteResult) => void;
	onRouteRecalculate?: (routeId: string, newRoute: RouteResult) => void;
	showRealTimeControls?: boolean;
}

const RealTimeMapComponent: React.FC<RealTimeMapComponentProps> = ({
	routeResults,
	startAddress,
	startCoordinates,
	onMarkerClick,
	onRouteRecalculate,
	showRealTimeControls = true,
}) => {
	console.log("🗺️ RealTimeMapComponent erhält", routeResults.length, "Routen");

	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<MapLibreMap | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const [routeVisibility, setRouteVisibility] = useState<
		Record<string, boolean>
	>(routeResults.reduce((acc, route) => ({ ...acc, [route.id]: true }), {}));
	const [_activePopup, _setActivePopup] = useState<string | null>(null);
	const [mapStyle, setMapStyle] = useState("streets");
	const [showPOIFilter, setShowPOIFilter] = useState(false);
	const [showTrafficLegend, setShowTrafficLegend] = useState(false);
	const [offlineMode, _setOfflineMode] = useState(false);
	const [_routingProfile, _setRoutingProfile] = useState<
		"fastest" | "shortest" | "eco"
	>("fastest");
	const [_showRouteDetails, _setShowRouteDetails] = useState<string | null>(
		null,
	);
	const [_isRecalculating, _setIsRecalculating] = useState<string | null>(null);

	// Real-Time Data Hook
	const [realTimeState, realTimeActions] = useRealTimeData({
		traffic: true,
		pois: [
			POICategory.POLICE,
			POICategory.PARKING,
			POICategory.CHARGING_STATION,
		],
		buildings3d: "auto",
		updateInterval: 5000,
		autoConnect: true,
		performanceMode: true,
	});

	// Map styles mit Offline-Unterstützung
	const mapStyles = {
		streets: {
			name: "Straßen",
			url: offlineMode
				? "/styles/offline-streets.json"
				: "https://api.maptiler.com/maps/streets-v2/style.json?key=QSdqT57jTC1C80kuBccz",
		},
		satellite: {
			name: "Satellit",
			url: offlineMode
				? "/styles/offline-satellite.json"
				: "https://api.maptiler.com/maps/hybrid/style.json?key=QSdqT57jTC1C80kuBccz",
		},
		terrain: {
			name: "Gelände",
			url: offlineMode
				? "/styles/offline-terrain.json"
				: "https://api.maptiler.com/maps/landscape/style.json?key=QSdqT57jTC1C80kuBccz",
		},
		police: {
			name: "Polizei",
			url: offlineMode
				? "/styles/offline-police.json"
				: "/styles/police-style.json",
		},
	};

	// Map initialisieren
	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		const initializeMap = async () => {
			try {
				let styleUrl = mapStyles[mapStyle as keyof typeof mapStyles].url;

				// Offline-Style laden falls verfügbar
				if (offlineMode) {
					try {
						const offlineStyle =
							await offlineMapService.getOfflineMapStyle(mapStyle);
						styleUrl = offlineStyle;
					} catch (_error) {
						console.warn(
							"Offline-Style konnte nicht geladen werden, verwende Online-Style",
						);
					}
				}

				map.current = new MapLibreMap({
					container: mapContainer.current!,
					style: styleUrl,
					center: [startCoordinates.lng, startCoordinates.lat],
					zoom: 10,
					pitch: 0,
					bearing: 0,
					maxPitch: 60,
				});

				// GPU-Optimierung
				map.current.getCanvas().style.transform = "translateZ(0)";

				// Controls hinzufügen
				map.current.addControl(
					new NavigationControl({
						showCompass: true,
						visualizePitch: true,
					}),
					"top-left",
				);

				map.current.addControl(new FullscreenControl(), "top-left");

				map.current.addControl(
					new GeolocateControl({
						positionOptions: {
							enableHighAccuracy: true,
							timeout: 10000,
						},
						trackUserLocation: true,
					}),
					"top-left",
				);

				// Event-Handler
				map.current.on("load", () => {
					setMapLoaded(true);
					setupMapSources();
					addMarkers();
					fitToRoutes();
					setupRealTimeLayers();
				});

				map.current.on("moveend", () => {
					updateRealTimeViewport();
				});

				map.current.on("zoomend", () => {
					updateRealTimeViewport();
				});

				map.current.on("error", (e) => {
					console.error("Map error:", e);
					if (offlineMode) {
						toast.error(
							"Kartenfehler im Offline-Modus - prüfen Sie Ihre gespeicherten Karten",
						);
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
				console.error("Failed to initialize map:", error);
				toast.error("Karte konnte nicht geladen werden");
			}
		};

		initializeMap();
	}, [
		startCoordinates,
		mapStyle,
		offlineMode,
		addMarkers,
		fitToRoutes,
		mapStyles[mapStyle as keyof typeof mapStyles].url,
		setupMapSources,
		setupRealTimeLayers,
		updateRealTimeViewport,
	]);

	// Real-Time Viewport Update
	const updateRealTimeViewport = useCallback(() => {
		if (!map.current || !mapLoaded) return;

		const bounds = map.current.getBounds();
		const center = map.current.getCenter();
		const zoom = map.current.getZoom();

		realTimeActions.updateViewport({
			bounds: {
				north: bounds.getNorth(),
				south: bounds.getSouth(),
				east: bounds.getEast(),
				west: bounds.getWest(),
			},
			zoom,
			center: [center.lng, center.lat],
		});
	}, [mapLoaded, realTimeActions]);

	// Real-Time Layers Setup
	const setupRealTimeLayers = useCallback(() => {
		if (!map.current || !mapLoaded) return;

		// Traffic Layer
		if (realTimeState.traffic.enabled) {
			map.current.addSource("traffic-data", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: [],
				},
			});

			map.current.addLayer({
				id: "traffic-lines",
				type: "line",
				source: "traffic-data",
				paint: {
					"line-width": 4,
					"line-opacity": 0.8,
				},
				filter: [">", ["zoom"], 10], // Nur ab Zoom 11 anzeigen
			});
		}

		// POI Layer
		if (realTimeState.pois.enabled) {
			map.current.addSource("poi-data", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: [],
				},
			});

			map.current.addLayer({
				id: "poi-points",
				type: "circle",
				source: "poi-data",
				paint: {
					"circle-radius": 6,
					"circle-color": "#3b82f6",
					"circle-stroke-width": 2,
					"circle-stroke-color": "#ffffff",
				},
				filter: [">", ["zoom"], 9], // Nur ab Zoom 10 anzeigen
			});
		}

		// 3D Buildings Layer
		if (realTimeState.buildings3d.enabled) {
			map.current.addSource("buildings-3d", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: [],
				},
			});

			map.current.addLayer({
				id: "buildings-3d-extrusion",
				type: "fill-extrusion",
				source: "buildings-3d",
				paint: {
					"fill-extrusion-height": ["get", "height"],
					"fill-extrusion-base": ["get", "min_height"],
					"fill-extrusion-opacity": 0.7,
					"fill-extrusion-color": "#e5e7eb",
				},
				filter: [">", ["zoom"], 14], // Nur ab Zoom 15 anzeigen
			});
		}
	}, [mapLoaded, realTimeState]);

	// Traffic Data Update
	useEffect(() => {
		if (!map.current || !mapLoaded || !realTimeState.traffic.enabled) return;

		const trafficSource = map.current.getSource("traffic-data") as any;
		if (trafficSource) {
			const features = realTimeState.traffic.data.map((segment) => ({
				type: "Feature" as const,
				properties: {
					id: segment.id,
					level: segment.level,
					speed: segment.speed,
					delay: segment.delay,
					color: TRAFFIC_LEVELS[segment.level].color,
					opacity: TRAFFIC_LEVELS[segment.level].opacity,
				},
				geometry: {
					type: "LineString" as const,
					coordinates: segment.coordinates,
				},
			}));

			trafficSource.setData({
				type: "FeatureCollection",
				features,
			});

			// Update paint properties for traffic levels
			map.current.setPaintProperty("traffic-lines", "line-color", [
				"case",
				["==", ["get", "level"], 0],
				TRAFFIC_LEVELS[0].color,
				["==", ["get", "level"], 1],
				TRAFFIC_LEVELS[1].color,
				["==", ["get", "level"], 2],
				TRAFFIC_LEVELS[2].color,
				["==", ["get", "level"], 3],
				TRAFFIC_LEVELS[3].color,
				"#cccccc",
			]);

			map.current.setPaintProperty("traffic-lines", "line-opacity", [
				"case",
				["==", ["get", "level"], 0],
				TRAFFIC_LEVELS[0].opacity,
				["==", ["get", "level"], 1],
				TRAFFIC_LEVELS[1].opacity,
				["==", ["get", "level"], 2],
				TRAFFIC_LEVELS[2].opacity,
				["==", ["get", "level"], 3],
				TRAFFIC_LEVELS[3].opacity,
				0.6,
			]);
		}
	}, [realTimeState.traffic.data, mapLoaded, realTimeState.traffic.enabled]);

	// POI Data Update
	useEffect(() => {
		if (!map.current || !mapLoaded || !realTimeState.pois.enabled) return;

		const poiSource = map.current.getSource("poi-data") as any;
		if (poiSource) {
			const features = realTimeState.pois.data.map((poi) => ({
				type: "Feature" as const,
				properties: {
					id: poi.id,
					name: poi.name,
					category: poi.category,
					color: POI_CATEGORIES[poi.category].color,
					icon: POI_CATEGORIES[poi.category].icon,
				},
				geometry: {
					type: "Point" as const,
					coordinates: poi.coordinates,
				},
			}));

			poiSource.setData({
				type: "FeatureCollection",
				features,
			});

			// Update paint properties for POI categories
			map.current.setPaintProperty("poi-points", "circle-color", [
				"case",
				...realTimeState.pois.filter.categories.flatMap((category) => [
					["==", ["get", "category"], category],
					POI_CATEGORIES[category].color,
				]),
				"#cccccc",
			]);
		}
	}, [
		realTimeState.pois.data,
		mapLoaded,
		realTimeState.pois.enabled,
		realTimeState.pois.filter,
	]);

	// 3D Buildings Data Update
	useEffect(() => {
		if (!map.current || !mapLoaded || !realTimeState.buildings3d.enabled)
			return;

		const buildingsSource = map.current.getSource("buildings-3d") as any;
		if (buildingsSource) {
			const features = realTimeState.buildings3d.data.map((building) => ({
				type: "Feature" as const,
				properties: {
					id: building.id,
					height: building.height,
					min_height: building.minHeight,
					building: building.properties.building,
					levels: building.properties.levels,
					roof_shape: building.properties.roof_shape,
					material: building.properties.material,
					year_built: building.properties.year_built,
					address: building.properties.address,
				},
				geometry: {
					type: "Polygon" as const,
					coordinates: [building.coordinates],
				},
			}));

			buildingsSource.setData({
				type: "FeatureCollection",
				features,
			});
		}
	}, [
		realTimeState.buildings3d.data,
		mapLoaded,
		realTimeState.buildings3d.enabled,
	]);

	// Map-Sources einrichten
	const setupMapSources = useCallback(() => {
		if (!map.current) return;

		console.log("🗺️ Setup Map Sources für", routeResults.length, "Routen");

		// Start-Marker hinzufügen
		if (map.current.getSource("start-marker")) {
			map.current.removeSource("start-marker");
		}
		map.current.addSource("start-marker", {
			type: "geojson",
			data: {
				type: "Feature",
				properties: {},
				geometry: {
					type: "Point",
					coordinates: [startCoordinates.lng, startCoordinates.lat],
				},
			},
		});

		// Route-Sources für jede Route
		routeResults.forEach((route) => {
			if (!route.id || route.id === "undefined" || route.id === "null") {
				console.warn("Invalid route ID:", route.id);
				return;
			}

			const coordinates = route.route?.coordinates || [
				[startCoordinates.lng, startCoordinates.lat],
				[route.coordinates.lng, route.coordinates.lat],
			];

			const sourceId = `route-${route.id}`;

			// Vorherige Layer/Source entfernen
			if (map.current?.getSource(sourceId)) {
				if (map.current?.getLayer(`route-line-${route.id}`)) {
					map.current?.removeLayer(`route-line-${route.id}`);
				}
				if (map.current?.getLayer(`route-outline-${route.id}`)) {
					map.current?.removeLayer(`route-outline-${route.id}`);
				}
				map.current?.removeSource(sourceId);
			}

			// Neue Source hinzufügen
			map.current?.addSource(sourceId, {
				type: "geojson",
				data: {
					type: "Feature",
					properties: {
						routeId: route.id,
						distance: route.distance,
						duration: route.duration,
						color: route.color,
					},
					geometry: {
						type: "LineString",
						coordinates: coordinates,
					},
				},
			});

			// Route-Outline Layer
			map.current?.addLayer({
				id: `route-outline-${route.id}`,
				type: "line",
				source: sourceId,
				paint: {
					"line-color": "#000000",
					"line-width": 8,
					"line-opacity": 0.3,
				},
			});

			// Route-Line Layer
			map.current?.addLayer({
				id: `route-line-${route.id}`,
				type: "line",
				source: sourceId,
				paint: {
					"line-color": route.color,
					"line-width": 6,
					"line-opacity": 0.8,
					"line-dasharray": route.provider === "Offline-OSRM" ? [2, 2] : [1],
				},
			});

			// Route-Click-Handler
			map.current?.on("click", `route-line-${route.id}`, () => {
				showRoutePopup(route);
			});
		});
	}, [routeResults, startCoordinates, showRoutePopup]);

	// Marker hinzufügen
	const addMarkers = useCallback(() => {
		if (!map.current || !mapLoaded) return;

		// Start-Marker
		const startMarkerElement = document.createElement("div");
		startMarkerElement.className = "custom-marker start-marker";
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

		// Ziel-Marker für jede Route
		routeResults.forEach((route) => {
			if (!route.id || route.id === "undefined" || route.id === "null") {
				return;
			}

			const markerElement = document.createElement("div");
			markerElement.className = "custom-marker destination-marker";
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
          <p class="text-sm text-gray-600">${route.address}</p>
          <div class="mt-3 space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Entfernung:</span>
              <span class="font-medium">${route.distance.toFixed(1)} km</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Fahrzeit:</span>
              <span class="font-medium">${route.duration} min</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Routentyp:</span>
              <span class="font-medium">${route.routeType}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              🟢 Verkehrssituation: Normal<br>
              🛣️ Routentyp: Straße/Autobahn<br>
              📍 Zieltyp: ${route.destinationType === "station" ? "Polizeistation" : "Eigene Adresse"}<br>
              🔧 Routing-Engine: ${route.provider}
            </div>
          </div>
        </div>
      `);

			new Marker({ element: markerElement })
				.setLngLat([route.coordinates.lng, route.coordinates.lat])
				.setPopup(popup)
				.addTo(map.current);
		});
	}, [mapLoaded, routeResults, startAddress, startCoordinates]);

	// Route-Popup anzeigen
	const showRoutePopup = (route: RouteResult) => {
		if (!map.current) return;

		const coordinates = route.route?.coordinates || [
			[startCoordinates.lng, startCoordinates.lat],
			[route.coordinates.lng, route.coordinates.lat],
		];

		const centerLng =
			(coordinates[0][0] + coordinates[coordinates.length - 1][0]) / 2;
		const centerLat =
			(coordinates[0][1] + coordinates[coordinates.length - 1][1]) / 2;

		const _popup = new Popup({ offset: 25 })
			.setLngLat([centerLng, centerLat])
			.setHTML(`
        <div class="p-4 max-w-xs">
          <div class="flex items-center space-x-2 mb-3">
            <div class="w-4 h-4 rounded-full" style="background-color: ${route.color}"></div>
            <h3 class="font-bold text-gray-800">Route Details</h3>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Von:</span>
              <span class="text-sm font-medium">${startAddress}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Nach:</span>
              <span class="text-sm font-medium">${route.destinationName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Entfernung:</span>
              <span class="text-sm font-medium">${route.distance.toFixed(1)} km</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Fahrzeit:</span>
              <span class="text-sm font-medium">${route.duration} min</span>
            </div>
          </div>
          
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="text-xs text-gray-500">
              🟢 Verkehrssituation: Normal<br>
              🛣️ Routentyp: Straße/Autobahn<br>
              📍 Zieltyp: ${route.destinationType === "station" ? "Polizeistation" : "Eigene Adresse"}<br>
              🔧 Routing-Engine: ${route.provider}
            </div>
          </div>
        </div>
      `)
			.addTo(map.current);
	};

	// Karte an Routen anpassen
	const fitToRoutes = () => {
		if (!map.current || routeResults.length === 0) return;

		const bounds = routeResults
			.reduce((bounds, route) => {
				return bounds.extend([route.coordinates.lng, route.coordinates.lat]);
			}, new LngLatBounds())
			.extend([startCoordinates.lng, startCoordinates.lat]);

		map.current.fitBounds(bounds, {
			padding: { top: 50, bottom: 50, left: 50, right: 50 },
			maxZoom: 15,
		});
	};

	// Route-Sichtbarkeit umschalten
	const toggleRouteVisibility = (routeId: string) => {
		if (
			!map.current ||
			!routeId ||
			routeId === "undefined" ||
			routeId === "null" ||
			Number.isNaN(Number(routeId))
		) {
			console.warn("Invalid route ID for visibility toggle:", routeId);
			return;
		}

		const newVisibility = !routeVisibility[routeId];
		setRouteVisibility((prev) => ({ ...prev, [routeId]: newVisibility }));

		const visibility = newVisibility ? "visible" : "none";

		try {
			map.current.setLayoutProperty(
				`route-line-${routeId}`,
				"visibility",
				visibility,
			);
			map.current.setLayoutProperty(
				`route-outline-${routeId}`,
				"visibility",
				visibility,
			);
		} catch (error) {
			console.error(`Error toggling visibility for route ${routeId}:`, error);
		}
	};

	// Kartenstil ändern
	const _changeMapStyle = async (styleId: string) => {
		if (!map.current) return;

		try {
			let styleUrl = mapStyles[styleId as keyof typeof mapStyles].url;

			if (offlineMode) {
				const offlineStyle =
					await offlineMapService.getOfflineMapStyle(styleId);
				styleUrl = offlineStyle;
			}

			map.current.setStyle(styleUrl);
			setMapStyle(styleId);

			// Custom layers nach Style-Change neu hinzufügen
			map.current.once("styledata", () => {
				setupMapSources();
				addMarkers();
				setupRealTimeLayers();
			});

			toast.success(
				`Kartenstil geändert zu ${mapStyles[styleId as keyof typeof mapStyles]?.name}`,
			);
		} catch (error) {
			console.error("Failed to change map style:", error);
			toast.error("Kartenstil konnte nicht geändert werden");
		}
	};

	return (
		<div className="relative w-full h-full">
			{/* Map Container */}
			<div
				ref={mapContainer}
				className="w-full h-full rounded-lg"
				style={{ minHeight: "600px" }}
			/>

			{/* Real-Time Controls */}
			{showRealTimeControls && (
				<div className="absolute top-4 right-4 space-y-3">
					{/* Real-Time Toggle */}
					<RealTimeToggle
						enabled={realTimeState.traffic.enabled}
						connected={realTimeState.traffic.connected}
						onToggle={realTimeActions.toggleTraffic}
						connectionQuality={
							realTimeState.traffic.connected ? "excellent" : "disconnected"
						}
					/>

					{/* POI Filter Panel */}
					<AnimatePresence>
						{showPOIFilter && (
							<POIFilterPanel
								filter={realTimeState.pois.filter}
								onFilterChange={realTimeActions.updatePOIFilter}
								onClose={() => setShowPOIFilter(false)}
							/>
						)}
					</AnimatePresence>

					{/* Traffic Legend */}
					<AnimatePresence>
						{showTrafficLegend && (
							<TrafficLegend onClose={() => setShowTrafficLegend(false)} />
						)}
					</AnimatePresence>
				</div>
			)}

			{/* Control Buttons */}
			<div className="absolute bottom-4 left-4 space-y-2">
				{/* POI Filter Button */}
				<motion.button
					onClick={() => setShowPOIFilter(!showPOIFilter)}
					className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					title="POI-Filter"
				>
					<MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</motion.button>

				{/* Traffic Legend Button */}
				<motion.button
					onClick={() => setShowTrafficLegend(!showTrafficLegend)}
					className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					title="Verkehrslegende"
				>
					<Car className="h-5 w-5 text-green-600 dark:text-green-400" />
				</motion.button>

				{/* 3D Buildings Toggle */}
				<motion.button
					onClick={realTimeActions.toggleBuildings3D}
					className={cn(
						"p-3 rounded-lg shadow-lg border transition-colors",
						realTimeState.buildings3d.enabled
							? "bg-blue-600 text-white border-blue-600"
							: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
					)}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					title="3D-Gebäude"
				>
					<Building className="h-5 w-5" />
				</motion.button>
			</div>

			{/* Route Legend */}
			<div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
				<h4 className="font-medium text-gray-900 dark:text-white mb-3">
					Routen-Übersicht
				</h4>
				<div className="space-y-2 max-h-80 overflow-y-auto">
					{routeResults
						.filter(
							(route) =>
								route.id &&
								route.id !== "undefined" &&
								route.id !== "null" &&
								!Number.isNaN(Number(route.id)),
						)
						.map((route) => (
							<motion.div
								key={route.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								<div className="flex items-center space-x-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: route.color }}
									/>
									<span className="text-sm text-gray-700 dark:text-gray-300">
										{route.destinationName}
									</span>
								</div>

								<div className="flex items-center space-x-2">
									<button
										onClick={() => toggleRouteVisibility(route.id)}
										className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
									>
										{routeVisibility[route.id] ? (
											<Eye className="h-4 w-4" />
										) : (
											<EyeOff className="h-4 w-4" />
										)}
									</button>

									<span className="text-xs text-gray-500 dark:text-gray-400">
										{route.distance.toFixed(1)} km
									</span>
								</div>
							</motion.div>
						))}
				</div>
			</div>

			{/* Performance Stats */}
			{realTimeState.performance.fps < 30 && (
				<div className="absolute bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
					<div className="flex items-center space-x-2">
						<AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
						<span className="text-sm text-yellow-800 dark:text-yellow-200">
							Performance: {realTimeState.performance.fps.toFixed(1)} FPS
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default RealTimeMapComponent;
