const axios = require('axios');

async function testBackendEndpoint() {
  try {
    console.log('🧪 Testing Backend API Endpoint\n');
    
    // First, login to get a token
    console.log('1️⃣ Logging in as wale8196@gmail.com...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'wale8196@gmail.com',
      password: 'Test1234' // Use your actual password
    });
    
    if (!loginRes.data.success) {
      console.log('❌ Login failed:', loginRes.data.message);
      console.log('   Please update the password in the test script');
      return;
    }
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 20) + '...\n');
    
    // Test wallet details endpoint
    console.log('2️⃣ Fetching wallet details...');
    const walletRes = await axios.get('http://localhost:5000/api/v1/wallet/details', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Wallet API Response:\n');
    console.log(JSON.stringify(walletRes.data, null, 2));
    
    if (walletRes.data.success) {
      const personalAccount = walletRes.data.data.accounts.find(a => a.type === 'personal');
      if (personalAccount) {
        console.log('\n💰 Personal Account:');
        console.log('   Account Number:', personalAccount.accountNumber);
        console.log('   Balance:', `₦${Number(personalAccount.balance).toLocaleString()}`);
        console.log('   Account Name:', personalAccount.accountName);
        
        if (personalAccount.accountNumber === '4510464657') {
          console.log('\n✅ Correct account! Balance should show:', `₦${Number(personalAccount.balance).toLocaleString()}`);
        }
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running!');
      console.error('   Start it with: cd VPay-Backend && npm start');
    } else if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testBackendEndpoint();
