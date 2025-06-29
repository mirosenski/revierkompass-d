export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const heilbronnAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Heilbronn',
    address: 'Karlstraße 108-112',
    city: 'Heilbronn',
    coordinates: [49.14155, 9.23619],
    type: 'praesidium',
    telefon: '07131-104-0',
  },
  {
    name: 'Polizeirevier Bad Mergentheim',
    address: 'Schloß 6',
    city: 'Bad Mergentheim',
    coordinates: [49.49275, 9.77691],
    type: 'revier',
    telefon: '07931 5499-0',
  },
  {
    name: 'Polizeirevier Buchen',
    address: 'Bödigheimer Straße 19',
    city: 'Buchen (Odenwald)',
    coordinates: [49.516190, 9.323873],
    type: 'revier',
    telefon: '06281 904-0',
  },
  {
    name: 'Polizeirevier Eppingen',
    address: 'Brettener Straße 57',
    city: 'Eppingen',
    coordinates: [49.135654, 8.906410],
    type: 'revier',
    telefon: '07262 6095-0',
  },
  {
    name: 'Polizeirevier Heilbronn',
    address: 'John-F.-Kennedy-Straße 14',
    city: 'Heilbronn',
    coordinates: [49.123493, 9.221350],
    type: 'revier',
    telefon: '07131 7479-0',
  },
  {
    name: 'Polizeirevier Heilbronn-Böckingen',
    address: 'Neckargartacher Straße 108',
    city: 'Heilbronn',
    coordinates: [49.149374, 9.196707],
    type: 'revier',
    telefon: '07131 20406-0',
  },
  {
    name: 'Polizeirevier Künzelsau',
    address: 'Schillerstraße 11',
    city: 'Künzelsau',
    coordinates: [49.27948, 9.68212],
    type: 'revier',
    telefon: '07940 940-0',
  },
  {
    name: 'Polizeirevier Lauffen',
    address: 'Stuttgarter Straße 19',
    city: 'Lauffen am Neckar',
    coordinates: [49.07395, 9.15531],
    type: 'revier',
    telefon: '07133 209-0',
  },
  {
    name: 'Polizeirevier Mosbach',
    address: 'Hauptstraße 85',
    city: 'Mosbach',
    coordinates: [49.356241, 9.148287],
    type: 'revier',
    telefon: '06261 809-0',
  },
  {
    name: 'Polizeirevier Neckarsulm',
    address: 'Binswanger Straße 1',
    city: 'Neckarsulm',
    coordinates: [49.190376, 9.224797],
    type: 'revier',
    telefon: '07132 9371-0',
  },
  {
    name: 'Polizeirevier Öhringen',
    address: 'Karlsvorstadt 29',
    city: 'Öhringen',
    coordinates: [49.2012387, 9.5073549],
    type: 'revier',
    telefon: '07941 930-0',
  },
  {
    name: 'Polizeirevier Tauberbischofsheim',
    address: 'Hauptstraße 91',
    city: 'Tauberbischofsheim',
    coordinates: [49.62028, 9.65909],
    type: 'revier',
    telefon: '09341 81-0',
  },
  {
    name: 'Polizeirevier Weinsberg',
    address: 'Haller Straße 17',
    city: 'Weinsberg',
    coordinates: [49.15194, 9.29223],
    type: 'revier',
    telefon: '07134  992-0',
  },
  {
    name: 'Polizeirevier Wertheim',
    address: 'Wilhelm-Blos-Straße 1',
    city: 'Wertheim',
    coordinates: [49.75719, 9.51547],
    type: 'revier',
    telefon: '09342 91 89-0',
  },
];

// Funktion zum Erstellen aller Heilbronn-Stationen
export const createAllHeilbronnAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Heilbronn-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = heilbronnAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'heilbronn.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Heilbronn-Stationen... (${createdCount}/${heilbronnAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of heilbronnAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Heilbronn-Stationen... (${createdCount}/${heilbronnAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Heilbronn erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Heilbronn-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 