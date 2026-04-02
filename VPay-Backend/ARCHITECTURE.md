# VPay VFD Integration - System Architecture

## Data Flow Diagram

### Account Verification Flow (Frontend → Backend → VFD)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend (React Native)                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  BankTransferScreen or Other Transfer Screen                        │
│  ├─ User enters: Account Number (10 digits)                         │
│  ├─ User selects: Bank (6-digit code)                               │
│  └─ Calls: POST /api/v1/payments/resolve-account                    │
│      {                                                               │
│        "accountNumber": "1234567890",                               │
│        "bankCode": "000014"                                         │
│      }                                                               │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Backend (Node.js Express)                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  paymentController.js → resolveAccount()                            │
│  ├─ 1. Validate input:                                              │
│  │   └─ accountNumber must be 10 digits                             │
│  │   └─ bankCode must be 6 digits                                   │
│  ├─ 2. Call bankService.verifyAccountNumber()                       │
│  │   └─ If validation fails → return 400 error                      │
│  │                                                                   │
│  └─ 3. On success, return:                                          │
│      {                                                               │
│        "success": true,                                             │
│        "data": {                                                    │
│          "accountName": "JOHN DOE",    ← From VFD                  │
│          "accountNumber": "1234567890",                             │
│          "clientId": "CLI_001",                                     │
│          "bank": { "code": "000014", "name": "GTBank" }            │
│        }                                                             │
│      }                                                               │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VPay Service Layer                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  bankService.js → verifyAccountNumber()                             │
│  ├─ Input Validation:                                               │
│  │  ├─ Account Number: /^\d{10}$/ (10 digits)                      │
│  │  └─ Bank Code: /^\d{6}$/ (6 digits)                             │
│  │                                                                   │
│  ├─ Call vfdWalletService.getTransferRecipient()                   │
│  │  └─ Pass: accountNo, bankCode, transferType='inter'             │
│  │                                                                   │
│  └─ On Response:                                                    │
│     ├─ If account found: Extract name & return normalized data     │
│     ├─ If not found: Throw "Account not found" error              │
│     └─ If service error: Throw generic error                       │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VFD Client Library                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  vfdWalletService.js → getTransferRecipient()                      │
│                                                                       │
│  Multi-Method Fallback System (tries up to 5 endpoints):           │
│  ┌─────────────────────────────────────────────────┐               │
│  │ Attempt 1: GET /transfer/recipient              │               │
│  │ (snake_case params: accountNo, bank,            │               │
│  │ transfer_type)                                  │               │
│  └─────────────────────────────────────────────────┘               │
│    ↓ If fails with 404                                              │
│  ┌─────────────────────────────────────────────────┐               │
│  │ Attempt 2: GET /transfer/recipient              │               │
│  │ (camelCase params: accountNumber, bankCode,     │               │
│  │ transferType)                                   │               │
│  └─────────────────────────────────────────────────┘               │
│    ↓ If fails with 404                                              │
│  ┌─────────────────────────────────────────────────┐               │
│  │ Attempt 3: POST /transfer/recipient             │               │
│  │ (snake_case body)                               │               │
│  └─────────────────────────────────────────────────┘               │
│    ↓ If fails with 404                                              │
│  ┌─────────────────────────────────────────────────┐               │
│  │ Attempt 4: POST /transfer/resolve               │               │
│  │ (camelCase body)                                │               │
│  └─────────────────────────────────────────────────┘               │
│    ↓ If fails with 404                                              │
│  ┌─────────────────────────────────────────────────┐               │
│  │ Attempt 5: GET /beneficiary                     │               │
│  │ (alternative endpoint)                          │               │
│  └─────────────────────────────────────────────────┘               │
│    ↓                                                                 │
│  ✓ Success (response.data.status === '00')                         │
│    └─ normalizeRecipientResponse() converts VFD response           │
│    └─ Returns: {name, accountNumber, clientId, bvn, bank}         │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ External: VFD BaaS Wallet API                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Environment URLs:                                                   │
│  ├─ Dev:  https://api-devapps.vfdbank.systems/...                 │
│  └─ Prod: https://api-apps.vfdbank.systems/...                    │
│                                                                       │
│  Base Path: /vtech-wallet/api/v2/wallet2                           │
│                                                                       │
│  Required Auth:                                                      │
│  └─ OAuth2 Bearer Token (obtained from /vfd-tech/baas-portal/...)  │
│     ├─ Using: VFD_CONSUMER_KEY                                     │
│     └─ Using: VFD_CONSUMER_SECRET                                  │
│                                                                       │
│  Response Format:                                                    │
│  {                                                                   │
│    "status": "00",        ← '00' = success, '01'/'02' = pending    │
│    "message": "Successful",                                         │
│    "data": {                                                        │
│      "name": "JOHN DOE",                                           │
│      "account": {                                                   │
│        "number": "1234567890",                                      │
│        "id": "ACC_12345"                                            │
│      },                                                              │
│      "clientId": "CLI_001",                                         │
│      "bvn": "12345678901",                                          │
│      "bank": {                                                      │
│        "code": "000014",                                            │
│        "name": "GTBank"                                             │
│      }                                                               │
│    }                                                                 │
│  }                                                                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Flow Diagram

```
         Request to /resolve-account
                  │
                  ▼
        ┌─────────────────────┐
        │ Input Validation    │
        └─────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
    INVALID              VALID
    Error 400           (continue)
    └─→ Frontend         │
                         ▼
                  bankService.verifyAccountNumber()
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Validate           Call VFD         Response
   Format            API              Received
        │                │                │
    FAIL│           FAIL │            FAIL│
        │           (401)│           (404,5xx)
        ▼           ▼    ▼
    Error ────────► Error ──────────► Error
    (format)   (auth)          (not found / service)
        │           │                │
        └───────────┴────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │ Error Handler│
            └──────────────┘
      ┌─────────┬──────────────┐
      ▼         ▼              ▼
   400     500           Return Error
  (Bad    (Service)       to Frontend
  Request) Error
```

