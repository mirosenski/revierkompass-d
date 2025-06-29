export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const mannheimAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Mannheim',
    address: 'L6 1',
    city: 'Mannheim',
    coordinates: [49.483230, 8.467120],
    type: 'praesidium',
    telefon: '0621 174-0',
  },
  {
    name: 'Polizeirevier Eberbach',
    address: 'Kellereistraße 33',
    city: 'Eberbach',
    coordinates: [49.46272, 8.98406],
    type: 'revier',
    telefon: '06271 9210-0',
  },
  {
    name: 'Polizeirevier Heidelberg-Mitte',
    address: 'Rohrbacher Straße 11',
    city: 'Heidelberg',
    coordinates: [49.4065157, 8.6930257],
    type: 'revier',
    telefon: '06221 1857-0',
  },
  {
    name: 'Polizeirevier Heidelberg-Nord',
    address: 'Furtwänglerstraße 11',
    city: 'Heidelberg',
    coordinates: [49.42126, 8.68019],
    type: 'revier',
    telefon: '06221 4569-0',
  },
  {
    name: 'Polizeirevier Heidelberg-Süd',
    address: 'Bürgerstraße 47',
    city: 'Heidelberg',
    coordinates: [49.3789878, 8.6764057],
    type: 'revier',
    telefon: '06221 3418-0',
  },
  {
    name: 'Polizeirevier Hockenheim',
    address: 'Werderstraße 8-10',
    city: 'Hockenheim',
    coordinates: [49.3181265, 8.5407761],
    type: 'revier',
    telefon: '06205 2860-0',
  },
  {
    name: 'Polizeirevier Ladenburg',
    address: 'Bahnhofstraße 20-22',
    city: 'Ladenburg',
    coordinates: [49.471731, 8.603919],
    type: 'revier',
    telefon: '06203 9305-0',
  },
  {
    name: 'Polizeirevier Mannheim-Innenstadt',
    address: 'H4 1',
    city: 'Mannheim',
    coordinates: [49.4910013, 8.4656997],
    type: 'revier',
    telefon: '0621 1258-0',
  },
  {
    name: 'Polizeirevier Mannheim-Käfertal',
    address: 'Ladenburger Straße 3',
    city: 'Mannheim',
    coordinates: [49.5124314, 8.5182761],
    type: 'revier',
    telefon: '0621 71849-0',
  },
  {
    name: 'Polizeirevier Mannheim-Neckarau',
    address: 'Reingoldplatz 4',
    city: 'Mannheim',
    coordinates: [49.45437, 8.48306],
    type: 'revier',
    telefon: '0621 83397-0',
  },
  {
    name: 'Polizeirevier Mannheim-Neckarstadt',
    address: 'Waldhofstraße 32-34',
    city: 'Mannheim',
    coordinates: [49.4995783, 8.4718308],
    type: 'revier',
    telefon: '0621 3301-0',
  },
  {
    name: 'Polizeirevier Mannheim-Oststadt',
    address: 'L6 1',
    city: 'Mannheim',
    coordinates: [49.48323, 8.46712],
    type: 'revier',
    telefon: '0621 174-3310',
  },
  {
    name: 'Polizeirevier Mannheim-Sandhofen',
    address: 'Sonnenstraße 37c/d',
    city: 'Mannheim',
    coordinates: [49.5461914, 8.4481622],
    type: 'revier',
    telefon: '0621 77769-0',
  },
  {
    name: 'Polizeirevier Neckargemünd',
    address: 'Bahnhofstraße 39',
    city: 'Neckargemünd',
    coordinates: [49.39309, 8.78452],
    type: 'revier',
    telefon: '06223 9254-0',
  },
  {
    name: 'Polizeirevier Schwetzingen',
    address: 'Carl-Theodor-Straße 8',
    city: 'Schwetzingen',
    coordinates: [49.3845385, 8.5756366],
    type: 'revier',
    telefon: '06202 288-0',
  },
  {
    name: 'Polizeirevier Sinsheim',
    address: 'Wilhelmstraße 7',
    city: 'Sinsheim',
    coordinates: [49.25386, 8.87891],
    type: 'revier',
    telefon: '07261 690-0',
  },
  {
    name: 'Polizeirevier Weinheim',
    address: 'Am Hauptbahnhof 4',
    city: 'Weinheim',
    coordinates: [49.55348, 8.66625],
    type: 'revier',
    telefon: '06201 1003-0',
  },
  {
    name: 'Polizeirevier Wiesloch',
    address: 'Schloßstraße 11-13',
    city: 'Wiesloch',
    coordinates: [49.29544, 8.6969613],
    type: 'revier',
    telefon: '06222 5709-0',
  },
];

// Funktion zum Erstellen aller Mannheim-Stationen
export const createAllMannheimAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Mannheim-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = mannheimAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'mannheim.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Mannheim-Stationen... (${createdCount}/${mannheimAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of mannheimAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Mannheim-Stationen... (${createdCount}/${mannheimAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Mannheim erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Mannheim-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 