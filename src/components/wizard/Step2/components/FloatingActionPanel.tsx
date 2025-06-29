import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface FloatingActionPanelProps {
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  isLoading: boolean;
  totalSelected: number;
  selectedStations: string[];
  selectedCustomAddresses: string[];
  stations: any[];
  customAddresses: any[];
  onStationToggle: (id: string) => void;
  onCustomToggle: (id: string) => void;
}

const FloatingActionPanel: React.FC<FloatingActionPanelProps> = ({
  isPanelOpen,
  setIsPanelOpen,
  isLoading,
  totalSelected,
  selectedStations,
  selectedCustomAddresses,
  stations,
  customAddresses,
  onStationToggle,
  onCustomToggle
}) => {
  return (
    <motion.div
      initial={{ y: 300 }}
      animate={{ y: isPanelOpen ? 0 : 240 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 240 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-t-3xl shadow-2xl z-50 border-t border-gray-200 dark:border-gray-700"
    >
      {/* Drag Handle */}
      <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 cursor-grab active:cursor-grabbing" />
      
      {/* Quick Stats */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          ) : (
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSelected}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Routen werden berechnet...' : 'Ziele ausgewählt'}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {isPanelOpen ? 'Verstecken' : 'Details'}
          </button>
        </div>
      </div>
      
      {/* Expandable Selection Preview */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div 
            className="px-6 pb-6 max-h-96 overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              Ausgewählte Ziele:
            </h3>
            <div className="space-y-2">
              {selectedStations.map(id => {
                const station = stations.find(s => s.id === id);
                return station ? (
                  <div key={id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white">{station.name}</span>
                    <button 
                      onClick={() => onStationToggle(id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null;
              })}
              {selectedCustomAddresses.map(id => {
                const address = customAddresses.find(a => a.id === id);
                return address ? (
                  <div key={id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm flex justify-between items-center">
                    <span className="text-gray-900 dark:text-white">{address.name}</span>
                    <button 
                      onClick={() => onCustomToggle(id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingActionPanel; 