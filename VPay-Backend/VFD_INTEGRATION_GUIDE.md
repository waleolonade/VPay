# VFD BaaS API Integration Guide

## Overview
This guide helps you test and debug the VFD BaaS API integration for account verification and transfers.

## Quick Start - Test Account Verification

### 1. Run the VFD Transfer Test Script
```bash
cd VPay-Backend
node test-vfd-transfer.js
```

This script will:
- ✅ Authenticate with VFD BaaS
- ✅ Try 5 different endpoint variations to find which works
- ✅ Show the correct response format for your VFD instance
- ✅ Identify which endpoint is compatible with your credentials

### 2. Check the Logs
Look for lines like:
```
[SUCCESS] ✓ This endpoint works!
[DATA] Response structure: {...}
```

This tells you which endpoint VFD is using.

## VFD API Endpoints Being Tested

The test script tries these endpoints in order of likelihood:

### 1. GET /transfer/recipient (snake_case)
```http
GET /transfer/recipient?accountNo=1234567890&bank=000014&transfer_type=inter
```

### 2. GET /transfer/recipient (camelCase)
```http
GET /transfer/recipient?accountNumber=1234567890&bankCode=000014&transferType=inter
```

### 3. POST /transfer/recipient (snake_case)
```http
POST /transfer/recipient
{
  "accountNo": "1234567890",
  "bank": "000014",
  "transfer_type": "inter"
}
```

### 4. POST /transfer/resolve
```http
POST /transfer/resolve
{
  "accountNo": "1234567890",
  "bankCode": "000014",
  "transferType": "inter"
}
```

### 5. GET /beneficiary
```http
GET /beneficiary?accountNo=1234567890&bank=000014
```

## Expected VFD Response Format

### Success Response (status: '00')
```json
{
  "status": "00",
  "message": "Successful",
  "data": {
    "name": "JOHN DOE",              // Account holder name
    "account": {
      "number": "1234567890",        // Account number
      "id": "ACC_12345"              // Account ID (for transfers)
    },
    "clientId": "CLI_001",           // Client ID
    "bvn": "12345678901",            // BVN (optional)
    "bank": {
      "code": "000014",
      "name": "GTBank"
    }
  }
}
```

### Error Response (account not found)
```json
{
  "status": "01",
  "message": "Account not found"
}
```

## Troubleshooting

### Problem 1: 404 Error
**Symptom**: Request failed with status code 404

**Causes**:
- 🔴 Endpoint path is incorrect
- 🔴 Parameter names are wrong (snake_case vs camelCase)
- 🔴 Request method is wrong (GET vs POST)

**Solution**: Run `test-vfd-transfer.js` to identify correct endpoint

### Problem 2: 401 Unauthorized
**Symptom**: VFD returns 401 error

**Causes**:
- 🔴 VFD_CONSUMER_KEY or VFD_CONSUMER_SECRET is invalid
- 🔴 Credentials are expired
- 🔴 Token not being passed correctly

**Solution**:
1. Verify `.env` has correct VFD credentials:
   ```env
   VFD_CONSUMER_KEY=your_key
   VFD_CONSUMER_SECRET=your_secret
   VFD_TOKEN_VALIDITY=-1
   NODE_ENV=development  # or production
   ```
2. Run `test-vfd-transfer.js` to test auth

### Problem 3: Account Validation Failed
**Symptom**: "Could not verify account number"

**Causes**:
- 🔴 Account number doesn't exist
- 🔴 Account number format is wrong (must be 10 digits)
- 🔴 Bank code is wrong
- 🔴 Response structure different from expected format

**Solution**:
1. Verify account number is exactly 10 digits
2. Verify bank code is exactly 6 digits
3. Test with a known working account
4. Check test script output for actual VFD response

## Integration Points

### Frontend Flow
1. User enters account number + bank code
2. Frontend calls: `POST /api/v1/payments/resolve-account`
3. Backend calls: `verifyAccountNumber()` in bankService.js
4. bankService calls: `getTransferRecipient()` in vfdWalletService.js
5. Response: Account holder name or error message

### Backend Components

**File**: `services/vfdWalletService.js`
- `getTransferRecipient()` - Main API call with fallback logic
- `normalizeRecipientResponse()` - Standardizes VFD response format
- Tries 5 endpoint variations automatically
- Returns normalized data structure

**File**: `services/bankService.js`
- `verifyAccountNumber()` - High-level account verification
- Input validation (format checking)
- Error handling with user-friendly messages
- Returns standardized success/error responses

**File**: `controllers/paymentController.js`
- `resolveAccount()` - Express route handler
- Input validation
- Error response formatting for frontend
- 400 = validation error, 500 = service error

## VFD Bank Codes Reference

Common Nigerian bank codes:
```
000014 = Guaranty Trust Bank (GTBank)
000015 = Zenith Bank
000013 = First Bank
000009 = First City Monument Bank
000004 = Access Bank
090267 = Providus Bank
100004 = First Inland Bank
999999 = VFD Intra-bank (VPay wallets)
```

See `vfdWalletService.js` `getBankList()` for complete list.

## Next Steps

1. **Run the test**: `node test-vfd-transfer.js`
2. **Identify working endpoint**: Look for "This endpoint works!"
3. **Update code if needed**: If test finds different endpoint, update vfdWalletService.js
4. **Test from frontend**: Try transferring to a known account
5. **Check logs**: Monitor backend logs for any issues

## Debug Logging

All operations log to this format:
```
[VFD] Attempting: GET /transfer/recipient (snake_case) → /transfer/recipient?accountNo=...
[VFD] Response status: 200, data.status: 00
[VFD] ✓ Resolution successful via GET /transfer/recipient (snake_case)
[VFD] Recipient: JOHN DOE
```

Check logs in: `VPay-Backend/logs/` or console output

## Support

If issues persist:
1. Ensure all VFD credentials are correct
2. Contact VFD support with the actual API response from the test script
3. Check if VFD API is in maintenance
4. Verify network connectivity to `api-devapps.vfdbank.systems` or `api-apps.vfdbank.systems`
