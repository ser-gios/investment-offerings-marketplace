const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// POST or update rating
router.post('/:projectId', authenticate, (req, res) => {
  const { payout_reliability, transparency, overall, feedback } = req.body;
  if (!payout_reliability || !transparency || !overall) return res.status(400).json({ error: 'Missing rating fields' });

  // Ensure user has invested in this project
  const invested = db.prepare('SELECT id FROM investments WHERE investor_id = ? AND project_id = ?').get(req.user.id, req.params.projectId);
  if (!invested && req.user.role !== 'admin') return res.status(403).json({ error: 'You must be an investor in this project to rate it' });

  const existing = db.prepare('SELECT id FROM ratings WHERE project_id = ? AND investor_id = ?').get(req.params.projectId, req.user.id);
  if (existing) {
    db.prepare('UPDATE ratings SET payout_reliability=?, transparency=?, overall=?, feedback=? WHERE id=?')
      .run(+payout_reliability, +transparency, +overall, feedback || null, existing.id);
    return res.json(db.prepare('SELECT * FROM ratings WHERE id = ?').get(existing.id));
  }

  const id = uuidv4();
  db.prepare('INSERT INTO ratings (id, project_id, investor_id, payout_reliability, transparency, overall, feedback) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.params.projectId, req.user.id, +payout_reliability, +transparency, +overall, feedback || null);
  res.status(201).json(db.prepare('SELECT * FROM ratings WHERE id = ?').get(id));
});

// GET ratings for project
router.get('/:projectId', (req, res) => {
  const ratings = db.prepare(`
    SELECT r.*, u.name as investor_name FROM ratings r
    JOIN users u ON r.investor_id = u.id
    WHERE r.project_id = ? ORDER BY r.created_at DESC
  `).all(req.params.projectId);

  const avg = (key) => ratings.length ? +(ratings.reduce((s, r) => s + r[key], 0) / ratings.length).toFixed(1) : 0;
  res.json({
    ratings,
    summary: {
      payout_reliability: avg('payout_reliability'),
      transparency: avg('transparency'),
      overall: avg('overall'),
      count: ratings.length,
    }
  });
});

module.exports = router;
