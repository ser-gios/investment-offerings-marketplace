const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const dbAsync = require('../db-wrapper');
const { authenticate, requireRole } = require('../middleware/auth');

// Compute composite rating for a project
async function getProjectRating(projectId) {
  const ratings = await dbAsync.queryAll('SELECT * FROM ratings WHERE project_id = ?', [projectId]);
  if (!ratings || !ratings.length) return null;
  const avg = (key) => ratings.reduce((s, r) => s + r[key], 0) / ratings.length;
  return {
    payout_reliability: +avg('payout_reliability').toFixed(1),
    transparency: +avg('transparency').toFixed(1),
    overall: +avg('overall').toFixed(1),
    count: ratings.length,
  };
}

// GET all active projects (marketplace) - only those with payment_status = 'paid'
router.get('/', async (req, res) => {
  try {
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

    const projects = await dbAsync.queryAll(query, params);
    const result = [];
    for (const p of projects) {
      const files = await dbAsync.queryAll('SELECT * FROM project_files WHERE project_id = ?', [p.id]);
      const rating = await getProjectRating(p.id);
      result.push({
        ...p,
        rating: rating,
        funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
        files: files || [],
      });
    }
    res.json(result);
  } catch (e) {
    console.error('Get projects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const p = await dbAsync.query(`SELECT p.*, u.name as business_name, u.email as business_email FROM projects p JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Not found' });
    
    const ratings_list = await dbAsync.queryAll(`SELECT r.*, u.name as investor_name FROM ratings r JOIN users u ON r.investor_id = u.id WHERE r.project_id = ? ORDER BY r.created_at DESC`, [p.id]);
    const files = await dbAsync.queryAll(`SELECT * FROM project_files WHERE project_id = ?`, [p.id]);
    const investors = await dbAsync.query(`SELECT COUNT(DISTINCT investor_id) as cnt FROM investments WHERE project_id = ? AND status = 'active'`, [p.id]);
    const rating = await getProjectRating(p.id);
    
    res.json({
      ...p,
      rating: rating,
      ratings_list: ratings_list || [],
      funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
      files: files || [],
      investors_count: investors?.cnt || 0,
    });
  } catch (e) {
    console.error('Get project error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST create project (business only)
router.post('/', authenticate, requireRole('business', 'admin'), async (req, res) => {
  const { name, description, payout_frequency, interest_rate, min_investment, max_investment, total_pool, category, risk_level, duration_months } = req.body;
  if (!name || !description || !payout_frequency || !interest_rate || !total_pool) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const id = uuidv4();
    // Auto-approve projects for demo purposes (status='active', payment_status='paid')
    await dbAsync.run(`
      INSERT INTO projects (id, user_id, name, description, payout_frequency, interest_rate, min_investment, max_investment, total_pool, category, risk_level, duration_months, status, payment_status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'active','paid')
    `, [id, req.user.id, name, description, payout_frequency, +interest_rate, +(min_investment || 1000), max_investment ? +max_investment : null, +total_pool, category || 'General', risk_level || 'medium', +(duration_months || 12)]);
    
    const project = await dbAsync.query('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json(project);
  } catch (e) {
    console.error('Create project error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH update project
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const project = await dbAsync.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Not found' });
    if (project.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['name', 'description', 'status', 'risk_level', 'category'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    const now = new Date().toISOString();
    const set = updates.map((k, i) => `${k} = $${i+1}`).join(', ');
    const vals = updates.map(k => req.body[k]);
    await dbAsync.run(`UPDATE projects SET ${set}, updated_at = $${vals.length + 1} WHERE id = $${vals.length + 2}`, [...vals, now, req.params.id]);
    
    const updated = await dbAsync.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) {
    console.error('Update project error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET my projects (business)
router.get('/my/listings', authenticate, requireRole('business', 'admin'), async (req, res) => {
  try {
    const projects = await dbAsync.queryAll('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    
    const result = [];
    for (const p of projects) {
      const investmentsCount = await dbAsync.query(`SELECT COUNT(*) as cnt FROM investments WHERE project_id = ? AND status='active'`, [p.id]);
      result.push({
        ...p,
        rating: getProjectRating(p.id),
        funding_pct: p.total_pool > 0 ? +((p.funded_amount / p.total_pool) * 100).toFixed(1) : 0,
        investments_count: investmentsCount?.cnt || 0,
      });
    }
    
    res.json(result);
  } catch (e) {
    console.error('Get my projects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
