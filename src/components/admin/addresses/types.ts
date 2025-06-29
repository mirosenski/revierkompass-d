export interface AddressFilterState {
  search: string;
  city: string;
  status: 'all' | 'pending' | 'approved' | 'rejected';
  showInactive: boolean;
}

export interface AddressModalProps {
  address: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: any) => void;
  isLoading?: boolean;
  error?: string | null;
  availablePraesidien?: any[];
}

export interface AddressCardProps {
  address: any;
  onEdit?: (address: any) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onConvertToStation?: (address: any) => void;
  currentUser?: {
    id: string;
    role: string;
  } | null;
  checked?: boolean;
  onCheck?: (id: string, checked: boolean) => void;
}

export interface AddressFiltersProps {
  filters: AddressFilterState;
  onFilterChange: (field: keyof AddressFilterState, value: any) => void;
  onClearFilters: () => void;
  allCities: string[];
  hasActiveFilters: boolean;
  filteredAddressesCount: number;
  activeTab?: 'station' | 'user' | 'temporary';
} 