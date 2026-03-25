const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');
const dbAsync = require('../db-wrapper');
const { SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const allowed = ['investor', 'business'];
  const userRole = allowed.includes(role) ? role : 'investor';
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    const emailLower = email.toLowerCase();
    
    // Use async query if DATABASE_URL exists (PostgreSQL), otherwise sync (SQLite)
    if (process.env.DATABASE_URL) {
      await db.prepareAsync('INSERT INTO users (id, email, password, name, role) VALUES (?,?,?,?,?)')
        .runAsync(id, emailLower, hash, name, userRole);
    } else {
      db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?,?,?,?,?)')
        .run(id, emailLower, hash, name, userRole);
    }
    
    const user = { id, email: emailLower, name, role: userRole };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE') || e.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  
  try {
    const emailLower = email.toLowerCase();
    let user;
    
    // Use async query if DATABASE_URL exists (PostgreSQL), otherwise sync (SQLite)
    if (process.env.DATABASE_URL) {
      user = await db.prepareAsync('SELECT * FROM users WHERE email = ?')
        .getAsync(emailLower);
    } else {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailLower);
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });
    
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  } catch (e) {
    res.status(500).json({ error: 'Login error: ' + e.message });
  }
});

router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const user = await dbAsync.query('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(user || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const emailLower = email.toLowerCase();
    let user;
    
    // Use async query if DATABASE_URL exists (PostgreSQL), otherwise sync (SQLite)
    if (process.env.DATABASE_URL) {
      user = await db.prepareAsync('SELECT id FROM users WHERE email = ?').getAsync(emailLower);
    } else {
      user = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    }
    
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ message: 'Si el email existe, recibirás un link para resetear tu contraseña.' });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    if (process.env.DATABASE_URL) {
      await db.prepareAsync('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
        .runAsync(resetToken, resetTokenExpires.toISOString(), user.id);
    } else {
      db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
        .run(resetToken, resetTokenExpires.toISOString(), user.id);
    }

    // Build reset link
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    // Send email
    const emailSent = await sendPasswordResetEmail(emailLower, resetLink);
    
    if (!emailSent && process.env.NODE_ENV === 'production') {
      console.error('Failed to send password reset email to:', email);
      // Still return success to not reveal if email exists
    }
    
    // In development, return token for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset link for ${email}: ${resetLink}`);
      return res.json({ 
        message: 'If email exists, reset link will be sent',
        resetToken, 
        resetLink
      });
    }
    
    res.json({ message: 'Si el email existe, recibirás un link para resetear tu contraseña.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Find user with valid reset token
    let user;
    if (process.env.DATABASE_URL) {
      user = await db.prepareAsync(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?'
      ).getAsync(token, new Date().toISOString());
    } else {
      user = db.prepare(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?'
      ).get(token, new Date().toISOString());
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hash = bcrypt.hashSync(newPassword, 10);

    // Update password and clear reset token
    if (process.env.DATABASE_URL) {
      await db.prepareAsync(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
      ).runAsync(hash, user.id);
    } else {
      db.prepare(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
      ).run(hash, user.id);
    }

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
