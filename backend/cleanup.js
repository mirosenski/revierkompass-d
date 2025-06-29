const { PrismaClient } = require('@prisma/client');

async function cleanup() {
  const prisma = new PrismaClient();
  
  try {
    // Lösche alle Stationen mit NaN-IDs
    const result = await prisma.policeStation.deleteMany({
      where: {
        id: 'NaN'
      }
    });
    
    console.log(`✅ ${result.count} fehlerhafte Einträge gelöscht`);
    
    // Zeige alle verbleibenden Stationen
    const stations = await prisma.policeStation.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        city: true
      }
    });
    
    console.log('📋 Verbleibende Stationen:');
    stations.forEach(station => {
      console.log(`  - ${station.name} (${station.type}) - ID: ${station.id}`);
    });
    
  } catch (error) {
    console.error('Fehler beim Cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup(); 