const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

let token = '';

async function test() {
  try {
    console.log('🚀 Starting Verification Tests...');

    // 1. Login to get token (using default admin)
    console.log('\n🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testuser@vpay.com',
      password: 'Password@123'
    });


    token = loginRes.data.data.accessToken;

    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test QR Transactions
    console.log('\n🔍 Testing GET /qr...');
    const qrRes = await axios.get(`${API_URL}/qr`, { headers });
    console.log(`✅ QR Transactions: ${qrRes.data.data.length} found`);

    // 3. Test Payment Links
    console.log('\n🔗 Testing Payment Links...');
    const createPLRes = await axios.post(`${API_URL}/payment-links`, {
      amount: 1500,
      description: 'Test Payment Link'
    }, { headers });
    console.log(`✅ Created Payment Link: ${createPLRes.data.data.slug}`);

    const getPLRes = await axios.get(`${API_URL}/payment-links`, { headers });
    console.log(`✅ Fetched Payment Links: ${getPLRes.data.data.length} found`);

    // 4. Test Split Payments
    console.log('\n🍕 Testing Split Payments...');
    // Get another user for split
    const usersRes = await axios.get(`${API_URL}/admin/users`, { headers });
    const otherUser = usersRes.data.data.find(u => u.email !== 'admin@vpay.ng');
    
    if (otherUser) {
      const createSplitRes = await axios.post(`${API_URL}/splits`, {
        title: 'Team Lunch',
        totalAmount: 5000,
        members: [{ userId: otherUser.id, amountOwed: 2500 }]
      }, { headers });
      console.log(`✅ Created Split Group: ${createSplitRes.data.data.id}`);

      const getSplitsRes = await axios.get(`${API_URL}/splits`, { headers });
      console.log(`✅ Fetched Split Groups: ${getSplitsRes.data.data.length} found`);
    } else {
      console.log('⚠️ No other users found to test Split Payments');
    }

    console.log('\n✨ All backend tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
  }
}

test();
