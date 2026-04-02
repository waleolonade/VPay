const { pool } = require('./config/database');

async function checkUsersTable() {
  try {
    const [cols] = await pool.query('DESCRIBE users');
    console.log('Users table structure:');
    console.log('Column | Type | Key | Null | Default | Extra');
    console.log('-------|------|-----|------|---------|------');
    cols.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Key} | ${col.Null} | ${col.Default} | ${col.Extra}`);
    });
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

checkUsersTable();
