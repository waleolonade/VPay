const { pool } = require('./config/database');

async function checkAdmins() {
  try {
    console.log('\n📋 Checking admins table:\n');
    
    // Get table columns
    const [cols] = await pool.query('DESCRIBE admins');
    console.log('Columns:', cols.map(c => c.Field).join(', '));
    console.log('');
    
    // Check admins
    const [admins] = await pool.query('SELECT id, email FROM admins LIMIT 10');
    console.log(`Found ${admins.length} admin(s):`);
    console.log(admins);
    
    if (admins.length === 0) {
      console.log('\n⚠️  No admins found! Admin sessions cannot be created without an admin record.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdmins();
