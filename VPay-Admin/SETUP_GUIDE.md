# VPay Admin - Setup Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **VPay Backend** (running on http://localhost:5000)

## Installation

1. **Navigate to the admin directory:**
   ```bash
   cd VPay-Admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

1. **Environment Variables:**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_APP_NAME=VPay Admin
   ```

2. **Backend Configuration:**
   
   Ensure your VPay backend is running and accessible at the URL specified in `VITE_API_URL`.

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Preview Production Build

Build and preview the production version:
```bash
npm run build
npm run preview
```

## Building for Production

Create an optimized production build:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
VPay-Admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (Button, Card, Modal, etc.)
│   │   └── layout/         # Layout components (Sidebar, Header)
│   ├── pages/              # Page components
│   │   ├── Dashboard/      # Dashboard page with analytics
│   │   ├── Users/          # User management pages
│   │   ├── Transactions/   # Transaction management
│   │   ├── Loans/          # Loan management
│   │   ├── KYC/            # KYC verification
│   │   └── ...             # Other feature pages
│   ├── services/           # API service layer
│   │   ├── api.js          # Axios instance with interceptors
│   │   └── index.js        # All service functions
│   ├── store/              # State management (Zustand)
│   │   └── authStore.js    # Authentication store
│   ├── utils/              # Utility functions
│   │   ├── helpers.js      # Helper functions
│   │   ├── export.js       # Export utilities (Excel, PDF)
│   │   └── constants.js    # App constants
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Documentation
```

## Features

### ✅ Implemented Features

1. **Dashboard**
   - Real-time statistics
   - Charts and analytics
   - Recent activity

2. **User Management**
   - View all users
   - Search and filter
   - User details
   - Freeze/unfreeze accounts
   - Export to Excel

3. **Transaction Management**
   - All transactions
   - Search and filter
   - Transaction details
   - Refund capability
   - Export to Excel

4. **Loan Management**
   - Loan applications
   - Approve/reject loans
   - Loan details

5. **KYC Management**
   - Pending KYC requests
   - Approve/reject KYC
   - KYC level assignment

6. **Wallet Management**
   - View wallets
   - Credit/debit operations

7. **Financial Services**
   - Savings management
   - Investment management

8. **Bill Services**
   - Bill payments
   - Airtime transactions
   - Data subscriptions

9. **Cards**
   - Card management
   - Freeze/unfreeze cards

10. **Business**
    - Business account management
    - Invoice management
    - Payroll management

11. **Payment Services**
    - Payment links
    - QR payments
    - Split payments

12. **Marketing**
    - Rewards management
    - Promotions
    - Subscriptions

13. **Support**
    - Support tickets
    - Customer inquiries

14. **Notifications**
    - Send push notifications
    - Bulk notifications

15. **Settings**
    - Platform configuration
    - Security settings
    - API configuration

### 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Professional color scheme
- **Loading States** - Smooth loading indicators
- **Empty States** - Friendly empty state messages
- **Toast Notifications** - Real-time feedback
- **Modal Dialogs** - Confirmation dialogs
- **Data Tables** - Sortable, filterable tables
- **Charts** - Interactive charts and graphs
- **Export** - Export data to Excel/PDF
- **Pagination** - Efficient data pagination

## Default Admin Credentials

For testing purposes, use these credentials:

```
Email: admin@vpay.com
Password: Admin@123
```

**Important:** Change these credentials in production!

## API Integration

The admin dashboard integrates with all VPay backend routes:

- `/admin/*` - Admin specific operations
- `/users/*` - User management
- `/transactions/*` - Transactions
- `/wallets/*` - Wallet operations
- `/loans/*` - Loan management
- `/savings/*` - Savings operations
- `/investments/*` - Investment management
- `/bills/*` - Bill payments
- `/airtime/*` - Airtime services
- `/data/*` - Data services
- `/kyc/*` - KYC operations
- `/cards/*` - Card management
- `/business/*` - Business accounts
- `/invoices/*` - Invoice management
- `/payment-links/*` - Payment links
- `/qr/*` - QR payments
- `/splits/*` - Split payments
- `/subscriptions/*` - Subscriptions
- `/rewards/*` - Rewards
- `/promotions/*` - Promotions
- `/payroll/*` - Payroll
- `/support/*` - Support tickets
- `/notifications/*` - Notifications

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
# Change port in vite.config.js
server: {
  port: 3001, // or any other available port
}
```

### API Connection Issues

1. Verify backend is running:
   ```bash
   curl http://localhost:5000/api/v1/health
   ```

2. Check CORS settings in backend

3. Verify `.env` file has correct API URL

### Build Errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Module Not Found Errors

Ensure all dependencies are installed:
```bash
npm install
```

### Chart.js Errors

If you see Chart.js errors, ensure you've registered all required components in your component files.

## Development Tips

### Hot Module Replacement (HMR)

Vite provides fast HMR. Changes will reflect immediately without full page reload.

### API Testing

Use the browser DevTools Network tab to debug API calls.

### State Management

The app uses Zustand for state management. Check `src/store/authStore.js` for authentication state.

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add menu item in `src/components/layout/Sidebar.jsx`
4. Create API service in `src/services/index.js`

## Performance Optimization

- **Code Splitting** - Automatic route-based code splitting
- **Image Optimization** - Use WebP format for images
- **Caching** - React Query caches API responses
- **Lazy Loading** - Components load on demand

## Security

- **Authentication** - JWT token-based authentication
- **Authorization** - Role-based access control
- **HTTPS** - Always use HTTPS in production
- **Input Validation** - All inputs are validated
- **XSS Protection** - React's built-in XSS protection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Support

For issues and questions:
- GitHub Issues - Create an issue on the repository
- Email - support@vpay.com
- Documentation - See README.md

## License

Proprietary - VPay Platform

---

**Need Help?** Check the [README.md](README.md) for more detailed information.
