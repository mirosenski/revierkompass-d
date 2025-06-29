export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const stuttgartAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Stuttgart',
    address: 'Hahnemannstraße 1',
    city: 'Stuttgart',
    coordinates: [48.81046, 9.18686],
    type: 'praesidium',
    telefon: '0711 8990-0',
  },
  {
    name: 'Polizeirevier 1 Theodor-Heuss-Straße',
    address: 'Theodor-Heuss-Straße 11',
    city: 'Stuttgart',
    coordinates: [48.7769268, 9.1744498],
    type: 'revier',
    telefon: '0711 8990-3100',
  },
  {
    name: 'Polizeirevier 2 Wolframstraße',
    address: 'Wolframstraße 36',
    city: 'Stuttgart',
    coordinates: [48.7922325, 9.1830113],
    type: 'revier',
    telefon: '0711 8990-3200',
  },
  {
    name: 'Polizeirevier 3 Gutenbergstraße',
    address: 'Gutenbergstraße 109/111',
    city: 'Stuttgart',
    coordinates: [48.7700658, 9.1539327],
    type: 'revier',
    telefon: '0711 8990-3300',
  },
  {
    name: 'Polizeirevier 4 Balinger Straße',
    address: 'Balinger Straße 31',
    city: 'Stuttgart',
    coordinates: [48.72991, 9.14272],
    type: 'revier',
    telefon: '0711 8990-3400',
  },
  {
    name: 'Polizeirevier 5 Ostendstraße',
    address: 'Ostendstraße 88',
    city: 'Stuttgart',
    coordinates: [48.7837341, 9.2079634],
    type: 'revier',
    telefon: '0711 8990-3500',
  },
  {
    name: 'Polizeirevier 6 Martin-Luther Straße',
    address: 'Martin-Luther-Straße 40/42',
    city: 'Stuttgart',
    coordinates: [48.80509, 9.22409],
    type: 'revier',
    telefon: '0711 8990-3600',
  },
  {
    name: 'Polizeirevier 7 Ludwigsburger Straße',
    address: 'Ludwigsburger Straße 126',
    city: 'Stuttgart',
    coordinates: [48.8317597, 9.1746453],
    type: 'revier',
    telefon: '0711 8990-3700',
  },
  {
    name: 'Polizeirevier 8 Kärntner Straße',
    address: 'Kärntner Straße 18',
    city: 'Stuttgart',
    coordinates: [48.8131253, 9.16063],
    type: 'revier',
    telefon: '0711 8990-3800',
  },
];

export const createAllStuttgartAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Stuttgart-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = stuttgartAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'stuttgart.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Stuttgart-Stationen... (${createdCount}/${stuttgartAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of stuttgartAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Stuttgart-Stationen... (${createdCount}/${stuttgartAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Stuttgart erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Stuttgart-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 