const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

let mongoServer;
let accessToken;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const res = await request(app).post('/api/v1/auth/register').send({
    firstName: 'Wallet',
    lastName: 'Tester',
    email: 'wallet@vpay.com',
    phone: '08055556666',
    password: 'Wallet@123',
  });
  accessToken = res.body.data.accessToken;
  userId = res.body.data.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Wallet', () => {
  it('should get wallet details for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('balance');
    expect(res.body.data).toHaveProperty('accountNumber');
  });

  it('should deny access without token', async () => {
    const res = await request(app).get('/api/v1/wallet');
    expect(res.status).toBe(401);
  });
});
