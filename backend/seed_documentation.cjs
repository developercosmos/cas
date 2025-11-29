const { Pool } = require('pg');

async function seedDocumentation() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    console.log('Seeding User Access Management documentation...');
    
    // Read and execute the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'src/plugins/user-access-management/20251129_seed_documentation.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Documentation seeded successfully');
    
    // Verify insertion
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM plugin.plugin_documentation 
      WHERE plugin_id = 'user-access-management'
    `);
    
    console.log(`✅ ${result.rows[0].count} documentation records inserted`);
    
  } catch (error) {
    console.error('❌ Error seeding documentation:', error.message);
  } finally {
    await pool.end();
  }
}

seedDocumentation();
