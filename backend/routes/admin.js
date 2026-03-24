const router = require('express').Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// Dashboard stats
router.get('/stats', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role != ?').get('admin').cnt;
  const projects = db.prepare('SELECT COUNT(*) as cnt FROM projects').get().cnt;
  const activeProjects = db.prepare("SELECT COUNT(*) as cnt FROM projects WHERE status = 'active'").get().cnt;
  const investments = db.prepare('SELECT COUNT(*) as cnt, SUM(amount) as total FROM investments').get();
  const payouts = db.prepare("SELECT COUNT(*) as cnt, SUM(amount) as total FROM payouts WHERE status = 'pending'").get();
  const recentProjects = db.prepare(`
    SELECT p.*, u.name as business_name FROM projects p JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC LIMIT 5
  `).all();
  res.json({
    users,
    projects,
    active_projects: activeProjects,
    total_invested: investments.total || 0,
    total_investments: investments.cnt,
    pending_payouts: payouts.cnt,
    pending_payouts_amount: payouts.total || 0,
    recent_projects: recentProjects,
  });
});

// GET all users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at, is_active FROM users ORDER BY created_at DESC').all();
  res.json(users.map(u => ({
    ...u,
    investments_count: db.prepare('SELECT COUNT(*) as cnt FROM investments WHERE investor_id = ?').get(u.id).cnt,
    projects_count: db.prepare('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?').get(u.id).cnt,
  })));
});

// PATCH toggle user active
router.patch('/users/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(user.is_active ? 0 : 1, user.id);
  res.json({ is_active: !user.is_active });
});

// GET all projects
router.get('/projects', (req, res) => {
  const projects = db.prepare(`SELECT p.*, u.name as business_name FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`).all();
  res.json(projects.map(p => ({
    ...p,
    investors_count: db.prepare("SELECT COUNT(DISTINCT investor_id) as cnt FROM investments WHERE project_id = ? AND status='active'").get(p.id).cnt,
    funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
    payment_status: p.payment_status || 'pending',
  })));
});

// PATCH project status
router.patch('/projects/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'active', 'closed', 'suspended'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ status });
});

// PATCH project payment status (approve/reject payment)
router.patch('/projects/:id/payment', (req, res) => {
  const { payment_status } = req.body;
  const allowed = ['pending', 'paid'];
  if (!allowed.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
  
  // When payment is approved, also activate the project
  if (payment_status === 'paid') {
    db.prepare("UPDATE projects SET payment_status = ?, status = 'active', updated_at = datetime('now') WHERE id = ?").run(payment_status, req.params.id);
  } else {
    db.prepare("UPDATE projects SET payment_status = ?, updated_at = datetime('now') WHERE id = ?").run(payment_status, req.params.id);
  }
  res.json({ payment_status });
});

// GET all payouts
router.get('/payouts', (req, res) => {
  const payouts = db.prepare(`
    SELECT pay.*, p.name as project_name, u.name as investor_name, u.email as investor_email
    FROM payouts pay JOIN projects p ON pay.project_id = p.id JOIN users u ON pay.investor_id = u.id
    ORDER BY pay.scheduled_date ASC
  `).all();
  res.json(payouts);
});

// PATCH payout status
router.patch('/payouts/:id', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processed', 'failed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare("UPDATE payouts SET status = ?, processed_date = datetime('now') WHERE id = ?").run(status, req.params.id);
  res.json({ status });
});

// GET all deposits with user info
router.get('/deposits', (req, res) => {
  const deposits = db.prepare(`
    SELECT d.*, u.name as investor_name, u.email as investor_email
    FROM deposits d JOIN users u ON d.investor_id = u.id
    ORDER BY d.created_at DESC
  `).all();
  res.json(deposits);
});

module.exports = router;
