import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { ViewSwitcherProps } from '../types';

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ activeView, setActiveView }) => (
  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex space-x-1">
    {['grid', 'list', 'compact', 'map'].map((view, i) => (
      <button
        key={view}
        className={`p-2 rounded-md transition-all ${
          activeView === view 
            ? 'bg-white dark:bg-gray-800 shadow text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveView(view as any)}
        aria-label={`${view} view`}
        title={`${view === 'grid' ? 'Raster' : view === 'list' ? 'Liste' : view === 'compact' ? 'Kompakt' : 'Karte'} Ansicht`}
      >
        {view === 'grid' && <LayoutGrid className="h-5 w-5" />}
        {view === 'list' && <LayoutList className="h-5 w-5" />}
        {view === 'compact' && <div className="h-5 w-5 grid grid-cols-3 gap-0.5">
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
          <div className="bg-current rounded-sm" />
        </div>}
        {view === 'map' && <div className="h-5 w-5 bg-current rounded-full" />}
      </button>
    ))}
  </div>
);

export default ViewSwitcher; 