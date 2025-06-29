import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PraesidiumCardProps } from '../types';
import { animationVariants } from '../animations/variants';

const PraesidiumCard: React.FC<PraesidiumCardProps> = ({
  praesidium,
  onToggle,
  onExpand,
  onStationToggle,
  selectedStations,
  viewMode,
  expandedPraesidien
}) => {
  const isSelected = selectedStations.includes(praesidium.id);
  const selectedReviere = praesidium.reviere.filter(r => selectedStations.includes(r.id));

  return (
    <motion.div
      variants={animationVariants.card}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={`p-6 rounded-xl border transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
      }`}
      onClick={() => onToggle(praesidium.id)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Building className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {praesidium.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {praesidium.address}
            </p>
            {praesidium.telefon && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {praesidium.telefon}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {praesidium.selectedCount > 0 && (
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {praesidium.selectedCount}/{praesidium.reviere.length}
            </div>
          )}
          <CheckCircle2 className={`h-6 w-6 transition-colors ${
            isSelected ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'
          }`} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <ChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedPraesidien.has(praesidium.id) ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>
      </div>
      
      {viewMode === 'list' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Auswahl-Fortschritt</span>
            <span>{selectedReviere.length}/{praesidium.reviere.length}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedReviere.length / praesidium.reviere.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <AnimatePresence>
          {expandedPraesidien.has(praesidium.id) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {praesidium.reviere.map(revier => (
                <div 
                  key={revier.id}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    selectedStations.includes(revier.id)
                      ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStationToggle(revier.id);
                  }}
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium">{revier.name}</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {revier.address}
                    </p>
                    {revier.telefon && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {revier.telefon}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className={`h-5 w-5 transition-colors ${
                    selectedStations.includes(revier.id) 
                      ? 'text-blue-500' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default PraesidiumCard; 