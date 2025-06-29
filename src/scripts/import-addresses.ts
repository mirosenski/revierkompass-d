import { stuttgartAddresses } from '../data/stuttgart-addresses';
import { karlsruheAddresses } from '../data/karlsruhe-addresses';
import { mannheimAddresses } from '../data/mannheim-addresses';
import { freiburgAddresses } from '../data/freiburg-addresses';
import { heilbronnAddresses } from '../data/heilbronn-addresses';
import { konstanzAddresses } from '../data/konstanz-addresses';
import { ludwigsburgAddresses } from '../data/ludwigsburg-addresses';
import { offenburgAddresses } from '../data/offenburg-addresses';
import { pforzheimAddresses } from '../data/pforzheim-addresses';
import { ravensburgAddresses } from '../data/ravensburg-addresses';
import { reutlingenAddresses } from '../data/reutlingen-addresses';
import { ulmAddresses } from '../data/ulm-addresses';
import { aalenAddresses } from '../data/aalen-addresses';

interface AddressData {
  name: string;
  address: string;
  city: string;
  coordinates: [number, number];
  type: 'praesidium' | 'revier';
  telefon: string;
  parentId?: string;
}

interface CityData {
  name: string;
  addresses: AddressData[];
  createFunction?: () => Promise<number>;
}

const allCityData = [
  { name: 'Stuttgart', addresses: stuttgartAddresses },
  { name: 'Karlsruhe', addresses: karlsruheAddresses },
  { name: 'Mannheim', addresses: mannheimAddresses },
  { name: 'Freiburg', addresses: freiburgAddresses },
  { name: 'Heilbronn', addresses: heilbronnAddresses },
  { name: 'Konstanz', addresses: konstanzAddresses },
  { name: 'Ludwigsburg', addresses: ludwigsburgAddresses },
  { name: 'Offenburg', addresses: offenburgAddresses },
  { name: 'Pforzheim', addresses: pforzheimAddresses },
  { name: 'Ravensburg', addresses: ravensburgAddresses },
  { name: 'Reutlingen', addresses: reutlingenAddresses },
  { name: 'Ulm', addresses: ulmAddresses },
  { name: 'Aalen', addresses: aalenAddresses },
];

export const importAllStations = async () => {
  const { toast } = await import('react-hot-toast');
  const { createStation } = await import('@/services/api/backend-api.service');
  let totalCreated = 0;
  let totalErrors = 0;
  const loadingToast = toast.loading('Importiere Polizeistationen...');

  for (const city of allCityData) {
    let praesidiumId = '';
    // Präsidium zuerst
    const praesidium = city.addresses.find(a => a.type === 'praesidium');
    if (praesidium) {
      try {
        const res = await createStation({
          name: praesidium.name,
          type: praesidium.type,
          city: praesidium.city,
          address: praesidium.address,
          coordinates: praesidium.coordinates,
          telefon: praesidium.telefon,
          email: `${praesidium.city.toLowerCase().replace(/\s+/g, '')}@polizei.bwl.de`,
          notdienst24h: false,
          isActive: true,
        });
        praesidiumId = res.id;
        totalCreated++;
      } catch (e) { totalErrors++; }
    }
    // Reviere
    for (const revier of city.addresses.filter(a => a.type === 'revier')) {
      try {
        await createStation({
          name: revier.name,
          type: revier.type,
          city: revier.city,
          address: revier.address,
          coordinates: revier.coordinates,
          telefon: revier.telefon,
          email: `${revier.city.toLowerCase().replace(/\s+/g, '')}@polizei.bwl.de`,
          notdienst24h: false,
          isActive: true,
          parentId: praesidiumId
        });
        totalCreated++;
      } catch (e) { totalErrors++; }
    }
    toast.loading(`Importiere... (${totalCreated})`, { id: loadingToast });
  }
  toast.dismiss(loadingToast);
  if (totalCreated > 0) toast.success(`✅ ${totalCreated} Polizeistationen importiert!`);
  else toast.error('❌ Keine Stationen importiert');
  return { totalCreated, totalErrors };
};

// Funktion zum Anzeigen der Statistiken
export const showAddressStats = () => {
  console.log('📊 Adress-Statistiken:');
  let totalAddresses = 0;
  
  for (const city of allCityData) {
    const praesidien = city.addresses.filter(a => a.type === 'praesidium').length;
    const reviere = city.addresses.filter(a => a.type === 'revier').length;
    totalAddresses += city.addresses.length;
    
    console.log(`  ${city.name}: ${praesidien} Präsidien, ${reviere} Reviere (${city.addresses.length} total)`);
  }
  
  console.log(`📊 Gesamt: ${totalAddresses} Adressen in ${allCityData.length} Städten`);
  return { totalAddresses, cityCount: allCityData.length };
};

// Funktion zum Testen der API-Verbindung
export const testAPIConnection = async () => {
  try {
    const response = await fetch('/api/stationen');
    if (response.ok) {
      const stations = await response.json();
      console.log(`✅ API-Verbindung OK. Aktuell ${stations.length} Stationen in der Datenbank.`);
      return stations.length;
    } else {
      console.error('❌ API-Verbindung fehlgeschlagen:', response.status);
      return 0;
    }
  } catch (error) {
    console.error('❌ API-Verbindung fehlgeschlagen:', error);
    return 0;
  }
};

// Funktion zum Leeren der Datenbank
export const clearDatabase = async () => {
  try {
    const stationResponse = await fetch('/api/stationen', { method: 'DELETE' });
    const addressResponse = await fetch('/api/addresses', { method: 'DELETE' });
    
    const stationResult = await stationResponse.json();
    const addressResult = await addressResponse.json();
    
    console.log(`🗑️ Datenbank geleert: ${stationResult.deletedCount} Stationen, ${addressResult.deletedCount} Adressen gelöscht`);
    return { stationCount: stationResult.deletedCount, addressCount: addressResult.deletedCount };
  } catch (error) {
    console.error('Fehler beim Leeren der Datenbank:', error);
    throw error;
  }
};

// Neue Import-Funktion mit Warnung und automatischem Leeren
export const importAllStationsWithWarning = async () => {
  const { toast } = await import('react-hot-toast');
  
  // Warnung anzeigen
  const confirmed = window.confirm(
    '⚠️ WARNUNG: Import wird alle Daten in der Datenbank löschen!\n\n' +
    '• Alle Stationen werden gelöscht\n' +
    '• Alle Adressen werden gelöscht\n' +
    '• Nur Polizeistationen werden neu importiert\n\n' +
    'Möchtest du fortfahren?'
  );
  
  if (!confirmed) {
    toast.error('❌ Import abgebrochen');
    return { totalCreated: 0, totalErrors: 0, cancelled: true };
  }
  
  try {
    // 1. Datenbank leeren
    toast.loading('🗑️ Leere Datenbank...');
    await clearDatabase();
    toast.dismiss();
    
    // 2. Stationen importieren
    const result = await importAllStations();
    
    toast.success(`✅ Import abgeschlossen!\n🗑️ Datenbank geleert\n📥 ${result.totalCreated} Stationen importiert`);
    return { ...result, cancelled: false };
    
  } catch (error) {
    console.error('Fehler beim Import:', error);
    toast.error('❌ Fehler beim Import');
    throw error;
  }
}; 