// hooks/useOptimisticAddresses.ts
import { useState, useCallback } from 'react';
import { CustomAddress } from '../types';
import { toast } from 'react-hot-toast';

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  rollbackData?: CustomAddress;
}

export function useOptimisticAddresses(initialAddresses: CustomAddress[]) {
  const [addresses, setAddresses] = useState<CustomAddress[]>(initialAddresses);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());

  // Optimistisches Hinzufügen
  const optimisticAdd = useCallback(async (
    address: Omit<CustomAddress, 'id'>, 
    apiCall: () => Promise<CustomAddress>
  ) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticAddress = { ...address, id: tempId } as CustomAddress;
    
    // Sofort zur UI hinzufügen
    setAddresses(prev => [...prev, optimisticAddress]);
    setPendingUpdates(prev => new Map(prev).set(tempId, {
      id: tempId,
      type: 'create',
      timestamp: Date.now()
    }));

    try {
      // API-Call im Hintergrund
      const realAddress = await apiCall();
      
      // Temporäre ID durch echte ersetzen
      setAddresses(prev => prev.map(addr => 
        addr.id === tempId ? realAddress : addr
      ));
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });
      
      return realAddress;
    } catch (error) {
      // Bei Fehler: Rollback
      setAddresses(prev => prev.filter(addr => addr.id !== tempId));
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });
      
      toast.error('Fehler beim Hinzufügen der Adresse');
      throw error;
    }
  }, []);

  // Optimistisches Aktualisieren
  const optimisticUpdate = useCallback(async (
    id: string,
    updates: Partial<CustomAddress>,
    apiCall: () => Promise<CustomAddress>
  ) => {
    const originalAddress = addresses.find(addr => addr.id === id);
    if (!originalAddress) return;

    // Sofort in UI aktualisieren
    setAddresses(prev => prev.map(addr => 
      addr.id === id ? { ...addr, ...updates } : addr
    ));
    setPendingUpdates(prev => new Map(prev).set(id, {
      id,
      type: 'update',
      timestamp: Date.now(),
      rollbackData: originalAddress
    }));

    try {
      // API-Call im Hintergrund
      const updatedAddress = await apiCall();
      
      // Mit Server-Daten synchronisieren
      setAddresses(prev => prev.map(addr => 
        addr.id === id ? updatedAddress : addr
      ));
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
      
      return updatedAddress;
    } catch (error) {
      // Bei Fehler: Rollback
      setAddresses(prev => prev.map(addr => 
        addr.id === id ? originalAddress : addr
      ));
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
      
      toast.error('Fehler beim Aktualisieren der Adresse');
      throw error;
    }
  }, [addresses]);

  // Optimistisches Löschen
  const optimisticDelete = useCallback(async (
    id: string,
    apiCall: () => Promise<void>
  ) => {
    const originalAddress = addresses.find(addr => addr.id === id);
    if (!originalAddress) return;

    // Sofort aus UI entfernen
    setAddresses(prev => prev.filter(addr => addr.id !== id));
    setPendingUpdates(prev => new Map(prev).set(id, {
      id,
      type: 'delete',
      timestamp: Date.now(),
      rollbackData: originalAddress
    }));

    try {
      // API-Call im Hintergrund
      await apiCall();
      
      // Update erfolgreich, aus pending entfernen
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
    } catch (error) {
      // Bei Fehler: Rollback
      setAddresses(prev => [...prev, originalAddress]);
      setPendingUpdates(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
      
      toast.error('Fehler beim Löschen der Adresse');
      throw error;
    }
  }, [addresses]);

  return {
    addresses,
    pendingUpdates,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
    isPending: (id: string) => pendingUpdates.has(id)
  };
}