const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const dbAsync = require('../db-wrapper');
const { authenticate, requireRole } = require('../middleware/auth');

// Calculate interest earned based on frequency and time
function calcInterest(amount, rate, purchasedAt, frequency) {
  const msPerYear = 1000 * 60 * 60 * 24 * 365;
  const years = (Date.now() - new Date(purchasedAt).getTime()) / msPerYear;
  const periodsMap = { monthly: 12, quarterly: 4, annual: 1 };
  const n = periodsMap[frequency] || 1;
  // Compound interest
  const value = amount * Math.pow(1 + (rate / 100) / n, n * years);
  return +(value - amount).toFixed(2);
}

// Helper: Get commission percentage from platform config
async function getCommissionPercentage() {
  try {
    const config = await dbAsync.query(
      `SELECT value FROM platform_config WHERE key = ?`,
      ['commission_percentage']
    );
    return parseFloat(config?.value || 3) / 100; // Default 3% if not found
  } catch (e) {
    console.warn('Could not get commission percentage, using default 3%:', e.message);
    return 0.03;
  }
}

// Helper: Record transaction in account_transactions table
async function recordTransaction(fromUserId, toUserId, amount, transactionType, referenceId, referenceType, description, feeAmount = 0) {
  try {
    const txId = uuidv4();
    await dbAsync.run(
      `INSERT INTO account_transactions (id, from_user_id, to_user_id, amount, transaction_type, reference_id, reference_type, description, fee_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, fromUserId, toUserId, amount, transactionType, referenceId, referenceType, description, feeAmount, 'completed', new Date().toISOString()]
    );
    return txId;
  } catch (e) {
    console.error('Error recording transaction:', e.message);
    // Non-blocking error - don't fail the investment if transaction record fails
    return null;
  }
}

// GET my portfolio
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    const investments = await dbAsync.queryAll(`
      SELECT i.*, p.name as project_name, p.interest_rate, p.payout_frequency, p.risk_level, p.category, p.status as project_status
      FROM investments i JOIN projects p ON i.project_id = p.id
      WHERE i.investor_id = ? ORDER BY i.created_at DESC
    `, [req.user.id]);

    const enriched = (investments || []).map(inv => {
      const earned = calcInterest(inv.amount, +inv.interest_rate || 0, inv.created_at, inv.payout_frequency);
      const currentValue = +(inv.amount + earned).toFixed(2);
      return { ...inv, interest_earned: earned, current_value: currentValue };
    });

    const totalInvested = enriched.reduce((s, i) => s + (i.status === 'active' ? i.amount : 0), 0);
    const totalValue = enriched.reduce((s, i) => s + (i.status === 'active' ? i.current_value : 0), 0);
    const totalEarned = enriched.reduce((s, i) => s + (i.status === 'active' ? i.interest_earned : 0), 0);

    res.json({
      investments: enriched,
      summary: {
        total_invested: +totalInvested.toFixed(2),
        total_value: +totalValue.toFixed(2),
        total_earned: +totalEarned.toFixed(2),
        roi: totalInvested > 0 ? +((totalEarned / totalInvested) * 100).toFixed(2) : 0,
        active_count: enriched.filter(i => i.status === 'active').length,
      }
    });
  } catch (e) {
    console.error('Get portfolio error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST invest in a project (with commission handling)
router.post('/', authenticate, requireRole('investor', 'admin'), async (req, res) => {
  const { project_id, amount } = req.body;
  if (!project_id || !amount) return res.status(400).json({ error: 'Missing fields' });

  try {
    const project = await dbAsync.query('SELECT * FROM projects WHERE id = ? AND status = ?', [project_id, 'active']);
    if (!project) return res.status(404).json({ error: 'Project not found or inactive' });

    // Verificar que el usuario tenga suficiente balance
    const user = await dbAsync.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.balance < amount) {
      return res.status(400).json({ 
        error: 'Saldo insuficiente. Por favor deposita primero en Mi Cuenta.',
        required: amount,
        current_balance: user?.balance || 0
      });
    }

    // Validaciones adicionales
    if (+amount < project.min_investment) {
      return res.status(400).json({ error: `Mínimo de inversión es $${project.min_investment}` });
    }
    if (project.max_investment && +amount > project.max_investment) {
      return res.status(400).json({ error: `Máximo de inversión es $${project.max_investment}` });
    }

    const remaining = project.total_pool - project.funded_amount;
    if (+amount > remaining) {
      return res.status(400).json({ error: `Solo $${remaining.toFixed(2)} disponibles en esta oferta` });
    }

    // Get commission percentage
    const commissionRate = await getCommissionPercentage();
    const feeAmount = +(amount * commissionRate).toFixed(2);
    const businessAmount = +(amount - feeAmount).toFixed(2);

    // Crear inversión
    const invId = uuidv4();
    const now = new Date().toISOString();

    // Crear inversión y debitar balance de inversor
    await dbAsync.run(`
      INSERT INTO investments (id, investor_id, project_id, amount, purchase_price, current_value, paid_from_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `, [invId, req.user.id, project_id, amount, amount, amount, now]);

    // Debitar del balance del inversor (monto completo)
    await dbAsync.run(`
      UPDATE users SET balance = balance - ? WHERE id = ?
    `, [amount, req.user.id]);

    // Acreditar balance a la empresa (sin la comisión)
    await dbAsync.run(`
      UPDATE users SET balance = balance + ? WHERE id = ?
    `, [businessAmount, project.user_id]);

    // Actualizar funded_amount del proyecto
    await dbAsync.run(`
      UPDATE projects SET funded_amount = funded_amount + ? WHERE id = ?
    `, [amount, project_id]);

    // Record transactions in account_transactions
    // 1. Inversor → Empresa (monto neto sin comisión)
    await recordTransaction(
      req.user.id,
      project.user_id,
      businessAmount,
      'investment_received',
      invId,
      'investment',
      `Inversión en proyecto: ${project.name}`,
      feeAmount
    );

    // 2. Platform commission (Inversor → Platform)
    if (feeAmount > 0) {
      // Get or create admin account
      const adminUser = await dbAsync.query(
        `SELECT id FROM users WHERE role = ? LIMIT 1`,
        ['admin']
      );
      if (adminUser) {
        await dbAsync.run(`
          UPDATE users SET balance = balance + ? WHERE id = ?
        `, [feeAmount, adminUser.id]);
        
        await recordTransaction(
          req.user.id,
          adminUser.id,
          feeAmount,
          'platform_commission',
          invId,
          'investment',
          `Comisión plataforma (${(commissionRate * 100).toFixed(1)}%) - Inversión en: ${project.name}`,
          feeAmount
        );
      }
    }

    // Programar primer pago
    const payoutDate = new Date();
    const monthsMap = { monthly: 1, quarterly: 3, annual: 12 };
    payoutDate.setMonth(payoutDate.getMonth() + (monthsMap[project.payout_frequency] || 1));
    const periodsMap = { monthly: 12, quarterly: 4, annual: 1 };
    const payoutAmount = +((amount * (project.interest_rate / 100)) / periodsMap[project.payout_frequency]).toFixed(2);

    await dbAsync.run('INSERT INTO payouts (id, investment_id, investor_id, project_id, amount, scheduled_date, created_at) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), invId, req.user.id, project_id, payoutAmount, payoutDate.toISOString().split('T')[0], now]);

    res.status(201).json({
      id: invId,
      message: 'Inversión creada exitosamente',
      investment: {
        id: invId,
        project_id,
        amount,
        business_amount: businessAmount,
        platform_fee: feeAmount,
        purchase_price: amount,
        current_value: amount,
        status: 'active'
      }
    });
  } catch (err) {
    console.error('Create investment error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET pending payouts for investor
router.get('/payouts', authenticate, (req, res) => {
  const payouts = db.prepare(`
    SELECT pay.*, p.name as project_name, p.interest_rate, p.payout_frequency
    FROM payouts pay JOIN projects p ON pay.project_id = p.id
    WHERE pay.investor_id = ? ORDER BY pay.scheduled_date ASC
  `).all(req.user.id);
  res.json(payouts);
});

// POST list investment on secondary market
router.post('/:id/list', authenticate, (req, res) => {
  const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND investor_id = ?').get(req.params.id, req.user.id);
  if (!inv) return res.status(404).json({ error: 'Investment not found' });
  if (inv.status !== 'active') return res.status(400).json({ error: 'Only active investments can be listed' });

  const existing = db.prepare('SELECT id FROM market_listings WHERE investment_id = ? AND status = ?').get(inv.id, 'active');
  if (existing) return res.status(409).json({ error: 'Already listed' });

  const { asking_price } = req.body;
  const listId = uuidv4();
  db.prepare('INSERT INTO market_listings (id, investment_id, seller_id, asking_price, original_amount) VALUES (?,?,?,?,?)')
    .run(listId, inv.id, req.user.id, +(asking_price || inv.current_value), inv.amount);
  res.status(201).json(db.prepare('SELECT * FROM market_listings WHERE id = ?').get(listId));
});

// GET secondary market listings
router.get('/market', authenticate, (req, res) => {
  const listings = db.prepare(`
    SELECT ml.*, i.amount, i.current_value, i.interest_earned, p.name as project_name, p.interest_rate, p.payout_frequency, p.risk_level, u.name as seller_name
    FROM market_listings ml
    JOIN investments i ON ml.investment_id = i.id
    JOIN projects p ON i.project_id = p.id
    JOIN users u ON ml.seller_id = u.id
    WHERE ml.status = 'active' AND ml.seller_id != ?
    ORDER BY ml.created_at DESC
  `).all(req.user.id);
  res.json(listings);
});

// POST buy from secondary market
router.post('/market/:listingId/buy', authenticate, requireRole('investor', 'admin'), (req, res) => {
  const listing = db.prepare('SELECT * FROM market_listings WHERE id = ? AND status = ?').get(req.params.listingId, 'active');
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Transfer ownership
  const newInvId = uuidv4();
  const old = db.prepare('SELECT * FROM investments WHERE id = ?').get(listing.investment_id);
  db.prepare('INSERT INTO investments (id, investor_id, project_id, amount, purchase_price, current_value, interest_earned) VALUES (?,?,?,?,?,?,?)')
    .run(newInvId, req.user.id, old.project_id, old.amount, listing.asking_price, old.current_value, old.interest_earned);
  db.prepare("UPDATE investments SET status = 'sold' WHERE id = ?").run(listing.investment_id);
  db.prepare("UPDATE market_listings SET status = 'sold' WHERE id = ?").run(listing.id);
  res.status(201).json({ message: 'Purchase successful', investment_id: newInvId });
});

module.exports = router;
