describe('Navigation Database Migration', () => {
  test('should create navigation tables', async () => {
    // This test will verify tables exist after migration
    const db = require('../../backend/dist/services/DatabaseService.js');
    
    try {
      // Test navigation_modules table exists
      const modulesTable = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'plugin'
          AND table_name = 'navigation_modules'
        ) as exists
      `);

      expect(modulesTable?.exists).toBe(true);

      // Test navigation_config table exists  
      const configTable = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'plugin'
          AND table_name = 'navigation_config'
        ) as exists
      `);

      expect(configTable?.exists).toBe(true);

      console.log('✅ Navigation database tables created successfully');
    } catch (error) {
      console.error('❌ Navigation database test failed:', error);
      process.exit(1);
    }
  });
});
