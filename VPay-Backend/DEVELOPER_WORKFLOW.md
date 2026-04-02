# VFD Integration - Developer Workflow Guide

## Phase 1: Pre-Test Setup (5 minutes)

### Step 1.1: Verify Environment File
```bash
cd VPay-Backend
cat .env
```

**Expected Output**:
```env
VFD_CONSUMER_KEY=<your_consumer_key>
VFD_CONSUMER_SECRET=<your_consumer_secret>
VFD_TOKEN_VALIDITY=-1
NODE_ENV=development
```

**If missing**:
- Get credentials from VFD BaaS Portal
- Create `.env` with above variables
- DO NOT commit `.env` to git

### Step 1.2: Install Dependencies
```bash
cd VPay-Backend
npm install
```

**Verify packages**:
```bash
npm list axios dotenv express
```

Should show:
- ✅ axios (for HTTP requests)
- ✅ dotenv (for .env variables)
- ✅ express (for API routes)

### Step 1.3: Get Test Account Details
You need:
1. **Account Number**: 10 digits (e.g., `0123456789`)
   - Can be your own VFD account
   - Or a test account from VFD

2. **Bank Code**: 6 digits (e.g., `000014` for GTBank)
   - From list in `vfdWalletService.js` or `QUICK_REFERENCE.md`

---

## Phase 2: Run Diagnostic Test (5 minutes)

### Step 2.1: Execute Test Script
```bash
cd VPay-Backend
node test-vfd-transfer.js
```

### Step 2.2: Interpret Output

**Look for this pattern**:
```
TEST Parameters:
  Account: 1234567890
  Bank Code: 000014
  Base URL: https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2

Attempt 1: GET /transfer/recipient (snake_case)
Status: 404 ❌

Attempt 2: GET /transfer/recipient (camelCase)
Status: 200 ✓ SUCCESS!
Response Data: { status: '00', ... }
```

**What this means**:
- Attempt 2 (GET with camelCase) is your working endpoint
- VFD API accepts: `accountNumber`, `bankCode`, `transferType` parameters
- Response has status `'00'` = success

### Step 2.3: Save Your Findings

**Record this information**:
```markdown
# My VFD API Configuration

## Working Endpoint
- Method: GET
- Path: /transfer/recipient
- Parameters: camelCase (accountNumber, bankCode, transferType)
- Attempt #: 2

## Test Account
- Account: 1234567890
- Bank: 000014 (GTBank)
- Status: ✓ Verified
```

Keep this for Step 3.

---

## Phase 3: Update Code (Optional - Only if Needed)

### Step 3.1: Check If Update Needed

If your working endpoint is **NOT** Attempt 1:
- System will still work (fallback handles it)
- But you can optimize by moving working one to top

If your working endpoint **IS** Attempt 1:
- ✅ No changes needed! Skip to Phase 4

### Step 3.2: Update vfdWalletService.js

**Edit**: `VPay-Backend/services/vfdWalletService.js` (lines 48-70)

**Find this section**:
```javascript
const attempts = [
  { name: 'GET /transfer/recipient (snake_case)', ... },  // Attempt 1
  { name: 'GET /transfer/recipient (camelCase)', ... },   // Attempt 2
  // ... rest of attempts
];
```

**If Attempt 2 works**:
```javascript
const attempts = [
  { name: 'GET /transfer/recipient (camelCase)',          // ← Move this to #1
    method: 'get', 
    url: `/transfer/recipient?accountNumber=${accountNo}&bankCode=${bankCode}&transferType=${transferType}` },
  
  { name: 'GET /transfer/recipient (snake_case)',         // ← Move this to #2
    method: 'get', 
    url: `/transfer/recipient?accountNo=${accountNo}&bank=${bankCode}&transfer_type=${transferType}` },
  
  // ... rest of attempts unchanged
];
```

**Add a comment**:
```javascript
// Reordered: Attempt 2 works best for our VFD instance
// Date: 2024-01-15 | Tested with GTBank account
const attempts = [
  // ...
];
```

**Save file**: Ctrl+S

### Step 3.3: Verify No Errors

```bash
# In VS Code terminal
cd VPay-Backend
node -c services/vfdWalletService.js  # Syntax check
```

Should show: No output = ✅ Good

---

## Phase 4: Test from Backend (10 minutes)

### Step 4.1: Start Backend Server
```bash
cd VPay-Backend
npm run dev
```

**Expected output**:
```
Server running on port 3000
Socket.IO server initialized
Database connected
```

Let it run - don't close this terminal.

### Step 4.2: Open New Terminal for API Testing

**Test via curl (Mac/Linux)**:
```bash
curl -X POST http://localhost:3000/api/v1/payments/resolve-account \
  -H "Content-Type: application/json" \
  -d '{"accountNumber":"1234567890","bankCode":"000014"}'
```

