import React from 'react';
import { Search, Mic, Command } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onVoiceCommand: () => void;
  onCommand: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onVoiceCommand,
  onCommand
}) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-400 dark:focus-within:ring-blue-500">
        {/* Search Icon */}
        <div className="absolute left-5 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors duration-200">
          <Search className="h-5 w-5" />
        </div>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Suchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 pl-14 pr-4 py-4 bg-transparent text-gray-900 dark:text-white placeholder:text-base placeholder:font-normal placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-lg transition-all duration-200"
        />
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pr-4">
          {/* Voice Command Button */}
          <button
            onClick={onVoiceCommand}
            className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group relative focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
            title="Sprachsteuerung aktivieren"
          >
            <Mic className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="sr-only">Sprachsteuerung</span>
          </button>
          {/* Command Button */}
          <button
            onClick={onCommand}
            className="p-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group relative focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-500"
            title="Befehle öffnen (⌘+K)"
          >
            <Command className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="sr-only">Befehle</span>
          </button>
        </div>
      </div>
      {/* Search Suggestions (optional, kann später animiert werden) */}
      {searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-10 animate-fade-in">
          <div className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Suche nach: "{searchQuery}"
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Drücken Sie Enter für eine vollständige Suche
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 