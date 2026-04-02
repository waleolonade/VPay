require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const { verifyAccessToken } = require('./config/auth');
const socketService = require('./services/socketService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const loanRoutes = require('./routes/loanRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const billRoutes = require('./routes/billRoutes');
const airtimeRoutes = require('./routes/airtimeRoutes');
const dataRoutes = require('./routes/dataRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const kycRoutes = require('./routes/kycRoutes');
const bankRoutes = require('./routes/bankRoutes');
const rewardsRoutes = require('./routes/rewardsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const paymentLinkRoutes = require('./routes/paymentLinkRoutes');
const splitRoutes = require('./routes/splitRoutes');
const qrRoutes = require('./routes/qrRoutes');
const cardRoutes = require('./routes/cardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const promotionsRoutes = require('./routes/promotionsRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const businessRoutes = require('./routes/businessRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const twoFactorAuthRoutes = require('./routes/twoFactorAuthRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const sessionManagementRoutes = require('./routes/sessionManagementRoutes');
const ipWhitelistRoutes = require('./routes/ipWhitelistRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
// Jobs
require('./jobs/interestCalculator');
require('./jobs/loanRepaymentReminder');
require('./jobs/transactionCleanup');
require('./jobs/notificationSender');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://192.168.1.87:3000', 'http://192.168.1.87:5173', 'http://192.168.1.87:3001'],
    methods: ['GET', 'POST'],
  },
  // Mobile clients keep connections alive longer — raise timeouts
  pingTimeout: 60000,
  pingInterval: 25000,
  // Allow Socket.IO v3 clients as well
  allowEIO3: true,
  // Allow polling for the initial handshake and as a fallback
  transports: ['polling', 'websocket'],
});

// Authenticate socket connections via JWT bearer token
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication error: no token'));
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  // Each user owns a private room — backend emits to this room
  socket.join(`user:${socket.userId}`);
  logger.info(`Socket connected: userId=${socket.userId}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: userId=${socket.userId}`);
  });
});

socketService.init(io);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://192.168.1.87:3000', 'http://[IP_ADDRESS]', 'http://[IP_ADDRESS]'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Rate limiting
// app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/savings', savingsRoutes);
app.use('/api/v1/investments', investmentRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/airtime', airtimeRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/beneficiaries', beneficiaryRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/business/payroll', payrollRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/transactions', require('./routes/adminTransactionRoutes'));
app.use('/api/v1/admin/2fa', twoFactorAuthRoutes);
app.use('/api/v1/admin/activity-logs', activityLogRoutes);
app.use('/api/v1/admin/sessions', sessionManagementRoutes);
app.use('/api/v1/admin/ip-whitelist', ipWhitelistRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/banks', bankRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/payment-links', paymentLinkRoutes);
app.use('/api/v1/splits', splitRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/users', dashboardRoutes);
app.use('/api/v1/promotions', promotionsRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`404 [${req.method}] ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`VPay Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
// Force nodemon restart
