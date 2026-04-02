const { pool } = require('./config/database');
const fs = require('fs');

async function checkWalletsTable() {
  try {
    const [columns] = await pool.query('DESCRIBE users');
    const [indexes] = await pool.query('SHOW INDEX FROM users');
    
    const report = {
      columns,
      indexes
    };
    
    fs.writeFileSync('users-report.json', JSON.stringify(report, null, 2));
    console.log('Report written to users-report.json');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkWalletsTable();
