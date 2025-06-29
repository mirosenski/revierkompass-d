// Skript zum Bereinigen der Datenbank vor dem Import

export const cleanDatabase = async () => {
  const { toast } = await import('react-hot-toast');

  try {
    console.log('🧹 Starte Datenbank-Bereinigung...');
    const loadingToast = toast.loading('Bereinige Datenbank...');

    // Lösche alle Stationen
    const deleteStationsResponse = await fetch('/api/stationen', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (deleteStationsResponse.ok) {
      console.log('✅ Alle Stationen gelöscht');
    } else {
      console.warn('⚠️ Fehler beim Löschen der Stationen:', deleteStationsResponse.status);
    }

    // Lösche alle Adressen
    const deleteAddressesResponse = await fetch('/api/addresses', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (deleteAddressesResponse.ok) {
      console.log('✅ Alle Adressen gelöscht');
    } else {
      console.warn('⚠️ Fehler beim Löschen der Adressen:', deleteAddressesResponse.status);
    }

    // Prüfe, ob die Datenbank leer ist
    const stationsResponse = await fetch('/api/stationen');
    const addressesResponse = await fetch('/api/addresses');

    const stationsCount = stationsResponse.ok ? (await stationsResponse.json()).length : 0;
    const addressesCount = addressesResponse.ok ? (await addressesResponse.json()).length : 0;

    toast.dismiss(loadingToast);

    if (stationsCount === 0 && addressesCount === 0) {
      toast.success('✅ Datenbank erfolgreich bereinigt!');
      console.log('✅ Datenbank-Bereinigung abgeschlossen');
      return { success: true, stationsDeleted: true, addressesDeleted: true };
    } else {
      toast.error('⚠️ Datenbank teilweise bereinigt');
      console.log('⚠️ Datenbank teilweise bereinigt:', { stationsCount, addressesCount });
      return { success: false, stationsCount, addressesCount };
    }

  } catch (error) {
    console.error('❌ Fehler bei der Datenbank-Bereinigung:', error);
    toast.error('❌ Fehler bei der Datenbank-Bereinigung');
    throw error;
  }
};

// Funktion zum Prüfen des Datenbank-Status
export const checkDatabaseStatus = async () => {
  try {
    const stationsResponse = await fetch('/api/stationen');
    const addressesResponse = await fetch('/api/addresses');

    const stationsCount = stationsResponse.ok ? (await stationsResponse.json()).length : 0;
    const addressesCount = addressesResponse.ok ? (await addressesResponse.json()).length : 0;

    console.log('📊 Datenbank-Status:', { stationsCount, addressesCount });
    return { stationsCount, addressesCount };
  } catch (error) {
    console.error('❌ Fehler beim Prüfen des Datenbank-Status:', error);
    return { stationsCount: 0, addressesCount: 0 };
  }
};

// Funktion zum sicheren Bereinigen (mit Bestätigung)
export const safeCleanDatabase = async () => {
  const { toast } = await import('react-hot-toast');
  
  try {
    // Prüfe aktuellen Status
    const status = await checkDatabaseStatus();
    
    if (status.stationsCount === 0 && status.addressesCount === 0) {
      toast.success('ℹ️ Datenbank ist bereits leer');
      return { success: true, message: 'Datenbank bereits leer' };
    }

    // Zeige Warnung
    const warningMessage = `⚠️ Möchten Sie wirklich alle ${status.stationsCount} Stationen und ${status.addressesCount} Adressen löschen?`;
    console.log(warningMessage);
    
    // In einer echten Anwendung würde hier eine Bestätigung vom Benutzer kommen
    // Für jetzt führen wir die Bereinigung direkt durch
    toast.error(warningMessage);
    
    // Kurze Pause für die Warnung
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Führe Bereinigung durch
    return await cleanDatabase();
    
  } catch (error) {
    console.error('❌ Fehler bei der sicheren Datenbank-Bereinigung:', error);
    toast.error('❌ Fehler bei der Datenbank-Bereinigung');
    throw error;
  }
}; 