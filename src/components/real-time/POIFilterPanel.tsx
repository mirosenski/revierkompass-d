import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Search,
  Settings
} from 'lucide-react';
import { POICategory, POI_CATEGORIES, POIFilter } from '@/lib/services/poi-streaming-service';
import { cn } from '@/lib/utils';

interface POIFilterPanelProps {
  filter: POIFilter;
  onFilterChange: (filter: POIFilter) => void;
  onClose?: () => void;
  className?: string;
}

export const POIFilterPanel: React.FC<POIFilterPanelProps> = ({
  filter,
  onFilterChange,
  onClose,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (category: POICategory) => {
    const newCategories = filter.categories.includes(category)
      ? filter.categories.filter(c => c !== category)
      : [...filter.categories, category];

    onFilterChange({
      ...filter,
      categories: newCategories
    });
  };

  const selectAll = () => {
    onFilterChange({
      ...filter,
      categories: Object.values(POICategory)
    });
  };

  const clearAll = () => {
    onFilterChange({
      ...filter,
      categories: []
    });
  };

  const filteredCategories = Object.entries(POI_CATEGORIES).filter(([key, config]) =>
    config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = filter.categories.length;
  const totalCount = Object.keys(POI_CATEGORIES).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            POI-Filter
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({selectedCount}/{totalCount})
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </motion.button>
          
          {onClose && (
            <motion.button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="POI-Kategorien suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <motion.button
          onClick={selectAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Alle auswählen
        </motion.button>
        
        <motion.button
          onClick={clearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Alle abwählen
        </motion.button>
      </div>

      {/* Categories */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {filteredCategories.map(([key, config]) => {
                const category = key as POICategory;
                const isSelected = filter.categories.includes(category);
                
                return (
                  <motion.div
                    key={category}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{config.icon}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {config.name}
                        </h4>
                        <motion.div
                          animate={{ scale: isSelected ? 1 : 0.8 }}
                          className={cn(
                            'w-4 h-4 rounded-full border-2 transition-colors',
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 dark:border-gray-600'
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full bg-white rounded-full"
                            />
                          )}
                        </motion.div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {config.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredCategories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine POI-Kategorien gefunden</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Categories Preview */}
      {!isExpanded && selectedCount > 0 && (
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {filter.categories.slice(0, 3).map(category => {
              const config = POI_CATEGORIES[category];
              return (
                <motion.span
                  key={category}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </motion.span>
              );
            })}
            {selectedCount > 3 && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                +{selectedCount - 3} weitere
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}; 