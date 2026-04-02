const axios = require('axios');

async function testVPayVerify() {
  const baseUrl = 'http://localhost:3000/api/v1';
  // Note: Needs a valid phone that exists in DB
  try {
    const res = await axios.post(`${baseUrl}/payments/verify-account`, {
      phone: '08123456789' // Assumed existing phone for testing logic structure
    });
    console.log('Verify Response:', res.status, res.data);
  } catch (err) {
    console.log('Verify Error:', err.response?.status, err.response?.data || err.message);
  }
}

testVPayVerify();
