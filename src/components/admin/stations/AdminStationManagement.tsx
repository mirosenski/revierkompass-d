import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Building2, AlertTriangle, MapPin, BarChart3, Settings, Database, List, Grid3X3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminStore } from '@/lib/store/admin-store'
import { Station } from '@/types/station.types'
import { FilterState } from './types'
import { LoadingSpinner } from './LoadingSpinner'
import { StationCard } from './StationCard'
import { CompactStationList } from './CompactStationList'
import { StationModal } from './StationModal'
import { StationFilters } from './StationFilters'
import { createAllAalenAddresses } from '@/data/aalen-addresses'
import { createAllFreiburgAddresses } from '@/data/freiburg-addresses'
import { createAllHeilbronnAddresses } from '@/data/heilbronn-addresses'
import { createAllKarlsruheAddresses } from '@/data/karlsruhe-addresses'
import { createAllKonstanzAddresses } from '@/data/konstanz-addresses'
import { createAllLudwigsburgAddresses } from '@/data/ludwigsburg-addresses'
import { createAllMannheimAddresses } from '@/data/mannheim-addresses'
import { createAllOffenburgAddresses } from '@/data/offenburg-addresses'
import { createAllPforzheimAddresses } from '@/data/pforzheim-addresses'
import { createAllRavensburgAddresses } from '@/data/ravensburg-addresses'
import { createAllReutlingenAddresses } from '@/data/reutlingen-addresses'
import { createAllStuttgartAddresses } from '@/data/stuttgart-addresses'
import { createAllUlmAddresses } from '@/data/ulm-addresses'
import { createAllEinsatzAddresses } from '@/data/einsatz-addresses'

