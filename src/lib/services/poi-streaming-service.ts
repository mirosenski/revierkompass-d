export interface POI {
	id: string;
	type: string;
	name: string;
	coordinates: [number, number];
	category: POICategory;
	properties: Record<string, any>;
	timestamp: number;
}

export enum POICategory {
	POLICE = "police",
	BUS_STOP = "bus_stop",
	PARKING = "parking",
	CHARGING_STATION = "charging_station",
	HOSPITAL = "hospital",
	PHARMACY = "pharmacy",
	GAS_STATION = "gas_station",
	RESTAURANT = "restaurant",
	HOTEL = "hotel",
}

export interface POICategoryConfig {
	category: POICategory;
	name: string;
	icon: string;
	color: string;
	description: string;
	query: string;
	maxResults: number;
}

export const POI_CATEGORIES: Record<POICategory, POICategoryConfig> = {
	[POICategory.POLICE]: {
		category: POICategory.POLICE,
		name: "Polizei-Dienststellen",
		icon: "👮",
		color: "#3b82f6",
		description: "Polizeidienststellen und -wachen",
		query: "amenity=police",
		maxResults: 50,
	},
	[POICategory.BUS_STOP]: {
		category: POICategory.BUS_STOP,
		name: "Bushaltestellen",
		icon: "🚌",
		color: "#10b981",
		description: "Öffentliche Bushaltestellen",
		query: "highway=bus_stop",
		maxResults: 100,
	},
	[POICategory.PARKING]: {
		category: POICategory.PARKING,
		name: "Parkplätze",
		icon: "🅿️",
		color: "#f59e0b",
		description: "Parkplätze und Parkhäuser",
		query: "amenity=parking",
		maxResults: 80,
	},
	[POICategory.CHARGING_STATION]: {
		category: POICategory.CHARGING_STATION,
		name: "E-Ladestationen",
		icon: "🔌",
		color: "#8b5cf6",
		description: "Elektroauto-Ladestationen",
		query: "amenity=charging_station",
		maxResults: 60,
	},
	[POICategory.HOSPITAL]: {
		category: POICategory.HOSPITAL,
		name: "Krankenhäuser",
		icon: "🏥",
		color: "#ef4444",
		description: "Krankenhäuser und Kliniken",
		query: "amenity=hospital",
		maxResults: 30,
	},
	[POICategory.PHARMACY]: {
		category: POICategory.PHARMACY,
		name: "Apotheken",
		icon: "💊",
		color: "#06b6d4",
		description: "Apotheken und Drogerien",
		query: "amenity=pharmacy",
		maxResults: 40,
	},
	[POICategory.GAS_STATION]: {
		category: POICategory.GAS_STATION,
		name: "Tankstellen",
		icon: "⛽",
		color: "#f97316",
		description: "Tankstellen und Service-Stationen",
		query: "amenity=fuel",
		maxResults: 50,
	},
	[POICategory.RESTAURANT]: {
		category: POICategory.RESTAURANT,
		name: "Restaurants",
		icon: "🍽️",
		color: "#ec4899",
		description: "Restaurants und Gastronomie",
		query: "amenity=restaurant",
		maxResults: 70,
	},
	[POICategory.HOTEL]: {
		category: POICategory.HOTEL,
		name: "Hotels",
		icon: "🏨",
		color: "#6366f1",
		description: "Hotels und Unterkünfte",
		query: "tourism=hotel",
		maxResults: 40,
	},
};

export interface POIViewport {
	bounds: {
		north: number;
		south: number;
		east: number;
		west: number;
	};
	zoom: number;
}

export interface POIFilter {
	categories: POICategory[];
	maxDistance?: number;
	includeClosed?: boolean;
}

export class POIStreamingService {
	private overpassUrl = "https://overpass-api.de/api/interpreter";
	private requestQueue: Array<() => Promise<void>> = [];
	private isProcessingQueue = false;
	private lastRequestTime = 0;
	private minRequestInterval = 500; // 500ms zwischen Requests
	private poiCache: Map<string, { data: POI[]; timestamp: number }> = new Map();
	private cacheTimeout = 5 * 60 * 1000; // 5 Minuten
	private listeners: Set<(data: POI[]) => void> = new Set();
	private currentFilter: POIFilter = { categories: Object.values(POICategory) };
	private debounceTimeout: NodeJS.Timeout | null = null;

	constructor() {
		this.processQueue();
	}

	async loadPOIs(
		viewport: POIViewport,
		filter: POIFilter = this.currentFilter,
	): Promise<POI[]> {
		this.currentFilter = filter;

		// Debounce für Map-Moves
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
		}

