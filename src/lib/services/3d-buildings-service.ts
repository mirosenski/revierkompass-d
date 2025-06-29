export interface Building3D {
	id: string;
	coordinates: [number, number][];
	height: number;
	minHeight: number;
	properties: {
		building: string;
		levels?: number;
		roof_shape?: string;
		material?: string;
		year_built?: number;
		address?: string;
	};
}

export interface BuildingsViewport {
	bounds: {
		north: number;
		south: number;
		east: number;
		west: number;
	};
	zoom: number;
	center: [number, number];
}

export interface BuildingsConfig {
	enabled: boolean;
	minZoom: number;
	maxZoom: number;
	opacity: number;
	shadowEnabled: boolean;
	shadowMinZoom: number;
	lodLevels: LODLevel[];
	performanceCheck: boolean;
	cityWhitelist: string[];
}

export interface LODLevel {
	zoom: number;
	name: string;
	detail: "simple" | "textured" | "detailed" | "full";
	maxBuildings: number;
}

export const DEFAULT_LOD_LEVELS: LODLevel[] = [
	{ zoom: 15, name: "Simple Boxes", detail: "simple", maxBuildings: 1000 },
	{ zoom: 16, name: "With Texture", detail: "textured", maxBuildings: 2000 },
	{ zoom: 17, name: "Detailed Roofs", detail: "detailed", maxBuildings: 5000 },
	{ zoom: 18, name: "Window Details", detail: "full", maxBuildings: 10000 },
];

export const DEFAULT_CITY_WHITELIST = [
	"Stuttgart",
	"Mannheim",
	"Karlsruhe",
	"Freiburg",
	"Heidelberg",
	"Heilbronn",
	"Ulm",
	"Pforzheim",
	"Reutlingen",
	"Ludwigsburg",
];

export class Buildings3DService {
	private buildingsCache: Map<
		string,
		{ data: Building3D[]; timestamp: number }
	> = new Map();
	private cacheTimeout = 10 * 60 * 1000; // 10 Minuten
	private config: BuildingsConfig;
	private listeners: Set<(data: Building3D[]) => void> = new Set();
	private performanceMonitor: PerformanceMonitor;
	private isEnabled = false;

	constructor() {
		this.config = {
			enabled: true,
			minZoom: 15,
			maxZoom: 18,
			opacity: 0.7,
			shadowEnabled: true,
			shadowMinZoom: 16,
			lodLevels: DEFAULT_LOD_LEVELS,
			performanceCheck: true,
			cityWhitelist: DEFAULT_CITY_WHITELIST,
		};

		this.performanceMonitor = new PerformanceMonitor();
	}

	async loadBuildings(viewport: BuildingsViewport): Promise<Building3D[]> {
		// Prüfe ob 3D-Buildings aktiviert sind
		if (!this.shouldLoadBuildings(viewport)) {
			return [];
		}

		const cacheKey = this.generateCacheKey(viewport);
		const cached = this.buildingsCache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			console.log("🏢 3D-Buildings Cache-Hit für", cacheKey);
			return cached.data;
		}

		// Performance-Check
		if (
			this.config.performanceCheck &&
			!this.performanceMonitor.canLoadBuildings()
		) {
			console.warn(
				"🏢 Performance-Check fehlgeschlagen - 3D-Buildings deaktiviert",
			);
			return [];
		}

