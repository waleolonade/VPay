# VPay Admin Dashboard

Complete administrative web application for VPay fintech platform.

## Features

### Core Management
- 📊 **Dashboard** - Real-time statistics and analytics
- 👥 **User Management** - Complete user control and monitoring
- 💰 **Wallet Management** - Wallet operations and balance control
- 💳 **Transaction Management** - Transaction monitoring and control
- 🏦 **Banking** - Bank account management and integrations

### Financial Services
- 💵 **Loans** - Loan applications, approvals, and management
- 💎 **Savings** - Savings plans and goal management
- 📈 **Investments** - Investment portfolio management
- 🎫 **Cards** - Virtual/physical card management

### Business Features
- 🏢 **Business Accounts** - Business account management
- 📄 **Invoices** - Invoice creation and tracking
- 💰 **Payroll** - Payroll management system
- 🔗 **Payment Links** - Payment link generation and tracking

### Payment Services
- 📱 **Bill Payments** - Utility bills management
- 📞 **Airtime & Data** - Telecom services
- 📲 **QR Payments** - QR code payment management
- ✂️ **Split Payments** - Split payment tracking

### Customer Management
- ✅ **KYC Management** - KYC verification and approval
- 🎁 **Rewards** - Loyalty and rewards program
- 📢 **Promotions** - Marketing campaigns
- 💳 **Subscriptions** - Subscription management
- 🎫 **Support** - Customer support ticket system
- 🔔 **Notifications** - Push notification management

### Analytics & Reports
- 📊 Real-time charts and graphs
- 📈 Export to Excel/PDF
- 📉 Trend analysis
- 💹 Revenue tracking

## Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Charts**: Chart.js & Recharts
- **Tables**: React Table
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: React Icons
- **Date Handling**: date-fns
- **Forms**: React Select, React Datepicker
- **Export**: XLSX, jsPDF

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=VPay Admin
```

## Project Structure

```
VPay-Admin/
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/         # Common UI components
│   │   ├── layout/         # Layout components
│   │   ├── charts/         # Chart components
│   │   └── tables/         # Table components
│   ├── pages/              # Page components
│   │   ├── Dashboard/
│   │   ├── Users/
│   │   ├── Transactions/
│   │   ├── Loans/
│   │   └── ...
│   ├── services/           # API services
│   ├── hooks/              # Custom hooks
│   ├── store/              # Zustand stores
│   ├── utils/              # Utility functions
│   ├── routes/             # Route configurations
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Default Admin Credentials

```
Email: admin@vpay.com
Password: Admin@123
```

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Dashboard
- Total users, transactions, revenue
- Active loans, savings, investments
- Recent transactions
- User growth charts
- Revenue analytics

### User Management
- View all users
- Search and filter users
- User details and activity
- Edit user information
- Freeze/unfreeze accounts
- KYC status management
- Account tier management

### Transaction Management
- All transactions listing
- Filter by type, status, date
- Transaction details
- Refund processing
- Export transactions

### Loan Management
- Loan applications
- Approve/reject loans
- Active loans monitoring
- Repayment tracking
- Overdue loan alerts

### KYC Management
- Pending KYC reviews
- Document verification
- Approve/reject KYC
- KYC level assignment
- Document upload management

### Settings
- Platform settings
- Fee configuration
- Rate management
- Email templates
- Notification settings
- Security settings

## API Integration

All API calls are made to the VPay backend at `/api/v1`. The admin dashboard integrates with all existing backend routes:

- `/admin/*` - Admin operations
- `/users/*` - User management
- `/transactions/*` - Transactions
- `/wallets/*` - Wallet operations
- `/loans/*` - Loan management
- `/savings/*` - Savings
- `/investments/*` - Investments
- And all other routes...

## Authentication

The dashboard uses JWT token authentication. Upon successful login:
- Token is stored in localStorage
- Token is sent with every API request in Authorization header
- Token expiry is handled with automatic logout

## Role-Based Access Control

Supports multiple admin roles:
- **Super Admin** - Full access
- **Admin** - Standard admin access
- **Support** - Customer support access
- **Finance** - Financial operations access

## Security Features

- JWT authentication
- Role-based access control
- Session management
- Secure API communication
- Input validation
- XSS protection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - VPay Platform

## Support

For issues and support, contact: support@vpay.com
