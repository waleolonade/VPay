export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.87:3000'
  : 'https://api.velpay.com';

const v1 = '/api/v1';

export const endpoints = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH:             `${v1}/auth`,
  LOGIN:            `${v1}/auth/login`,
  LOGIN_OTP:        `${v1}/auth/login-otp`,
  VERIFY_OTP:       `${v1}/auth/verify-otp`,
  VERIFY_ADMIN_OTP: `${v1}/auth/verify-admin-otp`,
  RESEND_OTP:       `${v1}/auth/resend-otp`,
  REGISTER:         `${v1}/auth/register`,
  LOGOUT:           `${v1}/auth/logout`,
  REFRESH_TOKEN:    `${v1}/auth/refresh-token`,
  FORGOT_PASSWORD:  `${v1}/auth/forgot-password`,
  RESET_PASSWORD:   `${v1}/auth/reset-password`,

  // Payroll & Staff
  PAYROLL_STATS: `${v1}/business/payroll/stats`,
  GET_STAFF: `${v1}/business/payroll/staff`,
  ADD_STAFF: `${v1}/business/payroll/staff`,
  RUN_PAYROLL: `${v1}/business/payroll/run`,
  
  // Invoices (Business Payment Requests)
  INVOICES: `${v1}/invoices`,
  INVOICE_STATS: `${v1}/invoices/stats`,

  // Auth/Others
  VALIDATE_BVN: `${v1}/auth/validate-bvn`,

  // ── Profile / User ────────────────────────────────────────────────────────
  GET_PROFILE:     `${v1}/users/me`,
  UPDATE_PROFILE:  `${v1}/users/me`,
  UPLOAD_AVATAR:   `${v1}/users/me/avatar`,
  CHANGE_PASSWORD: `${v1}/users/me/change-password`,
  SET_PIN:         `${v1}/users/me/pin`,

  // ── KYC ───────────────────────────────────────────────────────────────────
  SUBMIT_BVN: `${v1}/kyc/bvn`,
  SUBMIT_NIN: `${v1}/kyc/nin`,

  // ── Wallet ────────────────────────────────────────────────────────────────
  GET_WALLETS:            `${v1}/wallet`,
  GET_BALANCE:            `${v1}/wallet`,           // same endpoint, aliased
  WALLET_FUND_BANK:       `${v1}/wallet/fund/bank`,
  WALLET_FUND_VIRTUAL:    `${v1}/wallet/fund/virtual`,
  WALLET_FUND_CARD:       `${v1}/wallet/fund/card`,
  WALLET_FUND_CARD_OTP:   `${v1}/wallet/fund/card/validate-otp`,
  WALLET_FUND_CARD_VERIFY:`${v1}/wallet/fund/card/verify`,
  WALLET_FUND_SIMULATE:   `${v1}/wallet/fund/simulate`,
  WALLET_STATEMENT:       `${v1}/wallet/statement`,
  WALLET_BUSINESS_PROFILE:`${v1}/wallet/business/profile`,

  // ── Payments ──────────────────────────────────────────────────────────────
  BANKS_LIST:      `${v1}/payments/banks`,
  SAVED_BANKS:     `${v1}/banks`,
  BANK_TRANSFER:   `${v1}/payments/bank-transfer`,
  VPAY_TRANSFER:   `${v1}/payments/vpay-transfer`,
  VERIFY_ACCOUNT:  `${v1}/payments/verify-account`,
  RESOLVE_ACCOUNT: `${v1}/payments/resolve-account`,
  SEARCH_VPAY_USERS: `${v1}/payments/search-users`,

  // ── Payment Links ─────────────────────────────────────────────────────────
  PAYMENT_LINKS:           `${v1}/payment-links`,
  PAYMENT_LINK_SLUG:       `${v1}/payment-links/:slug`,
  PAYMENT_LINK_DEACTIVATE: `${v1}/payment-links/:id/deactivate`,

  // ── Bill Splitting ────────────────────────────────────────────────────────
  SPLITS:       `${v1}/splits`,
  SPLIT_DETAILS:`${v1}/splits/:id`,
  SPLIT_PAY:    `${v1}/splits/:id/pay`,

  // ── Transactions ──────────────────────────────────────────────────────────
  GET_TRANSACTIONS:    `${v1}/transactions`,
  GET_TRANSACTION:     `${v1}/transactions/:reference`,
  GET_TRANSACTION_SUMMARY: `${v1}/transactions/summary`,
  AI_ADVICE:           `${v1}/transactions/ai-advice`,
  VFD_TRANSACTIONS:    `${v1}/transactions`,

  // ── Loans ─────────────────────────────────────────────────────────────────
  GET_LOANS:        `${v1}/loans`,
  LOAN_ELIGIBILITY: `${v1}/loans/eligibility`,
  LOAN_CALCULATE:   `${v1}/loans/calculate`,
  APPLY_LOAN:       `${v1}/loans/apply`,
  LOAN_REPAY:       `${v1}/loans/:id/repay`,

  // ── Savings ───────────────────────────────────────────────────────────────
  GET_SAVINGS:     `${v1}/savings`,
  CREATE_SAVINGS:  `${v1}/savings`,
  SAVINGS_SUMMARY: `${v1}/savings/summary`,
  SAVINGS_FUND:    `${v1}/savings/:id/fund`,
  SAVINGS_WITHDRAW:`${v1}/savings/:id/withdraw`,

  // ── Bills ─────────────────────────────────────────────────────────────────
  BILLS_CATEGORIES: `${v1}/bills/categories`,
  BILLS_BILLERS:    `${v1}/bills/billers`,
  BILLS_BILLER_ITEMS:`${v1}/bills/billers/:billerId/items`,
  BILLS_VERIFY:     `${v1}/bills/verify`,
  BILLS_PAY:        `${v1}/bills/pay`,
  BILLS_STATUS:     `${v1}/bills/status/:transactionId`,
  BILLS_HISTORY:    `${v1}/bills`,

  // ── Airtime & Data ────────────────────────────────────────────────────────
  AIRTIME_BUY:     `${v1}/airtime/buy`,
  AIRTIME_HISTORY: `${v1}/airtime`,
  DATA_PLANS:      `${v1}/data/plans/:network`,
  DATA_BUY:        `${v1}/data/buy`,
  DATA_HISTORY:    `${v1}/data`,

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS:          `${v1}/notifications`,
  NOTIFICATION:           `${v1}/notifications/:id`,
  NOTIFICATION_READ:      `${v1}/notifications/:id/read`,
  NOTIFICATIONS_READ_ALL: `${v1}/notifications/read-all`,
  NOTIFICATION_TOKEN:     `${v1}/notifications/token`,

  // Dashboard
  DASHBOARD: `${v1}/users/dashboard`,

  // Wallet
  WALLET_DETAILS: `${v1}/wallet/details`,
  // ── Bank Accounts & Cards ─────────────────────────────────────────────────
  BANK_ACCOUNTS:  `${v1}/banks`,
  BANK_ACCOUNT:   `${v1}/banks/:id`,
  SET_DEFAULT_ACCOUNT: `${v1}/banks/:id/default`,
  GET_CARDS:      `${v1}/cards`,
  CREATE_CARD_VIRTUAL: `${v1}/cards/virtual`,
  CARD_STATUS:    `${v1}/cards/:id/status`,
  CARD_DETAILS:   `${v1}/cards/:id/details`,

  // ── Legacy/Temporary ──────────────────────────────────────────────────────
  CARDS:          `${v1}/banks/cards`,
  CARD:           `${v1}/banks/cards/:id`,

  // ── Beneficiaries ─────────────────────────────────────────────────────────
  BENEFICIARIES: `${v1}/beneficiaries`,
  BENEFICIARY:   `${v1}/beneficiaries/:id`,

  // ── Subscriptions ─────────────────────────────────────────────────────────
  SUBSCRIPTIONS:        `${v1}/subscriptions`,
  SUBSCRIPTION_CANCEL:  `${v1}/subscriptions/:id/cancel`,

  // ── Investments ───────────────────────────────────────────────────────────
  INVESTMENT_PLANS:    `${v1}/investments/plans`,
  INVESTMENTS:         `${v1}/investments`,
  INVESTMENT_WITHDRAW: `${v1}/investments/:id/withdraw`,

  // ── Rewards ───────────────────────────────────────────────────────────────
  REWARDS: `${v1}/rewards`,

  // ── Promotions & Offers ───────────────────────────────────────────────────
  PROMOTIONS: `${v1}/promotions`,
  PERSONALIZED_OFFERS: `${v1}/promotions/personalized`,
  CASHBACK_OFFERS: `${v1}/promotions/cashback`,
  TRACK_PROMOTION: `${v1}/promotions/track`,

  // ── Support ───────────────────────────────────────────────────────────────
  SUPPORT_TICKET: `${v1}/support/ticket`,

  // ── Business Accounts ─────────────────────────────────────────────────────
  BUSINESS_REQUEST:           `${v1}/business/request`,
  BUSINESS_REQUESTS:          `${v1}/business/requests`,
  BUSINESS_ANALYTICS_OVERVIEW:`${v1}/business/analytics/overview`,
  BUSINESS_ANALYTICS_TRENDS:  `${v1}/business/analytics/trends`,
  BUSINESS_ANALYTICS_CUSTOMERS:`${v1}/business/analytics/customers`,
  BUSINESS_ANALYTICS_CATEGORIES:`${v1}/business/analytics/categories`,
  BUSINESS_ANALYTICS_ACTIVITY:`${v1}/business/analytics/activity`,
  BUSINESS_ANALYTICS_GROWTH:  `${v1}/business/analytics/growth`,

// ── VFD VBAAS ────────────────────────────────────────────────────────────
  VFD_TRANSACTIONS: `${v1}/vfd/transactions`,
  VFD_TRANSACTION:  `${v1}/vfd/transactions/:reference`,

  // ── QR Payments ───────────────────────────────────────────────────────────
  QR_TOKEN:    `${v1}/qr/token`,
  QR_PAY_VPAY: `${v1}/qr/pay-vpay`,
  QR_PAY_BILL: `${v1}/qr/pay-bill`,
};

