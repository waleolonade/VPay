# VelPay - Digital Payment Platform

A comprehensive React Native fintech application for seamless money transfers, bills payment, loans, savings, and investments.

## Project Structure

```
VelPay/
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
│
├── src/
│   ├── components/
│   │   ├── common/       (Reusable UI components)
│   │   ├── home/         (Home screen components)
│   │   ├── wallet/       (Wallet features)
│   │   └── loans/        (Loan features)
│   │
│   ├── screens/          (App screens organized by feature)
│   │   ├── auth/         (Authentication flow)
│   │   ├── main/         (Main app screens)
│   │   ├── payments/     (Payment screens)
│   │   ├── qr-payments/  (QR code features)
│   │   ├── loans/        (Loan management)
│   │   ├── savings/      (Savings plans)
│   │   ├── investments/  (Investment options)
│   │   ├── rewards/      (Rewards & cashback)
│   │   └── support/      (Help & support)
│   │
│   ├── navigation/       (Navigation configuration)
│   ├── services/         (API services)
│   ├── utils/            (Helpers and validators)
│   ├── hooks/            (Custom React hooks)
│   ├── context/          (React Context for state)
│   ├── redux/            (Redux state management)
│   ├── styles/           (Design tokens & themes)
│   └── constants/        (App constants)
│
├── __tests__/            (Test files)
│
├── App.js                (App entry point with splash screen)
├── app.json              (Expo configuration)
├── package.json          (Dependencies)
└── README.md             (This file)
```

## Key Features

### 🔐 Authentication
- User registration and login
- Password reset functionality
- OTP verification
- Biometric authentication setup

### 💰 Wallet Management
- View account balance
- Fund wallet
- Withdraw funds
- Transaction history

### 💸 Payments
- Bank transfers
- VPay to VPay transfers
- Airtime purchase
- Data plans
- Bills payment (electricity, cable, internet)

### 📱 QR Code Payments
- QR code scanning
- QR code generation
- Merchant payments

### 🏦 Loans
- Loan eligibility check
- Loan application
- Loan status tracking
- Loan repayment

### 💎 Savings
- Create savings goals
- Target-based savings
- Fixed deposits
- Savings withdrawal

### 📈 Investments
- Mutual funds
- Treasury bills
- Investment tracking

### 🎁 Rewards
- Cashback tracking
- Referral program
- Voucher management

### 💬 Support
- Help center
- FAQ
- Contact support
- Report issues

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack, Tab, Drawer)
- **State Management**: Redux Toolkit + Redux Context API
- **API Communication**: Axios
- **Form Validation**: Custom validators
- **Authentication**: JWT tokens
- **Database**: AsyncStorage (local) + API integration
- **Testing**: Jest + React Native Testing Library

## Getting Started

### Prerequisites
- Node.js >= 14
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd VelPay
```

2. Install dependencies
```bash
npm install --legacy-peer-deps
```

3. Start the development server
```bash
expo start
```

4. Scan QR code with Expo Go app on your phone

## Environment Variables

Create a `.env` file in the root directory:
```
API_BASE_URL=https://api.velpay.com/v1
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm test` - Run test suite

## API Endpoints

All API endpoints are configured in `src/constants/apiEndpoints.js`

## Component Usage

### Button
```jsx
<Button
  title="Click Me"
  onPress={() => {}}
  type="primary"
  size="medium"
/>
```

### Input
```jsx
<Input
  label="Email"
  placeholder="your@email.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
/>
```

### BalanceCard
```jsx
<BalanceCard
  balance="250,000.00"
  onViewDetails={() => {}}
/>
```

## State Management

### Redux Slices
- `authSlice` - Authentication state
- `walletSlice` - Wallet balance and details
- `transactionSlice` - Transaction history
- `loanSlice` - Loan information

### Context
- `AuthContext` - User authentication state
- `WalletContext` - Wallet operations
- `ThemeContext` - App theme configuration

## Services

### API Service (`api.js`)
- Base configuration for all API requests
- Request/response interceptors
- Error handling

### Auth Service
- Login, register, logout
- Token refresh
- Password reset

### Wallet Service
- Get balance
- Fund wallet
- Withdraw funds

### Transaction Service
- Fetch transactions
- Create transactions
- Transfer money

### Loan Service
- Get loans
- Check eligibility
- Apply for loan
- Repay loan

## Utilities

### Helpers
- `formatCurrency()` - Format numbers as currency
- `formatPhoneNumber()` - Format phone numbers
- `getInitials()` - Get name initials
- `getDaysAgo()` - Format relative dates

### Validators
- Email validation
- Phone number validation
- Password strength checking
- Amount validation
- PIN validation

## Contributing

1. Create feature branches from `develop`
2. Follow the existing code structure
3. Write tests for new features
4. Submit pull requests with descriptions

## License

MIT

## Support

For support, contact: support@velpay.com

---

**Version**: 1.0.0  
**Last Updated**: March 7, 2026
