import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, Copy, Clock, MapPin, Route, Zap, BarChart3, Map, Table, Wifi, WifiOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import InteractiveMap from '@/components/map/InteractiveMap';
import OfflineMapComponent from '../map/OfflineMapComponent';
import { useWizardStore } from '@/store/useWizardStore';
import { useAppStore, RouteResult } from '@/lib/store/app-store';
import { useStationStore } from '@/store/useStationStore';
import { routingService } from '@/lib/services/routing-service';
import NoSelectionWarning from './NoSelectionWarning';
import { Station as StationType } from '@/types/station.types';
import { Station as AppStoreStation } from '@/lib/store/app-store';

// Hilfsfunktion zur Konvertierung zwischen Station-Typen
const convertStationType = (station: StationType): AppStoreStation => {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    coordinates: {
      lat: station.coordinates[0],
      lng: station.coordinates[1]
    },
    phone: station.telefon,
    email: '', // Nicht verfügbar in station.types.ts
    type: station.type === 'praesidium' ? 'Präsidium' : 'Revier',
    city: station.city,
    district: '', // Nicht verfügbar in station.types.ts
    openingHours: '', // Nicht verfügbar in station.types.ts
    emergency24h: station.notdienst24h
  };
};

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const Step3PremiumExport: React.FC = () => {
  const { selectedStations, selectedCustomAddresses } = useWizardStore();
  const { wizard: { startAddress }, customAddresses } = useAppStore();
  const { stations } = useStationStore();

  const [routeResults, setRouteResults] = useState<RouteResult[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const calculateRoutes = async () => {
      if (!startAddress || (!selectedStations?.length && !selectedCustomAddresses?.length)) {
        setRouteResults(null);
        return;
      }

      setIsCalculating(true);
      try {
        // Konvertiere Stationen in den erwarteten Typ
        const convertedStations = stations.map(convertStationType);
        
        const routes = await routingService.calculateMultipleRoutes(
          startAddress,
          selectedStations || [],
          selectedCustomAddresses || [],
          convertedStations,
          customAddresses || []
        );

        setRouteResults(routes as unknown as RouteResult[]);
        toast.success('Routenberechnung abgeschlossen!');
      } catch (error) {
        console.error('Routenberechnung fehlgeschlagen:', error);
        toast.error('Fehler bei der Routenberechnung');
        setRouteResults(null);
      } finally {
        setIsCalculating(false);
      }
    };

    if (startAddress && (selectedStations?.length || selectedCustomAddresses?.length)) {
      void calculateRoutes();
    }
  }, [startAddress, selectedStations, selectedCustomAddresses, customAddresses, stations]);

  if (!startAddress || (!selectedStations?.length && !selectedCustomAddresses?.length)) {
    return <NoSelectionWarning />;
  }

  const results = routeResults || [];

  const tabs: Tab[] = [
    { id: 'summary', label: 'Zusammenfassung', icon: BarChart3 },
    { id: 'map', label: 'Interaktive Karte', icon: Map },
    { id: 'offline-map', label: 'Offline-Karte', icon: WifiOff },
    { id: 'table', label: 'Detaillierte Tabelle', icon: Table },
    { id: 'export', label: 'Export-Optionen', icon: Download }
  ];

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Hauptdaten-Arbeitsblatt
    const worksheetData = [
      ['POLIZEI BADEN-WÜRTTEMBERG'],
      ['ROUTENANALYSE - REVIERKOMPASS'],
      ['Exportiert am: ' + new Date().toLocaleString('de-DE')],
      [''],
      ['Ziel', 'Typ', 'Adresse', 'Entfernung (km)', 'Fahrzeit (min)', 'Kraftstoff (L)', 'Kosten (€)', 'Route-Typ'],
      ...(results).map(result => [
        result.destinationName,
        result.destinationType === 'station' ? 'Polizeistation' : 'Eigene Adresse',
        result.address,
        result.distance,
        result.duration,
        result.estimatedFuel,
        result.estimatedCost,
        result.routeType
      ]),
      [''],
      ['ZUSAMMENFASSUNG'],
      ['Gesamtanzahl Ziele:', results.length],
      ['Gesamtentfernung (km):', results.reduce((sum, r) => sum + r.distance, 0).toFixed(1)],
      ['Gesamtfahrzeit (min):', results.reduce((sum, r) => sum + r.duration, 0)],
      ['Gesamtkraftstoff (L):', results.reduce((sum, r) => sum + r.estimatedFuel, 0).toFixed(1)],
      ['Gesamtkosten (€):', results.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(2)]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Spaltenbreiten setzen
    worksheet['!cols'] = [
      { width: 35 }, // Ziel
      { width: 15 }, // Typ
      { width: 40 }, // Adresse
      { width: 15 }, // Entfernung
      { width: 15 }, // Fahrzeit
      { width: 15 }, // Kraftstoff
      { width: 12 }, // Kosten
      { width: 15 }  // Route-Typ
    ];

    // Header-Styling (vereinfacht, da XLSX begrenzte Styling-Optionen hat)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Routenanalyse');
    
    // Zusätzliches Arbeitsblatt mit Metadaten
    const metaData = [
      ['METADATEN'],
      [''],
      ['Export-Information'],
      ['Anwendung:', 'RevierKompass v2.0'],
      ['Organisation:', 'Polizei Baden-Württemberg'],
      ['Export-Datum:', new Date().toLocaleString('de-DE')],
      ['Anzahl Routen:', results.length],
      [''],
      ['Routing-Parameter'],
      ['Provider:', 'OSRM, Valhalla, GraphHopper'],
      ['Optimierung:', 'Multi-Provider Fallback'],
      ['Kraftstoffpreis:', '1.75 €/L (Durchschnitt)'],
      ['Verbrauch:', '9.5 L/100km (Annahme)']
    ];

    const metaWorksheet = XLSX.utils.aoa_to_sheet(metaData);
    metaWorksheet['!cols'] = [{ width: 20 }, { width: 30 }];
    
    XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Metadaten');
    
    // Datei speichern
    const fileName = `Polizei_Routen_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Excel-Datei erfolgreich exportiert!');
  };

  const exportToPDF = () => {
    // Vereinfachter PDF-Export (in production würde hier jsPDF oder ähnliches verwendet)
    const content = results.map(result =>
      `${result.destinationName} | ${result.address} | ${result.distance}km | ${result.duration}min`
    ).join('\n');
    
    const blob = new Blob([
      'POLIZEI BADEN-WÜRTTEMBERG - ROUTENANALYSE\n',
      '=====================================\n\n',
      content,
      '\n\nExportiert am: ' + new Date().toLocaleString('de-DE')
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Polizei_Routen_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('PDF-Export simuliert (TXT-Datei)');
  };

  const exportToCSV = () => {
    const headers = ['Ziel', 'Typ', 'Adresse', 'Entfernung_km', 'Fahrzeit_min', 'Kraftstoff_L', 'Kosten_EUR', 'Route_Typ'];
    const csvContent = [
      headers.join(','),
      ...results.map(result =>
        [
          `"${result.destinationName}"`,
          result.destinationType === 'station' ? 'Polizeistation' : 'Eigene_Adresse',
          `"${result.address}"`,
          result.distance,
          result.duration,
          result.estimatedFuel,
          result.estimatedCost,
          result.routeType
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Polizei_Routen_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('CSV-Datei erfolgreich exportiert!');
  };

  const copyToClipboard = () => {
    const content = results.map(result =>
      `${result.destinationName}\t${result.address}\t${result.distance} km\t${result.duration} min`
    ).join('\n');
    
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Daten in Zwischenablage kopiert!');
    }).catch(() => {
      toast.error('Fehler beim Kopieren in die Zwischenablage');
    });
  };

  const getExportHandler = () => {
    switch (exportFormat) {
      case 'excel': return exportToExcel;
      case 'pdf': return exportToPDF;
      case 'csv': return exportToCSV;
      default: return exportToExcel;
    }
  };

  const totalDistance = results.reduce((sum, r) => sum + r.distance, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const totalFuel = results.reduce((sum, r) => sum + r.estimatedFuel, 0);
  const totalCost = results.reduce((sum, r) => sum + r.estimatedCost, 0);

  const renderTableTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h3 className="text-xl font-bold">Detaillierte Routenergebnisse</h3>
        <p className="text-blue-100 mt-1">
          Optimierte Routen zu allen ausgewählten Zielen
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Ziel</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Typ</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Adresse</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Entfernung</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Fahrzeit</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Kraftstoff</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Kosten</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Route-Typ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {results.map((result, index) => (
              <motion.tr
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: result.color }}
                    />
                    {result.destinationName}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.destinationType === 'station'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  }`}>
                    {result.destinationType === 'station' ? 'Polizeistation' : 'Eigene Adresse'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {result.address}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {result.distance.toFixed(1)} km
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {result.duration} min
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {result.estimatedFuel.toFixed(1)} L
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  €{result.estimatedCost.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.routeType === 'Schnellste' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      : result.routeType === 'Kürzeste'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  }`}>
                    {result.routeType}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderExportTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Premium Export-Optionen
      </h3>
      
      {/* Export Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Export-Format auswählen:
        </label>
        <div className="flex space-x-4">
          {[
            { id: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: 'green' },
            { id: 'pdf', label: 'PDF (.pdf)', icon: FileText, color: 'red' },
            { id: 'csv', label: 'CSV (.csv)', icon: FileSpreadsheet, color: 'blue' }
          ].map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  exportFormat === format.id
                    ? `border-${format.color}-500 bg-${format.color}-50 dark:bg-${format.color}-900/20 text-${format.color}-700 dark:text-${format.color}-300`
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{format.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={getExportHandler()}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FileSpreadsheet className="h-5 w-5" />
          <span>Premium Export</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyToClipboard}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Copy className="h-5 w-5" />
          <span>Zwischenablage</span>
        </motion.button>
        
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FileText className="h-5 w-5" />
          <span>CSV Export</span>
        </button>
        
        <button
          onClick={exportToPDF}
          className="flex items-center justify-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <FileText className="h-5 w-5" />
          <span>PDF Export</span>
        </button>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'map':
        return renderMapTab();
      case 'offline-map':
        return renderOfflineMapTab();
      case 'table':
        return renderTableTab();
      case 'export':
        return renderExportTab();
      default:
        return renderSummaryTab();
    }
  };

  const renderSummaryTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {results.length}
                </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ziele</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <Route className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {totalDistance.toFixed(1)} km
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtstrecke</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtzeit</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                €{totalCost.toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Geschätzte Kosten</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Routenübersicht
        </h3>
        <div className="space-y-3">
            {results.map((result, index) => (
            <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: result.color }}
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result.destinationName}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {result.address}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {result.distance.toFixed(1)} km
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {result.duration} min
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderMapTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
        <InteractiveMap
          routeResults={routeResults || []}
          startAddress={startAddress?.fullAddress || ''}
          startCoordinates={startAddress?.coordinates || { lat: 0, lng: 0 }}
        />
    </motion.div>
  );

  const renderOfflineMapTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <WifiOff className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Offline-Kartenfunktionen für Baden-Württemberg
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
              Diese Karte bietet erweiterte Offline-Funktionen speziell für den Einsatz in Baden-Württemberg. 
              Alle Kartendaten, Routing-Profile und NBAN-Zonen sind lokal verfügbar.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-blue-800 dark:text-blue-200">Offline-Kacheln</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-blue-800 dark:text-blue-200">Lokales Routing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-blue-800 dark:text-blue-200">NBAN-Zonen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-blue-800 dark:text-blue-200">Einsatz-Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        <OfflineMapComponent
          routeResults={routeResults || []}
          startAddress={startAddress?.fullAddress || ''}
          startCoordinates={startAddress?.coordinates || { lat: 0, lng: 0 }}
          showOfflineControls={true}
          onRouteRecalculate={(routeId, profile) => {
          // Hier würde die Route mit dem neuen Profil neu berechnet
          console.log(`Recalculating route ${routeId} with profile ${profile}`);
          // In einer echten Implementierung würden hier die Routen-Daten aktualisiert
        }}
      />
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-2xl shadow-lg">
            <Download className="h-8 w-8 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Export & Ergebnisse
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Ihre Routenergebnisse sind bereit zum Export
            </p>
          </div>
        </div>
      </motion.div>

      {/* Calculation Status */}
      {isCalculating ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold mb-2">Routenberechnung läuft...</h3>
          <p className="text-blue-100">
            Multi-Provider Routing wird durchgeführt (OSRM, Valhalla, GraphHopper)
          </p>
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Geschätzte Zeit: 3-5 Sekunden</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Optimale Routen werden berechnet</span>
            </div>
          </div>
        </motion.div>
      ) : (
        routeResults && (
          <>
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2"
          >
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="min-h-[600px]"
          >
            {renderTabContent()}
          </motion.div>
          </>
        )
      )}
    </div>
  );
};

export default Step3PremiumExport;