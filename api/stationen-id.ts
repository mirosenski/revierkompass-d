import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

// Prisma Client initialisieren
const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStation(req, res);
      case 'PUT':
        return await updateStation(req, res);
      case 'DELETE':
        return await deleteStation(req, res);
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

async function getStation(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Station ID ist erforderlich' });
  }

  try {
    const station = await prisma.policeStation.findUnique({
      where: { id: id }
    });
    
    if (!station) {
      return res.status(404).json({ error: 'Station nicht gefunden' });
    }
    
    const processedStation = {
      ...station,
      coordinates: station.coordinates ? JSON.parse(station.coordinates) : null
    };
    
    res.json(processedStation);
  } catch (error) {
    console.log('Datenbank nicht verfügbar für Station ID:', id);
    res.status(503).json({ error: 'Datenbank nicht verfügbar' });
  }
}

async function updateStation(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Station ID ist erforderlich' });
  }

  try {
    const updatedStation = await prisma.policeStation.update({
      where: { id: id },
      data: {
        ...req.body,
        coordinates: req.body.coordinates ? JSON.stringify(req.body.coordinates) : null
      }
    });
    
    const processedStation = {
      ...updatedStation,
      coordinates: updatedStation.coordinates ? JSON.parse(updatedStation.coordinates) : null
    };
    
    res.json(processedStation);
  } catch (error) {
    res.status(503).json({ error: 'Datenbank nicht verfügbar' });
  }
}

async function deleteStation(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Station ID ist erforderlich' });
  }

  try {
    await prisma.policeStation.delete({
      where: { id: id }
    });
    
    res.status(204).end();
  } catch (error) {
    res.status(503).json({ error: 'Datenbank nicht verfügbar' });
  }
} 