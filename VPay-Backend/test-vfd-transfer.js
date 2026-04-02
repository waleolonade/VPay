/**
 * Test VFD Transfer/Recipient APIs to find correct endpoint format
 * Run: node test-vfd-transfer.js
 */
require('dotenv').config();
const axios = require('axios');

const getAuthUrl = () =>
  process.env.NODE_ENV === 'production'
    ? 'https://api-apps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token'
    : 'https://api-devapps.vfdbank.systems/vfd-tech/baas-portal/v1.1/baasauth/token';

const getBaseUrl = () =>
  process.env.NODE_ENV === 'production'
    ? 'https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2'
    : 'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';

const testVFDTransfer = async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('[TEST] VFD Transfer API Test Suite');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test account details (replace with actual test account from VFD)
  const testAccount = {
    accountNumber: '0123456789', // 10-digit account number from VFD
    bankCode: '000014', // GTBank
    transferType: 'inter',
  };

  console.log('[CONFIG] Test Parameters:');
  console.log(`  Account Number: ${testAccount.accountNumber}`);
  console.log(`  Bank Code: ${testAccount.bankCode}`);
  console.log(`  Base URL: ${getBaseUrl()}\n`);

  try {
    // Step 1: Get auth token
    console.log('[STEP 1] Authenticating with VFD...');
    const authResponse = await axios.post(
      getAuthUrl(),
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

    if (authResponse.data.status !== '00' || !authResponse.data.data?.access_token) {
      console.error('[ERROR] Auth failed:', authResponse.data.message);
      return;
    }

    const token = authResponse.data.data.access_token;
    console.log(`[✓] Auth successful. Token: ${token.substring(0, 30)}...\n`);

    // Build client with auth headers
    const client = axios.create({
      baseURL: getBaseUrl(),
      headers: {
        Authorization: `Bearer ${token}`,
        AccessToken: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    // Step 2: Test different endpoint variations
    const endpoints = [
      {
        name: 'Method 1: GET /transfer/recipient (snake_case params)',
        method: 'get',
        url: `/transfer/recipient?accountNo=${testAccount.accountNumber}&bank=${testAccount.bankCode}&transfer_type=${testAccount.transferType}`,
      },
      {
        name: 'Method 2: GET /transfer/recipient (camelCase params)',
        method: 'get',
        url: `/transfer/recipient?accountNumber=${testAccount.accountNumber}&bankCode=${testAccount.bankCode}&transferType=${testAccount.transferType}`,
      },
      {
        name: 'Method 3: POST /transfer/recipient',
        method: 'post',
        url: '/transfer/recipient',
        data: {
          accountNo: testAccount.accountNumber,
          bank: testAccount.bankCode,
          transfer_type: testAccount.transferType,
        },
      },
      {
        name: 'Method 4: POST /transfer/resolve',
        method: 'post',
        url: '/transfer/resolve',
        data: {
          accountNo: testAccount.accountNumber,
          bankCode: testAccount.bankCode,
          transferType: testAccount.transferType,
        },
      },
      {
        name: 'Method 5: GET /beneficiary?accountNo=...',
        method: 'get',
        url: `/beneficiary?accountNo=${testAccount.accountNumber}&bank=${testAccount.bankCode}`,
      },
      {
        name: 'Method 6: POST /beneficiary',
        method: 'post',
        url: '/beneficiary',
        data: {
          accountNo: testAccount.accountNumber,
          bank: testAccount.bankCode,
        },
      },
    ];

    console.log('[STEP 2] Testing endpoint variations...\n');

    for (const endpoint of endpoints) {
      console.log(`\n─────────────────────────────────────────────────────────────`);
      console.log(`[TEST] ${endpoint.name}`);
      console.log(`─────────────────────────────────────────────────────────────`);

      try {
        let response;
        if (endpoint.method === 'get') {
          console.log(`[REQUEST] GET ${endpoint.url}`);
          response = await client.get(endpoint.url);
        } else {
          console.log(`[REQUEST] POST ${endpoint.url}`);
          console.log(`[PAYLOAD] ${JSON.stringify(endpoint.data, null, 2)}`);
          response = await client.post(endpoint.url, endpoint.data);
        }

        console.log(`[✓] Status: ${response.status}`);
        console.log(`[RESPONSE] ${JSON.stringify(response.data, null, 2)}`);

        if (response.data.status === '00') {
          console.log('[SUCCESS] ✓ This endpoint works!');
          console.log(`[DATA] Response structure:`, JSON.stringify({
            status: response.data.status,
            dataKeys: response.data.data ? Object.keys(response.data.data) : null,
            dataStructure: response.data.data,
          }, null, 2));
        }
      } catch (error) {
        console.log(`[✗] Failed`);
        console.log(`[HTTP Status] ${error.response?.status || 'N/A'}`);
        console.log(`[ERROR] ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
          console.log(`[RESPONSE] ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('[SUMMARY] Test complete. Check logs above for working endpoint.');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('[CRITICAL ERROR]', error.message);
    if (error.response?.data) {
      console.error('[RESPONSE]', error.response.data);
    }
  }
};

testVFDTransfer();