		try {
			const buildings = await this.fetchBuildingsForViewport(viewport);

			// Cache speichern
			this.buildingsCache.set(cacheKey, {
				data: buildings,
				timestamp: Date.now(),
			});

			// Listener benachrichtigen
			this.notifyListeners(buildings);

			console.log(
				`🏢 ${buildings.length} 3D-Buildings geladen für Zoom ${viewport.zoom}`,
			);
			return buildings;
		} catch (error) {
			console.error("🏢 Fehler beim Laden von 3D-Buildings:", error);
			return [];
		}
	}

	private shouldLoadBuildings(viewport: BuildingsViewport): boolean {
		if (!this.config.enabled || !this.isEnabled) {
			return false;
		}

		if (
			viewport.zoom < this.config.minZoom ||
			viewport.zoom > this.config.maxZoom
		) {
			return false;
		}

		// Prüfe ob Stadt in Whitelist ist (vereinfachte Implementierung)
		const isWhitelistedCity = this.isCityInWhitelist(viewport.center);
		if (!isWhitelistedCity) {
			return false;
		}

		return true;
	}

	private isCityInWhitelist(center: [number, number]): boolean {
		// Vereinfachte Implementierung - in Produktion würde hier eine Geocoding-API verwendet
		// Für jetzt geben wir true zurück für Baden-Württemberg
		const [lng, lat] = center;

		// Baden-Württemberg Bounds (vereinfacht)
		const bwBounds = {
			north: 49.8,
			south: 47.5,
			east: 10.5,
			west: 7.5,
		};

		return (
			lat >= bwBounds.south &&
			lat <= bwBounds.north &&
			lng >= bwBounds.west &&
			lng <= bwBounds.east
		);
	}

	private async fetchBuildingsForViewport(
		viewport: BuildingsViewport,
	): Promise<Building3D[]> {
		const { bounds, zoom } = viewport;
		const lodLevel = this.getLODLevel(zoom);

		// Simulierte Gebäudedaten für Entwicklung
		// In Produktion würde hier eine echte API verwendet werden
		return this.generateMockBuildings(bounds, lodLevel);
	}

	private getLODLevel(zoom: number): LODLevel {
		const level = this.config.lodLevels.find((lod) => zoom >= lod.zoom);
		return level || this.config.lodLevels[this.config.lodLevels.length - 1];
	}

	private generateMockBuildings(
		bounds: { north: number; south: number; east: number; west: number },
		lodLevel: LODLevel,
	): Building3D[] {
		const buildings: Building3D[] = [];
		const numBuildings = Math.min(lodLevel.maxBuildings, 100); // Max 100 für Demo

		for (let i = 0; i < numBuildings; i++) {
			const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
			const lng = bounds.west + Math.random() * (bounds.east - bounds.west);

			// Erstelle ein realistisches Gebäude-Polygon (vereinfacht als Rechteck)
			const size = 0.001 + Math.random() * 0.003; // 100-400m
			const height = 5 + Math.random() * 50; // 5-55m
			const minHeight = Math.random() * 2; // 0-2m

			const coordinates: [number, number][] = [
				[lng - size / 2, lat - size / 2],
				[lng + size / 2, lat - size / 2],
				[lng + size / 2, lat + size / 2],
				[lng - size / 2, lat + size / 2],
				[lng - size / 2, lat - size / 2], // Schließen
			];

			buildings.push({
				id: `building-${i}`,
				coordinates,
				height,
				minHeight,
				properties: {
					building: "residential",
					levels: Math.floor(height / 3),
					roof_shape: Math.random() > 0.5 ? "flat" : "gabled",
					material: Math.random() > 0.7 ? "brick" : "concrete",
					year_built: 1950 + Math.floor(Math.random() * 70),
					address: `Musterstraße ${Math.floor(Math.random() * 100) + 1}`,
				},
			});
		}

		return buildings;
	}

	private generateCacheKey(viewport: BuildingsViewport): string {
		const { bounds, zoom } = viewport;
		return `${bounds.south.toFixed(3)}-${bounds.west.toFixed(3)}-${bounds.north.toFixed(3)}-${bounds.east.toFixed(3)}-${zoom}`;
	}

	getMapStyleConfig(zoom: number): any {
		const lodLevel = this.getLODLevel(zoom);

		return {
			"fill-extrusion-height": ["get", "height"],
			"fill-extrusion-base": ["get", "min_height"],
			"fill-extrusion-opacity": this.config.opacity,
			"fill-extrusion-color": [
				"case",
				["==", ["get", "building"], "residential"],
				"#e5e7eb",
				["==", ["get", "building"], "commercial"],
				"#fbbf24",
				["==", ["get", "building"], "industrial"],
				"#6b7280",
				"#d1d5db", // Default
			],
			"fill-extrusion-translate": [0, 0],
			"fill-extrusion-translate-anchor": "map",
			"fill-extrusion-pattern":
				lodLevel.detail === "textured" ? "building-pattern" : undefined,
		};
	}

	getShadowConfig(zoom: number): any {
		if (!this.config.shadowEnabled || zoom < this.config.shadowMinZoom) {
			return null;
		}

		return {
			"fill-extrusion-shadow": true,
			"fill-extrusion-shadow-color": "rgba(0, 0, 0, 0.3)",
			"fill-extrusion-shadow-offset": [2, 2],
		};
	}

	updateConfig(newConfig: Partial<BuildingsConfig>): void {
		this.config = { ...this.config, ...newConfig };
		console.log("🏢 3D-Buildings Konfiguration aktualisiert:", this.config);
	}

	enable(): void {
		this.isEnabled = true;
		console.log("🏢 3D-Buildings aktiviert");
	}

	disable(): void {
		this.isEnabled = false;
		console.log("🏢 3D-Buildings deaktiviert");
	}

	subscribe(callback: (data: Building3D[]) => void): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}

	private notifyListeners(data: Building3D[]): void {
		this.listeners.forEach((listener) => {
			try {
				listener(data);
			} catch (error) {
				console.error(
					"🏢 Fehler beim Benachrichtigen des Buildings-Listeners:",
					error,
				);
			}
		});
	}

	clearCache(): void {
		this.buildingsCache.clear();
		console.log("🏢 3D-Buildings Cache geleert");
	}

	getPerformanceStats(): any {
		return this.performanceMonitor.getStats();
	}
}

