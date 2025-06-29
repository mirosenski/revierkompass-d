import React, { useCallback } from 'react'
import { Edit2, Trash2, ChevronDown, ChevronRight, MapPin, Phone, Mail, Clock, Building2, X, Check } from 'lucide-react'
import { StationCardProps } from './types'

export const StationCard: React.FC<StationCardProps> = React.memo(({ 
  station, 
  onEdit, 
  onDelete, 
  isExpanded, 
  onToggle, 
  children 
}) => {
  const isPraesidium = station.type === 'praesidium';
  
  const handleEdit = useCallback(() => {
    onEdit(station);
  }, [station, onEdit]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Möchten Sie "${station.name}" wirklich löschen?`)) {
      onDelete(station.id);
    }
  }, [station.name, station.id, onDelete]);

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
      isPraesidium 
        ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 shadow-md ml-4 md:ml-8'
    } hover:shadow-xl hover:scale-[1.01] border border-gray-200/50 dark:border-gray-600/50`}>
      
      {/* Status Badges */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {station.notdienst24h && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 shadow-sm">
            <Clock className="w-3 h-3" />
            24h
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
          station.isActive 
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {station.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {station.isActive ? 'Aktiv' : 'Inaktiv'}
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {isPraesidium && (
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={isExpanded ? 'Reviere ausblenden' : 'Reviere anzeigen'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? 
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                }
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="truncate">{station.name}</span>
              </h3>
              <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-lg text-xs font-medium ${
                isPraesidium 
                  ? 'bg-blue-200 dark:bg-blue-800/50 text-blue-900 dark:text-blue-200'
                  : 'bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-200'
              }`}>
                {isPraesidium ? 'Präsidium' : 'Revier'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{station.address}, {station.city}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a 
              href={`tel:${station.telefon}`} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
              title={station.telefon}
            >
              {station.telefon}
            </a>
          </div>
          {station.email && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 md:col-span-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a 
                href={`mailto:${station.email}`} 
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                title={station.email}
              >
                {station.email}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={`${station.name} bearbeiten`}
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Bearbeiten</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`${station.name} löschen`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {children}
    </div>
  );
});

StationCard.displayName = 'StationCard'; 