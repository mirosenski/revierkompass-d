import { Station, StationType } from '@/types/station.types'

export interface StationCardProps {
  station: Station;
  onEdit: (station: Station) => void;
  onDelete: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export interface StationModalProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: StationFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  availablePraesidien: Station[];
}

export interface StationFormData {
  name: string;
  address: string;
  city: string;
  telefon: string;
  email: string;
  coordinates: [number, number];
  type: StationType;
  notdienst24h: boolean;
  isActive: boolean;
  parentId: string;
}

export interface FilterState {
  search: string;
  city: string;
  type: 'all' | StationType;
  showInactive: boolean;
}

export const INITIAL_FORM_DATA: StationFormData = {
  name: '',
  address: '',
  city: '',
  telefon: '',
  email: '',
  coordinates: [0, 0],
  type: 'revier',
  notdienst24h: false,
  isActive: true,
  parentId: '',
}; 