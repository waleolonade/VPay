const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationFile = process.argv[2] || 'create_business_tables.sql';
    console.log(`📊 Reading migration file: ${migrationFile}...`);
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running migration...\n');
    
    // Remove comments and split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      try {
        const [result] = await pool.query(statement);
        console.log(`    ✓ Success`);
      } catch (error) {
        console.error(`    ✗ Error: ${error.message}`);
        if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
          console.log('    ℹ Already exists, continuing...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed!');
    
    // Verify table was created
    const [rows] = await pool.query("SHOW TABLES LIKE 'business_requests'");
    if (rows.length > 0) {
      console.log('✓ Verified: business_requests table exists');
      
      // Show column count
      const [cols] = await pool.query('DESCRIBE business_requests');
      console.log(`✓ Table has ${cols.length} columns`);
    } else {
      console.error('✗ Warning: business_requests table not found!');
    }
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    pool.end();
    process.exit(1);
  }
}

runMigration();