## Component Hierarchy

```
Frontend
├── BankTransferScreen (when transferring to bank account)
│   ├── AccountNumberInput (10 digits)
│   ├── BankSelector (shows bank codes)
│   └── VerifyButton
│       └─ Calls: /api/v1/payments/resolve-account
│
├── VPayToVPayScreen (when transferring to VPay user)
│   ├── RecipientSearch (by phone or name)
│   ├── AmountInput
│   └─ Calls: /api/v1/payments/vPayTransfer
│
└── Wallet/ProfileScreen
    └─ Displays beneficiaries (past transfer recipients)

Backend
├── paymentController.js
│   ├── resolveAccount()          ← Account verification endpoint
│   ├── bankTransfer()            ← Execute bank transfer
│   ├── vpayTransfer()            ← Execute P2P transfer
│   └── (other transfer endpoints)
│
├── services/bankService.js
│   └── verifyAccountNumber()     ← High-level verification with validation
│
├── services/vfdWalletService.js
│   ├── getTransferRecipient()    ← VFD API with 5-method fallback
│   ├── normalizeRecipientResponse() ← Convert response format
│   ├── transfer()                ← Execute VFD transfer
│   ├── getTransactionStatus()    ← Check transfer status
│   └── (other VFD operations)
│
└── Real-time (Socket.IO)
    ├── transfer_sent            ← Sender gets confirmation
    ├── transfer_received        ← Recipient gets notification
    └── bank_transfer_completed  ← Balance updates
```

## Key Data Transformations

### 1. Account Verification Request
```javascript
// Frontend Input
{
  accountNumber: "1234567890",
  bankCode: "000014"
}

    ↓ (paymentController validates)

// bankService Input
{
  accountNumber: "1234567890",        // Validated: 10 digits
  bankCode: "000014"                  // Validated: 6 digits
}

    ↓ (vfdWalletService transforms)

// VFD API Request (Attempt 2 example: GET with camelCase)
GET /transfer/recipient?accountNumber=1234567890&bankCode=000014&transferType=inter

    ↓ (VFD API responds)

// VFD API Response
{
  "status": "00",
  "data": {
    "name": "JOHN DOE",
    "account": { "number": "1234567890", "id": "ACC_001" },
    "clientId": "CLI_001",
    "bvn": "12345678901",
    "bank": { "code": "000014", "name": "GTBank" }
  }
}

    ↓ (normalizeRecipientResponse transforms)

// Normalized Response (standard format)
{
  name: "JOHN DOE",
  accountNumber: "1234567890",
  clientId: "CLI_001",
  bvn: "12345678901",
  bank: { code: "000014", name: "GTBank" }
}

    ↓ (bankService returns to controller)

    ↓ (paymentController returns to frontend)

// Frontend Output
{
  "success": true,
  "data": {
    "accountName": "JOHN DOE",
    "accountNumber": "1234567890",
    "clientId": "CLI_001",
    "bank": { "code": "000014", "name": "GTBank" }
  }
}
```

## Configuration & Environment

### Required Environment Variables
```env
# VFD BaaS Credentials
VFD_CONSUMER_KEY=your_consumer_key
VFD_CONSUMER_SECRET=your_consumer_secret
VFD_TOKEN_VALIDITY=-1

# Environment
NODE_ENV=development  # or production
VFD_ENV=dev          # dev or prod (determines API URL)

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vpay

# Authentication
JWT_SECRET=your_jwt_secret
```

### VFD API Environment URLs
```
Development:
  Base: https://api-devapps.vfdbank.systems
  Path: /vtech-wallet/api/v2/wallet2
  Full: https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2

Production:
  Base: https://api-apps.vfdbank.systems
  Path: /vtech-wallet/api/v2/wallet2
  Full: https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2
```

## Security Considerations

1. **API Credentials**: Stored in `.env`, never committed to git
2. **Bearer Token**: Obtained fresh for each request, expired tokens automatically refreshed
3. **Account Numbers**: Always validated (10 digits) before sending to VFD
4. **Bank Codes**: Always validated (6 digits) before sending to VFD
5. **Beneficiary Auto-Save**: Only after successful transfer confirmation
6. **Error Messages**: Generic for frontend (no sensitive details exposed)
7. **Logging**: Full details logged server-side only, never sent to frontend

## Testing Strategy

1. **Unit Tests**: Test bankService.js validation logic
2. **Integration Tests**: Test full request flow to mock VFD API
3. **E2E Tests**: Test-vfd-transfer.js against real VFD API
4. **Manual Testing**: Transfer to known accounts, verify Socket.IO events

## Performance Optimization

1. **Token Caching**: VFD tokens cached, reused until expiry
2. **Connection Pooling**: MySQL connections pooled
3. **Request Timeouts**: All VFD requests have 30s timeout
4. **Error Fallback**: 5 attempts before giving up (max retry: 5)
5. **Beneficiary Caching**: Recent recipients cached in AsyncStorage (frontend)

## Monitoring & Debugging

### Logs to Monitor
- VFD API requests/responses in server logs
- Account verification success/failure rates
- Transfer status in database
- Socket.IO event emissions

### Key Metrics
- Account verification success rate
- VFD API response time (avg, p95)
- Transfer completion rate
- Socket.IO event delivery rate
- Error rate by type (validation, not-found, service)

---

**Last Updated**: Current Session
**Version**: 1.0 (Multi-method fallback implemented)
**Status**: Ready for testing
