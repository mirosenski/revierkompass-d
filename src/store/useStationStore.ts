import { create } from 'zustand'
import { Station } from '@/types/station.types'
import { stationService } from '@/services/api/station.service'

interface StationStore {
  stations: Station[]
  isLoading: boolean
  error: string | null

  loadStations: () => Promise<void>
  getStationsByType: (type: 'praesidium' | 'revier') => Station[]
  getReviereByPraesidium: (praesidiumId: string) => Station[]
  getPraesidiumById: (id: string) => Station | undefined
}

export const useStationStore = create<StationStore>((set, get) => ({
  stations: [],
  isLoading: false,
  error: null,

  loadStations: async () => {
    console.log('🔄 useStationStore: Lade Stationen...');
    set({ isLoading: true, error: null })
    try {
      const data = await stationService.getAllStations()
      console.log('✅ useStationStore: Stationen geladen:', data.length);
      set({ stations: data, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ useStationStore: Fehler beim Laden:', message);
      set({ error: message, isLoading: false })
    }
  },

  getStationsByType: (type) => {
    const stations = get().stations;
    if (!Array.isArray(stations)) return [];
    return stations.filter((s) => s.type === type);
  },

  getReviereByPraesidium: (praesidiumId) => {
    const stations = get().stations;
    if (!Array.isArray(stations)) return [];
    return stations.filter((s) => s.parentId === praesidiumId);
  },

  getPraesidiumById: (id) => {
    const stations = get().stations;
    if (!Array.isArray(stations)) return undefined;
    return stations.find((s) => s.id === id && s.type === 'praesidium');
  }
}))
