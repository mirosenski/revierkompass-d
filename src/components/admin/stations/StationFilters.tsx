import React from 'react'
import { Search, MapPin, X } from 'lucide-react'
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
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
      <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Adresse, Telefon..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm sm:text-base"
          />
        </div>

        {/* City Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
          <select
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-colors text-sm sm:text-base"
          >
            <option key="all-cities" value="">Alle Städte</option>
            {allCities.map((city, index) => (
              <option key={`city-${city}-${index}`} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Results & Clear */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {filteredStationsCount} Ergebnis{filteredStationsCount !== 1 ? 'se' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <X className="w-3 h-3" />
              Filter löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 