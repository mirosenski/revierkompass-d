import { create } from 'zustand'
import { Station } from '@/types/station.types'
import {
  fetchStations,
  createStation as apiCreateStation,
  updateStation as apiUpdateStation,
  deleteStation as apiDeleteStation,
} from '@/services/api/backend-api.service'

interface AdminStore {
  stations: Station[]
  isLoading: boolean
  error: string | null

  loadStations: (params?: { all: boolean; take: number }) => Promise<void>
  createStation: (
    station: Omit<Station, 'id' | 'lastModified'>
  ) => Promise<void>
  updateStation: (id: string, updates: Partial<Station>) => Promise<void>
  deleteStation: (id: string) => Promise<void>
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  stations: [],
  isLoading: false,
  error: null,

  loadStations: async (params = { all: true, take: 1000 }) => {
    console.log('🔄 useAdminStore: Lade Stationen...');
    set({ isLoading: true, error: null })
    try {
      const data = await fetchStations(params)
      console.log('✅ useAdminStore: Stationen geladen:', data.length);
      console.log('🔍 Stationen Details:', data.map(s => ({ name: s.name, type: s.type, parentId: s.parentId })))
      set({ stations: data, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ useAdminStore: Fehler beim Laden:', message);
      set({ error: message, isLoading: false })
    }
  },

  createStation: async (station) => {
    console.log('🔄 useAdminStore: Erstelle Station...', station);
    set({ isLoading: true, error: null })
    try {
      const created = await apiCreateStation(station)
      console.log('✅ useAdminStore: Station erstellt:', created);
      
      // Verwende die gleichen Parameter wie loadStations
      const updatedStations = await fetchStations({ all: true, take: 1000 })
      console.log('✅ useAdminStore: Stationen nach Erstellung neu geladen:', updatedStations.length);
      console.log('🔍 Neue Stationen Details:', updatedStations.map(s => ({ 
        id: s.id, 
        name: s.name, 
        type: s.type, 
        parentId: s.parentId,
        isActive: s.isActive 
      })));
      set({ stations: updatedStations, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ useAdminStore: Fehler beim Erstellen:', message);
      set({ error: message, isLoading: false })
    }
  },

  updateStation: async (id, updates) => {
    console.log('🔄 useAdminStore: Aktualisiere Station...', id, updates);
    set({ isLoading: true, error: null })
    try {
      const updated = await apiUpdateStation(id, updates)
      console.log('✅ useAdminStore: Station aktualisiert:', updated);
      
      // Verwende die gleichen Parameter wie loadStations
      const updatedStations = await fetchStations({ all: true, take: 1000 })
      console.log('✅ useAdminStore: Stationen nach Update neu geladen:', updatedStations.length);
      set({ stations: updatedStations, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ useAdminStore: Fehler beim Aktualisieren:', message);
      set({ error: message, isLoading: false })
    }
  },

  deleteStation: async (id) => {
    console.log('🔄 useAdminStore: Lösche Station...', id);
    set({ isLoading: true, error: null })
    try {
      await apiDeleteStation(id)
      console.log('✅ useAdminStore: Station gelöscht');
      
      // Verwende die gleichen Parameter wie loadStations
      const updatedStations = await fetchStations({ all: true, take: 1000 })
      console.log('✅ useAdminStore: Stationen nach Löschung neu geladen:', updatedStations.length);
      set({ stations: updatedStations, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ useAdminStore: Fehler beim Löschen:', message);
      set({ error: message, isLoading: false })
    }
  },


}))
