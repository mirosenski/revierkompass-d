// utils/offlineManager.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CustomAddress } from '../types';

interface AddressDB extends DBSchema {
  addresses: {
    key: string;
    value: CustomAddress & {
      syncStatus: 'synced' | 'pending' | 'error';
      lastModified: number;
    };
    indexes: { 'by-sync-status': string };
  };
  pendingOperations: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retries: number;
    };
  };
}

export class OfflineManager {
  private static db: IDBPDatabase<AddressDB> | null = null;
  private static readonly DB_NAME = 'revierkompass-offline';
  private static readonly DB_VERSION = 1;

  static async initDB(): Promise<void> {
    this.db = await openDB<AddressDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Addresses store
        if (!db.objectStoreNames.contains('addresses')) {
          const addressStore = db.createObjectStore('addresses', { keyPath: 'id' });
          addressStore.createIndex('by-sync-status', 'syncStatus');
        }
        
        // Pending operations store
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }
      },
    });
  }

  // Speichere Adresse offline
  static async saveAddressOffline(address: CustomAddress): Promise<void> {
    if (!this.db) await this.initDB();
    
    await this.db!.put('addresses', {
      ...address,
      syncStatus: navigator.onLine ? 'synced' : 'pending',
      lastModified: Date.now()
    });
  }

  // Hole alle offline Adressen
  static async getOfflineAddresses(): Promise<CustomAddress[]> {
    if (!this.db) await this.initDB();
    
    const addresses = await this.db!.getAll('addresses');
    return addresses.map(({ syncStatus, lastModified, ...address }) => address);
  }

  // Speichere pending Operation
  static async addPendingOperation(
    type: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.db) await this.initDB();
    
    const operation = {
      id: `op_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    await this.db!.add('pendingOperations', operation);
  }

  // Synchronisiere pending Operations
  static async syncPendingOperations(): Promise<{
    successful: number;
    failed: number;
  }> {
    if (!this.db) await this.initDB();
    if (!navigator.onLine) return { successful: 0, failed: 0 };
    
    const operations = await this.db!.getAll('pendingOperations');
    let successful = 0;
    let failed = 0;
    
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create':
            await fetch('/api/addresses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data)
            });
            break;
            
          case 'update':
            await fetch(`/api/addresses/${op.data.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(op.data)
            });
            break;
            
          case 'delete':
            await fetch(`/api/addresses/${op.data.id}`, {
              method: 'DELETE'
            });
            break;
        }
        
        // Operation erfolgreich - löschen
        await this.db!.delete('pendingOperations', op.id);
        successful++;
      } catch (error) {
        // Retry counter erhöhen
        op.retries++;
        if (op.retries > 3) {
          // Nach 3 Versuchen als Fehler markieren
          await this.db!.delete('pendingOperations', op.id);
          failed++;
        } else {
          await this.db!.put('pendingOperations', op);
        }
      }
    }
    
    return { successful, failed };
  }

  // Cache-Größe prüfen
  static async getCacheSize(): Promise<{
    addresses: number;
    pendingOps: number;
    totalSizeMB: number;
  }> {
    if (!this.db) await this.initDB();
    
    const addresses = await this.db!.count('addresses');
    const pendingOps = await this.db!.count('pendingOperations');
    
    // Geschätzte Größe (durchschnittlich 1KB pro Eintrag)
    const totalSizeMB = ((addresses + pendingOps) * 1024) / (1024 * 1024);
    
    return { addresses, pendingOps, totalSizeMB };
  }

  // Cache leeren
  static async clearCache(): Promise<void> {
    if (!this.db) await this.initDB();
    
    await this.db!.clear('addresses');
    await this.db!.clear('pendingOperations');
  }
}

// hooks/useOffline.ts
import { useEffect, useState, useCallback } from 'react';
import { OfflineManager } from '../utils/offlineManager';
import { toast } from 'react-hot-toast';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Wieder online - synchronisiere Daten...');
      syncData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline - Änderungen werden lokal gespeichert');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial sync
    if (navigator.onLine) {
      syncData();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = useCallback(async () => {
    try {
      const result = await OfflineManager.syncPendingOperations();
      
      if (result.successful > 0) {
        toast.success(`${result.successful} Änderungen synchronisiert`);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} Änderungen konnten nicht synchronisiert werden`);
      }
      
      setPendingSync(0);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, []);

  const checkPendingOperations = useCallback(async () => {
    const { pendingOps } = await OfflineManager.getCacheSize();
    setPendingSync(pendingOps);
  }, []);

  useEffect(() => {
    checkPendingOperations();
    const interval = setInterval(checkPendingOperations, 30000); // Alle 30 Sekunden
    return () => clearInterval(interval);
  }, [checkPendingOperations]);

  return {
    isOnline,
    pendingSync,
    syncData,
    clearCache: OfflineManager.clearCache
  };
}