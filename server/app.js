const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// API Routers
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Admin route helper
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// Fallback for SPA routing if needed
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống nội bộ.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Website Diễn giả & CRM đang chạy tại:`);
    console.log(`👉 Landing Page: http://localhost:${PORT}`);
    console.log(`👉 CRM & Admin:  http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
  });
}

module.exports = app;
