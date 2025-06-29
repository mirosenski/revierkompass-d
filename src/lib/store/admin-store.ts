import { create } from 'zustand';
import { Station } from '@/types/station.types';
import { fetchStations } from '@/services/api/backend-api.service';
import { createStation, updateStation, deleteStation } from '@/services/api/admin-station.service';

export interface AdminStats {
  totalStations: number;
  totalPrecincts: number;
  totalStationHouses: number;
  routesToday: number;
  avgResponseTime: number;
  popularCities: Array<{
    city: string;
    count: number;
  }>;
  lastUpdate: Date;
}

export interface AdminState {
  // Data State
  allStations: Station[];
  filteredStations: Station[];
  selectedStations: string[];
  stats: AdminStats | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  editingStationId: string | null;
  
  // Filters & Sorting
  searchQuery: string;
  cityFilter: string;
  typeFilter: 'all' | 'praesidium' | 'revier';
  sortBy: 'name' | 'city' | 'type';
  sortOrder: 'asc' | 'desc';
  
  // Actions - Data Management
  loadStations: () => Promise<void>;
  addStation: (station: Omit<Station, 'id'>) => Promise<void>;
  updateStation: (id: string, updates: Partial<Station>) => Promise<void>;
  deleteStation: (id: string) => Promise<void>;
  deleteMultipleStations: (ids: string[]) => Promise<void>;
  importStations: (stations: Station[]) => Promise<void>;
  
  // Actions - Statistics
  loadStats: () => Promise<void>;
  updateStats: () => void;
  
  // Actions - Selection
  toggleStationSelection: (id: string) => void;
  selectAllStations: () => void;
  clearSelection: () => void;
  
  // Actions - Filtering & Sorting
  setSearchQuery: (query: string) => void;
  setCityFilter: (city: string) => void;
  setTypeFilter: (type: 'all' | 'praesidium' | 'revier') => void;
  setSorting: (sortBy: 'name' | 'city' | 'type', order: 'asc' | 'desc') => void;
  getFilteredStations: () => Station[];
  
  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setEditing: (editing: boolean, stationId?: string) => void;
}

