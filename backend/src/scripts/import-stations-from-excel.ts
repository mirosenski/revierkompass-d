import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma';

interface ExcelRow {
  name: string;
  address: string;
  city: string;
  zipCode?: string;
  coordinates?: string;
  type: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isEmergency?: boolean;
  zustaendigkeitsbereich?: string;
  praesidiumId?: string;
}

function parseCoordinates(value: string | undefined): { lat: number; lng: number } {
  if (!value) return { lat: 0, lng: 0 };
  const [latStr, lngStr] = value.split(',');
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  return {
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
  };
}

async function importStations() {
  const filePath = path.join(__dirname, '../../../public/data/polizeiReviere.xlsx');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Excel file not found:', filePath);
    process.exit(1);
  }

  console.log('🚔 Importing police stations from Excel...');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📄 Found ${rows.length} stations in Excel file`);

  await prisma.policeStation.deleteMany({});
  console.log('🗑️ Cleared existing stations');

  let imported = 0;

  for (const row of rows) {
    if (!row.name || !row.address || !row.city) continue;

    try {
      await prisma.policeStation.create({
        data: {
          name: row.name,
          address: row.address,
          city: row.city,
          zipCode: row.zipCode || '',
          coordinates: parseCoordinates(row.coordinates || (row as any).koordinaten),
          type: row.type.toLowerCase() === 'präsidium' ? 'präsidium' : 'revier',
          phone: row.phone || (row as any).telefon || null,
          email: row.email || null,
          openingHours: row.openingHours || (row as any).oeffnungszeiten || null,
          isEmergency: row.isEmergency ?? (row as any).notfall ?? false,
          responsibilityArea: row.zustaendigkeitsbereich || null,
          praesidiumId: row.praesidiumId || null,
        },
      });
      imported++;
    } catch (error) {
      console.warn(`⚠️ Failed to import station ${row.name}:`, error);
    }
  }

  console.log(`✅ Imported ${imported} stations`);
  await prisma.$disconnect();
}

importStations().catch((e) => {
  console.error(e);
  process.exit(1);
});
