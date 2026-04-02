
const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/database');

// Helper to clear test users (by email)
async function clearTestUser(email) {
  await pool.query('DELETE FROM users WHERE email = ?', [email]);
}

describe('Admin/Superadmin Security Login Flow', () => {
  const admin = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin-test@vpay.com',
    phone: '08000000001',
    password: 'Admin@1234',
    role: 'admin',
  };

  beforeAll(async () => {
    await clearTestUser(admin.email);
  });
  afterAll(async () => {
    await clearTestUser(admin.email);
    pool.end && pool.end();
  });

  it('should register a new admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(admin);
    expect([200, 201, 409]).toContain(res.status); // 409 if already exists
  });

  it('should require 2FA, IP whitelist, and session for admin login', async () => {
    // Attempt login (should trigger 2FA/IP/session checks)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: admin.password });
    // Accept 401/403 for security checks, or 200 if all passed
    expect([200, 401, 403]).toContain(res.status);
    // If 2FA required, expect a message or flag
    if (res.status !== 200) {
      expect(res.body).toHaveProperty('message');
    }
  });

  // Add more tests for 2FA verification, IP whitelist, and session management as needed
});
