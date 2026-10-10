const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/public/info - Public speaker settings & stats
router.get('/info', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('[Public Info Error]', err);
    return res.status(500).json({ success: false, message: 'Không thể tải thông tin diễn giả.' });
  }
});

// GET /api/public/courses - List active courses
router.get('/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT id, title, badge, slug, short_desc, target_audience, format, duration, schedule,
             tuition_original, tuition_discount, image_url, order_index, syllabus_json
      FROM courses
      WHERE is_active = 1
      ORDER BY order_index ASC, id ASC
    `).all();

    const formatted = courses.map(c => ({
      ...c,
      syllabus: c.syllabus_json ? JSON.parse(c.syllabus_json) : []
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('[Public Courses Error]', err);
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách khóa học.' });
  }
});

// GET /api/public/courses/:slug - Course detail
router.get('/courses/:slug', (req, res) => {
  try {
    const course = db.prepare(`
      SELECT id, title, badge, slug, short_desc, target_audience, format, duration, schedule,
             tuition_original, tuition_discount, image_url, syllabus_json
      FROM courses
      WHERE slug = ? AND is_active = 1
    `).get(req.params.slug);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Khóa học không tồn tại.' });
    }

    course.syllabus = course.syllabus_json ? JSON.parse(course.syllabus_json) : [];
    return res.json({ success: true, data: course });
  } catch (err) {
    console.error('[Course Detail Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết khóa học.' });
  }
});

// GET /api/public/articles - Skill sharing articles with category filter
router.get('/articles', (req, res) => {
  try {
    const category = req.query.category;
    let query = 'SELECT id, title, slug, category, summary, read_time, image_url, created_at FROM articles';
    let params = [];

    if (category && category !== 'Tất cả') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY order_index ASC, id DESC';

    const articles = db.prepare(query).all(...params);
    return res.json({ success: true, data: articles });
  } catch (err) {
    console.error('[Public Articles Error]', err);
    return res.status(500).json({ success: false, message: 'Không thể tải bài viết chia sẻ.' });
  }
});

// GET /api/public/articles/:id - Article detail
router.get('/articles/:id', (req, res) => {
  try {
    const article = db.prepare(`
      SELECT id, title, slug, category, summary, content, read_time, image_url, created_at
      FROM articles
      WHERE id = ? OR slug = ?
    `).get(req.params.id, req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại.' });
    }

    return res.json({ success: true, data: article });
  } catch (err) {
    console.error('[Article Detail Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải nội dung bài viết.' });
  }
});

// GET /api/public/testimonials
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = db.prepare(`
      SELECT id, student_name, role, company, content, avatar_url, rating
      FROM testimonials
      ORDER BY order_index ASC, id ASC
    `).all();

    return res.json({ success: true, data: testimonials });
  } catch (err) {
    console.error('[Testimonials Error]', err);
    return res.status(500).json({ success: false, message: 'Không thể tải đánh giá học viên.' });
  }
});

// POST /api/public/register - Student registration with validation & anti-spam
router.post('/register', (req, res) => {
  try {
    const { full_name, phone, email, course_id, learning_needs, consent } = req.body;

    // 1. Validation: Full name
    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).'
      });
    }

    // 2. Validation: Phone (Vietnam phone format: 03x, 05x, 07x, 08x, 09x or +84)
    const cleanPhone = phone ? phone.replace(/[\s.-]/g, '') : '';
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 chữ số tại Việt Nam (VD: 0912345678).'
      });
    }

    // 3. Validation: Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.'
      });
    }

    // 4. Validation: Consent
    if (!consent || consent === false || consent === 'false' || consent === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng đánh dấu đồng ý để chuyên gia và đội ngũ liên hệ tư vấn lộ trình học.'
      });
    }

    // 5. Course check
    let courseTitle = 'Tư vấn lộ trình phát triển chung';
    let validCourseId = null;

    if (course_id) {
      const course = db.prepare('SELECT id, title FROM courses WHERE id = ?').get(course_id);
      if (course) {
        validCourseId = course.id;
        courseTitle = course.title;
      }
    }

    // 6. Anti-duplicate submission check (same phone/email for same course in last 5 minutes)
    const recentCheck = db.prepare(`
      SELECT id, created_at FROM registrations
      WHERE (phone = ? OR email = ?)
        AND (course_id = ? OR course_id IS NULL)
        AND datetime(created_at, '+5 minutes') > datetime('now')
      LIMIT 1
    `).get(cleanPhone, email.trim().toLowerCase(), validCourseId);

    if (recentCheck) {
      return res.status(429).json({
        success: false,
        message: 'Bạn vừa gửi thông tin đăng ký cách đây ít phút. Đội ngũ chuyên gia đã nhận được yêu cầu và sẽ liên hệ sớm nhất!'
      });
    }

    // 7. Insert into SQLite database
    const insertStmt = db.prepare(`
      INSERT INTO registrations (full_name, phone, email, course_id, course_title, learning_needs, consent, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 'Mới đăng ký', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(
      full_name.trim(),
      cleanPhone,
      email.trim().toLowerCase(),
      validCourseId,
      courseTitle,
      learning_needs ? learning_needs.trim() : ''
    );

    if (!result || !result.lastInsertRowid) {
      return res.status(500).json({
        success: false,
        message: 'Hệ thống không thể lưu trữ đăng ký. Vui lòng liên hệ hotline trực tiếp.'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Đăng ký thành công! Cảm ơn anh/chị ${full_name.trim()}. Đội ngũ tư vấn sẽ liên hệ qua số ${cleanPhone} trong vòng 24 giờ.`,
      registration_id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('[Registration Save Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lưu thông tin đăng ký vào cơ sở dữ liệu. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;
