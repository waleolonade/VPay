// App-wide constants

const NETWORKS = {
  MTN: 'mtn',
  AIRTEL: 'airtel',
  GLO: 'glo',
  NMOBILE: '9mobile',
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REVERSED: 'reversed',
};

const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DISBURSED: 'disbursed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DEFAULTED: 'defaulted',
  REJECTED: 'rejected',
};

const KYC_LEVELS = {
  BASIC: 0,
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
};

const DAILY_LIMITS = {
  [KYC_LEVELS.BASIC]: 50000,
  [KYC_LEVELS.TIER_1]: 200000,
  [KYC_LEVELS.TIER_2]: 500000,
  [KYC_LEVELS.TIER_3]: 5000000,
};

const TRANSACTION_LIMITS = {
  [KYC_LEVELS.BASIC]: 20000,
  [KYC_LEVELS.TIER_1]: 100000,
  [KYC_LEVELS.TIER_2]: 200000,
  [KYC_LEVELS.TIER_3]: 2000000,
};

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const LOGIN_MAX_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

const TRANSFER_FEE_TIERS = [
  { max: 5000, fee: 10 },
  { max: 50000, fee: 25 },
  { max: Infinity, fee: 50 },
];

const LOAN_INTEREST_RATE = parseFloat(process.env.LOAN_INTEREST_RATE) || 0.05;
const SAVINGS_INTEREST_RATE = parseFloat(process.env.SAVINGS_INTEREST_RATE) || 0.08;
const REFERRAL_REWARD_AMOUNT = 500;
const SIGNUP_REWARD_POINTS = 100;

const BILL_FEES = {
  airtime: 0,
  data: 0,
  cable_tv: 100,
  electricity: 100,
  utility: 50,
  internet_subscription: 50,
  default: 50,
};

module.exports = {
  NETWORKS,
  TRANSACTION_STATUS,
  LOAN_STATUS,
  KYC_LEVELS,
  DAILY_LIMITS,
  TRANSACTION_LIMITS,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  LOGIN_MAX_ATTEMPTS,
  LOCK_TIME_MINUTES,
  TRANSFER_FEE_TIERS,
  LOAN_INTEREST_RATE,
  SAVINGS_INTEREST_RATE,
  REFERRAL_REWARD_AMOUNT,
  SIGNUP_REWARD_POINTS,
  BILL_FEES,
};
