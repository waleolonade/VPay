require('dotenv').config();
const { pool } = require('../config/database');

function genPersonal() {
    const r = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
    return `4${r}`;
}
function genBusiness() {
    const r = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
    return `5${r}`;
}

async function run() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update personal wallets that don't start with 4
        const [personal] = await connection.query(
            `SELECT id, account_number FROM wallets WHERE wallet_type = 'personal' AND account_number NOT LIKE '4%'`
        );
        console.log(`Updating ${personal.length} personal wallet(s)...`);
        for (const w of personal) {
            let newNo = genPersonal();
            // Ensure uniqueness
            const [exists] = await connection.query('SELECT id FROM wallets WHERE account_number = ?', [newNo]);
            while (exists.length > 0) { newNo = genPersonal(); }
            await connection.query('UPDATE wallets SET account_number = ? WHERE id = ?', [newNo, w.id]);
            console.log(`  Personal: ${w.account_number} → ${newNo}`);
        }

        // Update business wallets that don't start with 5
        const [business] = await connection.query(
            `SELECT id, account_number FROM wallets WHERE wallet_type = 'business' AND account_number NOT LIKE '5%'`
        );
        console.log(`Updating ${business.length} business wallet(s)...`);
        for (const w of business) {
            let newNo = genBusiness();
            const [exists] = await connection.query('SELECT id FROM wallets WHERE account_number = ?', [newNo]);
            while (exists.length > 0) { newNo = genBusiness(); }
            await connection.query('UPDATE wallets SET account_number = ? WHERE id = ?', [newNo, w.id]);
            console.log(`  Business: ${w.account_number} → ${newNo}`);
        }

        await connection.commit();
        console.log('✅ All wallet account numbers updated!');

        // Print final state
        const [all] = await connection.query('SELECT wallet_type, account_number, account_name FROM wallets ORDER BY created_at');
        console.log('\nFinal wallet state:');
        all.forEach(w => console.log(`  [${w.wallet_type}] ${w.account_number} - ${w.account_name}`));

    } catch (err) {
        await connection.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();