class PerformanceMonitor {
	private fpsHistory: number[] = [];
	private memoryHistory: number[] = [];
	private lastFrameTime = performance.now();
	private frameCount = 0;

	constructor() {
		this.startMonitoring();
	}

	private startMonitoring(): void {
		const measurePerformance = () => {
			const now = performance.now();
			const deltaTime = now - this.lastFrameTime;

			if (deltaTime > 0) {
				const fps = 1000 / deltaTime;
				this.fpsHistory.push(fps);

				// Behalte nur die letzten 60 FPS-Werte
				if (this.fpsHistory.length > 60) {
					this.fpsHistory.shift();
				}
			}

			this.lastFrameTime = now;
			this.frameCount++;

			// Memory-Usage tracken (falls verfügbar)
			if ("memory" in performance) {
				const memory = (performance as any).memory;
				this.memoryHistory.push(memory.usedJSHeapSize / 1024 / 1024); // MB

				if (this.memoryHistory.length > 60) {
					this.memoryHistory.shift();
				}
			}

			requestAnimationFrame(measurePerformance);
		};

		requestAnimationFrame(measurePerformance);
	}

	canLoadBuildings(): boolean {
		const avgFps = this.getAverageFPS();
		const avgMemory = this.getAverageMemory();

		// Prüfe Performance-Kriterien
		const fpsOK = avgFps > 30;
		const memoryOK = avgMemory < 500; // Max 500MB

		console.log(
			`🏢 Performance-Check: FPS=${avgFps.toFixed(1)}, Memory=${avgMemory.toFixed(1)}MB`,
		);

		return fpsOK && memoryOK;
	}

	private getAverageFPS(): number {
		if (this.fpsHistory.length === 0) return 60;
		return (
			this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
			this.fpsHistory.length
		);
	}

	private getAverageMemory(): number {
		if (this.memoryHistory.length === 0) return 0;
		return (
			this.memoryHistory.reduce((sum, mem) => sum + mem, 0) /
			this.memoryHistory.length
		);
	}

	getStats(): any {
		return {
			fps: {
				current: this.fpsHistory[this.fpsHistory.length - 1] || 0,
				average: this.getAverageFPS(),
				min: Math.min(...this.fpsHistory),
				max: Math.max(...this.fpsHistory),
			},
			memory: {
				current: this.memoryHistory[this.memoryHistory.length - 1] || 0,
				average: this.getAverageMemory(),
				max: Math.max(...this.memoryHistory),
			},
			frameCount: this.frameCount,
		};
	}
}

// Singleton-Instanz
export const buildings3DService = new Buildings3DService();
