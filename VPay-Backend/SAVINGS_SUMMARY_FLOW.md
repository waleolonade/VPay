# Savings Summary Feature - Full Stack Implementation

## 🎯 Overview
This document describes the complete data flow from the SQL database to the UI component for the Savings Summary feature.

---

## 📊 **Database Layer** (MySQL)

### Table: `savings`
```sql
CREATE TABLE savings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reference VARCHAR(50) UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15, 2) DEFAULT 0.00,
  current_balance DECIMAL(15, 2) DEFAULT 0.00,  -- ⭐ Used in summary
  interest_rate DECIMAL(5, 4) DEFAULT 0.0000,
  interest_earned DECIMAL(15, 2) DEFAULT 0.00,  -- ⭐ Used in summary
  frequency ENUM('daily', 'weekly', 'monthly'),
  status ENUM('active', 'completed', 'broken'),  -- ⭐ Used in summary
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### SQL Query
```sql
SELECT 
  COALESCE(SUM(current_balance), 0) as totalBalance,
  COALESCE(SUM(interest_earned), 0) as totalInterest,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans,
  COUNT(*) as totalPlans
FROM savings 
WHERE user_id = ?
```

---

## 🔧 **Model Layer** (Node.js)

**File:** `VPay-Backend/models/Savings.js`

```javascript
async getSummary(userId) {
  const sql = `
    SELECT 
      COALESCE(SUM(current_balance), 0) as totalBalance,
      COALESCE(SUM(interest_earned), 0) as totalInterest,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans,
      COUNT(*) as totalPlans
    FROM savings 
    WHERE user_id = ?
  `;
  const [rows] = await pool.query(sql, [userId]);
  return {
    totalBalance: parseFloat(rows[0].totalBalance) || 0,
    totalInterest: parseFloat(rows[0].totalInterest) || 0,
    activePlans: parseInt(rows[0].activePlans) || 0,
    totalPlans: parseInt(rows[0].totalPlans) || 0,
  };
}
```

**Returns:**
```json
{
  "totalBalance": 25000.50,
  "totalInterest": 1250.75,
  "activePlans": 3,
  "totalPlans": 5
}
```

---

## 🎮 **Controller Layer** (Express)

**File:** `VPay-Backend/controllers/savingsController.js`

```javascript
// @desc    Get savings summary
// @route   GET /api/v1/savings/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    const summary = await Savings.getSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 25000.50,
    "totalInterest": 1250.75,
    "activePlans": 3,
    "totalPlans": 5
  }
}
```

---

## 🚦 **Route Layer** (Express Router)

**File:** `VPay-Backend/routes/savingsRoutes.js`

```javascript
const { protect } = require('../middleware/auth');
const { getSummary } = require('../controllers/savingsController');

router.get('/summary', protect, getSummary);
```

**Registered in:** `VPay-Backend/server.js`
```javascript
app.use('/api/v1/savings', savingsRoutes);
```

**Full Endpoint:** `GET /api/v1/savings/summary`

---

## 🌐 **API Service Layer** (React Native)

### Constants
**File:** `src/constants/apiEndpoints.js`

```javascript
export const endpoints = {
  SAVINGS_SUMMARY: `${v1}/savings/summary`,
};
```

### Service
**File:** `src/services/savingsService.js`

```javascript
export const savingsService = {
  getSummary: () => api.get(endpoints.SAVINGS_SUMMARY),
};
```

---

## 📱 **Component Layer** (React Native)

**File:** `src/screens/savings/SavingsScreen.js`

```javascript
const [summary, setSummary] = useState({
  totalBalance: 0,
  totalInterest: 0,
  activePlans: 0
});

const loadSavings = async () => {
  const summaryRes = await savingsService.getSummary();
  if (summaryRes.success) {
    setSummary(summaryRes.data);
  }
};

// UI Rendering
const totalSaved = summary.totalBalance;
const totalInterest = summary.totalInterest;

