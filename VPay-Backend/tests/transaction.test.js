const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

let mongoServer;
let accessToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const res = await request(app).post('/api/v1/auth/register').send({
    firstName: 'Tx',
    lastName: 'Tester',
    email: 'tx@vpay.com',
    phone: '08077778888',
    password: 'Txtest@1',
  });
  accessToken = res.body.data.accessToken;

  // Seed a transaction
  await Transaction.create({
    reference: 'VPY-TEST-001',
    user: new mongoose.Types.ObjectId(),
    type: 'credit',
    category: 'deposit',
    amount: 5000,
    status: 'completed',
    completedAt: new Date(),
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Transactions', () => {
  it('should return empty transactions list for new user', async () => {
    const res = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it('should return 404 for unknown transaction reference', async () => {
    const res = await request(app)
      .get('/api/v1/transactions/UNKNOWN-REF')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});
