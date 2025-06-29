import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../api/lib/error-handler';

// Prisma Client initialisieren
const prisma = new PrismaClient();

// Temporäre statische Daten für Polizeistationen
const staticStations = [
  {
    id: 1,
    name: "Polizeipräsidium Stuttgart",
    address: "Taubenheimstraße 85, 70372 Stuttgart",
    coordinates: { lat: 48.7758, lng: 9.1829 },
    phone: "0711 8990-0",
    email: "poststelle.pp.stuttgart@polizei.bwl.de"
  },
  {
    id: 2,
    name: "Polizeipräsidium Karlsruhe",
    address: "Erbprinzenstraße 96, 76133 Karlsruhe",
    coordinates: { lat: 49.0069, lng: 8.4037 },
    phone: "0721 666-0",
    email: "poststelle.pp.karlsruhe@polizei.bwl.de"
  },
  {
    id: 3,
    name: "Polizeipräsidium Mannheim",
    address: "Collinistraße 1, 68161 Mannheim",
    coordinates: { lat: 49.4875, lng: 8.4660 },
    phone: "0621 174-0",
    email: "poststelle.pp.mannheim@polizei.bwl.de"
  },
  {
    id: 4,
    name: "Polizeipräsidium Freiburg",
    address: "Basler Landstraße 113, 79111 Freiburg",
    coordinates: { lat: 47.9990, lng: 7.8421 },
    phone: "0761 882-0",
    email: "poststelle.pp.freiburg@polizei.bwl.de"
  },
  {
    id: 5,
    name: "Polizeipräsidium Heilbronn",
    address: "Cäcilienstraße 56, 74072 Heilbronn",
    coordinates: { lat: 49.1406, lng: 9.2185 },
    phone: "07131 104-0",
    email: "poststelle.pp.heilbronn@polizei.bwl.de"
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStations(req, res);
      case 'POST':
        return await createStation(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function getStations(req: VercelRequest, res: VercelResponse) {
  try {
    // Versuche zuerst die Datenbank zu verwenden
    const stations = await prisma.policeStation.findMany({
      orderBy: { name: 'asc' }
    });
    
    const processedStations = stations.map(station => ({
      ...station,
      coordinates: station.coordinates ? JSON.parse(station.coordinates) : null
    }));
    
    res.json(processedStations);
  } catch (error) {
    // Fallback zu statischen Daten wenn Datenbank nicht verfügbar
    console.log('Datenbank nicht verfügbar, verwende statische Daten');
    res.json(staticStations);
  }
}

async function createStation(req: VercelRequest, res: VercelResponse) {
  try {
    const { id, ...stationData } = req.body;
    
    // Validierung
    if (!stationData.name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    
    const newStation = await prisma.policeStation.create({
      data: {
        ...stationData,
        coordinates: stationData.coordinates ? JSON.stringify(stationData.coordinates) : null
      }
    });
    
    const processedStation = {
      ...newStation,
      coordinates: newStation.coordinates ? JSON.parse(newStation.coordinates) : null
    };
    
    res.status(201).json(processedStation);
  } catch (error) {
    // Fallback für POST-Requests
    res.status(503).json({ error: 'Datenbank nicht verfügbar' });
  }
} 