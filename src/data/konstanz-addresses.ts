export interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

export const konstanzAddresses: AddressData[] = [
  {
    name: 'Polizeipräsidium Konstanz',
    address: 'Benediktinerplatz 3',
    city: 'Konstanz',
    coordinates: [47.66898, 9.1797],
    type: 'praesidium',
    telefon: '07531 995-0',
  },
  {
    name: 'Polizeirevier Friedrichshafen',
    address: 'Ehlersstraße 35',
    city: 'Friedrichshafen',
    coordinates: [47.659393, 9.486471],
    type: 'revier',
    telefon: '07541 701-0',
  },
  {
    name: 'Polizeirevier Konstanz',
    address: 'Benediktinerplatz 3',
    city: 'Konstanz',
    coordinates: [47.66898, 9.1797],
    type: 'revier',
    telefon: '07531 995-0',
  },
  {
    name: 'Polizeirevier Radolfzell am Bodensee',
    address: 'Güttinger Straße 1',
    city: 'Radolfzell am Bodensee',
    coordinates: [47.7396273, 8.9740013],
    type: 'revier',
    telefon: '07732 95066-0',
  },
  {
    name: 'Polizeirevier Singen',
    address: 'Julius-Bührer-Straße 6',
    city: 'Singen (Hohentwiel)',
    coordinates: [47.7589161, 8.8428238],
    type: 'revier',
    telefon: '07731 888-0',
  },
  {
    name: 'Polizeirevier Stockach',
    address: 'Winterspürer Straße 27',
    city: 'Stockach',
    coordinates: [47.85142, 9.02147],
    type: 'revier',
    telefon: '07771 9391-0',
  },
  {
    name: 'Polizeirevier Donaueschingen',
    address: 'Lehenstraße 2',
    city: 'Donaueschingen',
    coordinates: [47.95346, 8.49631],
    type: 'revier',
    telefon: '0771 83783-0',
  },
  {
    name: 'Polizeirevier Oberndorf am Neckar',
    address: 'Klosterstraße 3',
    city: 'Oberndorf am Neckar',
    coordinates: [48.292067, 8.574928],
    type: 'revier',
    telefon: '07423 8101-0',
  },
  {
    name: 'Polizeirevier Rottweil',
    address: 'Kaiserstraße 10',
    city: 'Rottweil',
    coordinates: [48.16405, 8.62602],
    type: 'revier',
    telefon: '0741 477-0',
  },
  {
    name: 'Polizeirevier Schramberg',
    address: 'Bahnhofstraße 5',
    city: 'Schramberg',
    coordinates: [48.229114, 8.384202],
    type: 'revier',
    telefon: '07422 2701-0',
  },
  {
    name: 'Polizeirevier Schwenningen',
    address: 'Oberdorfstraße 54',
    city: 'Villingen-Schwenningen',
    coordinates: [48.06277, 8.52662],
    type: 'revier',
    telefon: '07720 8500-0',
  },
  {
    name: 'Polizeirevier Spaichingen',
    address: 'Hauptstraße 79',
    city: 'Spaichingen',
    coordinates: [48.07203, 8.74116],
    type: 'revier',
    telefon: '07424 9318-0',
  },
  {
    name: 'Polizeirevier Tuttlingen',
    address: 'Stockacher Straße 158',
    city: 'Tuttlingen',
    coordinates: [47.97348, 8.82836],
    type: 'revier',
    telefon: '07461 941-0',
  },
  {
    name: 'Polizeirevier Villingen',
    address: 'Waldstraße 10/1',
    city: 'Villingen-Schwenningen',
    coordinates: [48.06477, 8.45252],
    type: 'revier',
    telefon: '07721 601-0',
  },
];

// Funktion zum Erstellen aller Konstanz-Stationen
export const createAllKonstanzAddresses = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');

  try {
    let createdCount = 0;
    let errorCount = 0;
    let praesidiumId = '';
    const loadingToast = toast.loading('Erstelle Konstanz-Stationen...');

    // Erstelle zuerst das Präsidium
    const praesidium = konstanzAddresses.find(entry => entry.type === 'praesidium');
    if (praesidium) {
      try {
        const praesidiumData = {
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: 'konstanz.pp@polizei.bwl.de',
          notdienst24h: false,
          isActive: true,
        };
        
        console.log('🔄 Erstelle Präsidium:', praesidium.name);
        const response = await createStation(praesidiumData);
        
        praesidiumId = response.id;
        createdCount++;
        console.log('✅ Präsidium erstellt:', response);
        toast.loading(`Erstelle Konstanz-Stationen... (${createdCount}/${konstanzAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen des Präsidiums ${praesidium.name}:`, error);
        errorCount++;
      }
    }

    // Erstelle dann alle Reviere mit parentId
    for (const entry of konstanzAddresses.filter(e => e.type === 'revier')) {
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
        toast.loading(`Erstelle Konstanz-Stationen... (${createdCount}/${konstanzAddresses.length})`, { id: loadingToast });
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Fehler beim Erstellen von ${entry.name}:`, error);
        errorCount++;
      }
    }

    toast.dismiss(loadingToast);
    
    if (createdCount > 0) {
      toast.success(`✅ ${createdCount} Stationen für Polizeipräsidium Konstanz erfolgreich erstellt!${errorCount > 0 ? ` (${errorCount} Fehler)` : ''}`);
    } else {
      toast.error('❌ Keine Stationen konnten erstellt werden');
    }
    
    return createdCount;
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Konstanz-Stationen:', error);
    toast.error('❌ Fehler beim Erstellen der Stationen');
    throw error;
  }
}; 