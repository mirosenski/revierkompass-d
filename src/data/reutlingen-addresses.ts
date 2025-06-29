export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const reutlingenAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Reutlingen',
    address: 'Bismarckstraße 60',
    city: 'Reutlingen',
    coordinates: [48.492355, 9.220761],
    type: 'praesidium',
    telefon: '07121 942-0',
  },
  {
    name: 'Polizeirevier Esslingen',
    address: 'Agnespromenade 4',
    city: 'Esslingen am Neckar',
    coordinates: [48.743119, 9.304437],
    type: 'revier',
    telefon: '0711 3990-0',
  },
  {
    name: 'Polizeirevier Filderstadt',
    address: 'Karl-Benz-Straße 23',
    city: 'Filderstadt',
    coordinates: [48.675288, 9.196178],
    type: 'revier',
    telefon: '0711 7091-3',
  },
  {
    name: 'Polizeirevier Flughafen Stuttgart',
    address: 'Flughafenstraße 36',
    city: 'Stuttgart',
    coordinates: [48.6911183, 9.1893812],
    type: 'revier',
    telefon: '0711 78780-0',
  },
  {
    name: 'Polizeirevier Kirchheim unter Teck',
    address: 'Dettinger Straße 101',
    city: 'Kirchheim unter Teck',
    coordinates: [48.63936, 9.45455],
    type: 'revier',
    telefon: '07021 501-0',
  },
  {
    name: 'Polizeirevier Metzingen',
    address: 'Ulmer Straße 96',
    city: 'Metzingen',
    coordinates: [48.53479, 9.29091],
    type: 'revier',
    telefon: '07123/924 - 0',
  },
  {
    name: 'Polizeirevier Münsingen',
    address: 'Karlstraße 2',
    city: 'Münsingen',
    coordinates: [48.4113143, 9.4916674],
    type: 'revier',
    telefon: '07381/9364 - 0',
  },
  {
    name: 'Polizeirevier Nürtingen',
    address: 'Europastraße 34',
    city: 'Nürtingen',
    coordinates: [48.62911, 9.33628],
    type: 'revier',
    telefon: '07022 9224-0',
  },
  {
    name: 'Polizeirevier Pfullingen',
    address: 'Burgstraße 26',
    city: 'Pfullingen',
    coordinates: [48.4710361, 9.2297361],
    type: 'revier',
    telefon: '07121/9918 - 0',
  },
  {
    name: 'Polizeirevier Reutlingen',
    address: 'Burgstraße 27 - 29',
    city: 'Reutlingen',
    coordinates: [48.49069, 9.22134],
    type: 'revier',
    telefon: '07121 942-3333',
  },
  {
    name: 'Polizeirevier Rottenburg',
    address: 'Königstraße 9',
    city: 'Rottenburg am Neckar',
    coordinates: [48.4779814, 8.9347265],
    type: 'revier',
    telefon: '07472 9801-0',
  },
  {
    name: 'Polizeirevier Tübingen',
    address: 'Konrad-Adenauer-Straße 30',
    city: 'Tübingen',
    coordinates: [48.5096732, 9.0489565],
    type: 'revier',
    telefon: '07071 972-1400',
  },
  {
    name: 'Polizeirevier Albstadt',
    address: 'Rudolf-Diesel-Straße 3',
    city: 'Albstadt',
    coordinates: [48.23104, 9.02733],
    type: 'revier',
    telefon: '07432 955-0',
  },
  {
    name: 'Polizeirevier Balingen',
    address: 'Johann-Sebastian-Bach-Straße 2',
    city: 'Balingen',
    coordinates: [48.275667, 8.857329],
    type: 'revier',
    telefon: '07433 264-0',
  },
  {
    name: 'Polizeirevier Hechingen',
    address: 'Heiligkreuzstraße 6',
    city: 'Hechingen',
    coordinates: [48.34886, 8.96347],
    type: 'revier',
    telefon: '07471 9880-0',
  },
];

export const createAllReutlingenAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Reutlingen-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = reutlingenAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'reutlingen.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Reutlingen-Stationen... (${createdCount}/${reutlingenAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of reutlingenAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Reutlingen-Stationen... (${createdCount}/${reutlingenAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Reutlingen erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Reutlingen-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 