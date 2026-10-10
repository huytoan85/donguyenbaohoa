const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Protect all admin routes
router.use(authMiddleware);

// GET /api/admin/dashboard - Statistical metrics
router.get('/dashboard', (req, res) => {
  try {
    const totalRegs = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;

    // By status
    const statusRows = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM registrations
      GROUP BY status
    `).all();

    const statusCounts = {
      'Mới đăng ký': 0,
      'Đã liên hệ': 0,
      'Đang tư vấn': 0,
      'Đã ghi danh': 0,
      'Đã hoàn thành': 0,
      'Đã hủy': 0
    };
    for (const r of statusRows) {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status] = r.count;
      }
    }

    // By course
    const courseBreakdown = db.prepare(`
      SELECT COALESCE(course_title, 'Tư vấn chung') as course_title, COUNT(*) as count
      FROM registrations
      GROUP BY course_title
      ORDER BY count DESC
    `).all();

    // Active courses count
    const activeCoursesCount = db.prepare('SELECT COUNT(*) as count FROM courses WHERE is_active = 1').get().count;

    // Recent 5 leads
    const recentLeads = db.prepare(`
      SELECT id, full_name, phone, email, course_title, status, created_at
      FROM registrations
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return res.json({
      success: true,
      data: {
        totalRegistrations: totalRegs,
        statusCounts,
        courseBreakdown,
        activeCoursesCount,
        recentLeads
      }
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải thống kê tổng quan CRM.' });
  }
});

// GET /api/admin/registrations - List student leads with filter, search
router.get('/registrations', (req, res) => {
  try {
    const { search, status, course_id } = req.query;
    let query = 'SELECT * FROM registrations WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR learning_needs LIKE ?)';
      params.push(q, q, q, q);
    }

    if (status && status !== 'Tất cả') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (course_id && course_id !== 'Tất cả') {
      query += ' AND course_id = ?';
      params.push(course_id);
    }

    query += ' ORDER BY created_at DESC';

    const leads = db.prepare(query).all(...params);
    return res.json({ success: true, data: leads });
  } catch (err) {
    console.error('[Admin Registrations Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách học viên.' });
  }
});

// GET /api/admin/registrations/:id
router.get('/registrations/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });
    }
    return res.json({ success: true, data: lead });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tải chi tiết học viên.' });
  }
});

// PUT /api/admin/registrations/:id - Update status and consultation notes
router.put('/registrations/:id', (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['Mới đăng ký', 'Đã liên hệ', 'Đang tư vấn', 'Đã ghi danh', 'Đã hoàn thành', 'Đã hủy'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }

    const current = db.prepare('SELECT id FROM registrations WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học viên.' });
    }

    db.prepare(`
      UPDATE registrations
      SET status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes, req.params.id);

    return res.json({ success: true, message: 'Cập nhật trạng thái và ghi chú thành công!' });
  } catch (err) {
    console.error('[Update Reg Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật học viên.' });
  }
});

// DELETE /api/admin/registrations/:id
router.delete('/registrations/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi để xóa.' });
    }
    return res.json({ success: true, message: 'Đã xóa bản ghi học viên.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa bản ghi.' });
  }
});

// GET /api/admin/registrations/export/csv - Export CSV with UTF-8 BOM
router.get('/export/csv', (req, res) => {
  try {
    const { search, status, course_id } = req.query;
    let query = 'SELECT * FROM registrations WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(q, q, q);
    }
    if (status && status !== 'Tất cả') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (course_id && course_id !== 'Tất cả') {
      query += ' AND course_id = ?';
      params.push(course_id);
    }
    query += ' ORDER BY created_at DESC';

    const leads = db.prepare(query).all(...params);

    // Escape CSV cell helper
    const esc = (text) => {
      if (text === null || text === undefined) return '""';
      const str = String(text).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${str}"`;
    };

    const headers = ['Mã ID', 'Họ và tên', 'Số điện thoại', 'Email', 'Khóa học quan tâm', 'Nhu cầu học tập', 'Trạng thái', 'Ghi chú tư vấn', 'Thời gian đăng ký', 'Cập nhật lần cuối'];
    let csvBody = headers.map(h => `"${h}"`).join(',') + '\r\n';

    for (const l of leads) {
      const row = [
        l.id,
        esc(l.full_name),
        esc(l.phone),
        esc(l.email),
        esc(l.course_title),
        esc(l.learning_needs),
        esc(l.status),
        esc(l.notes),
        esc(l.created_at),
        esc(l.updated_at)
      ];
      csvBody += row.join(',') + '\r\n';
    }

    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const bodyBuffer = Buffer.from(csvBody, 'utf-8');
    const fullBuffer = Buffer.concat([bomBuffer, bodyBuffer]);

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="danh-sach-hoc-vien-${timestamp}.csv"`);
    return res.send(fullBuffer);
  } catch (err) {
    console.error('[CSV Export Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi xuất file CSV.' });
  }
});

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tải cấu hình diễn giả.' });
  }
});

// POST /api/admin/settings - Bulk update settings
router.post('/settings', (req, res) => {
  try {
    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const updateMany = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updateStmt.run(key, String(value));
        }
      }
    });

    updateMany(req.body);
    return res.json({ success: true, message: 'Cập nhật thông tin diễn giả thành công!' });
  } catch (err) {
    console.error('[Update Settings Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi lưu thông tin diễn giả.' });
  }
});

// --- COURSES CRUD ---
// GET /api/admin/courses
router.get('/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY order_index ASC, id ASC').all();
    const formatted = courses.map(c => ({
      ...c,
      syllabus: c.syllabus_json ? JSON.parse(c.syllabus_json) : []
    }));
    return res.json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách khóa học.' });
  }
});

// POST /api/admin/courses
router.post('/courses', (req, res) => {
  try {
    const { title, badge, slug, short_desc, target_audience, format, duration, schedule, tuition_original, tuition_discount, image_url, order_index, is_active, syllabus } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và đường dẫn (slug) không được để trống.' });
    }

    const syllabus_json = syllabus ? (typeof syllabus === 'string' ? syllabus : JSON.stringify(syllabus)) : '[]';

    const insert = db.prepare(`
      INSERT INTO courses (title, badge, slug, short_desc, target_audience, format, duration, schedule, tuition_original, tuition_discount, image_url, order_index, is_active, syllabus_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      badge || '',
      slug,
      short_desc || '',
      target_audience || '',
      format || '',
      duration || '',
      schedule || '',
      parseInt(tuition_original) || 0,
      parseInt(tuition_discount) || 0,
      image_url || '/images/course-leadership.jpg',
      parseInt(order_index) || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      syllabus_json
    );

    return res.status(201).json({ success: true, message: 'Thêm khóa học mới thành công!', id: result.lastInsertRowid });
  } catch (err) {
    console.error('[Create Course Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tạo khóa học. Vui lòng kiểm tra lại slug không trùng lặp.' });
  }
});

