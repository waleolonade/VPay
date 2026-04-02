/**
 * Quick test for VFD authentication
 */
require('dotenv').config();

const axios = require('axios');

const testVFD = async () => {
  console.log('[TEST] Starting VFD auth test...');
  console.log('[TEST] Environment check:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - VFD_CONSUMER_KEY: ${process.env.VFD_CONSUMER_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`  - VFD_CONSUMER_SECRET: ${process.env.VFD_CONSUMER_SECRET ? 'SET' : 'NOT SET'}`);

  const authUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://api-apps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token'
      : 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';

  console.log(`[TEST] Auth URL: ${authUrl}`);

  try {
    console.log('[TEST] Requesting VFD token...');
    const response = await axios.post(
      authUrl,
      {
        consumerKey: process.env.VFD_CONSUMER_KEY,
        consumerSecret: process.env.VFD_CONSUMER_SECRET,
        validityTime: process.env.VFD_TOKEN_VALIDITY || '-1',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('[TEST] VFD Response Status:', response.status);
    console.log('[TEST] VFD Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.status === '00' && response.data.data?.access_token) {
      const token = response.data.data.access_token;
      console.log(`[TEST] ✓ Token obtained: ${token.substring(0, 20)}...`);

      // Now test the biller categories endpoint
      console.log('[TEST] Testing biller categories endpoint...');
      const billsUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://api-apps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore'
          : 'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';

      const categoriesResponse = await axios.get(`${billsUrl}/billercategory`, {
        headers: {
          Authorization: `Bearer ${token}`,
          AccessToken: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      console.log('[TEST] Categories Response Status:', categoriesResponse.status);
      console.log('[TEST] Categories Response Data:', JSON.stringify(categoriesResponse.data, null, 2));
    } else {
      console.error('[TEST] ✗ Token not in response or status != 00');
      console.error('[TEST] Status:', response.data.status);
      console.error('[TEST] Message:', response.data.message);
    }
  } catch (error) {
    console.error('[TEST] ✗ Error:', error.message);
    if (error.response) {
      console.error('[TEST] HTTP Status:', error.response.status);
      console.error('[TEST] Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('[TEST] Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('[TEST] No response received:', error.request);
    } else {
      console.error('[TEST] Error:', error);
    }
  }
};

testVFD();
