require('dotenv').config();
const { pool } = require('../config/database');

function genAccNo() {
    return '9' + String(Math.floor(Math.random() * 900000000 + 100000000));
}
function genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

async function run() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Step 1: Check if uq_wallets_user exists and drop it safely
        // First find the FK referencing uq_wallets_user (if any)
        const [fkRows] = await connection.query(`
            SELECT TABLE_NAME, CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
            AND TABLE_SCHEMA = DATABASE()
        `);

        // Drop foreign keys on tables that reference wallets.user_id (if any point at the unique key)
        for (const fk of fkRows) {
            // Only drop FKs on wallets table itself referencing users
            if (fk.TABLE_NAME === 'wallets') {
                console.log(`Dropping FK: ${fk.CONSTRAINT_NAME} on ${fk.TABLE_NAME}`);
                await connection.query(`ALTER TABLE wallets DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
            }
        }

        // Step 2: Drop the unique index
        const [indexes] = await connection.query(`SHOW INDEX FROM wallets WHERE Key_name = 'uq_wallets_user'`);
        if (indexes.length > 0) {
            await connection.query(`ALTER TABLE wallets DROP INDEX uq_wallets_user`);
            console.log('Dropped uq_wallets_user index');
        }

        // Step 3: Add new composite unique key (one personal + one business per user)
        const [newIdx] = await connection.query(`SHOW INDEX FROM wallets WHERE Key_name = 'uq_wallet_user_type'`);
        if (newIdx.length === 0) {
            await connection.query(`ALTER TABLE wallets ADD UNIQUE KEY uq_wallet_user_type (user_id, wallet_type)`);
            console.log('Added new uq_wallet_user_type index');
        }

        // Step 4: Re-add the FK to users table (now on user_id column directly, not the unique key)
        await connection.query(`
            ALTER TABLE wallets 
            ADD CONSTRAINT fk_wallets_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `).catch(() => console.log('FK already exists or not needed'));

        // Step 5: Set account_names on personal wallets
        await connection.query(`
            UPDATE wallets w
            JOIN users u ON w.user_id = u.id
            SET w.account_name = TRIM(CONCAT(IFNULL(u.first_name,''), ' ', IFNULL(u.last_name,'')))
            WHERE w.wallet_type = 'personal'
        `);

        // Step 6: Create business wallets for users who don't have one
        const [needsBiz] = await connection.query(`
            SELECT u.id, u.first_name, u.last_name
            FROM users u
            WHERE u.id NOT IN (SELECT user_id FROM wallets WHERE wallet_type = 'business')
        `);

        console.log(`Creating business wallets for ${needsBiz.length} user(s)...`);
        for (const u of needsBiz) {
            const id = genUUID();
            const accNo = genAccNo();
            const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
            await connection.query(
                `INSERT INTO wallets (id, user_id, balance, currency, account_number, account_name, bank_name, wallet_type, is_active, is_frozen, daily_limit, transaction_limit, total_credit, total_debit)
                 VALUES (?, ?, 0, 'NGN', ?, ?, 'VPay MFB', 'business', 1, 0, 1000000, 500000, 0, 0)`,
                [id, u.id, accNo, name + ' Business']
            );
        }

        await connection.commit();
        console.log('✅ Dual wallet migration done!');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
