const router = require('express').Router();
const db = require('../db');
const dbAsync = require('../db-wrapper');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const users = await dbAsync.query('SELECT COUNT(*) as cnt FROM users WHERE role != ?', ['admin']);
    const projects = await dbAsync.query('SELECT COUNT(*) as cnt FROM projects', []);
    const activeProjects = await dbAsync.query("SELECT COUNT(*) as cnt FROM projects WHERE status = 'active'", []);
    const investments = await dbAsync.query('SELECT COUNT(*) as cnt, SUM(amount) as total FROM investments', []);
    const payouts = await dbAsync.query("SELECT COUNT(*) as cnt, SUM(amount) as total FROM payouts WHERE status = 'pending'", []);
    const recentProjects = await dbAsync.queryAll(`
      SELECT p.*, u.name as business_name FROM projects p JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 5
    `, []);
    
    res.json({
      users: users?.cnt || 0,
      projects: projects?.cnt || 0,
      active_projects: activeProjects?.cnt || 0,
      total_invested: parseFloat(investments?.total) || 0,
      total_investments: investments?.cnt || 0,
      pending_payouts: payouts?.cnt || 0,
      pending_payouts_amount: parseFloat(payouts?.total) || 0,
      recent_projects: recentProjects || [],
    });
  } catch (e) {
    console.error('Admin stats error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await dbAsync.queryAll('SELECT id, email, name, role, created_at, is_active FROM users ORDER BY created_at DESC', []);
    const result = [];
    for (const u of users) {
      const invCount = await dbAsync.query('SELECT COUNT(*) as cnt FROM investments WHERE investor_id = ?', [u.id]);
      const projCount = await dbAsync.query('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?', [u.id]);
      result.push({
        ...u,
        investments_count: invCount?.cnt || 0,
        projects_count: projCount?.cnt || 0,
      });
    }
    res.json(result);
  } catch (e) {
    console.error('Get users error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH toggle user active
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await dbAsync.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Not found' });
    await dbAsync.run('UPDATE users SET is_active = ? WHERE id = ?', [user.is_active ? 0 : 1, user.id]);
    res.json({ is_active: !user.is_active });
  } catch (e) {
    console.error('Toggle user error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await dbAsync.queryAll(`SELECT p.*, u.name as business_name FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`, []);
    const result = [];
    for (const p of projects) {
      const invCount = await dbAsync.query("SELECT COUNT(DISTINCT investor_id) as cnt FROM investments WHERE project_id = ? AND status='active'", [p.id]);
      result.push({
        ...p,
        investors_count: invCount?.cnt || 0,
        funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
        payment_status: p.payment_status || 'pending',
      });
    }
    res.json(result);
  } catch (e) {
    console.error('Get projects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH project status
router.patch('/projects/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'active', 'closed', 'suspended'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const now = new Date().toISOString();
    await dbAsync.run("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?", [status, now, req.params.id]);
    res.json({ status });
  } catch (e) {
    console.error('Update project status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH project payment status (approve/reject payment)
router.patch('/projects/:id/payment', async (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ['pending', 'paid'];
    if (!allowed.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
    
    const now = new Date().toISOString();
    
    // When payment is approved, also activate the project
    if (payment_status === 'paid') {
      await dbAsync.run("UPDATE projects SET payment_status = ?, status = 'active', updated_at = ? WHERE id = ?", [payment_status, now, req.params.id]);
    } else {
      await dbAsync.run("UPDATE projects SET payment_status = ?, updated_at = ? WHERE id = ?", [payment_status, now, req.params.id]);
    }
    res.json({ payment_status });
  } catch (e) {
    console.error('Update payment status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE project
router.delete('/projects/:id', async (req, res) => {
  try {
    // Check if project has investments
    const investments = await dbAsync.query('SELECT COUNT(*) as cnt FROM investments WHERE project_id = ?', [req.params.id]);
    if (investments?.cnt > 0) {
      return res.status(400).json({ error: 'Cannot delete project with active investments' });
    }
    
    // Delete project
    await dbAsync.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete project error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET all payouts
router.get('/payouts', async (req, res) => {
  try {
    // Temporary: Return empty list while we investigate the payouts table
    res.json([]);
  } catch (e) {
    console.error('Get payouts error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH payout status
router.patch('/payouts/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processed', 'failed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const now = new Date().toISOString();
    await dbAsync.run("UPDATE payouts SET status = ?, processed_date = ? WHERE id = ?", [status, now, req.params.id]);
    res.json({ status });
  } catch (e) {
    console.error('Update payout status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DEBUG: Get raw project count
router.get('/debug/project-count', async (req, res) => {
  try {
    const all = await dbAsync.query('SELECT COUNT(*) as cnt FROM projects', []);
    const active = await dbAsync.query('SELECT COUNT(*) as cnt FROM projects WHERE status = ? AND payment_status = ?', ['active', 'paid']);
    res.json({ all_projects: all?.cnt || 0, active_projects: active?.cnt || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET all deposits with user info
router.get('/deposits', async (req, res) => {
  try {
    const deposits = await dbAsync.queryAll(`
      SELECT d.*, u.name as investor_name, u.email as investor_email
      FROM deposits d JOIN users u ON d.investor_id = u.id
      ORDER BY d.created_at DESC
    `, []);
    res.json(deposits || []);
  } catch (e) {
    console.error('Get deposits error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
