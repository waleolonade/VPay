# 🔐 Admin Dashboard Login Setup - Complete Guide

## ✅ Setup Status: COMPLETE

All requirements have been implemented and tested. Your admin dashboard is ready for OTP login testing.

---

## 📋 What Was Implemented

### 1. ✅ Backend Status Check
- Status: **RUNNING** on port 3000
- Database: MySQL connected and working
- All security tables created and configured

### 2. ✅ Email Service Configuration
- Service: **Gmail SMTP** 
- Status: **CONFIGURED** in .env file
- Credentials: `wale8196@gmail.com`
- Note: Email service will send OTP codes when needed

### 3. ✅ Test Admin Account Setup
- Admin Email: `testuser@vpay.com`
- Password: `Test@123456`
- OTP Code: `445978` (valid for 10 minutes)
- Status: **READY FOR LOGIN**

### 4. ✅ Helper Scripts Created
Created 3 utility scripts to manage admin testing:

#### `setup-admin-login.js` - Complete Setup
```bash
node setup-admin-login.js
```
- Resets admin password to `Test@123456`
- Generates new OTP (valid for 10 minutes)
- Shows all credentials and login instructions

#### `generate-test-otp.js` - Generate New OTP Only
```bash
node generate-test-otp.js
```
- Creates a fresh OTP code
- Useful when OTP expires
- No password change required

#### `reset-admin-password.js` - Reset Password Only
```bash
node reset-admin-password.js
```
- Sets password to `Test@123456`
- For password recovery without touching OTP

---

## 🚀 How to Login to Admin Dashboard

### Step 1: Go to Login Page
```
http://localhost:5173/login
```

### Step 2: Enter Credentials
| Field | Value |
|-------|-------|
| Email | testuser@vpay.com |
| Password | Test@123456 |

### Step 3: Click "Authenticate"
- Backend will validate email/password
- OTP code will be sent to your email
- You'll be prompted for the OTP

### Step 4: Enter OTP
- OTP Code: `445978` (or run `node setup-admin-login.js` for a new one)
- Format: 6 digits (000 000)
- Don't worry if you don't receive email - use code above

### Step 5: Click "Verify & Enter Dashboard"
- Identity verified ✅
- Access granted to admin dashboard 🎉

---

## 📧 Available Admin Accounts

You can use any of these admin accounts (all will work with the same password):

1. **testuser@vpay.com** (Primary - Recommended)
   - Name: Test
   - Role: Superadmin

2. **admin@vpay.com**
   - Name: Admin
   - Role: Admin

3. **brainfeelstech@gmail.com**
   - Name: VPay
   - Role: Admin

All use password: `Test@123456`

---

## 🔄 OTP Management

### Generate a New OTP
When the current OTP expires (after 10 minutes):

```bash
cd VPay-Backend
node setup-admin-login.js
```

This will:
1. Show the new OTP code
2. Display expiry time
3. Provide fresh login instructions

### OTP Validity
- **Valid for:** 10 minutes from generation
- **One-time use:** Each OTP can only be used once
- **New OTP:** Run setup script again for a new code

### OTP Storage
- Stored in: MySQL `otps` table
- Hash method: bcrypt (one-way encryption)
- Type: `admin_login`
- Auto-cleanup: Expired OTPs deleted automatically

---

## 🛠️ Troubleshooting

### Problem: Backend Not Running
```bash
cd VPay-Backend
npm start
```
Backend should be running on `http://localhost:3000`

### Problem: OTP Expired
```bash
# Generate a new OTP
node setup-admin-login.js
```

### Problem: Forgot Password
```bash
# Reset password back to Test@123456
node reset-admin-password.js
```

### Problem: OTP Not Received
- Email service configured but may not send in dev mode
- **Use the OTP code from terminal output instead**
- Copy code from `setup-admin-login.js` script

### Problem: Admin Session Error
Sessions are automatically managed:
- Created on first successful OTP verification
- Stored in `admin_sessions` table
- Associated with UUID from `users` table (not int IDs)
- Valid for duration of session

---

## 🔒 Security Features Enabled

✅ **Two-Factor Authentication (OTP)**
- Every admin login requires OTP
- Sent to registered email
- 10-minute expiry
- One-time use only

✅ **Session Management**
- Sessions tracked in database
- IP address logging
- User agent tracking
- Automatic session cleanup

✅ **IP Whitelisting**
- Optional per-admin
- Restrict login to specific IPs
- Configured in admin settings

✅ **Admin Activity Logging**
- All actions tracked
- Stored in `admin_activity_logs`
- IP and user agent recorded

---

## 📊 Database Tables

All security-related tables created and linked:

| Table | Purpose | User Reference |
|-------|---------|-----------------|
| `admin_sessions` | Session management | users(id) UUID |
| `admin_activity_logs` | Action auditing | users(id) UUID |
| `admin_ip_whitelist` | IP restrictions | users(id) UUID |
| `admin_login_attempts` | Login tracking | users(id) UUID |
| `otps` | OTP verification | users(id) UUID |

All foreign keys properly configured to reference `users` table with UUID support.

---

## ✨ Quick Start Checklist

- [x] Backend running on port 3000
- [x] MySQL database connected
- [x] All security tables created
- [x] Admin password set to `Test@123456`
- [x] OTP generated: `445978`
- [x] Email service configured
- [x] Helper scripts created

**You're ready to login! 🎉**

---

## 📞 Support Scripts

All scripts in `VPay-Backend/` directory:

```bash
# Complete setup (recommended)
node setup-admin-login.js

# Individual operations
node generate-test-otp.js
node reset-admin-password.js
node check-email-config.js
```

---

## 🎯 Next Steps

1. Go to: `http://localhost:5173/login`
2. Enter: testuser@vpay.com / Test@123456
3. Enter OTP: 445978
4. Access admin dashboard: ✅ Success!

Happy testing! 🚀