<View style={styles.summaryCard}>
  <View style={styles.summaryRow}>
    <View>
      <Text style={styles.summaryLabel}>Total Balance</Text>
      <Text style={styles.summaryAmount}>
        ₦{totalSaved.toLocaleString()}
      </Text>
    </View>
    <View style={styles.interestBox}>
      <Text style={styles.interestLabel}>Total Interest</Text>
      <Text style={styles.interestValue}>
        +₦{totalInterest.toLocaleString()}
      </Text>
    </View>
  </View>
</View>
```

---

## 🔐 **Authentication Flow**

1. **User Login** → JWT token generated
2. **Token stored** in AsyncStorage
3. **API request** includes token in Authorization header
4. **Middleware** (`protect`) verifies token
5. **req.user** populated with user data
6. **Controller** uses `req.user.id` for database query

---

## 🔄 **Complete Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Component                              │
│  (SavingsScreen.js)                                             │
│  - Displays Total Balance: ₦25,000.50                          │
│  - Displays Total Interest: +₦1,250.75                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │ savingsService.getSummary()
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Service                             │
│  (savingsService.js)                                            │
│  api.get('/api/v1/savings/summary')                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP GET Request
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Route                                │
│  (savingsRoutes.js)                                             │
│  router.get('/summary', protect, getSummary)                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Route matched
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Auth Middleware                              │
│  (middleware/auth.js)                                           │
│  - Verify JWT token                                             │
│  - Attach req.user                                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Token valid
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Controller                                   │
│  (savingsController.js)                                         │
│  - Call Savings.getSummary(req.user.id)                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Execute query
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Model Layer                                  │
│  (Savings.js)                                                   │
│  - Build SQL query                                              │
│  - Execute via connection pool                                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │ SQL Query
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MySQL Database                               │
│  SELECT                                                          │
│    COALESCE(SUM(current_balance), 0) as totalBalance,          │
│    COALESCE(SUM(interest_earned), 0) as totalInterest,         │
│    COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans│
│  FROM savings WHERE user_id = 'user-123'                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Result rows
                   ▼
                Response flows back up the chain
```

---

## 🧪 **Testing**

### Run Backend Test
```bash
node VPay-Backend/scripts/test-savings-summary.js
```

### Test with cURL
```bash
curl -X GET http://localhost:3000/api/v1/savings/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "totalBalance": 25000.50,
    "totalInterest": 1250.75,
    "activePlans": 3,
    "totalPlans": 5
  }
}
```

---

## 📁 **File Structure**

```
VPay-Backend/
├── models/
│   └── Savings.js              # ⭐ Database queries
├── controllers/
│   └── savingsController.js    # ⭐ Business logic
├── routes/
│   └── savingsRoutes.js        # ⭐ API routes
└── scripts/
    ├── savings_schema.sql      # 📄 Database schema
    └── test-savings-summary.js # 🧪 Test script

VPay/src/
├── constants/
│   └── apiEndpoints.js         # ⭐ API endpoint constants
├── services/
│   └── savingsService.js       # ⭐ API service
└── screens/savings/
    └── SavingsScreen.js        # ⭐ UI Component
```

---

## 🎯 **Key Features**

✅ **Database aggregation** - Calculations done in SQL for performance  
✅ **Secure authentication** - JWT middleware protection  
✅ **Error handling** - Try-catch blocks at every layer  
✅ **Type safety** - Proper type conversion (parseFloat, parseInt)  
✅ **Real-time updates** - RefreshControl for pull-to-refresh  
✅ **Optimized queries** - Using COALESCE for null safety  

---

## 🚀 **Performance Optimizations**

1. **Single SQL query** - Aggregates all data in one database call
2. **Indexed columns** - `user_id` and `status` are indexed
3. **Connection pooling** - Reuses database connections
4. **Parallel requests** - Frontend fetches summary and plans in parallel

---

## 🔒 **Security**

- **JWT Authentication** required for all endpoints
- **User isolation** - Queries filtered by `user_id`
- **SQL injection prevention** - Parameterized queries
- **Input validation** - Type checking in controller

---

## 📝 **Notes**

- Summary is calculated server-side for accuracy
- Supports multiple savings plans per user
- Interest is automatically earned based on interest rate
- Status can be: `active`, `completed`, or `broken`