**Test via PowerShell (Windows)**:
```powershell
$body = @{
    accountNumber = "1234567890"
    bankCode = "000014"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/payments/resolve-account" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Step 4.3: Check Response

**Success Response** (status 200):
```json
{
  "success": true,
  "data": {
    "accountName": "JOHN DOE",
    "accountNumber": "1234567890",
    "clientId": "CLI_001",
    "bank": {
      "code": "000014",
      "name": "GTBank"
    }
  }
}
```

✅ **Great!** Account verification is working.

**Error Response** (status 400):
```json
{
  "success": false,
  "message": "Invalid account number format. Expected 10 digits, got: 123456789"
}
```

Check your input format - account must be 10 digits, bank code 6 digits.

**Error Response** (status 500):
```json
{
  "success": false,
  "message": "Could not verify account. Please try again later."
}
```

Check backend logs for details. Might be:
- VFD credentials invalid
- Network connectivity issue
- VFD API temporarily down

---

## Phase 5: Test from Frontend (15 minutes)

### Step 5.1: Start Mobile App
In another terminal (not the backend one):
```bash
cd VPay  # Go to root, not VPay-Backend
npm start
```

This starts the Metro bundler. Wait for "⚡ MetroStarting..." message.

### Step 5.2: Launch App
- Press `i` for iOS simulator, or
- Press `a` for Android emulator, or
- Manually open app on physical device

### Step 5.3: Navigate to Bank Transfer Screen

**Path in app**:
1. Open app
2. Go to "Payments" or "Transfer" tab
3. Select "Bank Transfer"
4. Tap "Verify Account"

### Step 5.4: Enter Test Account Details
- Account Number: `1234567890` (use same as your test)
- Bank: Select `GTBank` from dropdown (or your test bank)

### Step 5.5: Verify Success

**Expected**: After tapping "Verify":
- ✅ Account holder name appears: "JOHN DOE"
- ✅ "Account verified" message shows
- ✅ Button changes to "Transfer"
- ✅ No error message

**If error appears**:
- Check account number format (10 digits)
- Check bank code (6 digits)
- Check backend is running (`npm run dev` in VPay-Backend)

### Step 5.6: Check Backend Logs

In backend terminal, you should see:
```
[VFD] Attempting: GET /transfer/recipient...
[VFD] Response status: 200
[VFD] ✓ Resolution successful via GET /transfer/recipient (camelCase)
[VFD] Recipient: JOHN DOE
[DEBUG] Account verification successful
```

These logs confirm:
- ✅ Backend received request
- ✅ VFD API responded
- ✅ Account found and returned to frontend

---

## Phase 6: Test Real Transfers (20 minutes)

### Step 6.1: Prepare Two Test Accounts

Get details for:
1. **Account A** (Sender)
   - Phone: `+234812345678`
   - Balance: At least N10,000
   
2. **Account B** (Recipient)
   - Phone: `+234987654321`
   - Available on same WiFi network

### Step 6.2: Test Bank Transfer (A → External Bank)

**From Account A App**:
1. Go to Bank Transfer screen
2. Verify an external account (any GTBank account)
3. Enter amount: `N1,000`
4. Tap "Send"
5. Enter PIN
6. Wait for "Transfer sent" confirmation

**Expected**:
- ✅ Toast appears: "Transfer sent"
- ✅ Balance updates in real-time
- ✅ Beneficiary saved

**Check Backend Log**:
```
[TRANSFER] Initiating bank transfer...
[VFD] Transfer request sent to VFD
[EMIT] bank_transfer_completed → userId
[DB] Transfer logged
```

### Step 6.3: Test P2P Transfer (A → B)

**From Account A App**:
1. Go to VPay Transfer screen
2. Search recipient: `+234987654321` or recipient name
3. Enter amount: `N2,000`
4. Tap "Send"
5. Review details
6. Enter PIN
7. Confirm transfer

**Expected (Account A)**:
- ✅ Toast: "Transfer sent to [Name]" (purple)
- ✅ Balance decreases by N2,000
- ✅ Transfer appears in history

**Expected (Account B)** - on same WiFi:
- ✅ Toast: "You received N2,000 from [Name]" (green)
- ✅ Balance increases by N2,000
- ✅ Transfer appears in history

**Real-Time Verification**:
- Both toasts appear within 1 second
- Both balances update simultaneously
- This confirms Socket.IO working

### Step 6.4: Check Transaction in Database

**Connect to MySQL**:
```bash
mysql -h localhost -u root -p vpay
```

**Check transactions table**:
```sql
SELECT * FROM transactions 
WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '%812345678%')
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected columns**:
- `id`: Unique transaction ID
- `type`: 'transfer', 'bank_transfer', etc.
- `amount`: Transfer amount
- `status`: 'completed', 'pending', 'failed'
- `created_at`: Timestamp

---

## Phase 7: Troubleshooting (As Needed)

### One or Both Toasts Don't Appear

**Problem**: Transfer completes but no real-time notification

**Diagnosis**:
1. Check Socket.IO connection:
   ```javascript
   // In app console
   console.log('Socket connected:', socket.connected);
   ```

