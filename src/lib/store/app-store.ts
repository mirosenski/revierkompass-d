import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Core Interfaces
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  fullAddress: string;
  coordinates: Coordinates;
  accuracy?: number;
}

export interface CustomAddress {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  address: string; // Vollständige Adresse
  coordinates?: Coordinates;
  createdAt: Date;
  isSelected?: boolean;
  backendId?: string; // ID im Backend für permanente Adressen
  addressType?: 'temporary' | 'permanent';
  parentId?: string; // Präsidium-Zuordnung
}

export interface Station {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  phone: string;
  email: string;
  type: 'Präsidium' | 'Revier';
  city: string;
  district: string;
  openingHours: string;
  emergency24h: boolean;
}

export interface RouteResult {
  id: string;
  destinationId: string;
  destinationName: string;
  destinationType: 'station' | 'custom';
  address: string;
  distance: number; // in km
  duration: number; // in minutes
  estimatedFuel: number; // in liters
  estimatedCost: number; // in euros
  routeType: 'Schnellste' | 'Kürzeste' | 'Ökonomisch';
  stationType?: 'Präsidium' | 'Revier'; // Für Polizeistationen
  coordinates: Coordinates;
  color: string;
  profile?: string; // Routing-Profil für Offline-Maps
  route: {
    coordinates: [number, number][];
    distance: number;
    duration: number;
  };
  provider: 'OSRM' | 'Valhalla' | 'GraphHopper' | 'Direct';
}

// Wizard State
export interface WizardState {
  currentStep: number;
  startAddress: Address | null;
  selectedCities: string[];
  selectedStations: string[];
  selectedCustomAddresses: string[];
  routeResults: RouteResult[];
}

// App State Interface
export interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Wizard State
  wizard: WizardState;
  setWizardStep: (step: number) => void;
  setStartAddress: (address: Address | null) => void;
  setSelectedCities: (cities: string[]) => void;
  setSelectedStations: (stations: string[]) => void;
  setSelectedCustomAddresses: (addresses: string[]) => void;
  setRouteResults: (results: RouteResult[]) => void;
  resetWizard: () => void;
  
  // Custom Addresses
  customAddresses: CustomAddress[];
  addCustomAddress: (address: Omit<CustomAddress, 'id' | 'createdAt' | 'address'>) => void;
  updateCustomAddress: (id: string, updates: Partial<CustomAddress>) => void;
  deleteCustomAddress: (id: string) => void;
  toggleCustomAddressSelection: (id: string) => void;
  clearCustomAddressSelection: () => void;
  
  // Loading States
  isLoadingGeocode: boolean;
  isLoadingRoutes: boolean;
  isCalculating: boolean;
  setLoadingGeocode: (loading: boolean) => void;
  setLoadingRoutes: (loading: boolean) => void;
  setCalculating: (calculating: boolean) => void;
  
  // Map State
  mapCenter: [number, number];
  mapZoom: number;
  mapPitch: number;
  mapBearing: number;
  setMapView: (center: [number, number], zoom: number, pitch?: number, bearing?: number) => void;
  
  // Error States
  error: string | null;
  setError: (error: string | null) => void;
  
  // Station Data
  stations: Station[];
  setStations: (stations: Station[]) => void;
}

// Initial State
const initialWizardState: WizardState = {
  currentStep: 1,
  startAddress: null,
  selectedCities: [],
  selectedStations: [],
  selectedCustomAddresses: [],
  routeResults: []
};

// Baden-Württemberg Center
const BW_CENTER: [number, number] = [48.6616, 9.3501];

// Store Implementation
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Wizard State
      wizard: initialWizardState,
      setWizardStep: (step) => 
        set((state) => ({ 
          wizard: { ...state.wizard, currentStep: step }
        })),
      setStartAddress: (address) =>
        set((state) => ({
          wizard: { ...state.wizard, startAddress: address }
        })),
      setSelectedCities: (cities) =>
        set((state) => ({
          wizard: { ...state.wizard, selectedCities: cities }
        })),
      setSelectedStations: (stations) =>
        set((state) => ({
          wizard: { ...state.wizard, selectedStations: stations }
        })),
      setSelectedCustomAddresses: (addresses) =>
        set((state) => ({
          wizard: { ...state.wizard, selectedCustomAddresses: addresses }
        })),
      setRouteResults: (results) =>
        set((state) => ({
          wizard: { ...state.wizard, routeResults: results }
        })),
      resetWizard: () =>
        set({ wizard: initialWizardState }),
      
      // Custom Addresses
      customAddresses: [],
      addCustomAddress: (address) => {
        set((state) => {
          const newAddress = {
            ...address,
            address: `${address.street}, ${address.zipCode} ${address.city}`,
            id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            isSelected: false,
            addressType: address.addressType || 'temporary',
            backendId: address.backendId,
            parentId: address.parentId
          };
          const updatedAddresses = [...state.customAddresses, newAddress];
          return { customAddresses: updatedAddresses };
        });
      },
      updateCustomAddress: (id, updates) =>
        set((state) => ({
          customAddresses: state.customAddresses.map(addr =>
            addr.id === id ? { ...addr, ...updates } : addr
          )
        })),
      deleteCustomAddress: (id) => {
        set((state) => ({
          customAddresses: state.customAddresses.filter(addr => addr.id !== id),
          wizard: {
            ...state.wizard,
            selectedCustomAddresses: state.wizard.selectedCustomAddresses.filter(addrId => addrId !== id)
          }
        }));
      },
      toggleCustomAddressSelection: (id) =>
        set((state) => {
          const isSelected = state.wizard.selectedCustomAddresses.includes(id);
          return {
            wizard: {
              ...state.wizard,
              selectedCustomAddresses: isSelected
                ? state.wizard.selectedCustomAddresses.filter(addrId => addrId !== id)
                : [...state.wizard.selectedCustomAddresses, id]
            },
            customAddresses: state.customAddresses.map(addr =>
              addr.id === id ? { ...addr, isSelected: !isSelected } : addr
            )
          };
        }),
      clearCustomAddressSelection: () =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            selectedCustomAddresses: []
          },
          customAddresses: state.customAddresses.map(addr => ({ ...addr, isSelected: false }))
        })),
      
      // Loading States
      isLoadingGeocode: false,
      isLoadingRoutes: false,
      isCalculating: false,
      setLoadingGeocode: (loading) => set({ isLoadingGeocode: loading }),
      setLoadingRoutes: (loading) => set({ isLoadingRoutes: loading }),
      setCalculating: (calculating) => set({ isCalculating: calculating }),
      
      // Map State
      mapCenter: BW_CENTER,
      mapZoom: 8,
      mapPitch: 0,
      mapBearing: 0,
      setMapView: (center, zoom, pitch = 0, bearing = 0) =>
        set({ 
          mapCenter: center, 
          mapZoom: zoom, 
          mapPitch: pitch, 
          mapBearing: bearing 
        }),
      
      // Error States
      error: null,
      setError: (error) => set({ error }),
      
      // Station Data
      stations: [],
      setStations: (stations) => set({ stations })
    }),
    {
      name: 'revierkompass-v2-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        customAddresses: state.customAddresses,
        // Wizard-Zustand wird nicht persistiert, damit immer mit Schritt 1 begonnen wird
        // wizard: {
        //   ...state.wizard,
        //   routeResults: [] // Don't persist route results
        // }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Custom-Adressen erfolgreich aus localStorage geladen
        }
      },
    }
  )
);
