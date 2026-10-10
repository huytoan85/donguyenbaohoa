const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username.trim());
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    admin: req.admin
  });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }

    const isMatch = bcrypt.compareSync(oldPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.admin.id);

    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('[Change Password Error]', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
});

module.exports = router;