		return new Promise((resolve) => {
			this.debounceTimeout = setTimeout(async () => {
				const pois = await this.fetchPOIsForViewport(viewport, filter);
				resolve(pois);
			}, 500);
		});
	}

	private async fetchPOIsForViewport(
		viewport: POIViewport,
		filter: POIFilter,
	): Promise<POI[]> {
		const cacheKey = this.generateCacheKey(viewport, filter);
		const cached = this.poiCache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			console.log("📍 POI-Cache-Hit für", cacheKey);
			return cached.data;
		}

		const allPOIs: POI[] = [];
		const { bounds } = viewport;

		// Nur laden wenn Zoom-Level ausreichend
		if (viewport.zoom < 10) {
			console.log("📍 Zoom-Level zu niedrig für POI-Loading");
			return [];
		}

		// Max 100 POIs pro Request
		const maxPOIsPerCategory = Math.floor(100 / filter.categories.length);

		for (const category of filter.categories) {
			try {
				const categoryConfig = POI_CATEGORIES[category];
				const pois = await this.fetchPOIsForCategory(
					bounds,
					categoryConfig,
					maxPOIsPerCategory,
				);
				allPOIs.push(...pois);
			} catch (error) {
				console.error(`📍 Fehler beim Laden von ${category}:`, error);
			}
		}

		// Client-Side Deduplication
		const uniquePOIs = this.deduplicatePOIs(allPOIs);

		// Cache speichern
		this.poiCache.set(cacheKey, {
			data: uniquePOIs,
			timestamp: Date.now(),
		});

		// Listener benachrichtigen
		this.notifyListeners(uniquePOIs);

		console.log(`📍 ${uniquePOIs.length} POIs geladen für Viewport`);
		return uniquePOIs;
	}

	private async fetchPOIsForCategory(
		bounds: { north: number; south: number; east: number; west: number },
		categoryConfig: POICategoryConfig,
		maxResults: number,
	): Promise<POI[]> {
		const query = this.buildOverpassQuery(
			bounds,
			categoryConfig.query,
			maxResults,
		);

		return new Promise((resolve, reject) => {
			this.requestQueue.push(async () => {
				try {
					const response = await fetch(this.overpassUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
						body: `data=${encodeURIComponent(query)}`,
					});

					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`);
					}

					const data = await response.json();
					const pois = this.parseOverpassResponse(data, categoryConfig);
					resolve(pois);
				} catch (error) {
					console.error(
						`📍 Fehler beim Laden von ${categoryConfig.name}:`,
						error,
					);
					reject(error);
				}
			});
		});
	}

	private buildOverpassQuery(
		bounds: { north: number; south: number; east: number; west: number },
		query: string,
		_maxResults: number,
	): string {
		return `
      [out:json][timeout:25];
      (
        node["${query}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        way["${query}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        relation["${query}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      );
      out body;
      >;
      out skel qt;
    `;
	}

	private parseOverpassResponse(
		data: any,
		categoryConfig: POICategoryConfig,
	): POI[] {
		const pois: POI[] = [];

		if (!data.elements) {
			return pois;
		}

		for (const element of data.elements) {
			if (element.type === "node" && element.lat && element.lon) {
				const poi: POI = {
					id: `poi-${element.id}`,
					type: element.type,
					name:
						element.tags?.name ||
						element.tags?.ref ||
						`Unbekannt ${categoryConfig.name}`,
					coordinates: [element.lon, element.lat],
					category: categoryConfig.category,
					properties: {
						...element.tags,
						capacity: element.tags?.capacity,
						opening_hours: element.tags?.opening_hours,
						phone: element.tags?.phone,
						website: element.tags?.website,
						wheelchair: element.tags?.wheelchair,
					},
					timestamp: Date.now(),
				};

				pois.push(poi);
			}
		}

		return pois;
	}

	private deduplicatePOIs(pois: POI[]): POI[] {
		const seen = new Set<string>();
		return pois.filter((poi) => {
			const key = `${poi.coordinates[0]}-${poi.coordinates[1]}-${poi.category}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	}

	private generateCacheKey(viewport: POIViewport, filter: POIFilter): string {
		const { bounds } = viewport;
		const categories = filter.categories.sort().join(",");
		return `${bounds.south.toFixed(3)}-${bounds.west.toFixed(3)}-${bounds.north.toFixed(3)}-${bounds.east.toFixed(3)}-${categories}`;
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.requestQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		while (this.requestQueue.length > 0) {
			const now = Date.now();
			const timeSinceLastRequest = now - this.lastRequestTime;

			if (timeSinceLastRequest < this.minRequestInterval) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest),
				);
			}

			const request = this.requestQueue.shift();
			if (request) {
				try {
					await request();
					this.lastRequestTime = Date.now();
				} catch (error) {
					console.error("📍 Fehler in Request-Queue:", error);
				}
			}
		}

		this.isProcessingQueue = false;
	}

	subscribe(callback: (data: POI[]) => void): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}

	private notifyListeners(data: POI[]): void {
		this.listeners.forEach((listener) => {
			try {
				listener(data);
			} catch (error) {
				console.error(
					"📍 Fehler beim Benachrichtigen des POI-Listeners:",
					error,
				);
			}
		});
	}

	updateFilter(filter: POIFilter): void {
		this.currentFilter = filter;
		this.poiCache.clear(); // Cache invalidieren
		console.log("📍 POI-Filter aktualisiert:", filter);
	}

	clearCache(): void {
		this.poiCache.clear();
		console.log("📍 POI-Cache geleert");
	}

	// Simulierte POI-Daten für Entwicklung
	generateMockPOIs(bounds: {
		north: number;
		south: number;
		east: number;
		west: number;
	}): POI[] {
		const mockPOIs: POI[] = [];
		const categories = Object.values(POICategory);

		for (let i = 0; i < 20; i++) {
			const category =
				categories[Math.floor(Math.random() * categories.length)];
			const categoryConfig = POI_CATEGORIES[category];

			const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
			const lng = bounds.west + Math.random() * (bounds.east - bounds.west);

			mockPOIs.push({
				id: `mock-poi-${i}`,
				type: "node",
				name: `Mock ${categoryConfig.name} ${i + 1}`,
				coordinates: [lng, lat],
				category,
				properties: {
					capacity: Math.floor(Math.random() * 100) + 10,
					opening_hours: "Mo-Fr 08:00-18:00",
					phone: "+49 123 456789",
					website: "https://example.com",
				},
				timestamp: Date.now(),
			});
		}

		return mockPOIs;
	}
}

// Singleton-Instanz
export const poiStreamingService = new POIStreamingService();
