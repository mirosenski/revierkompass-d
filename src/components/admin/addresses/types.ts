import type { Address } from "@/services/api/admin-address.service";

export interface AddressFilterState {
	search: string;
	city: string;
	status: "all" | "pending" | "approved" | "rejected";
	showInactive: boolean;
}

export interface StationData {
	type: "praesidium" | "revier";
	parentId: string;
	telefon: string;
	email: string;
	notdienst24h: boolean;
	isActive: boolean;
}

export interface Praesidium {
	id: string;
	name: string;
	city?: string;
	street?: string;
	zipCode?: string;
	// Weitere Felder können hier hinzugefügt werden
}

export interface AddressFormData {
	name: string;
	street: string;
	zipCode: string;
	city: string;
	coordinates: [number, number];
	isVerified: boolean;
	isActive: boolean;
	reviewStatus: "pending" | "approved" | "rejected";
	parentId: string;
	addressType: "temporary" | "permanent";
}

export interface AddressModalProps {
	address: Address | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (addressData: AddressFormData) => void;
	isLoading?: boolean;
	error?: string | null;
	availablePraesidien?: Address[];
}

export interface AddressCardProps {
	address: Address;
	onEdit?: (address: Address) => void;
	onDelete?: (id: string) => void;
	onApprove?: (id: string) => void;
	onReject?: (id: string) => void;
	onConvertToStation?: (address: Address) => void;
	currentUser?: {
		id: string;
		role: string;
	} | null;
	checked?: boolean;
	onCheck?: (id: string, checked: boolean) => void;
}

export interface AddressFiltersProps {
	filters: AddressFilterState;
	onFilterChange: (
		field: keyof AddressFilterState,
		value: string | boolean,
	) => void;
	onClearFilters: () => void;
	allCities: string[];
	hasActiveFilters: boolean;
	filteredAddressesCount: number;
	activeTab?: "station" | "user" | "temporary";
}