// PUT /api/admin/courses/:id
router.put('/courses/:id', (req, res) => {
  try {
    const { title, badge, slug, short_desc, target_audience, format, duration, schedule, tuition_original, tuition_discount, image_url, order_index, is_active, syllabus } = req.body;

    const syllabus_json = syllabus !== undefined ? (typeof syllabus === 'string' ? syllabus : JSON.stringify(syllabus)) : null;

    db.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          badge = COALESCE(?, badge),
          slug = COALESCE(?, slug),
          short_desc = COALESCE(?, short_desc),
          target_audience = COALESCE(?, target_audience),
          format = COALESCE(?, format),
          duration = COALESCE(?, duration),
          schedule = COALESCE(?, schedule),
          tuition_original = COALESCE(?, tuition_original),
          tuition_discount = COALESCE(?, tuition_discount),
          image_url = COALESCE(?, image_url),
          order_index = COALESCE(?, order_index),
          is_active = COALESCE(?, is_active),
          syllabus_json = COALESCE(?, syllabus_json)
      WHERE id = ?
    `).run(
      title,
      badge,
      slug,
      short_desc,
      target_audience,
      format,
      duration,
      schedule,
      tuition_original !== undefined ? parseInt(tuition_original) : null,
      tuition_discount !== undefined ? parseInt(tuition_discount) : null,
      image_url,
      order_index !== undefined ? parseInt(order_index) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      syllabus_json,
      req.params.id
    );

    return res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
  } catch (err) {
    console.error('[Update Course Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật khóa học.' });
  }
});

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Đã xóa khóa học.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa khóa học.' });
  }
});

// --- ARTICLES CRUD ---
// GET /api/admin/articles
router.get('/articles', (req, res) => {
  try {
    const articles = db.prepare('SELECT * FROM articles ORDER BY order_index ASC, id DESC').all();
    return res.json({ success: true, data: articles });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách bài viết.' });
  }
});

// POST /api/admin/articles
router.post('/articles', (req, res) => {
  try {
    const { title, slug, category, summary, content, read_time, image_url, order_index } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).json({ success: false, message: 'Tiêu đề, slug và nội dung bài viết không được để trống.' });
    }

    const insert = db.prepare(`
      INSERT INTO articles (title, slug, category, summary, content, read_time, image_url, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      slug,
      category || 'Lãnh đạo & Đội ngũ',
      summary || '',
      content,
      read_time || '5 phút đọc',
      image_url || '/images/course-leadership.jpg',
      parseInt(order_index) || 0
    );

    return res.status(201).json({ success: true, message: 'Đăng bài viết mới thành công!', id: result.lastInsertRowid });
  } catch (err) {
    console.error('[Create Article Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tạo bài viết. Đảm bảo đường dẫn slug không trùng lặp.' });
  }
});

// PUT /api/admin/articles/:id
router.put('/articles/:id', (req, res) => {
  try {
    const { title, slug, category, summary, content, read_time, image_url, order_index } = req.body;

    db.prepare(`
      UPDATE articles
      SET title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          category = COALESCE(?, category),
          summary = COALESCE(?, summary),
          content = COALESCE(?, content),
          read_time = COALESCE(?, read_time),
          image_url = COALESCE(?, image_url),
          order_index = COALESCE(?, order_index)
      WHERE id = ?
    `).run(
      title,
      slug,
      category,
      summary,
      content,
      read_time,
      image_url,
      order_index !== undefined ? parseInt(order_index) : null,
      req.params.id
    );

    return res.json({ success: true, message: 'Cập nhật bài viết thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật bài viết.' });
  }
});

// DELETE /api/admin/articles/:id
router.delete('/articles/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Đã xóa bài viết.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa bài viết.' });
  }
});

module.exports = router;
