export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const ravensburgAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Ravensburg',
    address: 'Gartenstraße 97',
    city: 'Ravensburg',
    coordinates: [47.7928276, 9.622915],
    type: 'praesidium',
    telefon: '+49 (0) 751 / 803-0',
  },
  {
    name: 'Polizeirevier Bad Saulgau',
    address: 'Hauptstraße 119',
    city: 'Bad Saulgau',
    coordinates: [48.01332, 9.5034],
    type: 'revier',
    telefon: '07581 482-0',
  },
  {
    name: 'Polizeirevier Leutkirch',
    address: 'Karlstraße 8',
    city: 'Leutkirch im Allgäu',
    coordinates: [47.826385, 10.019782],
    type: 'revier',
    telefon: '07561 8488-0',
  },
  {
    name: 'Polizeirevier Ravensburg',
    address: 'Seestraße 11',
    city: 'Ravensburg',
    coordinates: [47.778238, 9.612080],
    type: 'revier',
    telefon: '0751 803-3333',
  },
  {
    name: 'Polizeirevier Sigmaringen',
    address: 'Karlstraße 15',
    city: 'Sigmaringen',
    coordinates: [48.08527, 9.22126],
    type: 'revier',
    telefon: '07571 104-0',
  },
  {
    name: 'Polizeirevier Überlingen',
    address: 'Mühlenstraße 16',
    city: 'Überlingen',
    coordinates: [47.76441, 9.16577],
    type: 'revier',
    telefon: '07551 804-0',
  },
  {
    name: 'Polizeirevier Wangen im Allgäu',
    address: 'Lindauer Straße 38',
    city: 'Wangen im Allgäu',
    coordinates: [47.684606, 9.828214],
    type: 'revier',
    telefon: '07522 984-0',
  },
  {
    name: 'Polizeirevier Weingarten',
    address: 'Promenade 13/1',
    city: 'Weingarten',
    coordinates: [47.811509, 9.637479],
    type: 'revier',
    telefon: '0751 803-6666',
  },
];

export const createAllRavensburgAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Ravensburg-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = ravensburgAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'ravensburg.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Ravensburg-Stationen... (${createdCount}/${ravensburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of ravensburgAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Ravensburg-Stationen... (${createdCount}/${ravensburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Ravensburg erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Ravensburg-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 