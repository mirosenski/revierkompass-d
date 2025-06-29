// Step2 Types
export interface Revier {
  id: string;
  name: string;
  address: string;
  telefon?: string;
}

export interface Praesidium {
  id: string;
  name: string;
  address: string;
  city: string;
  telefon?: string;
  reviere: Revier[];
  selectedCount: number;
}

export interface PraesidiumCardProps {
  praesidium: Praesidium;
  onToggle: (id: string) => void;
  onExpand: () => void;
  onStationToggle: (id: string) => void;
  selectedStations: string[];
  viewMode: 'grid' | 'list' | 'compact' | 'map';
  expandedPraesidien: Set<string>;
}

export interface ViewSwitcherProps {
  activeView: 'grid' | 'list' | 'compact' | 'map';
  setActiveView: (view: 'grid' | 'list' | 'compact' | 'map') => void;
}

export interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export interface CommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  praesidien: any[];
}

export interface CommandItemProps {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}

export interface FormData {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  addressType: 'temporary' | 'permanent';
  parentId?: string; // Für permanente Adressen: Zugehörigkeit zu Präsidium
} 