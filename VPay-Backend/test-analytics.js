const { pool } = require('./config/database');
const BusinessAnalytics = require('./models/BusinessAnalytics');

async function testAnalytics() {
  try {
    console.log('🧪 Testing Business Analytics queries...\n');
    
    // Get a business user ID from the database
    const [users] = await pool.query(
      'SELECT id, email, is_business FROM users WHERE is_business = TRUE LIMIT 1'
    );
    
    if (users.length === 0) {
      console.log('⚠️  No business users found. Creating test scenario with first user...');
      const [firstUser] = await pool.query('SELECT id, email FROM users LIMIT 1');
      
      if (firstUser.length === 0) {
        console.log('❌ No users found in database');
        pool.end();
        return;
      }
      
      const userId = firstUser[0].id;
      console.log(`Testing with user: ${firstUser[0].email} (${userId})\n`);
      
      console.log('1️⃣ Testing getOverview...');
      const overview = await BusinessAnalytics.getOverview(userId);
      console.log('   ✅ Success:', JSON.stringify(overview, null, 2));
      
      console.log('\n2️⃣ Testing getMonthlyTrends...');
      const trends = await BusinessAnalytics.getMonthlyTrends(userId, 3);
      console.log('   ✅ Success: Found', trends.length, 'months');
      
      console.log('\n3️⃣ Testing getTopCustomers...');
      const customers = await BusinessAnalytics.getTopCustomers(userId, 5);
      console.log('   ✅ Success: Found', customers.length, 'customers');
      
      console.log('\n4️⃣ Testing getCategoryBreakdown...');
      const categories = await BusinessAnalytics.getCategoryBreakdown(userId);
      console.log('   ✅ Success: Found', categories.length, 'categories');
      
      console.log('\n5️⃣ Testing getRecentActivity...');
      const activity = await BusinessAnalytics.getRecentActivity(userId, 10);
      console.log('   ✅ Success: Found', activity.length, 'transactions');
      
      console.log('\n6️⃣ Testing getGrowthRate...');
      const growth = await BusinessAnalytics.getGrowthRate(userId);
      console.log('   ✅ Success:', JSON.stringify(growth, null, 2));
      
      console.log('\n✅ All analytics queries completed successfully!');
      console.log('   No wallet_type errors found.');
      
    } else {
      const userId = users[0].id;
      console.log(`Using business user: ${users[0].email} (${userId})\n`);
      
      console.log('1️⃣ Testing getOverview...');
      const overview = await BusinessAnalytics.getOverview(userId);
      console.log('   ✅ Success');
      
      console.log('2️⃣ Testing all other methods...');
      await BusinessAnalytics.getMonthlyTrends(userId, 6);
      await BusinessAnalytics.getTopCustomers(userId, 10);
      await BusinessAnalytics.getCategoryBreakdown(userId);
      await BusinessAnalytics.getRecentActivity(userId, 20);
      await BusinessAnalytics.getGrowthRate(userId);
      console.log('   ✅ All methods executed successfully');
      
      console.log('\n✅ All tests passed! No wallet_type errors.');
    }
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
    pool.end();
    process.exit(1);
  }
}

testAnalytics();
