import React from 'react'
import { Search, MapPin, Filter } from 'lucide-react'
import { FilterState } from './types'

interface StationFiltersProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  allCities: string[];
  hasActiveFilters: boolean;
  filteredStationsCount: number;
}

export const StationFilters: React.FC<StationFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  allCities,
  hasActiveFilters,
  filteredStationsCount
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Adresse, Telefon..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* City Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-colors"
          >
            <option key="all-cities" value="">Alle Städte</option>
            {allCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-colors"
          >
            <option key="all" value="all">Alle Typen</option>
            <option key="praesidium" value="praesidium">Präsidium</option>
            <option key="revier" value="revier">Revier</option>
          </select>
        </div>

        {/* Results & Clear */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {filteredStationsCount} Ergebnis{filteredStationsCount !== 1 ? 'se' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Filter löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 