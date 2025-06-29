import { VercelResponse } from '@vercel/node';

export function handleError(error: any, res: VercelResponse) {
  console.error('API Error:', error);
  
  // Prisma-spezifische Fehler
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Eintrag bereits vorhanden' });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Eintrag nicht gefunden' });
  }
  
  if (error.code === 'P2003') {
    return res.status(400).json({ error: 'Ungültige Referenz' });
  }
  
  // Datenbankverbindungsfehler
  if (error.code === 'P1001' || error.code === 'P1008') {
    return res.status(503).json({ error: 'Datenbank nicht verfügbar' });
  }
  
  // Standard-Fehler
  return res.status(500).json({ 
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
} 