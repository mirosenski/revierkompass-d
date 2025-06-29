import { prisma } from '../lib/prisma';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing stations
    console.log('🗑️ Clearing existing stations...');
    await prisma.policeStation.deleteMany({});
    console.log('✅ Cleared existing stations');

    // Display summary
    const stationCount = await prisma.policeStation.count();

    console.log('\n📊 Database seeding complete!');
    console.log('═══════════════════════════════════');
    console.log(`🏢 Police Stations: ${stationCount}`);
    console.log('═══════════════════════════════════');
    console.log('\n🚀 Ready to start the backend server!');
    console.log('💡 Database is now empty - you can add stations manually');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
