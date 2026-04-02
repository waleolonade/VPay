# VFD Integration Testing Checklist

## Pre-Test Checklist

- [ ] `.env` file exists in `VPay-Backend/` with these variables:
  ```env
  VFD_CONSUMER_KEY=<your_key>
  VFD_CONSUMER_SECRET=<your_secret>
  VFD_TOKEN_VALIDITY=-1
  NODE_ENV=development
  ```

- [ ] You have a test account number (10 digits)
  - Example: `0123456789`
  - Can use your own VFD account

- [ ] You have a bank code (6 digits)
  - Example: `000014` for GTBank
  - See VFD_INTEGRATION_GUIDE.md for full list

- [ ] Node.js dependencies installed:
  ```bash
  cd VPay-Backend
  npm install
  ```

## Step-by-Step Testing

### Step 1: Run the Diagnostic Test
```bash
cd VPay-Backend
node test-vfd-transfer.js
```

**What to expect**:
- Script authenticates with VFD
- Tries 5 different endpoint variations
- Shows success/failure for each
- Displays the response structure

**What to look for**:
```
TEST Parameters:
  Account: 0123456789
  Bank Code: 000014
  Base URL: https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2

Attempt 1: GET /transfer/recipient (snake_case)
  URL: /transfer/recipient?accountNo=0123456789&bank=000014&transfer_type=inter
  Status: 404 ❌

Attempt 2: GET /transfer/recipient (camelCase)
  URL: /transfer/recipient?accountNumber=0123456789&bankCode=000014&transferType=inter
  Status: 200 ✓ SUCCESS!
  Response: { status: '00', data: {...} }

Attempt 3: POST /transfer/recipient (snake_case)
  Status: 404 ❌

Attempt 4: POST /transfer/resolve
  Status: 404 ❌

Attempt 5: GET /beneficiary
  Status: 404 ❌
```

### Step 2: Identify the Working Endpoint
The test output will clearly show which endpoint works (status 200 with status: '00').

**Example**: If "Attempt 2: GET /transfer/recipient (camelCase)" shows ✓, that's your working endpoint.

### Step 3: Update vfdWalletService.js (Optional)
If the working endpoint is not the first attempt, you can optimize by moving it up:

Edit `VPay-Backend/services/vfdWalletService.js` line 48-70:
```javascript
const attempts = [
  { name: 'GET /transfer/recipient (camelCase)',  // ← Move working one here
    method: 'get', 
    url: `/transfer/recipient?accountNumber=${accountNo}&bankCode=${bankCode}&transferType=${transferType}` },
  // ... rest remain in fallback order
];
```

### Step 4: Test from Frontend
1. Start the backend: `npm run dev`
2. Start the mobile app: `npm start` (in root VPay folder)
3. Navigate to Bank Transfer screen
4. Try transferring to the test account number
5. Should see account holder name appear

### Step 5: Verify Socket.IO Events
For real-time updates to work:

**In BankTransferScreen**:
- After transfer completes, should see purple/green toast
- Wallet balance should update in real-time

**In VPayToVPayScreen** (for P2P):
- Sender sees purple "Transfer Sent" toast
- Recipient sees green "Transfer Received" toast
- Both refresh wallet balance automatically

## Common Parameters

### Account Number
- Must be exactly **10 digits**
- Format: `0123456789` ✅
- Format: `123456789` ❌ (only 9 digits)
- Format: `01234567890` ❌ (11 digits)

### Bank Code
- Must be exactly **6 digits**
- Format: `000014` ✅
- Format: `14` ❌ (only 2 digits)
- Format: `0000014` ❌ (7 digits)

### Transfer Type
- Options: `inter` (interbank) | `intra` (same bank)
- Default in code: `inter`

## Error Response Handling

### Status Code 200, Status: '00'
✅ **SUCCESS** - Account found and verified

### Status Code 200, Status: '01', '02', etc.
⚠️ **PENDING** - Request received but not completed yet

### Status Code 404
❌ **NOT FOUND** - Account doesn't exist OR endpoint format wrong

### Status Code 401
❌ **UNAUTHORIZED** - VFD credentials invalid

### Status Code 500
❌ **SERVICE ERROR** - VFD BaaS service error

## Debugging Commands

### Check if Node modules installed
```bash
cd VPay-Backend
npm list dotenv axios express mysql2
```

### Run test with verbose logging
```bash
cd VPay-Backend
NODE_DEBUG=* node test-vfd-transfer.js  # Very verbose
```

### Check .env file is readable
```bash
cd VPay-Backend
cat .env  # Linux/Mac
type .env  # Windows PowerShell
```

### Test VFD connectivity directly
```bash
# Linux/Mac
curl -H "Authorization: Bearer YOUR_VFD_TOKEN" \
  https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2/transfer/recipient?accountNo=0123456789&bank=000014

# Windows PowerShell
$headers = @{"Authorization" = "Bearer YOUR_VFD_TOKEN"}
Invoke-WebRequest -Uri "https://..." -Headers $headers
```

## Files Involved

```
VPay-Backend/
├── test-vfd-transfer.js          ← Run this to test
├── .env                          ← Credentials here
├── VFD_INTEGRATION_GUIDE.md      ← Overview
├── TESTING_CHECKLIST.md          ← This file
├── services/
│   ├── vfdWalletService.js       ← Makes VFD API calls
│   └── bankService.js            ← Validates accounts
└── controllers/
    └── paymentController.js      ← Route handler
```

## What Each File Does

| File | Purpose | Key Function |
|------|---------|--------------|
| `test-vfd-transfer.js` | Diagnostic script | Tests all 5 endpoint variations |
| `vfdWalletService.js` | VFD API client | `getTransferRecipient()` with fallback |
| `bankService.js` | Account verification | `verifyAccountNumber()` with validation |
| `paymentController.js` | HTTP routes | `/api/v1/payments/resolve-account` endpoint |

## Success Indicators

✅ Test script output shows at least one "✓ SUCCESS"
✅ Account holder name appears in response
✅ Frontend receives account name when verifying account
✅ Transfer to verified account completes without 500 error
✅ Socket.IO toast appears when transfer sent/received

## Next Steps if Test Fails

1. **All 5 attempts fail**: 
   - Check `.env` credentials
   - Verify network connectivity to VFD API
   - Contact VFD support

2. **401 Unauthorized**:
   - Verify VFD_CONSUMER_KEY and VFD_CONSUMER_SECRET
   - Check if credentials are expired
   - Get fresh credentials from VFD portal

3. **Account not found for all endpoints**:
   - Verify account number is correct (10 digits)
   - Verify bank code is correct (6 digits)
   - Try with a known working account
   - Contact VFD support with the error details

4. **Different response format than expected**:
   - Look at actual VFD response in test output
   - Update `normalizeRecipientResponse()` in vfdWalletService.js
   - Share response structure to team for documentation

## References

- VFD Documentation: https://vbaas-docs.vfdtech.ng/
- VFD API Base URLs:
  - Dev: `https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2`
  - Prod: `https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2`
- Bank Codes: See `vfdWalletService.js` lines 190-250

---

**Last Updated**: Current Session
**Status**: Test script ready, multi-method fallback implemented
**Next Action**: Run `node test-vfd-transfer.js` with your VFD credentials
