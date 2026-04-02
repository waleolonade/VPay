const { pool } = require('./config/database');

async function testWalletDataFlow() {
  try {
    console.log('🧪 Testing Wallet Data Flow\n');
    
    // Get a test user
    const [users] = await pool.query('SELECT id, email, first_name, last_name FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      pool.end();
      return;
    }
    
    const testUser = users[0];
    console.log('📊 Test User:', testUser.email);
    console.log('   User ID:', testUser.id);
    console.log('   Name:', testUser.first_name, testUser.last_name, '\n');
    
    // Query wallets table (matching backend query)
    console.log('🔍 Querying wallets table...');
    const [wallets] = await pool.query(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY wallet_type ASC',
      [testUser.id]
    );
    
    if (wallets.length === 0) {
      console.log('⚠️  No wallets found for this user');
      console.log('   Creating personal wallet...\n');
      
      // Create a wallet
      const accountNumber = '4' + Math.random().toString().substring(2, 11);
      await pool.query(
        `INSERT INTO wallets (user_id, balance, account_number, account_name, bank_name, wallet_type, is_active) 
         VALUES (?, 50000.00, ?, ?, 'VPay MFB', 'personal', 1)`,
        [testUser.id, accountNumber, `${testUser.first_name} ${testUser.last_name}`]
      );
      
      const [newWallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ?', [testUser.id]);
      wallets.push(...newWallets);
    }
    
    console.log(`✅ Found ${wallets.length} wallet(s):\n`);
    
    wallets.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1} [${wallet.wallet_type}]:`);
      console.log(`   Account Number: ${wallet.account_number}`);
      console.log(`   Account Name: ${wallet.account_name}`);
      console.log(`   Balance: ₦${Number(wallet.balance).toLocaleString()}`);
      console.log(`   Bank: ${wallet.bank_name}`);
      console.log(`   Active: ${wallet.is_active ? 'Yes' : 'No'}`);
      console.log(`   Frozen: ${wallet.is_frozen ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Test backend response format
    console.log('📤 Backend Response Format:\n');
    const personalWallet = wallets.find(w => w.wallet_type === 'personal');
    const businessWallet = wallets.find(w => w.wallet_type === 'business');
    
    const response = {
      success: true,
      data: {
        totalBalance: wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0),
        personalBalance: parseFloat(personalWallet?.balance || 0),
        businessBalance: parseFloat(businessWallet?.balance || 0),
        accounts: [
          personalWallet && {
            id: '1',
            bankName: personalWallet.bank_name || 'VPay MFB',
            accountNumber: personalWallet.account_number,
            accountName: personalWallet.account_name,
            type: 'personal',
            balance: parseFloat(personalWallet.balance || 0)
          },
          businessWallet && {
            id: '2',
            bankName: businessWallet.bank_name || 'VPay MFB',
            accountNumber: businessWallet.account_number,
            accountName: businessWallet.account_name,
            type: 'business',
            balance: parseFloat(businessWallet.balance || 0)
          }
        ].filter(Boolean)
      }
    };
    
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n✅ Data Flow Test Complete!');
    console.log('\n📱 Frontend should receive:');
    console.log(`   accountMode = 'personal'`);
    console.log(`   balance = ${response.data.personalBalance}`);
    console.log(`   accountNumber = ${personalWallet?.account_number}`);
    console.log(`   accountName = ${personalWallet?.account_name}`);
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    pool.end();
    process.exit(1);
  }
}

testWalletDataFlow();
