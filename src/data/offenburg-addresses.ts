export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const offenburgAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Offenburg',
    address: 'Prinz-Eugen-Straße 78',
    city: 'Offenburg',
    coordinates: [48.47991, 7.95363],
    type: 'praesidium',
    telefon: '0781 21-0',
  },
  {
    name: 'Polizeirevier Achern/Oberkirch',
    address: 'Hauptstraße 105',
    city: 'Achern',
    coordinates: [48.628941, 8.079465],
    type: 'revier',
    telefon: '07841 7066-0',
  },
  {
    name: 'Polizeirevier Baden-Baden',
    address: 'Gutenbergstraße 15',
    city: 'Baden-Baden',
    coordinates: [48.77683, 8.21775],
    type: 'revier',
    telefon: '07221 680-0',
  },
  {
    name: 'Polizeirevier Bühl',
    address: 'Hauptstraße 91',
    city: 'Bühl',
    coordinates: [48.6983699, 8.1376917],
    type: 'revier',
    telefon: '07223 99097-0',
  },
  {
    name: 'Polizeirevier Gaggenau',
    address: 'Unimogstraße 7',
    city: 'Gaggenau',
    coordinates: [48.80173, 8.3125],
    type: 'revier',
    telefon: '07225 9887-0',
  },
  {
    name: 'Polizeirevier Haslach i. K.',
    address: 'Schwarzwaldstraße 16',
    city: 'Haslach im Kinzigtal',
    coordinates: [48.2794373, 8.0882884],
    type: 'revier',
    telefon: '07832 97592-0',
  },
  {
    name: 'Polizeirevier Kehl',
    address: 'Rathausplatz 4',
    city: 'Kehl',
    coordinates: [48.538248, 7.920639],
    type: 'revier',
    telefon: '07851 893-0',
  },
  {
    name: 'Polizeirevier Lahr',
    address: 'Friedrichstraße 17',
    city: 'Lahr/Schwarzwald',
    coordinates: [48.3416497, 7.8747662],
    type: 'revier',
    telefon: '07821 277-0',
  },
  {
    name: 'Polizeirevier Offenburg',
    address: 'Hauptstraße 96',
    city: 'Offenburg',
    coordinates: [48.46886, 7.94252],
    type: 'revier',
    telefon: '0781 21-2200',
  },
  {
    name: 'Polizeirevier Rastatt',
    address: 'Engelstraße 31',
    city: 'Rastatt',
    coordinates: [48.86078, 8.20282],
    type: 'revier',
    telefon: '07222 761-0',
  },
];

export const createAllOffenburgAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Offenburg-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = offenburgAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'offenburg.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Offenburg-Stationen... (${createdCount}/${offenburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of offenburgAddresses.filter(e => e.type === 'revier')) {
      try {
        const revierData = {
          name: entry.name,
          type: entry.type,
          city: entry.city,
          address: entry.address,
          coordinates: entry.coordinates,
          telefon: entry.telefon,
          email: `${entry.city.toLowerCase().replace(/\s+/g, '')}@polizei.bwl.de`,
          notdienst24h: false,
          isActive: true,
          parentId: praesidiumId,
        };
        
        console.log('🔄 Erstelle Revier:', entry.name);
        await createStation(revierData);
        
        createdCount++;
        toast.loading(`Erstelle Offenburg-Stationen... (${createdCount}/${offenburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Offenburg erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Offenburg-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 