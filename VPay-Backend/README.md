# VPay Backend API

A robust Node.js/Express backend for the VPay fintech mobile application.

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Authentication**: JWT (Access + Refresh tokens)
- **File Upload**: Cloudinary
- **SMS**: Twilio
- **Push Notifications**: Firebase Cloud Messaging
- **Payment Gateway**: Paystack / Flutterwave

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB
- Redis

### Installation
```bash
cd VPay-Backend
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

### Running Tests
```bash
npm test
```

## API Base URL
`/api/v1`

## Available Endpoints
| Resource        | Base Path                    |
|-----------------|------------------------------|
| Auth            | /api/v1/auth                 |
| Users           | /api/v1/users                |
| Wallet          | /api/v1/wallet               |
| Transactions    | /api/v1/transactions         |
| Payments        | /api/v1/payments             |
| Loans           | /api/v1/loans                |
| Savings         | /api/v1/savings              |
| Investments     | /api/v1/investments          |
| Bills           | /api/v1/bills                |
| Airtime         | /api/v1/airtime              |
| Data            | /api/v1/data                 |
| Beneficiaries   | /api/v1/beneficiaries        |
| Notifications   | /api/v1/notifications        |
| Admin           | /api/v1/admin                |
