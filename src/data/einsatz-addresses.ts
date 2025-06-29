export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const einsatzAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Einsatz',
    address: 'Heininger Straße 100',
    city: 'Göppingen',
    coordinates: [48.6895433, 9.6719037],
    type: 'praesidium',
    telefon: '07161 616-0',
  },
];

export const createAllEinsatzAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    const loadingToast = toast.loading('Erstelle Einsatz-Stationen...');

    // Erstelle das Präsidium
    const praesidium = einsatzAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'einsatz.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Einsatz-Stationen... (${createdCount}/${einsatzAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Einsatz erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Einsatz-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 