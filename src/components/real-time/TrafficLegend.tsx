import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Info,
  X
} from 'lucide-react';
import { TRAFFIC_LEVELS, TrafficLevel } from '@/lib/services/real-time-traffic-service';
import { cn } from '@/lib/utils';

interface TrafficLegendProps {
  onClose?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const TrafficLegend: React.FC<TrafficLegendProps> = ({
  onClose,
  className,
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(showDetails);

  const trafficLevels = Object.values(TRAFFIC_LEVELS);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Verkehrssituation
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Info className="h-4 w-4" />
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

      {/* Traffic Levels */}
      <div className="p-3">
        <div className="space-y-2">
          {trafficLevels.map((level) => (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: level.level * 0.1 }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Color Indicator */}
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                  style={{ backgroundColor: level.color }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: level.level * 0.5
                  }}
                />
                
                {/* Icon */}
                {level.icon && (
                  <span className="text-lg">{level.icon}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {level.name}
                  </h4>
                  
                  {/* Speed Indicator */}
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getSpeedRange(level.level)}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {level.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-3 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Daten werden alle 30 Sekunden aktualisiert</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Klicken Sie auf Verkehrssegmente für Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <div className="font-medium text-blue-800 dark:text-blue-200">Datenquelle</div>
                  <div className="text-blue-600 dark:text-blue-300">Echtzeit-API</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <div className="font-medium text-green-800 dark:text-green-200">Aktualität</div>
                  <div className="text-green-600 dark:text-green-300">&lt; 5 Min</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Indicator */}
      <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <span className="text-xs font-medium text-green-800 dark:text-green-200">
            Live-Verkehrsdaten aktiv
          </span>
        </div>
      </div>
    </motion.div>
  );
};

function getSpeedRange(level: TrafficLevel): string {
  switch (level) {
    case TrafficLevel.FREE:
      return '80-120 km/h';
    case TrafficLevel.SLOW:
      return '40-80 km/h';
    case TrafficLevel.CONGESTED:
      return '10-40 km/h';
    case TrafficLevel.BLOCKED:
      return '0-10 km/h';
    default:
      return 'Unbekannt';
  }
}

// Compact Version für Toolbar
export const TrafficLegendCompact: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      
      <div className="flex items-center space-x-1">
        {Object.values(TRAFFIC_LEVELS).map((level) => (
          <motion.div
            key={level.level}
            className="w-3 h-3 rounded-full border border-white dark:border-gray-800"
            style={{ backgroundColor: level.color }}
            title={`${level.name}: ${level.description}`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>
      
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-1.5 h-1.5 bg-green-500 rounded-full"
      />
    </motion.div>
  );
}; 