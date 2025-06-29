export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const aalenAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Aalen',
    address: 'Böhmerwaldstraße 20',
    city: 'Aalen',
    coordinates: [48.830248, 10.091980],
    type: 'praesidium',
    telefon: '07361 580-0',
  },
  {
    name: 'Polizeirevier Aalen',
    address: 'Stuttgarter Straße 5',
    city: 'Aalen',
    coordinates: [48.83774, 10.09566],
    type: 'revier',
    telefon: '07361 524-0',
  },
  {
    name: 'Polizeirevier Backnang',
    address: 'Aspacher Straße 75',
    city: 'Backnang',
    coordinates: [48.949263, 9.421463],
    type: 'revier',
    telefon: '07191 909-0',
  },
  {
    name: 'Polizeirevier Crailsheim',
    address: 'Parkstraße 7',
    city: 'Crailsheim',
    coordinates: [49.135451, 10.074459],
    type: 'revier',
    telefon: '07951 480-0',
  },
  {
    name: 'Polizeirevier Ellwangen',
    address: 'Karlstraße 3',
    city: 'Ellwangen (Jagst)',
    coordinates: [48.964228, 10.131518],
    type: 'revier',
    telefon: '07961 930-0',
  },
  {
    name: 'Polizeirevier Fellbach',
    address: 'Cannstatter Straße 16',
    city: 'Fellbach',
    coordinates: [48.807339, 9.277376],
    type: 'revier',
    telefon: '0711 5772-0',
  },
  {
    name: 'Polizeirevier Schorndorf',
    address: 'Grabenstraße 28/1',
    city: 'Schorndorf',
    coordinates: [48.80715, 9.52375],
    type: 'revier',
    telefon: '07181 204-0',
  },
  {
    name: 'Polizeirevier Schwäbisch Gmünd',
    address: 'Lessingstraße 7',
    city: 'Schwäbisch Gmünd',
    coordinates: [48.796051, 9.791286],
    type: 'revier',
    telefon: '07171 358-0',
  },
  {
    name: 'Polizeirevier Schwäbisch Hall',
    address: 'Salinenstraße 18',
    city: 'Schwäbisch Hall',
    coordinates: [49.1181768, 9.7341306],
    type: 'revier',
    telefon: '0791 400-0',
  },
  {
    name: 'Polizeirevier Waiblingen',
    address: 'Alter Postplatz 20',
    city: 'Waiblingen',
    coordinates: [48.82902, 9.31758],
    type: 'revier',
    telefon: '07151 950-0',
  },
  {
    name: 'Polizeirevier Winnenden',
    address: 'Eugenstraße 5',
    city: 'Winnenden',
    coordinates: [48.87295, 9.40646],
    type: 'revier',
    telefon: '07195 694-0',
  },
];

// Funktion zum Erstellen aller Aalen-Stationen
export const createAllAalenAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Aalen-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = aalenAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'aalen.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Aalen-Stationen... (${createdCount}/${aalenAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of aalenAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Aalen-Stationen... (${createdCount}/${aalenAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Aalen erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Aalen-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 