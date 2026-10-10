const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'vietnam_speaker_crm_jwt_secret_key_2026_super_secure';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    // Allows token in query param for CSV download
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
