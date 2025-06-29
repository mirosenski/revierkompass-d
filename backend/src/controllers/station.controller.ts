import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Alle Stationen
export const getStations = async (where: any = {}, take: number = 50) => {
  return prisma.policeStation.findMany({
    where,
    take,
    orderBy: { name: 'asc' }
  });
};

// POST: Neue Station erstellen
export const createStation = async (data: any) => {
  // Koordinaten als String formatieren
  if (data.coordinates && typeof data.coordinates === 'object') {
    data.coordinates = `${data.coordinates.lat},${data.coordinates.lng}`;
  }

  return prisma.policeStation.create({
    data: {
      ...data,
      isActive: data.isActive !== false, // Standard: true
      lastModified: new Date()
    }
  });
};

// PUT: Station aktualisieren
export const updateStation = async (id: string, data: any) => {
  // Koordinaten-Update
  if (data.coordinates && typeof data.coordinates === 'object') {
    data.coordinates = `${data.coordinates.lat},${data.coordinates.lng}`;
  }

  return prisma.policeStation.update({
    where: { id },
    data: {
      ...data,
      lastModified: new Date()
    }
  });
};

// DELETE: Station löschen
export const deleteStation = async (id: string) => {
  await prisma.policeStation.delete({ where: { id } });
}; 