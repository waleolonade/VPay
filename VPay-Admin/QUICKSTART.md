# VPay Admin - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd VPay-Admin
npm install
```

### 2. Configure Environment
```bash
# Copy environment file
cp .env.example .env

# The .env file is already configured for local development
# VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open Browser
Navigate to: **http://localhost:3000**

### 5. Login
```
Email: admin@vpay.com
Password: Admin@123
```

## 📱 Features Available

✅ **Dashboard** - Real-time stats and analytics
✅ **Users** - Complete user management
✅ **Transactions** - Transaction monitoring
✅ **Wallets** - Wallet operations
✅ **Loans** - Loan approvals and management
✅ **Savings** - Savings management
✅ **Investments** - Investment portfolio
✅ **Bills** - Bill payments, Airtime, Data
✅ **KYC** - KYC verification system
✅ **Cards** - Card management
✅ **Business** - Business accounts, Invoices, Payroll
✅ **Payments** - Payment Links, QR, Split Payments
✅ **Subscriptions** - Subscription management
✅ **Rewards** - Loyalty programs
✅ **Promotions** - Marketing campaigns
✅ **Support** - Customer support tickets
✅ **Notifications** - Push notifications
✅ **Settings** - Platform configuration

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📦 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool (super fast!)
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **React Query** - Data fetching
- **Chart.js** - Charts and graphs
- **Axios** - HTTP client

## 🔗 Backend Integration

Make sure your VPay backend is running on:
```
http://localhost:5000
```

## 📝 Notes

- All API endpoints are configured in `src/services/index.js`
- Authentication state is managed in `src/store/authStore.js`
- All routes are protected and require authentication
- JWT token is stored in localStorage

## 🆘 Need Help?

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed documentation.

---

**Ready to go!** 🎉