// ===== MAIN COMPONENT =====
const AdminStationManagement: React.FC = () => {
  const {
    allStations: stations,
    filteredStations,
    isLoading,
    error,
    loadStations,
    addStation,
    updateStation,
    deleteStation,
    setSearchQuery,
    setCityFilter,
    setTypeFilter,
    clearSelection
  } = useAdminStore();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    city: '',
    showInactive: false
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [expandedPresidia, setExpandedPresidia] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [isAalenImporting, setIsAalenImporting] = useState(false);
  const [isFreiburgImporting, setIsFreiburgImporting] = useState(false);
  const [isHeilbronnImporting, setIsHeilbronnImporting] = useState(false);
  const [isKarlsruheImporting, setIsKarlsruheImporting] = useState(false);
  const [isKonstanzImporting, setIsKonstanzImporting] = useState(false);
  const [isLudwigsburgImporting, setIsLudwigsburgImporting] = useState(false);
  const [isMannheimImporting, setIsMannheimImporting] = useState(false);
  const [isOffenburgImporting, setIsOffenburgImporting] = useState(false);
  const [isPforzheimImporting, setIsPforzheimImporting] = useState(false);
  const [isRavensburgImporting, setIsRavensburgImporting] = useState(false);
  const [isReutlingenImporting, setIsReutlingenImporting] = useState(false);
  const [isStuttgartImporting, setIsStuttgartImporting] = useState(false);
  const [isUlmImporting, setIsUlmImporting] = useState(false);
  const [isEinsatzImporting, setIsEinsatzImporting] = useState(false);

  // Navigation tabs
  const navigationTabs = [
    { id: 'stations', label: 'Stationen', icon: Building2, active: true },
    { id: 'addresses', label: 'Adressen', icon: MapPin, active: false },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, active: false },
    { id: 'settings', label: 'Einstellungen', icon: Settings, active: false }
  ];

  // Load stations on mount
  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Filter stations based on search
  const debouncedSearch = useDebounce(filters.search, 300);
  useEffect(() => {
    setSearchQuery(debouncedSearch || '');
  }, [debouncedSearch, setSearchQuery]);

  // Filter stations based on city
  useEffect(() => {
    setCityFilter(filters.city || '');
  }, [filters.city, setCityFilter]);

  // Get all cities for filter dropdown
  const allCities = useMemo(() => {
    const cities = new Set(stations.map(s => s.city));
    return Array.from(cities).sort();
  }, [stations]);

  // Get available Präsidien for parent selection
  const availablePraesidien = useMemo(() => {
    return stations.filter(s => s.type === 'praesidium' && s.isActive);
  }, [stations]);

  // Get Reviere for a specific Präsidium
  const getReviere = useCallback((praesidiumId: string) => {
    return stations.filter(s => s.type === 'revier' && s.parentId === praesidiumId);
  }, [stations]);

  // Handle filter changes
  const handleFilterChange = useCallback((field: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      city: '',
      showInactive: false
    });
    // Also clear store filters
    setSearchQuery('');
    setCityFilter('');
  }, [setSearchQuery, setCityFilter]);

  // Handle station creation
  const handleCreateStation = useCallback(() => {
    setEditingStation(null);
    setIsModalOpen(true);
  }, []);

  // Handle station editing
  const handleEditStation = useCallback((station: Station) => {
    setEditingStation(station);
    setIsModalOpen(true);
  }, []);

  // Handle station deletion
  const handleDeleteStation = useCallback(async (id: string) => {
    try {
      await deleteStation(id);
      toast.success('Station erfolgreich gelöscht');
    } catch (err) {
      console.error('❌ Fehler beim Löschen:', err);
      toast.error('Fehler beim Löschen der Station');
    }
  }, [deleteStation]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingStation(null);
  }, []);

  // Handle station save
  const handleSaveStation = useCallback(async (formData: any) => {
    try {
      if (editingStation) {
        await updateStation(editingStation.id, formData);
      } else {
        await addStation(formData);
      }
      handleCloseModal();
    } catch (err) {
      console.error('❌ Fehler beim Speichern:', err);
      throw err;
    }
  }, [editingStation, updateStation, addStation, handleCloseModal]);

  // Toggle Präsidium expansion
  const togglePraesidiumExpansion = useCallback((praesidiumId: string) => {
    setExpandedPresidia(prev => {
      const newSet = new Set(prev);
      if (newSet.has(praesidiumId)) {
        newSet.delete(praesidiumId);
      } else {
        newSet.add(praesidiumId);
      }
      return newSet;
    });
  }, []);

  // Expand all Präsidien
  const expandAllPraesidien = useCallback(() => {
    const allPraesidienIds = filteredStations
      .filter(s => s.type === 'praesidium')
      .map(s => s.id);
    setExpandedPresidia(new Set(allPraesidienIds));
  }, [filteredStations]);

  // Collapse all Präsidien
  const collapseAllPraesidien = useCallback(() => {
    setExpandedPresidia(new Set());
  }, []);

  const handleAalenImport = useCallback(async () => {
    setIsAalenImporting(true);
    try {
      const createdCount = await createAllAalenAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Aalen-Import:', error);
    } finally {
      setIsAalenImporting(false);
    }
  }, [loadStations]);

  const handleFreiburgImport = useCallback(async () => {
    setIsFreiburgImporting(true);
    try {
      const createdCount = await createAllFreiburgAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Freiburg-Import:', error);
    } finally {
      setIsFreiburgImporting(false);
    }
  }, [loadStations]);

  const handleHeilbronnImport = useCallback(async () => {
    setIsHeilbronnImporting(true);
    try {
      const createdCount = await createAllHeilbronnAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Heilbronn-Import:', error);
    } finally {
      setIsHeilbronnImporting(false);
    }
  }, [loadStations]);

  const handleKarlsruheImport = useCallback(async () => {
    setIsKarlsruheImporting(true);
    try {
      const createdCount = await createAllKarlsruheAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Karlsruhe-Import:', error);
    } finally {
      setIsKarlsruheImporting(false);
    }
  }, [loadStations]);

  const handleKonstanzImport = useCallback(async () => {
    setIsKonstanzImporting(true);
    try {
      const createdCount = await createAllKonstanzAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Konstanz-Import:', error);
    } finally {
      setIsKonstanzImporting(false);
    }
  }, [loadStations]);

  const handleLudwigsburgImport = useCallback(async () => {
    setIsLudwigsburgImporting(true);
    try {
      const createdCount = await createAllLudwigsburgAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Ludwigsburg-Import:', error);
    } finally {
      setIsLudwigsburgImporting(false);
    }
  }, [loadStations]);

  const handleMannheimImport = useCallback(async () => {
    setIsMannheimImporting(true);
    try {
      const createdCount = await createAllMannheimAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Mannheim-Import:', error);
    } finally {
      setIsMannheimImporting(false);
    }
  }, [loadStations]);

  const handleOffenburgImport = useCallback(async () => {
    setIsOffenburgImporting(true);
    try {
      const createdCount = await createAllOffenburgAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Offenburg-Import:', error);
    } finally {
      setIsOffenburgImporting(false);
    }
  }, [loadStations]);

  const handlePforzheimImport = useCallback(async () => {
    setIsPforzheimImporting(true);
    try {
      const createdCount = await createAllPforzheimAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Pforzheim-Import:', error);
    } finally {
      setIsPforzheimImporting(false);
    }
  }, [loadStations]);

  const handleRavensburgImport = useCallback(async () => {
    setIsRavensburgImporting(true);
    try {
      const createdCount = await createAllRavensburgAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Ravensburg-Import:', error);
    } finally {
      setIsRavensburgImporting(false);
    }
  }, [loadStations]);

  const handleReutlingenImport = useCallback(async () => {
    setIsReutlingenImporting(true);
    try {
      const createdCount = await createAllReutlingenAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Reutlingen-Import:', error);
    } finally {
      setIsReutlingenImporting(false);
    }
  }, [loadStations]);

  const handleStuttgartImport = useCallback(async () => {
    setIsStuttgartImporting(true);
    try {
      const createdCount = await createAllStuttgartAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Stuttgart-Import:', error);
    } finally {
      setIsStuttgartImporting(false);
    }
  }, [loadStations]);

  const handleUlmImport = useCallback(async () => {
    setIsUlmImporting(true);
    try {
      const createdCount = await createAllUlmAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Ulm-Import:', error);
    } finally {
      setIsUlmImporting(false);
    }
  }, [loadStations]);

  const handleEinsatzImport = useCallback(async () => {
    setIsEinsatzImporting(true);
    try {
      const createdCount = await createAllEinsatzAddresses();
      if (createdCount > 0) {
        await loadStations();
      }
    } catch (error) {
      console.error('Fehler beim Einsatz-Import:', error);
    } finally {
      setIsEinsatzImporting(false);
    }
  }, [loadStations]);

  // Loading State
  if (isLoading && stations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Stationen werden geladen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && stations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Fehler beim Laden
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim() !== '') || 
    (filters.city && filters.city.trim() !== '')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Stationen verwalten
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                {filteredStations.length} von {stations.length} Stationen
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer bg-white/50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={filters.showInactive}
                  onChange={(e) => handleFilterChange('showInactive', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span>Inaktive anzeigen</span>
              </label>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/50 dark:bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'cards'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  title="Karten-Ansicht"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'compact'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  title="Listen-Ansicht"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleCreateStation}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm sm:text-base font-medium"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Neue Station</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <StationFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          allCities={allCities}
          hasActiveFilters={hasActiveFilters}
          filteredStationsCount={filteredStations.length}
        />
      </div>

      {/* Station Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
        {stations.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4">
              <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Stationen gefunden
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">
              {hasActiveFilters 
                ? 'Versuchen Sie, die Filter anzupassen oder zu löschen.' 
                : 'Erstellen Sie Ihre erste Station.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm sm:text-base"
              >
                Filter löschen
              </button>
            ) : (
              <button
                onClick={handleCreateStation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Erste Station erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {viewMode === 'cards' ? (
              // Karten-Ansicht
              <>
                {/* Expand/Collapse Controls */}
                <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Präsidien verwalten
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={expandAllPraesidien}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors text-xs font-medium"
                      title="Alle Präsidien ausklappen"
                    >
                      <span>Alle ausklappen</span>
                    </button>
                    <button
                      onClick={collapseAllPraesidien}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium"
                      title="Alle Präsidien schließen"
                    >
                      <span>Alle schließen</span>
                    </button>
                  </div>
                </div>
                
                {/* Zeige alle Präsidien an */}
                {filteredStations
                  .filter(s => s.type === 'praesidium')
                  .map((praesidium) => {
                    const allReviere = getReviere(praesidium.id);
                    
                    return (
                      <div key={praesidium.id} className="animate-in fade-in-50 duration-200">
                        <StationCard
                          station={praesidium}
                          onEdit={handleEditStation}
                          onDelete={handleDeleteStation}
                          isExpanded={expandedPresidia.has(praesidium.id)}
                          onToggle={() => togglePraesidiumExpansion(praesidium.id)}
                        >
                          {expandedPresidia.has(praesidium.id) && allReviere.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/50">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Reviere ({allReviere.length})
                                </h4>
                                {allReviere.map((revier) => (
                                  <StationCard
                                    key={revier.id}
                                    station={revier}
                                    onEdit={handleEditStation}
                                    onDelete={handleDeleteStation}
                                    isExpanded={false}
                                    onToggle={() => {}}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </StationCard>
                      </div>
                    );
                  })}
              </>
            ) : (
              // Kompakte Listen-Ansicht
              <div className="space-y-4">
                {/* Präsidien */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Polizeipräsidien ({filteredStations.filter(s => s.type === 'praesidium').length})
                  </h3>
                  <CompactStationList
                    stations={filteredStations.filter(s => s.type === 'praesidium')}
                    onEdit={handleEditStation}
                    onDelete={handleDeleteStation}
                    className="space-y-2"
                  />
                </div>
                
                {/* Reviere */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Polizeireviere ({filteredStations.filter(s => s.type === 'revier').length})
                  </h3>
                  <CompactStationList
                    stations={filteredStations.filter(s => s.type === 'revier')}
                    onEdit={handleEditStation}
                    onDelete={handleDeleteStation}
                    className="space-y-2"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <StationModal
        station={editingStation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStation}
        isLoading={isLoading}
        error={error}
        availablePraesidien={availablePraesidien}
      />
    </div>
  );
};

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default AdminStationManagement; 