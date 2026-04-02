/**
 * Test script to verify savings summary functionality
 * Run: node VPay-Backend/scripts/test-savings-summary.js
 */

require('dotenv').config();
const { pool } = require('../config/database');
const Savings = require('../models/Savings');

async function testSavingsSummary() {
  console.log('\n🔍 Testing Savings Summary Functionality...\n');

  try {
    // Test 1: Check if savings table exists
    console.log('1️⃣ Checking if savings table exists...');
    const [tables] = await pool.query("SHOW TABLES LIKE 'savings'");
    if (tables.length === 0) {
      console.error('❌ Savings table does not exist! Please run the schema migration.');
      process.exit(1);
    }
    console.log('✅ Savings table exists\n');

    // Test 2: Check table structure
    console.log('2️⃣ Checking savings table structure...');
    const [columns] = await pool.query('DESCRIBE savings');
    const requiredColumns = ['current_balance', 'interest_earned', 'user_id', 'status'];
    const columnNames = columns.map(col => col.Field);
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    if (missingColumns.length > 0) {
      console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
      process.exit(1);
    }
    console.log('✅ All required columns present\n');

    // Test 3: Test getSummary method with a test user
    console.log('3️⃣ Testing getSummary method...');
    
    // Get a sample user (first user in database)
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('⚠️  No users found in database. Skipping summary test.');
    } else {
      const testUserId = users[0].id;
      console.log(`   Using test user ID: ${testUserId}`);
      
      const summary = await Savings.getSummary(testUserId);
      console.log('   Summary result:', JSON.stringify(summary, null, 2));
      
      if (typeof summary.totalBalance === 'number' && 
          typeof summary.totalInterest === 'number' &&
          typeof summary.activePlans === 'number' &&
          typeof summary.totalPlans === 'number') {
        console.log('✅ getSummary returns correct structure\n');
      } else {
        console.error('❌ getSummary returned invalid structure');
        process.exit(1);
      }
    }

    // Test 4: Test SQL query directly
    console.log('4️⃣ Testing raw SQL query...');
    const sql = `
      SELECT 
        COALESCE(SUM(current_balance), 0) as totalBalance,
        COALESCE(SUM(interest_earned), 0) as totalInterest,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans,
        COUNT(*) as totalPlans
      FROM savings 
      WHERE user_id = ?
    `;
    const testUserId = users.length > 0 ? users[0].id : 'test-user-id';
    const [rows] = await pool.query(sql, [testUserId]);
    console.log('   Raw query result:', JSON.stringify(rows[0], null, 2));
    console.log('✅ SQL query executed successfully\n');

    console.log('🎉 All tests passed!\n');
    console.log('📋 Summary of endpoints:');
    console.log('   GET  /api/v1/savings          - Get all savings plans');
    console.log('   GET  /api/v1/savings/summary  - Get savings summary');
    console.log('   POST /api/v1/savings          - Create new savings plan');
    console.log('   POST /api/v1/savings/:id/fund - Fund savings plan');
    console.log('   POST /api/v1/savings/:id/withdraw - Withdraw from savings\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testSavingsSummary();
