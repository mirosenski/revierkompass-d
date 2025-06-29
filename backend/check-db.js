const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    // Alle Stationen anzeigen
    const stations = await prisma.policeStation.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        city: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('📋 Alle Stationen in der Datenbank:');
    stations.forEach(station => {
      console.log(`  - ${station.name} (${station.type}) - ID: ${station.id} - Parent: ${station.parentId || 'kein'}`);
    });
    
    // Speziell nach Test Revier suchen
    const testStations = await prisma.policeStation.findMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });
    
    console.log('\n🔍 Test-Stationen:');
    testStations.forEach(station => {
      console.log(`  - ${station.name} (${station.type}) - ID: ${station.id}`);
    });
    
    // Stuttgart Reviere
    const stuttgartReviere = await prisma.policeStation.findMany({
      where: {
        parentId: 'pp-stuttgart-1'
      }
    });
    
    console.log('\n🏢 Stuttgart Reviere:');
    stuttgartReviere.forEach(station => {
      console.log(`  - ${station.name} (${station.type}) - ID: ${station.id}`);
    });
    
  } catch (error) {
    console.error('Fehler beim Prüfen der Datenbank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 