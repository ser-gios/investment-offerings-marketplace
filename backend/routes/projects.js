const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const dbAsync = require('../db-wrapper');
const { authenticate, requireRole } = require('../middleware/auth');

// Compute composite rating for a project
function getProjectRating(projectId) {
  const ratings = db.prepare('SELECT * FROM ratings WHERE project_id = ?').all(projectId);
  if (!ratings.length) return null;
  const avg = (key) => ratings.reduce((s, r) => s + r[key], 0) / ratings.length;
  return {
    payout_reliability: +avg('payout_reliability').toFixed(1),
    transparency: +avg('transparency').toFixed(1),
    overall: +avg('overall').toFixed(1),
    count: ratings.length,
  };
}

// GET all active projects (marketplace) - only those with payment_status = 'paid'
router.get('/', (req, res) => {
  const { category, risk, freq, sort, search } = req.query;
  let query = `SELECT p.*, u.name as business_name FROM projects p JOIN users u ON p.user_id = u.id WHERE p.status = 'active' AND p.payment_status = 'paid'`;
  const params = [];

  if (category) { query += ` AND p.category = ?`; params.push(category); }
  if (risk) { query += ` AND p.risk_level = ?`; params.push(risk); }
  if (freq) { query += ` AND p.payout_frequency = ?`; params.push(freq); }
  if (search) { query += ` AND (p.name LIKE ? OR p.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

  const sortMap = {
    'rate_desc': 'p.interest_rate DESC',
    'rate_asc': 'p.interest_rate ASC',
    'newest': 'p.created_at DESC',
    'funded': '(p.funded_amount / p.total_pool) DESC',
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

  const projects = db.prepare(query).all(...params);
  const result = projects.map(p => ({
    ...p,
    rating: getProjectRating(p.id),
    funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
    files: db.prepare(`SELECT * FROM project_files WHERE project_id = ?`).all(p.id),
  }));
  res.json(result);
});

// GET single project
router.get('/:id', (req, res) => {
  const p = db.prepare(`SELECT p.*, u.name as business_name, u.email as business_email FROM projects p JOIN users u ON p.user_id = u.id WHERE p.id = ?`).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({
    ...p,
    rating: getProjectRating(p.id),
    ratings_list: db.prepare(`SELECT r.*, u.name as investor_name FROM ratings r JOIN users u ON r.investor_id = u.id WHERE r.project_id = ? ORDER BY r.created_at DESC`).all(p.id),
    funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
    files: db.prepare(`SELECT * FROM project_files WHERE project_id = ?`).all(p.id),
    investors_count: db.prepare(`SELECT COUNT(DISTINCT investor_id) as cnt FROM investments WHERE project_id = ? AND status = 'active'`).get(p.id)?.cnt || 0,
  });
});

// POST create project (business only)
router.post('/', authenticate, requireRole('business', 'admin'), async (req, res) => {
  const { name, description, payout_frequency, interest_rate, min_investment, max_investment, total_pool, category, risk_level, duration_months } = req.body;
  if (!name || !description || !payout_frequency || !interest_rate || !total_pool) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const id = uuidv4();
    await dbAsync.run(`
      INSERT INTO projects (id, user_id, name, description, payout_frequency, interest_rate, min_investment, max_investment, total_pool, category, risk_level, duration_months)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [id, req.user.id, name, description, payout_frequency, +interest_rate, +(min_investment || 1000), max_investment ? +max_investment : null, +total_pool, category || 'General', risk_level || 'medium', +(duration_months || 12)]);
    
    const project = await dbAsync.query('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json(project);
  } catch (e) {
    console.error('Create project error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH update project
router.patch('/:id', authenticate, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const allowed = ['name', 'description', 'status', 'risk_level', 'category'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  const set = updates.map(k => `${k} = ?`).join(', ');
  const vals = updates.map(k => req.body[k]);
  db.prepare(`UPDATE projects SET ${set}, updated_at = datetime('now') WHERE id = ?`).run(...vals, req.params.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

// GET my projects (business)
router.get('/my/listings', authenticate, requireRole('business', 'admin'), (req, res) => {
  const projects = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(projects.map(p => ({
    ...p,
    rating: getProjectRating(p.id),
    funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
    investments_count: db.prepare(`SELECT COUNT(*) as cnt FROM investments WHERE project_id = ? AND status='active'`).get(p.id)?.cnt || 0,
  })));
});

module.exports = router;
