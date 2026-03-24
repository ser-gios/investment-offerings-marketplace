/**
 * Import exported data to Supabase PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function importData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SEjulio2000!@db.azakblukrthsdpojpewx.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('✓ Connecting to Supabase...');
    const client = await pool.connect();

    // Read exported data
    const dataPath = path.join(__dirname, 'exported-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log('\n📥 Importing data...');

    // Insert users
    for (const user of data.users) {
      await client.query(
        `INSERT INTO users (id, email, password, name, role, avatar, balance, wallet_address, created_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.password, user.name, user.role, user.avatar, user.balance || 0, user.wallet_address, user.created_at, user.is_active || 1]
      );
    }
    console.log(`✓ Imported ${data.users.length} users`);

    // Insert projects
    for (const project of data.projects) {
      await client.query(
        `INSERT INTO projects (id, user_id, name, description, payout_frequency, interest_rate, min_investment, max_investment, total_pool, funded_amount, status, payment_status, category, risk_level, duration_months, start_date, end_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [project.id, project.user_id, project.name, project.description, project.payout_frequency, project.interest_rate, project.min_investment || 1000, project.max_investment, project.total_pool || 0, project.funded_amount || 0, project.status || 'pending', project.payment_status || 'pending', project.category, project.risk_level || 'medium', project.duration_months || 12, project.start_date, project.end_date, project.created_at, project.updated_at]
      );
    }
    console.log(`✓ Imported ${data.projects.length} projects`);

    // Insert deposits
    for (const deposit of data.deposits) {
      await client.query(
        `INSERT INTO deposits (id, investor_id, amount, tx_hash, status, blockchain_verified, confirmation_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [deposit.id, deposit.investor_id, deposit.amount, deposit.tx_hash, deposit.status || 'pending', deposit.blockchain_verified || 0, deposit.confirmation_date, deposit.created_at]
      );
    }
    console.log(`✓ Imported ${data.deposits.length} deposits`);

    // Insert investments
    for (const investment of data.investments) {
      await client.query(
        `INSERT INTO investments (id, investor_id, project_id, amount, status, purchase_price, current_value, interest_earned, last_payout, paid_from_balance, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [investment.id, investment.investor_id, investment.project_id, investment.amount, investment.status || 'active', investment.purchase_price || 0, investment.current_value || 0, investment.interest_earned || 0, investment.last_payout, investment.paid_from_balance || 0, investment.created_at]
      );
    }
    console.log(`✓ Imported ${data.investments.length} investments`);

    // Insert payouts
    for (const payout of data.payouts) {
      await client.query(
        `INSERT INTO payouts (id, investor_id, investment_id, amount, status, payout_date, scheduled_date, processed_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [payout.id, payout.investor_id, payout.investment_id, payout.amount, payout.status || 'pending', payout.payout_date, payout.scheduled_date, payout.processed_date, payout.created_at]
      );
    }
    console.log(`✓ Imported ${data.payouts.length} payouts`);

    // Insert ratings
    for (const rating of data.ratings) {
      await client.query(
        `INSERT INTO ratings (id, project_id, investor_id, payout_reliability, transparency, overall, feedback, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [rating.id, rating.project_id, rating.investor_id, rating.payout_reliability, rating.transparency, rating.overall, rating.feedback, rating.created_at]
      );
    }
    console.log(`✓ Imported ${data.ratings.length} ratings`);

    console.log('\n✅ All data imported successfully!');

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error importing data:', err.message);
    process.exit(1);
  }
}

importData();
