export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const freiburgAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Freiburg',
    address: 'Bissierstraße 1',
    city: 'Freiburg im Breisgau',
    coordinates: [48.00235, 7.82138],
    type: 'praesidium',
    telefon: '0761 882-0',
  },
  {
    name: 'Polizeirevier Bad Säckingen',
    address: 'Rathausplatz 3',
    city: 'Bad Säckingen',
    coordinates: [47.5523597, 7.949340597],
    type: 'revier',
    telefon: '07761 934-0',
  },
  {
    name: 'Polizeirevier Breisach',
    address: 'Müllheimerstraße 1',
    city: 'Breisach am Rhein',
    coordinates: [48.0382143, 7.5803855],
    type: 'revier',
    telefon: '07667 9117-0',
  },
  {
    name: 'Polizeirevier Emmendingen',
    address: 'Wiesenstraße 4',
    city: 'Emmendingen',
    coordinates: [48.10852, 7.85372],
    type: 'revier',
    telefon: '07641 582-0',
  },
  {
    name: 'Polizeirevier Freiburg -Nord-',
    address: 'Bertoldstraße 43a',
    city: 'Freiburg im Breisgau',
    coordinates: [47.996218, 7.8454321],
    type: 'revier',
    telefon: '0761 882-4221',
  },
  {
    name: 'Polizeirevier Freiburg -Süd-',
    address: 'Heinrich-von-Stephan-Straße 4',
    city: 'Freiburg im Breisgau',
    coordinates: [47.98763, 7.8364],
    type: 'revier',
    telefon: '0761 882-0',
  },
  {
    name: 'Polizeirevier Lörrach',
    address: 'Weinbrennerstraße 8',
    city: 'Lörrach',
    coordinates: [47.61014, 7.65873],
    type: 'revier',
    telefon: '07621 176-0',
  },
  {
    name: 'Polizeirevier Müllheim',
    address: 'Schwarzwaldstraße 14-16',
    city: 'Müllheim',
    coordinates: [47.81185, 7.62641],
    type: 'revier',
    telefon: '07631 1788-0',
  },
  {
    name: 'Polizeirevier Rheinfelden (Baden)',
    address: 'Basler Straße 16',
    city: 'Rheinfelden (Baden)',
    coordinates: [47.55532, 7.7831054],
    type: 'revier',
    telefon: '07623 7404-0',
  },
  {
    name: 'Polizeirevier Schopfheim',
    address: 'Hebelstraße 18',
    city: 'Schopfheim',
    coordinates: [47.6478483, 7.8244383],
    type: 'revier',
    telefon: '07622 66698-0',
  },
  {
    name: 'Polizeirevier Titisee-Neustadt',
    address: 'Bei der Kirche 2',
    city: 'Titisee-Neustadt',
    coordinates: [47.91138, 8.21507],
    type: 'revier',
    telefon: '07651 9336-0',
  },
  {
    name: 'Polizeirevier Waldkirch',
    address: 'Marktplatz 19',
    city: 'Waldkirch',
    coordinates: [48.0930829, 7.9619985],
    type: 'revier',
    telefon: '07681 4074-0',
  },
  {
    name: 'Polizeirevier Waldshut-Tiengen',
    address: 'Poststraße 4',
    city: 'Waldshut-Tiengen',
    coordinates: [47.62217, 8.21728],
    type: 'revier',
    telefon: '07751 8316-0',
  },
  {
    name: 'Polizeirevier Weil am Rhein',
    address: 'Basler Straße 7',
    city: 'Weil am Rhein',
    coordinates: [47.59161, 7.61],
    type: 'revier',
    telefon: '07621 9797-0',
  },
  {
    name: 'Polizeirevier Sankt Georgen im Schwarzwald',
    address: 'Talstraße 25',
    city: 'Sankt Georgen im Schwarzwald',
    coordinates: [48.128366, 8.337171],
    type: 'revier',
    telefon: '07724 9495-00',
  },
];

// Funktion zum Erstellen aller Freiburg-Stationen
export const createAllFreiburgAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Freiburg-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = freiburgAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'freiburg.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Freiburg-Stationen... (${createdCount}/${freiburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of freiburgAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Freiburg-Stationen... (${createdCount}/${freiburgAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Freiburg erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Freiburg-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 