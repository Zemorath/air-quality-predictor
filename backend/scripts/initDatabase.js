const Database = require('../database');

async function initializeDatabase() {
    const database = new Database();
    
    try {
        console.log('Initializing database...');
        await database.init();
        console.log('✅ Database initialized successfully!');
        
        // Check if data was inserted
        const locations = await database.getLocations();
        console.log(`📍 ${locations.length} locations available in database`);
        
        locations.forEach(location => {
            console.log(`   - ${location.name} (${location.latitude}, ${location.longitude})`);
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

initializeDatabase();