2. Backend logs for emit:
   ```
   [EMIT] transfer_sent → userId
   [SOCKET] Sent to room: user_XXX
   ```

**Fix**:
1. Check Socket.IO server running: `socket.io:*` in logs
2. Verify frontend has listener attached
3. Confirm user room is subscribed

### Account Verification Returns 404

**Problem**: "Invalid account" error

**Diagnosis**:
1. Verify account number is 10 digits
2. Verify bank code is 6 digits
3. Try different account number
4. Check backend logs for actual VFD response

**Fix**:
1. Run test script again: `node test-vfd-transfer.js`
2. Check if working endpoint changed
3. Update vfdWalletService.js if needed

### Transfers Execute But Balance Doesn't Update

**Problem**: Transfer succeeds but balance stale

**Diagnosis**:
1. Check Socket.IO events emitted
2. Verify frontend listener is active
3. Check if wallet refresh triggered

**Fix**:
1. Force manual refresh: Pull-to-refresh screen
2. Check Socket.IO event names match exactly
3. Verify user room subscription

### VFD API Returns 401 Unauthorized

**Problem**: VFD credentials invalid

**Diagnosis**:
```bash
# Test script will show
Status: 401
Message: Unauthorized
```

**Fix**:
1. Verify `.env` credentials are correct
2. Get fresh credentials from VFD portal
3. Check if credentials have expired
4. Restart backend: `npm run dev`

---

## Phase 8: Documentation & Handoff

### Step 8.1: Document Your Setup

Create a file: `VPay-Backend/VFD_SETUP_NOTES.md`

```markdown
# VFD Setup Notes

## Working Configuration
- Date: 2024-01-15
- Developer: Your Name
- VFD Environment: Development

## Working Endpoint
- Method: GET
- Path: /transfer/recipient
- Parameter Style: camelCase
- Attempt #: 2

## Test Accounts
- Account 1: 1234567890 (GTBank)
- Account 2: 9876543210 (GTBank)
- Status: Both verified and working

## Issues Encountered
- (none yet, all working!)

## Performance
- Account verification: ~1.2s
- Transfer execution: 3.5s
- Socket.IO delivery: 50ms
```

### Step 8.2: Team Handoff

Share with team:
1. ✅ `VFD_SETUP_NOTES.md` (your findings)
2. ✅ `TESTING_CHECKLIST.md` (how others can test)
3. ✅ `QUICK_REFERENCE.md` (quick lookups)
4. ✅ `ARCHITECTURE.md` (system design)

### Step 8.3: Commit to Git

```bash
cd VPay-Backend
git add QUICK_REFERENCE.md TESTING_CHECKLIST.md ARCHITECTURE.md VFD_INTEGRATION_GUIDE.md

git commit -m "docs: Add comprehensive VFD integration documentation

- Add QUICK_REFERENCE.md for quick lookups
- Add TESTING_CHECKLIST.md for step-by-step testing
- Add ARCHITECTURE.md for system design overview
- Add VFD_INTEGRATION_GUIDE.md for detailed guide

All VFD endpoints have multi-method fallback system.
Account verification validated against real VFD API.
Socket.IO real-time events working for both P2P and bank transfers."

git push origin main
```

---

## Success Criteria Checklist

- [ ] Test script runs without errors
- [ ] One of 5 endpoints marked as ✓ SUCCESS
- [ ] Backend `/resolve-account` endpoint returns 200
- [ ] Account name appears on frontend when verifying
- [ ] Bank transfer executes without 500 error
- [ ] P2P transfer executes without 500 error
- [ ] Real-time toast appears within 1 second
- [ ] Balance updates in real-time on both devices
- [ ] Beneficiaries auto-saved after transfer
- [ ] Transaction logged in database
- [ ] Team documentation created and shared

---

## Time Breakdown

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Setup | 5 min | Start here |
| 2 | Diagnostic test | 5 min | Run test script |
| 3 | Code updates | 5 min | Only if needed |
| 4 | Backend API test | 10 min | Curl/PowerShell test |
| 5 | Frontend app test | 15 min | Mobile app testing |
| 6 | Real transfers | 20 min | E2E testing |
| 7 | Troubleshooting | Variable | As needed |
| 8 | Documentation | 10 min | Share findings |
| **Total** | | **~80 min** | If all works |

---

## Next Immediate Action

**RIGHT NOW**:
1. Open terminal
2. Run: `cd VPay-Backend && node test-vfd-transfer.js`
3. Note which endpoint shows ✓ SUCCESS
4. Continue to Phase 3 based on result

**Then**:
1. Start backend: `npm run dev`
2. Start frontend: `npm start`
3. Test account verification on app
4. Test real transfer
5. Verify Socket.IO events work

---

**Last Updated**: Current Session
**Version**: 1.0
**Status**: Ready for developer workflows
**Duration**: ~80 minutes for complete testing
