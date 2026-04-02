const axios = require('axios');

async function test() {
  const baseUrl = 'http://localhost:5000/api/v1';
  // Note: This script assumes a valid token is available if tested manually.
  // Since I don't have a token here, I'll just check if the routes exist via error codes (401 is good, 404 is bad).
  
  const endpoints = [
    '/banks/list',
    '/banks/resolve',
    '/banks'
  ];

  for (const ep of endpoints) {
    try {
      await axios.get(`${baseUrl}${ep}`);
      console.log(`GET ${ep}: OK (or handled error)`);
    } catch (err) {
      console.log(`GET ${ep}: ${err.response?.status || err.message}`);
    }
  }
}

test();
