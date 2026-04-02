const { pool } = require('./config/database');

async function checkSpecificAccount() {
  try {
    console.log('🔍 Checking account: 4510464657\n');
    
    // Find the wallet
    const [wallets] = await pool.query(
      'SELECT * FROM wallets WHERE account_number = ?',
      ['4510464657']
    );
    
    if (wallets.length === 0) {
      console.log('❌ Account not found in wallets table');
      pool.end();
      return;
    }
    
    const wallet = wallets[0];
    console.log('✅ Wallet Found:');
    console.log('   ID:', wallet.id);
    console.log('   User ID:', wallet.user_id);
    console.log('   Account Number:', wallet.account_number);
    console.log('   Account Name:', wallet.account_name);
    console.log('   Balance:', `₦${Number(wallet.balance).toLocaleString()}`);
    console.log('   Wallet Type:', wallet.wallet_type);
    console.log('   Bank Name:', wallet.bank_name);
    console.log('   Is Active:', wallet.is_active);
    console.log('   Is Frozen:', wallet.is_frozen);
    console.log('   Created:', wallet.created_at);
    console.log('');
    
    // Get user details
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [wallet.user_id]
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User Details:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.first_name, user.last_name);
      console.log('');
    }
    
    // Simulate backend API response
    const [allWallets] = await pool.query(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY wallet_type ASC',
      [wallet.user_id]
    );
    
    console.log('📤 Backend API Response (what frontend receives):\n');
    
    const personalWallet = allWallets.find(w => w.wallet_type === 'personal');
    const businessWallet = allWallets.find(w => w.wallet_type === 'business');
    
    const apiResponse = {
      success: true,
      data: {
        totalBalance: allWallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0),
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
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n📱 Frontend Display (accountMode = "personal"):');
    const personalAccount = apiResponse.data.accounts.find(a => a.type === 'personal');
    if (personalAccount) {
      console.log('   Balance to show:', `₦${Number(personalAccount.balance).toLocaleString()}`);
      console.log('   Account Number:', personalAccount.accountNumber);
      console.log('   Account Name:', personalAccount.accountName);
    } else {
      console.log('   ❌ No personal account found!');
    }
    
    console.log('\n💡 Is this the account you expected?');
    console.log('   Account 4510464657 belongs to wallet type:', wallet.wallet_type);
    console.log('   You need to be in', wallet.wallet_type, 'mode to see this balance');
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    pool.end();
    process.exit(1);
  }
}

checkSpecificAccount();