const generateMockStats = (): AdminStats => ({
  totalStations: 54,
  totalPrecincts: 12,
  totalStationHouses: 42,
  routesToday: 127,
  avgResponseTime: 4.2,
  popularCities: [
    { city: 'Stuttgart', count: 23 },
    { city: 'Mannheim', count: 19 },
    { city: 'Karlsruhe', count: 15 },
    { city: 'Freiburg', count: 12 },
    { city: 'Heidelberg', count: 8 }
  ],
  lastUpdate: new Date()
});

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  allStations: [],
  filteredStations: [],
  selectedStations: [],
  stats: null,
  isLoading: false,
  error: null,
  isEditing: false,
  editingStationId: null,
  searchQuery: '',
  cityFilter: '',
  typeFilter: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  
  // Data Management
  loadStations: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const stations: Station[] = await fetchStations();
      set({
        allStations: stations,
        filteredStations: stations,
        isLoading: false
      });
      
      // Update filtered stations
      get().getFilteredStations();
      
    } catch (error) {
      console.error('Error loading stations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },
  
  addStation: async (stationData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newStation: Station = {
        ...stationData,
        id: `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const currentStations = get().allStations;
      const updatedStations = [...currentStations, newStation];
      
      set({ 
        allStations: updatedStations,
        isLoading: false 
      });
      
      // Update filtered stations and stats
      get().getFilteredStations();
      get().updateStats();
      
    } catch (error) {
      console.error('Error adding station:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error adding station',
        isLoading: false 
      });
    }
  },
  
  updateStation: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentStations = get().allStations;
      const updatedStations = currentStations.map(station =>
        station.id === id ? { ...station, ...updates } : station
      );
      
      set({ 
        allStations: updatedStations,
        isLoading: false,
        isEditing: false,
        editingStationId: null
      });
      
      // Update filtered stations
      get().getFilteredStations();
      
    } catch (error) {
      console.error('Error updating station:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error updating station',
        isLoading: false 
      });
    }
  },
  
  deleteStation: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentStations = get().allStations;
      const updatedStations = currentStations.filter(station => station.id !== id);
      
      set({ 
        allStations: updatedStations,
        selectedStations: get().selectedStations.filter(selectedId => selectedId !== id),
        isLoading: false 
      });
      
      // Update filtered stations and stats
      get().getFilteredStations();
      get().updateStats();
      
    } catch (error) {
      console.error('Error deleting station:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error deleting station',
        isLoading: false 
      });
    }
  },
  
  deleteMultipleStations: async (ids) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentStations = get().allStations;
      const updatedStations = currentStations.filter(station => !ids.includes(station.id));
      
      set({ 
        allStations: updatedStations,
        selectedStations: [],
        isLoading: false 
      });
      
      // Update filtered stations and stats
      get().getFilteredStations();
      get().updateStats();
      
    } catch (error) {
      console.error('Error deleting stations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error deleting stations',
        isLoading: false 
      });
    }
  },
  
  importStations: async (stations) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentStations = get().allStations;
      const newStations = stations.map(station => ({
        ...station,
        id: station.id || `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
      
      set({ 
        allStations: [...currentStations, ...newStations],
        isLoading: false 
      });
      
      // Update filtered stations and stats
      get().getFilteredStations();
      get().updateStats();
      
    } catch (error) {
      console.error('Error importing stations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error importing stations',
        isLoading: false 
      });
    }
  },
  
  // Statistics
  loadStats: async () => {
    set({ isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stats = generateMockStats();
      const currentStations = get().allStations;
      
      // Calculate real stats from current data
      stats.totalStations = currentStations.length;
      stats.totalPrecincts = currentStations.filter(s => s.type === 'praesidium').length;
      stats.totalStationHouses = currentStations.filter(s => s.type === 'revier').length;
      
      set({ stats, isLoading: false });
      
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Error loading stats',
        isLoading: false 
      });
    }
  },
  
  updateStats: () => {
    const currentStats = get().stats;
    const currentStations = get().allStations;
    
    if (currentStats) {
      const updatedStats: AdminStats = {
        ...currentStats,
        totalStations: currentStations.length,
        totalPrecincts: currentStations.filter(s => s.type === 'praesidium').length,
        totalStationHouses: currentStations.filter(s => s.type === 'revier').length,
        lastUpdate: new Date()
      };
      
      set({ stats: updatedStats });
    }
  },
  
  // Selection Management
  toggleStationSelection: (id) => {
    const current = get().selectedStations;
    const isSelected = current.includes(id);
    
    set({
      selectedStations: isSelected
        ? current.filter(selectedId => selectedId !== id)
        : [...current, id]
    });
  },
  
  selectAllStations: () => {
    const filtered = get().getFilteredStations();
    set({ selectedStations: filtered.map(station => station.id) });
  },
  
  clearSelection: () => {
    set({ selectedStations: [] });
  },
  
  // Filtering & Sorting
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().getFilteredStations();
  },
  
  setCityFilter: (city) => {
    set({ cityFilter: city });
    get().getFilteredStations();
  },
  
  setTypeFilter: (type) => {
    set({ typeFilter: type });
    get().getFilteredStations();
  },
  
  setSorting: (sortBy, order) => {
    set({ sortBy, sortOrder: order });
    get().getFilteredStations();
  },
  
  getFilteredStations: () => {
    const { allStations, searchQuery, cityFilter, typeFilter, sortBy, sortOrder } = get();
    
    let filtered = [...allStations];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        station.city.toLowerCase().includes(query) ||
        station.address.toLowerCase().includes(query)
      );
    }
    
    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter(station => station.city === cityFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(station => station.type === typeFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string, bValue: string;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'city':
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    set({ filteredStations: filtered });
    return filtered;
  },
  
  // UI State
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setEditing: (editing, stationId) => set({ 
    isEditing: editing, 
    editingStationId: stationId || null 
  })
}));
