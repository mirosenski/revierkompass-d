export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const ludwigsburgAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Ludwigsburg',
    address: 'Friedrich-Ebert-Straße 30',
    city: 'Ludwigsburg',
    coordinates: [48.8933215, 9.199877],
    type: 'praesidium',
    telefon: '07141 18-9',
  },
  {
    name: 'Polizeirevier Bietigheim-Bissingen',
    address: 'Stuttgarter Straße 57',
    city: 'Bietigheim-Bissingen',
    coordinates: [48.9528362, 9.1371278],
    type: 'revier',
    telefon: '07142 405-0',
  },
  {
    name: 'Polizeirevier Böblingen',
    address: 'Talstraße 50',
    city: 'Böblingen',
    coordinates: [48.68454, 9.00173],
    type: 'revier',
    telefon: '07031 13-2500',
  },
  {
    name: 'Polizeirevier Ditzingen',
    address: 'An der Lache 1-5',
    city: 'Ditzingen',
    coordinates: [48.8271283, 9.0740374],
    type: 'revier',
    telefon: '07156 4352-0',
  },
  {
    name: 'Polizeirevier Herrenberg',
    address: 'Alzentalstraße 1',
    city: 'Herrenberg',
    coordinates: [48.5940102, 8.8660863],
    type: 'revier',
    telefon: '07032 2708-0',
  },
  {
    name: 'Polizeirevier Kornwestheim',
    address: 'Stuttgarter Straße 101',
    city: 'Kornwestheim',
    coordinates: [48.85746, 9.18566],
    type: 'revier',
    telefon: '07154  1313-0',
  },
  {
    name: 'Polizeirevier Leonberg',
    address: 'Gerhart-Hauptmann-Straße 8',
    city: 'Leonberg',
    coordinates: [48.7983112, 9.0107918],
    type: 'revier',
    telefon: '07152 605-0',
  },
  {
    name: 'Polizeirevier Ludwigsburg',
    address: 'Stuttgarter Straße 26-28',
    city: 'Ludwigsburg',
    coordinates: [48.8928428, 9.1942979],
    type: 'revier',
    telefon: '07141 18-5353',
  },
  {
    name: 'Polizeirevier Marbach am Neckar',
    address: 'Steinerstraße 2',
    city: 'Marbach am Neckar',
    coordinates: [48.9392523, 9.2573308],
    type: 'revier',
    telefon: '07144 900-0',
  },
  {
    name: 'Polizeirevier Sindelfingen',
    address: 'Gartenstraße 4',
    city: 'Sindelfingen',
    coordinates: [48.7069732, 9.0039904],
    type: 'revier',
    telefon: '07031 697-0',
  },
  {
    name: 'Polizeirevier Vaihingen an der Enz',
    address: 'Heilbronner Straße 17',
    city: 'Vaihingen an der Enz',
    coordinates: [48.9337714, 8.9583672],
    type: 'revier',
    telefon: '07042 941-0',
  },
];

// Funktion zum Erstellen aller Ludwigsburg-Stationen
export const createAllLudwigsburgAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Ludwigsburg-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = ludwigsburgAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'ludwigsburg.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Ludwigsburg-Stationen... (${createdCount}/${ludwigsburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of ludwigsburgAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Ludwigsburg-Stationen... (${createdCount}/${ludwigsburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Ludwigsburg erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Ludwigsburg-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 