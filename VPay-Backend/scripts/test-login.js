const axios = require('axios');

const API_URL = 'http://192.168.1.87:3000/api/v1';
const LOGIN_URL = `${API_URL}/auth/login`;

async function testLogin() {
  try {
    const response = await axios.post(LOGIN_URL, {
      email: 'admin@vpay.com',
      password: 'VPayAdmin123!'
    });

    console.log('Login Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const token = response.data.data.accessToken;
      console.log('Token:', token);
      
      // Decode JWT
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
      console.log('Decoded Payload:', JSON.stringify(payload, null, 2));
      console.log('Issued At (iat):', new Date(payload.iat * 1000).toLocaleString());
      console.log('Expires At (exp):', new Date(payload.exp * 1000).toLocaleString());
      console.log('Current Time:', new Date().toLocaleString());
    }
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
