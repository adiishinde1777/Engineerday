import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { createToken, requireAdmin } from '../auth.js';

const router = express.Router();

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username.trim());
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const token = createToken({
    id: admin.id,
    username: admin.username,
    fullName: admin.full_name
  });

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name
    }
  });
});

// Verify Current Admin Session
router.get('/me', requireAdmin, (req, res) => {
  const admin = db.prepare('SELECT id, username, full_name, created_at FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) {
    return res.status(404).json({ success: false, message: 'Admin account not found' });
  }
  return res.json({ success: true, admin });
});

// Update Password
router.post('/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin.id);

  return res.json({ success: true, message: 'Password updated successfully' });
});

export default router;
