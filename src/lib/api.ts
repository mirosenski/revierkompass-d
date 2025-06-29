// API Client für Vercel Serverless Functions

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api' 
  : '/api';

export interface PoliceStation {
  id: string;
  name: string;
  type: string;
  city: string;
  address?: string;
  coordinates?: [number, number];
  telefon?: string;
  email?: string;
  notdienst24h: boolean;
  isActive: boolean;
  parentId?: string;
  lastModified: string;
}

export interface CreateStationData {
  name: string;
  type: string;
  city: string;
  address?: string;
  coordinates?: [number, number];
  telefon?: string;
  email?: string;
  notdienst24h?: boolean;
  isActive?: boolean;
  parentId?: string;
}

export interface UpdateStationData extends Partial<CreateStationData> {}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  
  return response.json();
}

export const api = {
  // Health Check
  health: async () => {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; timestamp: string; version: string }>(response);
  },

  // Stationen API
  stations: {
    // Alle Stationen abrufen
    getAll: async (): Promise<PoliceStation[]> => {
      const response = await fetch(`${API_BASE}/stationen`);
      return handleResponse<PoliceStation[]>(response);
    },

    // Einzelne Station abrufen
    getById: async (id: string): Promise<PoliceStation> => {
      const response = await fetch(`${API_BASE}/stationen/${id}`);
      return handleResponse<PoliceStation>(response);
    },

    // Neue Station erstellen
    create: async (data: CreateStationData): Promise<PoliceStation> => {
      const response = await fetch(`${API_BASE}/stationen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<PoliceStation>(response);
    },

    // Station aktualisieren
    update: async (id: string, data: UpdateStationData): Promise<PoliceStation> => {
      const response = await fetch(`${API_BASE}/stationen/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<PoliceStation>(response);
    },

    // Station löschen
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/stationen/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }
    },
  },
};

// React Query Hooks (falls @tanstack/react-query verwendet wird)
export const useStations = () => {
  // Implementierung für React Query
  return {
    queryKey: ['stations'],
    queryFn: api.stations.getAll,
  };
};

export const useStation = (id: string) => {
  return {
    queryKey: ['station', id],
    queryFn: () => api.stations.getById(id),
    enabled: !!id,
  };
};

export { ApiError }; 