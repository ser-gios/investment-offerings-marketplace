const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const dbAsync = require('../db-wrapper');
const { authenticate } = require('../middleware/auth');

// POST or update rating
router.post('/:projectId', authenticate, async (req, res) => {
  try {
    const { payout_reliability, transparency, overall, feedback } = req.body;
    if (!payout_reliability || !transparency || !overall) return res.status(400).json({ error: 'Missing rating fields' });

    // For demo: Allow anyone to rate (in production, validate investment)
    // const invested = await dbAsync.query('SELECT id FROM investments WHERE investor_id = ? AND project_id = ?', [req.user.id, req.params.projectId]);
    // if (!invested && req.user.role !== 'admin') return res.status(403).json({ error: 'You must be an investor in this project to rate it' });

    const existing = await dbAsync.query('SELECT id FROM ratings WHERE project_id = ? AND investor_id = ?', [req.params.projectId, req.user.id]);
    if (existing) {
      await dbAsync.run('UPDATE ratings SET payout_reliability=?, transparency=?, overall=?, feedback=? WHERE id=?',
        [+payout_reliability, +transparency, +overall, feedback || null, existing.id]);
      const updated = await dbAsync.query('SELECT * FROM ratings WHERE id = ?', [existing.id]);
      return res.json(updated);
    }

    const id = uuidv4();
    await dbAsync.run('INSERT INTO ratings (id, project_id, investor_id, payout_reliability, transparency, overall, feedback) VALUES (?,?,?,?,?,?,?)',
      [id, req.params.projectId, req.user.id, +payout_reliability, +transparency, +overall, feedback || null]);
    const created = await dbAsync.query('SELECT * FROM ratings WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (e) {
    console.error('Post rating error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET ratings for project
router.get('/:projectId', async (req, res) => {
  try {
    const ratings = await dbAsync.queryAll(`
      SELECT r.*, u.name as investor_name FROM ratings r
      JOIN users u ON r.investor_id = u.id
      WHERE r.project_id = ? ORDER BY r.created_at DESC
    `, [req.params.projectId]);

    const avg = (key) => ratings.length ? +(ratings.reduce((s, r) => s + r[key], 0) / ratings.length).toFixed(1) : 0;
    res.json({
      ratings: ratings || [],
      summary: {
        payout_reliability: avg('payout_reliability'),
        transparency: avg('transparency'),
        overall: avg('overall'),
        count: ratings?.length || 0,
      }
    });
  } catch (e) {
    console.error('Get ratings error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
