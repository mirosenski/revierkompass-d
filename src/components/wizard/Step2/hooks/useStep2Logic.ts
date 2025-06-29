import { useState, useEffect, useRef } from 'react';
import { useStationStore } from '@/store/useStationStore';
import { useWizardStore } from '@/store/useWizardStore';
import { useAppStore, RouteResult } from '@/lib/store/app-store';
import toast from 'react-hot-toast';
import React from 'react';

export const useStep2Logic = () => {
  // States
  const [activeView, setActiveView] = useState<'grid' | 'list' | 'compact' | 'map'>('grid');
  const [activeTab, setActiveTab] = useState<'stations' | 'custom'>('stations');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedPraesidien, setExpandedPraesidien] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    zipCode: '',
    city: '',
    addressType: 'temporary' as 'temporary' | 'permanent',
    parentId: undefined as string | undefined
  });

  // Routing state
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [routeCache, setRouteCache] = useState<Record<string, RouteResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Store-Hooks
  const { stations, getStationsByType, getReviereByPraesidium, loadStations } = useStationStore();
  const { selectedStations, setSelectedStations, selectedCustomAddresses, setSelectedCustomAddresses, setStep } = useWizardStore();
  const { customAddresses, addCustomAddress, deleteCustomAddress, setWizardStep } = useAppStore();

  // Lade Stationen beim Mounten und alle 30 Sekunden neu
  useEffect(() => {
    loadStations();
    
    // Polling für Updates alle 30 Sekunden
    const interval = setInterval(() => {
      loadStations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadStations]);

  // Synchronisiere Custom-Adressen zwischen Stores
  useEffect(() => {
    // Wenn Custom-Adressen im useAppStore vorhanden sind, aber nicht im useWizardStore
    if (customAddresses.length > 0 && selectedCustomAddresses.length === 0) {
      // Hier könnten wir die ausgewählten Adressen synchronisieren, falls nötig
    }
  }, [customAddresses, selectedCustomAddresses]);

  // Debug: Log wenn Stationen geladen sind
  useEffect(() => {
    console.log('🔍 useStep2Logic: Stationen geladen:', stations.length);
    const praesidien = getStationsByType('praesidium');
    const reviere = getStationsByType('revier');
    console.log('🔍 useStep2Logic: Präsidien:', praesidien.length, 'Reviere:', reviere.length);
  }, [stations, getStationsByType]);

  // Erstelle Präsidien mit Revieren
  const praesidiumWithReviere = React.useMemo(() => {
    const praesidien = getStationsByType('praesidium');
    return praesidien.map(praesidium => ({
      ...praesidium,
      reviere: getReviereByPraesidium(praesidium.id),
      selectedCount: getReviereByPraesidium(praesidium.id)
        .filter(r => selectedStations.includes(r.id)).length
    }));
  }, [stations, selectedStations, getStationsByType, getReviereByPraesidium]);

  // Debug: Log Präsidien mit Revieren
  useEffect(() => {
    console.log('🔍 useStep2Logic: Präsidien mit Revieren:', praesidiumWithReviere.length);
    praesidiumWithReviere.forEach(p => {
      console.log(`  - ${p.name}: ${p.reviere.length} Reviere`);
    });
  }, [praesidiumWithReviere]);

  // Manuelle Initialisierung der Custom-Adressen
  const initializeCustomAddresses = () => {
    try {
      const stored = localStorage.getItem('revierkompass-v2-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.customAddresses && parsed.customAddresses.length > 0) {
          return parsed.customAddresses;
        }
      }
    } catch (error) {
      console.error('❌ Fehler bei manueller Initialisierung:', error);
    }
    
    // Fallback: Test-Adresse hinzufügen, wenn keine vorhanden
    return [{
      id: 'test-address-1',
      name: 'Test Adresse',
      street: 'Musterstraße 123',
      zipCode: '70173',
      city: 'Stuttgart',
      addressType: 'temporary',
      address: 'Musterstraße 123, 70173 Stuttgart',
      createdAt: new Date(),
      isSelected: false
    }];
  };

  // Initialisiere Custom-Adressen beim Mounten
  useEffect(() => {
    try {
      const stored = localStorage.getItem('revierkompass-v2-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.customAddresses && parsed.customAddresses.length > 0) {
          if (customAddresses.length === 0) {
            // Hier könnten wir die Adressen manuell setzen, falls nötig
          }
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Lesen localStorage:', error);
    }
  }, [customAddresses.length]);

  // Manuelle Initialisierung beim ersten Laden
  useEffect(() => {
    const manualAddresses = initializeCustomAddresses();
    if (manualAddresses.length > 0 && customAddresses.length === 0) {
      // Hier könnten wir die Adressen manuell setzen, falls nötig
    }
  }, []);

  // Debug: Log Custom-Adressen
  useEffect(() => {
    // Debug localStorage
    try {
      const stored = localStorage.getItem('revierkompass-v2-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // localStorage customAddresses verfügbar
      }
    } catch (error) {
      console.error('❌ Fehler beim Lesen localStorage:', error);
    }
  }, [customAddresses, selectedCustomAddresses]);

  // Fetch routes from OSRM with rate limiting and better error handling
  const fetchRoutes = async () => {
    setIsLoading(true);
    const startCoords = { lat: 48.7784, lng: 9.1806 };
    
    // Im Map-View alle Stationen routen, sonst nur ausgewählte
    const selectedStationIds = new Set(selectedStations);
    const shouldRouteAll = activeView === 'map' || selectedStations.length === 0;
    
    const allDestinations = [
      ...stations
        .filter(s => s.type === 'praesidium' && s.coordinates && (shouldRouteAll || selectedStationIds.has(s.id)))
        .map(p => ({
          id: p.id,
          coordinates: { lat: p.coordinates[0], lng: p.coordinates[1] },
          type: 'praesidium',
          name: p.name,
          address: p.address
        })),
      ...stations
        .filter(s => s.type === 'revier' && s.coordinates && (shouldRouteAll || selectedStationIds.has(s.id)))
        .map(r => ({
          id: r.id,
          coordinates: { lat: r.coordinates[0], lng: r.coordinates[1] },
          type: 'revier',
          name: r.name,
          address: r.address
        }))
    ];

    // Wenn keine Stationen gefunden wurden, alle anzeigen
    if (allDestinations.length === 0) {
      const allStationDestinations = [
        ...stations
          .filter(s => s.type === 'praesidium' && s.coordinates)
          .map(p => ({
            id: p.id,
            coordinates: { lat: p.coordinates[0], lng: p.coordinates[1] },
            type: 'praesidium',
            name: p.name,
            address: p.address
          })),
        ...stations
          .filter(s => s.type === 'revier' && s.coordinates)
          .map(r => ({
            id: r.id,
            coordinates: { lat: r.coordinates[0], lng: r.coordinates[1] },
            type: 'revier',
            name: r.name,
            address: r.address
          }))
      ];
      allDestinations.push(...allStationDestinations);
    }

    // Test-Route hinzufügen für Debugging
    if (allDestinations.length === 0) {
      allDestinations.push({
        id: 'test-route',
        coordinates: { lat: 48.7758, lng: 9.1829 }, // Stuttgart Hauptbahnhof
        type: 'praesidium',
        name: 'Test Route',
        address: 'Stuttgart Hauptbahnhof'
      });
    }

    console.log('🗺️ Starte Routenberechnung für', allDestinations.length, 'Ziele');

    try {
      // Rate limiting: Verarbeite Routen in Batches von 3
      const batchSize = 3;
      const newRoutes: RouteResult[] = [];
      
      for (let i = 0; i < allDestinations.length; i += batchSize) {
        const batch = allDestinations.slice(i, i + batchSize);
        
        const batchRoutes = await Promise.all(
          batch.map(async dest => {
            // Sicherstellen, dass die ID gültig ist
            if (!dest.id || dest.id === 'undefined' || dest.id === 'null' || isNaN(Number(dest.id))) {
              console.warn('Invalid destination ID:', dest.id, 'for destination:', dest.name);
              return null;
            }

            const cacheKey = `${startCoords.lat}-${dest.coordinates.lat}-${dest.coordinates.lng}`;

            if (routeCache[cacheKey]) {
              return routeCache[cacheKey];
            }

            try {
              // OSRM API mit Timeout und Retry-Logic
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout

              const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${dest.coordinates.lng},${dest.coordinates.lat}?overview=full&geometries=geojson`,
                {
                  signal: controller.signal,
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Revierkompass/1.0'
                  }
                }
              );

              clearTimeout(timeoutId);

              if (response.status === 429) {
                // Rate limit erreicht - warte und verwende Fallback
                console.warn(`Rate limit reached for ${dest.name}, using fallback`);
                throw new Error('Rate limit reached');
              }

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const data = await response.json();

              if (data.code !== 'Ok' || !data.routes?.[0]) {
                throw new Error('No route found');
              }

              const osrmRoute = data.routes[0];
              const newRoute: RouteResult = {
                id: dest.id,
                destinationId: dest.id,
                destinationName: dest.name,
                destinationType: 'station',
                address: dest.address,
                coordinates: dest.coordinates,
                color: dest.type === 'praesidium' ? '#2563eb' : '#22c55e',
                distance: osrmRoute.distance / 1000,
                duration: Math.round(osrmRoute.duration / 60),
                estimatedFuel: (osrmRoute.distance / 1000) * 0.07,
                estimatedCost: (osrmRoute.distance / 1000) * 0.07 * 1.8,
                routeType: 'Schnellste',
                stationType: dest.type === 'praesidium' ? 'Präsidium' : 'Revier',
                route: {
                  coordinates: osrmRoute.geometry.coordinates,
                  distance: osrmRoute.distance / 1000,
                  duration: Math.round(osrmRoute.duration / 60)
                },
                provider: 'OSRM'
              };

              setRouteCache(prev => ({ ...prev, [cacheKey]: newRoute }));
              return newRoute;
            } catch (error) {
              console.warn(`Error routing to ${dest.name}:`, error);
              
              // Berechne Luftlinien-Distanz als Fallback
              const lat1 = startCoords.lat * Math.PI / 180;
              const lat2 = dest.coordinates.lat * Math.PI / 180;
              const deltaLat = (dest.coordinates.lat - startCoords.lat) * Math.PI / 180;
              const deltaLng = (dest.coordinates.lng - startCoords.lng) * Math.PI / 180;
              
              const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                       Math.cos(lat1) * Math.cos(lat2) *
                       Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = 6371 * c; // Erdradius in km
              
              return {
                id: dest.id,
                destinationId: dest.id,
                destinationName: dest.name,
                destinationType: 'station',
                address: dest.address,
                coordinates: dest.coordinates,
                color: dest.type === 'praesidium' ? '#2563eb' : '#22c55e',
                distance: distance,
                duration: Math.round(distance * 2), // Geschätzte Fahrzeit (2 min/km)
                estimatedFuel: distance * 0.07,
                estimatedCost: distance * 0.07 * 1.8,
                routeType: 'Schnellste',
                stationType: dest.type === 'praesidium' ? 'Präsidium' : 'Revier',
                route: {
                  coordinates: [
                    [startCoords.lng, startCoords.lat],
                    [dest.coordinates.lng, dest.coordinates.lat]
                  ],
                  distance: distance,
                  duration: Math.round(distance * 2)
                },
                provider: 'Direct'
              } as RouteResult;
            }
          })
        );

        // Filtere null-Werte heraus
        const validRoutes = batchRoutes.filter(route => route !== null) as RouteResult[];
        newRoutes.push(...validRoutes);

        // Warte zwischen Batches um Rate-Limiting zu vermeiden
        if (i + batchSize < allDestinations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s Pause
        }
      }

      setRoutes(newRoutes);
      console.log('🗺️ Routen berechnet:', newRoutes.length, 'für', allDestinations.length, 'Ziele');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch routes once stations are loaded or selection changes
  useEffect(() => {
    if (stations.length > 0) {
      fetchRoutes();
    }
  }, [stations, selectedStations, activeView]);

  // Screen reader helper
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // Toggle für Präsidium mit allen Revieren
  const togglePraesidiumWithReviere = (praesidiumId: string) => {
    const praesidien = getStationsByType('praesidium');
    const praesidiumWithReviere = praesidien.map(praesidium => ({
      ...praesidium,
      reviere: getReviereByPraesidium(praesidium.id),
      selectedCount: getReviereByPraesidium(praesidium.id)
        .filter(r => selectedStations.includes(r.id)).length
    }));
    
    const praesidium = praesidiumWithReviere.find(p => p.id === praesidiumId);
    if (!praesidium) return;

    const reviereIds = praesidium.reviere.map(r => r.id);
    const allIds = [praesidiumId, ...reviereIds];
    
    // Prüfen ob bereits alle ausgewählt sind
    const allSelected = allIds.every(id => selectedStations.includes(id));
    
    if (allSelected) {
      setSelectedStations(selectedStations.filter(id => !allIds.includes(id)));
      announceToScreenReader(`${praesidium.name} und alle Reviere abgewählt`);
    } else {
      setSelectedStations([...selectedStations.filter(id => !allIds.includes(id)), ...allIds]);
      announceToScreenReader(`${praesidium.name} und alle Reviere ausgewählt`);
    }
  };

  // Einzelne Station umschalten
  const handleStationToggle = (stationId: string) => {
    if (selectedStations.includes(stationId)) {
      setSelectedStations(selectedStations.filter(id => id !== stationId));
    } else {
      setSelectedStations([...selectedStations, stationId]);
    }
  };

  // Toggle Dropdown für Präsidium
  const togglePraesidiumExpansion = (praesidiumId: string) => {
    console.log('Expanding:', praesidiumId, 'Current state:', Array.from(expandedPraesidien));
    setExpandedPraesidien(prev => {
      const next = new Set(prev);
      if (next.has(praesidiumId)) {
        next.delete(praesidiumId);
      } else {
        next.add(praesidiumId);
      }
      return next;
    });
  };

  // Custom Address Toggle
  const handleCustomToggle = (addressId: string) => {
    if (selectedCustomAddresses.includes(addressId)) {
      setSelectedCustomAddresses(selectedCustomAddresses.filter(id => id !== addressId));
    } else {
      setSelectedCustomAddresses([...selectedCustomAddresses, addressId]);
    }
  };

  // Add Custom Address
  const handleAddAddress = async () => {
    if (!formData.name.trim() || !formData.street.trim() || !formData.zipCode.trim() || !formData.city.trim()) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      // Alle Adressen werden jetzt an das Backend gesendet
      const addressData = {
        name: formData.name,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        addressType: formData.addressType,
        parentId: formData.parentId,
        reviewStatus: formData.addressType === 'temporary' ? 'approved' : 'pending',
        isAnonymous: true, // Für anonyme Nutzer
        coordinates: null // Könnte später durch Geocoding ergänzt werden
      };

      try {
        // Backend-API aufrufen
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressData)
        });

        if (!response.ok) {
          throw new Error('Backend nicht verfügbar');
        }

        const result = await response.json();
        
        // Lokal hinzufügen mit Backend-ID
        addCustomAddress({
          name: formData.name,
          street: formData.street,
          zipCode: formData.zipCode,
          city: formData.city,
          addressType: formData.addressType,
          backendId: result.address.id,
          parentId: formData.parentId
        });

        if (formData.addressType === 'temporary') {
          toast.success('Temporäre Adresse hinzugefügt und sofort verfügbar');
        } else {
          toast.success('Permanente Adresse zur Überprüfung eingereicht');
        }
        
        announceToScreenReader(formData.addressType === 'temporary' ? 'Temporäre Adresse hinzugefügt' : 'Permanente Adresse eingereicht');
        
      } catch (backendError) {
        console.warn('Backend nicht verfügbar, speichere nur lokal:', backendError);
        
        // Fallback: Nur lokal speichern
        addCustomAddress({
          name: formData.name,
          street: formData.street,
          zipCode: formData.zipCode,
          city: formData.city,
          addressType: formData.addressType,
          parentId: formData.parentId
        });
        
        if (formData.addressType === 'temporary') {
          toast.success('Temporäre Adresse lokal hinzugefügt (Backend nicht verfügbar)');
        } else {
          toast.success('Permanente Adresse lokal gespeichert (Backend nicht verfügbar)');
        }
      }

      // Formular zurücksetzen
      setFormData({
        name: '',
        street: '',
        zipCode: '',
        city: '',
        addressType: 'temporary',
        parentId: undefined
      });
      setShowAddForm(false);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Adresse:', error);
      toast.error('Fehler beim Hinzufügen der Adresse');
    }
  };

  // Delete Custom Address
  const handleDeleteAddress = async (addressId: string) => {
    try {
      // Prüfen ob es eine permanente Adresse ist (hat Backend-ID)
      const address = customAddresses.find(addr => addr.id === addressId);
      if (address && address.backendId) {
        // Permanente Adresse: Versuche Backend-API aufrufen
        try {
          const response = await fetch(`/api/addresses/anonymous/${address.backendId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Backend nicht verfügbar');
          }
          
          toast.success('Permanente Adresse gelöscht');
        } catch (backendError) {
          console.warn('Backend nicht verfügbar, lösche nur lokal:', backendError);
          toast.success('Adresse lokal gelöscht (Backend nicht verfügbar)');
        }
      } else {
        // Temporäre Adresse: Nur lokal löschen
        toast.success('Temporäre Adresse gelöscht');
      }
      
      // Lokal löschen
      deleteCustomAddress(addressId);
      const updated = selectedCustomAddresses.filter(id => id !== addressId);
      setSelectedCustomAddresses(updated);
    } catch (error) {
      console.error('Fehler beim Löschen der Adresse:', error);
      toast.error('Fehler beim Löschen der Adresse');
    }
  };

  // Edit Custom Address
  const handleEditAddress = (address: any) => {
    // Formular mit Adress-Daten füllen
    setFormData({
      name: address.name,
      street: address.street,
      zipCode: address.zipCode,
      city: address.city,
      addressType: address.addressType || 'temporary',
      parentId: address.parentId || undefined
    });
    
    // Bearbeitungsmodus aktivieren
    setShowAddForm(true);
    
    // Adresse aus der Liste entfernen (wird durch neue ersetzt)
    deleteCustomAddress(address.id);
    const updated = selectedCustomAddresses.filter(id => id !== address.id);
    setSelectedCustomAddresses(updated);
    
    toast.success('Adresse zum Bearbeiten geöffnet');
  };

  // Voice Commands
  const handleVoiceCommand = (command: string) => {
    console.log("Voice command:", command);
    toast.success(`Sprachbefehl erkannt: ${command}`);
  };

  // Command Handler
  const handleCommand = (command: string) => {
    const praesidien = getStationsByType('praesidium');
    const praesidiumWithReviere = praesidien.map(praesidium => ({
      ...praesidium,
      reviere: getReviereByPraesidium(praesidium.id),
      selectedCount: getReviereByPraesidium(praesidium.id)
        .filter(r => selectedStations.includes(r.id)).length
    }));
    
    if (command.startsWith('selectPraesidium:')) {
      const praesidiumId = command.split(':')[1];
      togglePraesidiumWithReviere(praesidiumId);
    } else if (command === 'selectAllStuttgart') {
      const stuttgartPraesidien = praesidiumWithReviere.filter(p => 
        p.city.toLowerCase().includes('stuttgart')
      );
      const allIds = stuttgartPraesidien.flatMap(p => [
        p.id, 
        ...p.reviere.map(r => r.id)
      ]);
      setSelectedStations([...new Set([...selectedStations, ...allIds])]);
    }
  };

  // Weiter zum nächsten Schritt
  const handleContinue = () => {
    console.log('🚀 Continue-Button geklickt');
    console.log('📊 selectedStations:', selectedStations);
    console.log('📊 selectedCustomAddresses:', selectedCustomAddresses);
    
    const totalSelected = selectedStations.length + selectedCustomAddresses.length;
    console.log('📊 Total selected:', totalSelected);
    
    if (totalSelected === 0) {
      console.log('❌ Keine Ziele ausgewählt');
      toast.error('Bitte wählen Sie mindestens ein Ziel aus');
      announceToScreenReader('Fehler: Keine Ziele ausgewählt');
      return;
    }
    
    console.log('✅ Weiterleitung zu Step 3');
    toast.success(`${totalSelected} Ziele ausgewählt`);
    announceToScreenReader(`${totalSelected} Ziele ausgewählt - Weiter zur Routenberechnung`);
    setWizardStep(3);
  };

  return {
    // States
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    isPanelOpen,
    setIsPanelOpen,
    searchQuery,
    setSearchQuery,
    showAddForm,
    setShowAddForm,
    expandedPraesidien,
    formData,
    setFormData,
    routes,
    isLoading,
    searchInputRef,
    
    // Store data
    stations,
    selectedStations,
    selectedCustomAddresses,
    customAddresses,
    praesidiumWithReviere,
    
    // Functions
    togglePraesidiumWithReviere,
    handleStationToggle,
    togglePraesidiumExpansion,
    handleCustomToggle,
    handleAddAddress,
    handleDeleteAddress,
    handleEditAddress,
    handleContinue,
    announceToScreenReader,
    handleVoiceCommand,
    handleCommand
  };
}; 