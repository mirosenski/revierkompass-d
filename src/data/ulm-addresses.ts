export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const ulmAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Ulm',
    address: 'Münsterplatz 47',
    city: 'Ulm',
    coordinates: [48.397614, 9.9916439],
    type: 'praesidium',
    telefon: '0731 188-0',
  },
  {
    name: 'Polizeirevier Biberach',
    address: 'Erlenweg 2',
    city: 'Biberach an der Riß',
    coordinates: [48.08738, 9.79488],
    type: 'revier',
    telefon: '07351 447-0',
  },
  {
    name: 'Polizeirevier Ehingen',
    address: 'Panoramastraße 6',
    city: 'Ehingen (Donau)',
    coordinates: [48.2780345, 9.7251251],
    type: 'revier',
    telefon: '07391 588-0',
  },
  {
    name: 'Polizeirevier Eislingen',
    address: 'Ulmer Straße 34',
    city: 'Eislingen/Fils',
    coordinates: [48.6932276, 9.710758],
    type: 'revier',
    telefon: '07161 851-0',
  },
  {
    name: 'Polizeirevier Geislingen an der Steige',
    address: 'Eberhardstraße 12',
    city: 'Geislingen an der Steige',
    coordinates: [48.61701, 9.83882],
    type: 'revier',
    telefon: '07331 9327-0',
  },
  {
    name: 'Polizeirevier Giengen an der Brenz',
    address: 'Schwagestraße 16',
    city: 'Giengen an der Brenz',
    coordinates: [48.6231803, 10.2387663],
    type: 'revier',
    telefon: '07322 9653-0',
  },
  {
    name: 'Polizeirevier Göppingen',
    address: 'Pfarrstraße 29',
    city: 'Göppingen',
    coordinates: [48.7050512, 9.6508052],
    type: 'revier',
    telefon: '07161 63-2360',
  },
  {
    name: 'Polizeirevier Laupheim',
    address: 'Biberacher Straße 22',
    city: 'Laupheim',
    coordinates: [48.2252411, 9.8772729],
    type: 'revier',
    telefon: '07392 9630-0',
  },
  {
    name: 'Polizeirevier Riedlingen',
    address: 'Zwiefalter Straße 16',
    city: 'Riedlingen',
    coordinates: [48.1557, 9.47819],
    type: 'revier',
    telefon: '07371 938-0',
  },
  {
    name: 'Polizeirevier Uhingen',
    address: 'Im Brühl 5',
    city: 'Uhingen',
    coordinates: [48.70664, 9.57459],
    type: 'revier',
    telefon: '07161 9381-0',
  },
  {
    name: 'Polizeirevier Ulm-Mitte',
    address: 'Münsterplatz 47',
    city: 'Ulm',
    coordinates: [48.397614, 9.9916439],
    type: 'revier',
    telefon: '0731 188-0',
  },
  {
    name: 'Polizeirevier Ulm-West',
    address: 'Römerstraße 122',
    city: 'Ulm',
    coordinates: [48.3860517, 9.9669864],
    type: 'revier',
    telefon: '07 31 188-0',
  },
];

export const createAllUlmAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Ulm-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = ulmAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'ulm.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Ulm-Stationen... (${createdCount}/${ulmAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of ulmAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Ulm-Stationen... (${createdCount}/${ulmAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Ulm erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Ulm-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 