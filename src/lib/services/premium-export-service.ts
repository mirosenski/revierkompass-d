import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RouteResult, Address, Station, CustomAddress } from '../store/app-store';

export interface ExportOptions {
  includeMap?: boolean;
  includeMetadata?: boolean;
  corporateDesign?: boolean;
  format?: 'excel' | 'csv' | 'pdf' | 'json';
}

export interface ExportData {
  Ziel: string;
  Typ: string;
  Adresse: string;
  Stadt: string;
  Entfernung_km: string;
  Fahrzeit_min: string;
  Route_Typ: string;
  Koordinaten_Lat: number;
  Koordinaten_Lng: number;
  Erstellt_am: string;
}

export interface MetaData {
  exportiert_am: string;
  exportiert_von: string;
  startadresse: string;
  anzahl_ziele: number;
  kuerzeste_entfernung_km: string;
  laengste_entfernung_km: string;
  durchschnittliche_entfernung_km: string;
  kuerzeste_fahrtzeit_min: string;
  laengste_fahrtzeit_min: string;
  durchschnittliche_fahrtzeit_min: string;
  verwendete_routing_provider: string[];
  system_version: string;
}

class PremiumExportService {
  // Premium Excel Export with Corporate Design
  async exportToPremiumExcel(
    routeResults: RouteResult[],
    startAddress: Address,
    allStations: Station[],
    customAddresses: CustomAddress[],
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const wb = XLSX.utils.book_new();
      
      // Main data sheet with premium formatting
      const exportData = this.prepareExportData(routeResults, allStations, customAddresses);
      const ws = this.createPremiumMainSheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Routenergebnisse');

      // Metadata sheet with corporate branding
      if (options.includeMetadata !== false) {
        const metaData = this.createMetaData(routeResults, startAddress);
        const metaWs = this.createCorporateInfoSheet(metaData);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Informationen');
      }

      // Statistics sheet
      const statsWs = this.createStatisticsSheet(routeResults, allStations, customAddresses);
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistiken');

      // Corporate header sheet
      if (options.corporateDesign !== false) {
        const headerWs = this.createPoliceHeaderSheet();
        XLSX.utils.book_append_sheet(wb, headerWs, 'Polizei BW');
      }

      // Export with timestamped filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `RevierKompass_Premium_Export_${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Premium Excel export error:', error);
      throw new Error('Fehler beim Premium Excel-Export');
    }
  }

  // Create premium main sheet with corporate styling
  private createPremiumMainSheet(data: ExportData[]): XLSX.WorkSheet {
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for optimal viewing
    const colWidths = [
      { wch: 45 }, // Ziel
      { wch: 15 }, // Typ
      { wch: 50 }, // Adresse
      { wch: 20 }, // Stadt
      { wch: 15 }, // Entfernung
      { wch: 15 }, // Fahrzeit
      { wch: 18 }, // Route-Typ
      { wch: 12 }, // Lat
      { wch: 12 }, // Lng
      { wch: 20 }  // Erstellt am
    ];
    ws['!cols'] = colWidths;

    // Get the range for styling
    const range = XLSX.utils.decode_range(ws['!ref']!);

    // Apply premium header styling (Polizei Baden-Württemberg colors)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { 
          bold: true, 
          color: { rgb: 'FFFFFF' }, 
          sz: 12,
          name: 'Segoe UI'
        },
        fill: { 
          fgColor: { rgb: '1E40AF' } // Polizei Blau
        },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thick', color: { rgb: '1E3A8A' } },
          bottom: { style: 'thick', color: { rgb: '1E3A8A' } },
          left: { style: 'medium', color: { rgb: '1E3A8A' } },
          right: { style: 'medium', color: { rgb: '1E3A8A' } }
        }
      };
    }

    // Apply alternating row colors with premium styling
    for (let row = 1; row <= range.e.r; row++) {
      const isEven = row % 2 === 0;
      const fillColor = isEven ? 'F8FAFC' : 'FFFFFF'; // Light blue/white alternating
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        // Special formatting for distance and time columns
        let cellStyle: any = {
          fill: { fgColor: { rgb: fillColor } },
          font: { 
            sz: 10,
            name: 'Segoe UI'
          },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } }
          },
          alignment: { vertical: 'center' }
        };

        // Special formatting for numeric columns
        if (col === 4 || col === 5) { // Distance and time columns
          cellStyle.alignment.horizontal = 'right';
          cellStyle.font.bold = true;
        }

        // Special formatting for type column
        if (col === 1) { // Type column
          const cellValue = ws[cellAddress]?.v;
          if (cellValue === 'Präsidium') {
            cellStyle.font.color = { rgb: '7C3AED' }; // Purple for Präsidium
            cellStyle.font.bold = true;
          } else if (cellValue === 'Revier') {
            cellStyle.font.color = { rgb: '2563EB' }; // Blue for Revier
          } else if (cellValue === 'Eigene Adresse') {
            cellStyle.font.color = { rgb: '059669' }; // Green for custom addresses
          }
        }

        ws[cellAddress].s = cellStyle;
      }
    }

    return ws;
  }

  // Prepare export data with proper formatting
  private prepareExportData(
    routeResults: RouteResult[],
    allStations: Station[],
    customAddresses: CustomAddress[]
  ): ExportData[] {
    return routeResults.map(result => {
      let destinationInfo: any = {};
      
      if (result.destinationType === 'station') {
        const station = allStations.find(s => s.id === result.destinationId);
        destinationInfo = {
          name: result.destinationName,
          type: station?.type || 'Station',
          address: station?.address || '',
          city: station?.city || '',
          coordinates: station?.coordinates || { lat: 0, lng: 0 }
        };
      } else {
        const customAddr = customAddresses.find(a => a.id === result.destinationId);
        destinationInfo = {
          name: result.destinationName,
          type: 'Eigene Adresse',
          address: customAddr ? `${customAddr.street}, ${customAddr.zipCode} ${customAddr.city}` : '',
          city: customAddr?.city || '',
          coordinates: customAddr?.coordinates || { lat: 0, lng: 0 }
        };
      }
      
      return {
        Ziel: destinationInfo.name,
        Typ: destinationInfo.type,
        Adresse: destinationInfo.address,
        Stadt: destinationInfo.city,
        Entfernung_km: `${result.distance.toFixed(1)} km`,
        Fahrzeit_min: `${result.duration} min`,
        Route_Typ: result.provider,
        Koordinaten_Lat: Number(destinationInfo.coordinates.lat.toFixed(6)),
        Koordinaten_Lng: Number(destinationInfo.coordinates.lng.toFixed(6)),
        Erstellt_am: new Date().toLocaleString('de-DE')
      };
    });
  }

  // Create metadata with corporate branding
  private createMetaData(routeResults: RouteResult[], startAddress: Address): MetaData {
    const distances = routeResults.map(r => r.distance);
    const durations = routeResults.map(r => r.duration);
    const providers = [...new Set(routeResults.map(r => r.provider))];

    return {
      exportiert_am: new Date().toLocaleString('de-DE'),
      exportiert_von: 'RevierKompass v2.0 - Polizei Baden-Württemberg',
      startadresse: startAddress?.fullAddress || 'Nicht verfügbar',
      anzahl_ziele: routeResults.length,
      kuerzeste_entfernung_km: `${Math.min(...distances).toFixed(1)} km`,
      laengste_entfernung_km: `${Math.max(...distances).toFixed(1)} km`,
      durchschnittliche_entfernung_km: `${(distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(1)} km`,
      kuerzeste_fahrtzeit_min: `${Math.min(...durations)} min`,
      laengste_fahrtzeit_min: `${Math.max(...durations)} min`,
      durchschnittliche_fahrtzeit_min: `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} min`,
      verwendete_routing_provider: providers,
      system_version: 'RevierKompass v2.0'
    };
  }

  // Create corporate info sheet
  private createCorporateInfoSheet(metaData: MetaData): XLSX.WorkSheet {
    const data = Object.entries(metaData).map(([key, value]) => ({
      Eigenschaft: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      Wert: Array.isArray(value) ? value.join(', ') : value.toString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Style the info sheet
    ws['!cols'] = [{ wch: 35 }, { wch: 50 }];
    
    // Header styling
    const headerCells = ['A1', 'B1'];
    headerCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '1E40AF' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });
    
    return ws;
  }

  // Create statistics sheet
  private createStatisticsSheet(
    routeResults: RouteResult[],
    allStations: Station[],
    customAddresses: CustomAddress[]
  ): XLSX.WorkSheet {
    const cityStats: any[] = [];
    const cities = new Set<string>();
    
    // Collect all cities
    routeResults.forEach(result => {
      if (result.destinationType === 'station') {
        const station = allStations.find(s => s.id === result.destinationId);
        if (station) cities.add(station.city);
      } else {
        const customAddr = customAddresses.find(a => a.id === result.destinationId);
        if (customAddr) cities.add(customAddr.city);
      }
    });

    // Calculate statistics per city
    cities.forEach(city => {
      const cityRoutes = routeResults.filter(result => {
        if (result.destinationType === 'station') {
          const station = allStations.find(s => s.id === result.destinationId);
          return station?.city === city;
        } else {
          const customAddr = customAddresses.find(a => a.id === result.destinationId);
          return customAddr?.city === city;
        }
      });

      if (cityRoutes.length > 0) {
        cityStats.push({
          Stadt: city,
          Anzahl_Ziele: cityRoutes.length,
          Durchschnittliche_Entfernung_km: `${(cityRoutes.reduce((sum, r) => sum + r.distance, 0) / cityRoutes.length).toFixed(1)} km`,
          Durchschnittliche_Fahrtzeit_min: `${Math.round(cityRoutes.reduce((sum, r) => sum + r.duration, 0) / cityRoutes.length)} min`,
          Naechstes_Ziel: cityRoutes.sort((a, b) => a.distance - b.distance)[0].destinationName
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(cityStats.sort((a, b) => 
      parseFloat(a.Durchschnittliche_Entfernung_km) - parseFloat(b.Durchschnittliche_Entfernung_km)
    ));
    
    ws['!cols'] = [
      { wch: 20 }, // Stadt
      { wch: 15 }, // Anzahl Ziele
      { wch: 25 }, // Durchschnittliche Entfernung
      { wch: 25 }, // Durchschnittliche Fahrtzeit
      { wch: 40 }  // Nächstes Ziel
    ];
    
    return ws;
  }

  // Create police header sheet with branding
  private createPoliceHeaderSheet(): XLSX.WorkSheet {
    const headerData = [
      ['RevierKompass v2.0 - Polizei Baden-Württemberg'],
      ['Professionelle Routing-Anwendung für Polizeieinsätze'],
      [''],
      ['SYSTEM-INFORMATIONEN'],
      [''],
      ['Version', 'RevierKompass v2.0'],
      ['Entwickelt für', 'Polizei Baden-Württemberg'],
      ['Technologie', 'React + TypeScript + MapLibre GL'],
      ['Routing-Provider', 'OSRM, Valhalla, GraphHopper'],
      ['Geocoding', 'Nominatim + Photon Multi-Provider'],
      ['Kartenbasis', 'OpenStreetMap Deutschland'],
      [''],
      ['FEATURES'],
      [''],
      ['Multi-Provider Routing', '✓ Aktiviert'],
      ['Custom Address Management', '✓ Aktiviert'],
      ['Premium Excel Export', '✓ Aktiviert'],
      ['Admin Dashboard', '✓ Aktiviert'],
      ['Dark/Light Mode', '✓ Aktiviert'],
      ['Mobile Responsive', '✓ Aktiviert'],
      ['Offline Karten', '✓ Baden-Württemberg'],
      [''],
      ['KONTAKT & SUPPORT'],
      [''],
      ['E-Mail Support', 'support@revierkompass.de'],
      ['Telefon', '+49 (0) 711 999-1234'],
      ['Website', 'https://ppstuttgart.polizei-bw.de'],
      ['Dokumentation', 'https://docs.revierkompass.de'],
      [''],
      ['© 2025 Polizei Baden-Württemberg - Alle Rechte vorbehalten']
    ];

    const ws = XLSX.utils.aoa_to_sheet(headerData);
    
    // Premium styling for header sheet
    const titleCells = ['A1', 'A2'];
    titleCells.forEach((cell, index) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { 
            bold: true, 
            sz: index === 0 ? 18 : 14, 
            color: { rgb: '1E40AF' },
            name: 'Segoe UI'
          },
          alignment: { horizontal: 'center' }
        };
      }
    });

    // Section headers styling
    const sectionHeaders = ['A4', 'A13', 'A23'];
    sectionHeaders.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { 
            bold: true, 
            sz: 12, 
            color: { rgb: '1E40AF' },
            name: 'Segoe UI'
          },
          fill: { fgColor: { rgb: 'F1F5F9' } }
        };
      }
    });

    ws['!cols'] = [{ wch: 30 }, { wch: 40 }];
    
    return ws;
  }

  // CSV Export
  async exportToCSV(
    routeResults: RouteResult[],
    allStations: Station[],
    customAddresses: CustomAddress[]
  ): Promise<void> {
    try {
      const data = this.prepareExportData(routeResults, allStations, customAddresses);
      
      const headers = Object.keys(data[0]);
      const rows = data.map(row => Object.values(row).map(value => `"${value}"`));
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `RevierKompass_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Fehler beim CSV-Export');
    }
  }

  // Premium PDF Export
  async exportToPremiumPDF(
    routeResults: RouteResult[],
    startAddress: Address,
    allStations: Station[],
    customAddresses: CustomAddress[]
  ): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Premium header with Polizei branding
      pdf.setFillColor(30, 64, 175); // Polizei blue
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text('RevierKompass v2.0', pageWidth / 2, 12, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Polizei Baden-Württemberg', pageWidth / 2, 20, { align: 'center' });

      // Content area
      let yPosition = 35;
      
      // Export information
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.text(`Export erstellt: ${new Date().toLocaleString('de-DE')}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Startadresse: ${startAddress?.fullAddress || 'Nicht verfügbar'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Anzahl Ziele: ${routeResults.length}`, 20, yPosition);
      yPosition += 15;

      // Table header
      const tableStartY = yPosition;
      pdf.setFillColor(30, 64, 175);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('Ziel', 22, yPosition);
      pdf.text('Stadt', 80, yPosition);
      pdf.text('Entfernung', 120, yPosition);
      pdf.text('Fahrzeit', 150, yPosition);
      pdf.text('Typ', 175, yPosition);

      yPosition += 10;
      pdf.setTextColor(0, 0, 0);

      // Table data with alternating row colors
      routeResults.forEach((result, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(20, yPosition - 4, pageWidth - 40, 6, 'F');
        }

        let destinationInfo: any = {};
        if (result.destinationType === 'station') {
          const station = allStations.find(s => s.id === result.destinationId);
          destinationInfo = {
            name: result.destinationName,
            city: station?.city || '',
            type: station?.type || 'Station'
          };
        } else {
          const customAddr = customAddresses.find(a => a.id === result.destinationId);
          destinationInfo = {
            name: result.destinationName,
            city: customAddr?.city || '',
            type: 'Eigene Adresse'
          };
        }

        pdf.text(destinationInfo.name.substring(0, 25), 22, yPosition);
        pdf.text(destinationInfo.city, 80, yPosition);
        pdf.text(`${result.distance.toFixed(1)} km`, 120, yPosition);
        pdf.text(`${result.duration} min`, 150, yPosition);
        pdf.text(destinationInfo.type, 175, yPosition);

        yPosition += 6;
      });

      // Footer with branding
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Seite ${i} von ${totalPages} - RevierKompass v2.0 © Polizei Baden-Württemberg`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `RevierKompass_Premium_Report_${timestamp}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Fehler beim PDF-Export');
    }
  }

  // Copy to clipboard
  async copyToClipboard(
    routeResults: RouteResult[],
    allStations: Station[],
    customAddresses: CustomAddress[]
  ): Promise<void> {
    try {
      const data = this.prepareExportData(routeResults, allStations, customAddresses);
      
      const headers = Object.keys(data[0]).join('\t');
      const rows = data.map(row => Object.values(row).join('\t'));
      const textContent = [headers, ...rows].join('\n');
      
      await navigator.clipboard.writeText(textContent);
      
    } catch (error) {
      console.error('Clipboard error:', error);
      throw new Error('Fehler beim Kopieren in die Zwischenablage');
    }
  }
}

export const premiumExportService = new PremiumExportService();
