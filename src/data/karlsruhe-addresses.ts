export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const karlsruheAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Karlsruhe',
    address: 'Durlacher Allee 31-33',
    city: 'Karlsruhe',
    coordinates: [49.0075455, 8.4258926],
    type: 'praesidium',
    telefon: '0721 666-0',
  },
  {
    name: 'Polizeirevier Bad Schönborn',
    address: 'Hauptstraße 11',
    city: 'Bad Schönborn',
    coordinates: [49.2062279, 8.6486305],
    type: 'revier',
    telefon: '07253 8026-0',
  },
  {
    name: 'Polizeirevier Bretten',
    address: 'Weißhofer Straße 47',
    city: 'Bretten',
    coordinates: [49.0358073, 8.7117024],
    type: 'revier',
    telefon: '07252 5046-0',
  },
  {
    name: 'Polizeirevier Bruchsal',
    address: 'Schönbornstraße 12-14',
    city: 'Bruchsal',
    coordinates: [49.1278202, 8.5994215],
    type: 'revier',
    telefon: '07251 726-0',
  },
  {
    name: 'Polizeirevier Calw',
    address: 'Schloßberg 3',
    city: 'Calw',
    coordinates: [48.717534, 8.7350119],
    type: 'revier',
    telefon: '07051 161-3511',
  },
  {
    name: 'Polizeirevier Ettlingen',
    address: 'Pforzheimer Straße 18',
    city: 'Ettlingen',
    coordinates: [48.9421391, 8.411131],
    type: 'revier',
    telefon: '07243 3200-0',
  },
  {
    name: 'Polizeirevier Karlsruhe-Durlach',
    address: 'Amthausstraße 11 - 13',
    city: 'Karlsruhe',
    coordinates: [48.9983685, 8.4715934],
    type: 'revier',
    telefon: '0721 4907-0',
  },
  {
    name: 'Polizeirevier Karlsruhe-Marktplatz',
    address: 'Karl-Friedrich-Straße 15',
    city: 'Karlsruhe',
    coordinates: [49.007832, 8.4040002],
    type: 'revier',
    telefon: '0721 666-3311',
  },
  {
    name: 'Polizeiposten Karlsruhe-Oststadt',
    address: 'Durlacher Allee 31 - 33',
    city: 'Karlsruhe',
    coordinates: [49.007545, 8.425893],
    type: 'revier',
    telefon: '0721 666-3211',
  },
  {
    name: 'Polizeirevier Karlsruhe-Südweststadt',
    address: 'Beiertheimer Allee 16',
    city: 'Karlsruhe',
    coordinates: [49.0020225, 8.3977478],
    type: 'revier',
    telefon: '0721 666-3411',
  },
  {
    name: 'Polizeirevier Karlsruhe-Waldstadt',
    address: 'Stettiner Straße 41',
    city: 'Karlsruhe',
    coordinates: [49.0323462, 8.4318192],
    type: 'revier',
    telefon: '0721 96718-0',
  },
  {
    name: 'Polizeirevier Karlsruhe-West',
    address: 'Moltkestraße 68',
    city: 'Karlsruhe',
    coordinates: [49.0151313, 8.3757148],
    type: 'revier',
    telefon: '0721 666-3611',
  },
  {
    name: 'Polizeirevier Philippsburg',
    address: 'Lessingstraße 10',
    city: 'Philippsburg',
    coordinates: [49.2381635, 8.4617278],
    type: 'revier',
    telefon: '07256 9329-0',
  },
];

// Funktion zum Erstellen aller Karlsruhe-Stationen
export const createAllKarlsruheAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Karlsruhe-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = karlsruheAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'karlsruhe.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Karlsruhe-Stationen... (${createdCount}/${karlsruheAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of karlsruheAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Karlsruhe-Stationen... (${createdCount}/${karlsruheAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Karlsruhe erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Karlsruhe-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 