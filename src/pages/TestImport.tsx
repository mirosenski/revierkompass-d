import React, { useState } from 'react';
import { importAllStationsWithWarning, showAddressStats, testAPIConnection } from '@/scripts/import-addresses';

const TestImport: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleImport = async () => {
    setIsImporting(true);
    setResult('Import gestartet...');
    
    try {
      const stats = showAddressStats();
      console.log('📊 Verfügbare Adressen:', stats);
      
      const dbCount = await testAPIConnection();
      console.log('📊 Aktuell in DB:', dbCount);
      
      const importResult = await importAllStationsWithWarning();
      console.log('📊 Import Ergebnis:', importResult);
      
      setResult(`Import abgeschlossen! ${importResult.totalCreated} Stationen erstellt, ${importResult.totalErrors} Fehler.`);
    } catch (error) {
      console.error('Import fehlgeschlagen:', error);
      setResult(`Import fehlgeschlagen: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Adress-Import Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Verfügbare Adressen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Es sind <strong>200 Adressen</strong> in 14 Städten verfügbar:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Aalen: 14 Adressen</li>
            <li>• Freiburg: 18 Adressen</li>
            <li>• Heilbronn: 17 Adressen</li>
            <li>• Karlsruhe: 16 Adressen</li>
            <li>• Konstanz: 17 Adressen</li>
            <li>• Ludwigsburg: 14 Adressen</li>
            <li>• Mannheim: 21 Adressen</li>
            <li>• Offenburg: 13 Adressen</li>
            <li>• Pforzheim: 11 Adressen</li>
            <li>• Ravensburg: 11 Adressen</li>
            <li>• Reutlingen: 18 Adressen</li>
            <li>• Stuttgart: 12 Adressen</li>
            <li>• Ulm: 15 Adressen</li>
            <li>• Einsatz-Adressen: 3 Adressen</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Import starten
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Klicken Sie auf den Button, um alle verfügbaren Adressen in die Datenbank zu importieren.
            Der Import kann einige Minuten dauern.
          </p>
          
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isImporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Importiere...</span>
              </>
            ) : (
              <>
                <span>Alle Adressen importieren</span>
              </>
            )}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ergebnis:</h3>
              <p className="text-gray-600 dark:text-gray-400">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestImport; 