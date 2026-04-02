/**
 * Business Account System Test Script
 * Run this to test business request and analytics endpoints
 * 
 * Usage: node test-business-system.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Replace with actual user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!'
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function login() {
  console.log('\n🔐 Logging in...');
  try {
    const response = await api.post('/auth/login', TEST_USER);
    authToken = response.data.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSubmitBusinessRequest() {
  console.log('\n📝 Testing business request submission...');
  try {
    const response = await api.post('/business/request', {
      businessName: 'Test Corp Ltd',
      businessCategory: 'Technology',
      cacNumber: 'RC9876543',
      businessEmail: 'info@testcorp.com',
      businessPhone: '+2348012345678',
      businessAddress: '123 Test Street, Lagos, Nigeria',
      estimatedMonthlyRevenue: 1000000,
      cacCertificate: 'uploads/cac_cert_test.pdf',
    });
    console.log('✅ Business request submitted');
    console.log('   Status:', response.data.data.status);
    console.log('   Request ID:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Request submission failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetRequests() {
  console.log('\n📋 Testing get requests history...');
  try {
    const response = await api.get('/business/requests');
    console.log('✅ Retrieved requests');
    console.log(`   Total requests: ${response.data.data.length}`);
    response.data.data.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.businessName} - ${req.status.toUpperCase()}`);
    });
  } catch (error) {
    console.error('❌ Get requests failed:', error.response?.data?.message || error.message);
  }
}

async function testAnalyticsOverview() {
  console.log('\n📊 Testing analytics overview...');
  try {
    const response = await api.get('/business/analytics/overview');
    const data = response.data.data;
    console.log('✅ Analytics retrieved');
    console.log(`   Total Income: ₦${data.totalIncome.toLocaleString()}`);
    console.log(`   Total Expenses: ₦${data.totalExpenses.toLocaleString()}`);
    console.log(`   Net Profit: ₦${data.netProfit.toLocaleString()}`);
    console.log(`   Unique Customers: ${data.uniqueCustomers}`);
    console.log(`   Avg Transaction: ₦${data.avgTransactionValue.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Analytics failed:', error.response?.data?.message || error.message);
  }
}

async function testMonthlyTrends() {
  console.log('\n📈 Testing monthly trends...');
  try {
    const response = await api.get('/business/analytics/trends?months=6');
    console.log('✅ Trends retrieved');
    console.log(`   Months of data: ${response.data.data.length}`);
    response.data.data.forEach((trend) => {
      console.log(`   ${trend.month}: Income ₦${trend.income.toLocaleString()}, Profit ₦${trend.profit.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Trends failed:', error.response?.data?.message || error.message);
  }
}

async function testTopCustomers() {
  console.log('\n👥 Testing top customers...');
  try {
    const response = await api.get('/business/analytics/customers?limit=5');
    console.log('✅ Customers retrieved');
    console.log(`   Top customers: ${response.data.data.length}`);
    response.data.data.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.customerName} - ₦${customer.totalSpent.toLocaleString()} (${customer.transactionCount} txns)`);
    });
  } catch (error) {
    console.error('❌ Customers failed:', error.response?.data?.message || error.message);
  }
}

async function testCategoryBreakdown() {
  console.log('\n📑 Testing category breakdown...');
  try {
    const response = await api.get('/business/analytics/categories');
    console.log('✅ Categories retrieved');
    console.log(`   Total categories: ${response.data.data.length}`);
    response.data.data.slice(0, 5).forEach((cat) => {
      console.log(`   ${cat.category}: ₦${cat.total.toLocaleString()} (${cat.count} txns)`);
    });
  } catch (error) {
    console.error('❌ Categories failed:', error.response?.data?.message || error.message);
  }
}

async function testGrowthRate() {
  console.log('\n📊 Testing growth rate...');
  try {
    const response = await api.get('/business/analytics/growth');
    const data = response.data.data;
    console.log('✅ Growth rate retrieved');
    console.log(`   Current Month: ₦${data.currentMonth.toLocaleString()}`);
    console.log(`   Previous Month: ₦${data.previousMonth.toLocaleString()}`);
    console.log(`   Growth Rate: ${data.growthRate}%`);
    console.log(`   Trend: ${data.trend}`);
  } catch (error) {
    console.error('❌ Growth rate failed:', error.response?.data?.message || error.message);
  }
}

// Admin tests (requires admin role)
async function testAdminGetAllRequests() {
  console.log('\n👑 Testing admin get all requests...');
  try {
    const response = await api.get('/business/admin/requests?status=pending&limit=10');
    console.log('✅ Admin requests retrieved');
    console.log(`   Total requests: ${response.data.data.length}`);
  } catch (error) {
    console.error('❌ Admin requests failed:', error.response?.data?.message || error.message);
    console.log('   (This is expected if user is not admin)');
  }
}

async function testAdminApproveRequest(requestId) {
  console.log('\n✅ Testing admin approve request...');
  try {
    const response = await api.put(`/business/admin/requests/${requestId}`, {
      status: 'approved',
    });
    console.log('✅ Request approved');
    console.log('   New status:', response.data.data.status);
  } catch (error) {
    console.error('❌ Approval failed:', error.response?.data?.message || error.message);
    console.log('   (This is expected if user is not admin)');
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Business Account System Tests');
  console.log('==========================================');

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n❌ Cannot proceed without login');
    return;
  }

  // User tests
  const requestId = await testSubmitBusinessRequest();
  await testGetRequests();
  await testAnalyticsOverview();
  await testMonthlyTrends();
  await testTopCustomers();
  await testCategoryBreakdown();
  await testGrowthRate();

  // Admin tests (will fail if not admin)
  await testAdminGetAllRequests();
  if (requestId) {
    await testAdminApproveRequest(requestId);
  }

  console.log('\n==========================================');
  console.log('✨ Tests completed!');
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
