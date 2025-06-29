// hooks/useAddressQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomAddress } from '../types';
import { toast } from 'react-hot-toast';

// API Service
const addressAPI = {
  fetchAll: async (): Promise<CustomAddress[]> => {
    const response = await fetch('/api/addresses');
    if (!response.ok) throw new Error('Fehler beim Laden der Adressen');
    return response.json();
  },

  fetchOne: async (id: string): Promise<CustomAddress> => {
    const response = await fetch(`/api/addresses/${id}`);
    if (!response.ok) throw new Error('Adresse nicht gefunden');
    return response.json();
  },

  create: async (address: Omit<CustomAddress, 'id'>): Promise<CustomAddress> => {
    const response = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address)
    });
    if (!response.ok) throw new Error('Fehler beim Erstellen der Adresse');
    return response.json();
  },

  update: async ({ id, ...data }: CustomAddress): Promise<CustomAddress> => {
    const response = await fetch(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Fehler beim Aktualisieren der Adresse');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/addresses/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Fehler beim Löschen der Adresse');
  }
};

// Query Keys
const queryKeys = {
  all: ['addresses'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};

// Fetch all addresses
export function useAddresses(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.list(filters || {}),
    queryFn: addressAPI.fetchAll,
    staleTime: 5 * 60 * 1000, // 5 Minuten
    gcTime: 10 * 60 * 1000, // 10 Minuten (früher cacheTime)
  });
}

// Fetch single address
export function useAddress(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => addressAPI.fetchOne(id),
    enabled: !!id,
  });
}

// Create address mutation
export function useCreateAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressAPI.create,
    onMutate: async (newAddress) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() });
      
      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData(queryKeys.lists());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.lists(), (old: CustomAddress[] = []) => [
        ...old,
        { ...newAddress, id: `temp_${Date.now()}` } as CustomAddress
      ]);
      
      return { previousAddresses };
    },
    onError: (err, newAddress, context) => {
      // Rollback on error
      if (context?.previousAddresses) {
        queryClient.setQueryData(queryKeys.lists(), context.previousAddresses);
      }
      toast.error('Fehler beim Erstellen der Adresse');
    },
    onSuccess: () => {
      toast.success('Adresse erfolgreich erstellt');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}

// Update address mutation
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressAPI.update,
    onMutate: async (updatedAddress) => {
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.detail(updatedAddress.id) 
      });
      
      const previousAddress = queryClient.getQueryData(
        queryKeys.detail(updatedAddress.id)
      );
      
      queryClient.setQueryData(
        queryKeys.detail(updatedAddress.id), 
        updatedAddress
      );
      
      return { previousAddress };
    },
    onError: (err, updatedAddress, context) => {
      if (context?.previousAddress) {
        queryClient.setQueryData(
          queryKeys.detail(updatedAddress.id),
          context.previousAddress
        );
      }
      toast.error('Fehler beim Aktualisieren der Adresse');
    },
    onSuccess: () => {
      toast.success('Adresse erfolgreich aktualisiert');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.detail(variables.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lists() 
      });
    },
  });
}

// Delete address mutation
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addressAPI.delete,
    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.lists() });
      
      const previousAddresses = queryClient.getQueryData(queryKeys.lists());
      
      queryClient.setQueryData(
        queryKeys.lists(), 
        (old: CustomAddress[] = []) => old.filter(addr => addr.id !== addressId)
      );
      
      return { previousAddresses };
    },
    onError: (err, addressId, context) => {
      if (context?.previousAddresses) {
        queryClient.setQueryData(queryKeys.lists(), context.previousAddresses);
      }
      toast.error('Fehler beim Löschen der Adresse');
    },
    onSuccess: () => {
      toast.success('Adresse erfolgreich gelöscht');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}

// Prefetch address details
export function usePrefetchAddress() {
  const queryClient = useQueryClient();
  
  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => addressAPI.fetchOne(id),
      staleTime: 10 * 1000, // 10 Sekunden
    });
  }, [queryClient]);
}