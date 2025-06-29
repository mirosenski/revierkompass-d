import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Target } from 'lucide-react'

interface StickyBottomBarProps {
  totalSelected: number
  onContinue: () => void
  disabled?: boolean
}

const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ totalSelected, onContinue, disabled }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 z-40 shadow-lg">
    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      {/* Linke Seite: Auswahl-Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {totalSelected} {totalSelected === 1 ? 'Ziel' : 'Ziele'} ausgewählt
          </span>
        </div>
      </div>

      {/* Rechte Seite: Weiter-Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        disabled={disabled}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium shadow-lg disabled:opacity-50 flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      >
        <span>Weiter zur Routenberechnung</span>
        <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  </div>
)

export default StickyBottomBar
