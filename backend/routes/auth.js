const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const { SECRET } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const allowed = ['investor', 'business'];
  const userRole = allowed.includes(role) ? role : 'investor';
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?,?,?,?,?)')
      .run(id, email.toLowerCase(), hash, name, userRole);
    const user = { id, email: email.toLowerCase(), name, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });
  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(resetToken, resetTokenExpires.toISOString(), user.id);

    // TODO: Send email with reset link
    // For now, return token in response (ONLY for development/testing)
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    // In production, you would send this via email
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    res.json({ 
      message: 'If email exists, reset link will be sent',
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Find user with valid reset token
    const user = db.prepare(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?'
    ).get(token, new Date().toISOString());

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hash = bcrypt.hashSync(newPassword, 10);

    // Update password and clear reset token
    db.prepare(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
    ).run(hash, user.id);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
