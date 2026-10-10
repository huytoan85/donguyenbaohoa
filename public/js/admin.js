/**
 * ADMIN & CRM SPA APPLICATION
 * Quản trị Học viên, Khóa học & Nội dung Diễn giả
 */

// State
let token = localStorage.getItem('speaker_admin_token') || null;
let currentAdmin = JSON.parse(localStorage.getItem('speaker_admin_user') || 'null');
let activeLeadId = null;
let activeCourseId = null;
let activeArticleId = null;
let allCoursesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSidebarTabs();
  initLoginForm();
  initLeadFilters();
  initModals();
});

/* -------------------------------------------------------------------
   1. AUTHENTICATION & SESSION
   ------------------------------------------------------------------- */
function initAuth() {
  if (token) {
    showAdminLayout();
    loadDashboard();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showAdminLayout() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  if (currentAdmin) {
    const nameEl = document.getElementById('adminUserName');
    if (nameEl) nameEl.innerText = currentAdmin.full_name || currentAdmin.username;
  }
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  const alertEl = document.getElementById('loginAlert');
  const btn = document.getElementById('loginBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.style.display = 'none';

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    btn.disabled = true;
    btn.innerText = 'Đang đăng nhập...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        token = json.token;
        currentAdmin = json.admin;
        localStorage.setItem('speaker_admin_token', token);
        localStorage.setItem('speaker_admin_user', JSON.stringify(currentAdmin));
        showToast('Đăng nhập thành công!', 'success');
        showAdminLayout();
        loadDashboard();
      } else {
        alertEl.innerText = json.message || 'Đăng nhập không thành công.';
        alertEl.style.display = 'block';
      }
    } catch (err) {
      alertEl.innerText = 'Không thể kết nối đến máy chủ.';
      alertEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerText = 'Đăng nhập vào CRM';
    }
  });
}

window.logout = function() {
  localStorage.removeItem('speaker_admin_token');
  localStorage.removeItem('speaker_admin_user');
  token = null;
  currentAdmin = null;
  showLoginScreen();
  showToast('Đã đăng xuất.', 'success');
};

// Authorized Fetch Wrapper
async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    logout();
    throw new Error('Hết phiên làm việc.');
  }
  return res;
}

/* -------------------------------------------------------------------
   2. TABS & NAVIGATION
   ------------------------------------------------------------------- */
function initSidebarTabs() {
  const navBtns = document.querySelectorAll('.nav-item-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');

      // Set title
      const titleEl = document.getElementById('topbarTitle');
      if (titleEl) titleEl.innerText = btn.innerText.trim();

      // Trigger load
      if (targetTab === 'tabDashboard') loadDashboard();
      if (targetTab === 'tabLeads') loadLeads();
      if (targetTab === 'tabCourses') loadAdminCourses();
      if (targetTab === 'tabSettings') loadAdminSettings();
      if (targetTab === 'tabArticles') loadAdminArticles();
    });
  });
}

/* -------------------------------------------------------------------
   3. DASHBOARD METRICS & OVERVIEW
   ------------------------------------------------------------------- */
async function loadDashboard() {
  try {
    const res = await authFetch('/api/admin/dashboard');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;

      // KPI
      document.getElementById('dashTotalRegs').innerText = d.totalRegistrations || 0;
      document.getElementById('dashNewRegs').innerText = d.statusCounts['Mới đăng ký'] || 0;
      document.getElementById('dashEnrolledRegs').innerText = d.statusCounts['Đã ghi danh'] || 0;
      document.getElementById('dashActiveCourses').innerText = d.activeCoursesCount || 0;

      // Status Bars
      renderStatusBars(d.statusCounts, d.totalRegistrations);

      // Course Breakdown
      renderCourseBreakdown(d.courseBreakdown, d.totalRegistrations);

      // Recent leads table
      renderRecentLeads(d.recentLeads || []);
    }
  } catch (err) {
    console.error('Lỗi tải Dashboard:', err);
  }
}

function renderStatusBars(counts, total) {
  const container = document.getElementById('statusBarsContainer');
  if (!container) return;

  const statusConfigs = [
    { label: 'Mới đăng ký', key: 'Mới đăng ký', color: 'var(--status-new)' },
    { label: 'Đã liên hệ', key: 'Đã liên hệ', color: 'var(--status-contact)' },
    { label: 'Đang tư vấn', key: 'Đang tư vấn', color: 'var(--status-consult)' },
    { label: 'Đã ghi danh', key: 'Đã ghi danh', color: 'var(--status-enrolled)' },
    { label: 'Đã hoàn thành', key: 'Đã hoàn thành', color: 'var(--status-done)' },
    { label: 'Đã hủy', key: 'Đã hủy', color: 'var(--status-cancel)' }
  ];

  container.innerHTML = statusConfigs.map(s => {
    const cnt = counts[s.key] || 0;
    const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
    return `
      <div class="status-bar-item">
        <div class="bar-labels">
          <span>${s.label} (${cnt})</span>
          <span style="color: var(--admin-text-muted);">${pct}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct}%; background-color: ${s.color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCourseBreakdown(breakdown, total) {
  const container = document.getElementById('courseBreakdownContainer');
  if (!container) return;

  if (breakdown.length === 0) {
    container.innerHTML = '<p class="text-muted">Chưa có dữ liệu đăng ký khóa học.</p>';
    return;
  }

  container.innerHTML = breakdown.map(b => {
    const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
    return `
      <div class="status-bar-item">
        <div class="bar-labels">
          <span style="max-width: 80%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${b.course_title}</span>
          <span>${b.count} học viên (${pct}%)</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct}%; background-color: var(--admin-navy-800);"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentLeads(leads) {
  const tbody = document.getElementById('recentLeadsTbody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có lượt đăng ký nào</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(l => `
    <tr>
      <td><strong>${escapeHtml(l.full_name)}</strong></td>
      <td>${escapeHtml(l.phone)}</td>
      <td>${escapeHtml(l.course_title || 'Tư vấn chung')}</td>
      <td>${renderStatusBadge(l.status)}</td>
      <td><button class="btn-icon-action" title="Xem chi tiết" onclick="openLeadModal(${l.id})">🔍</button></td>
    </tr>
  `).join('');
}

/* -------------------------------------------------------------------
   4. CRM STUDENT LEADS MANAGEMENT
   ------------------------------------------------------------------- */
function initLeadFilters() {
  const searchInput = document.getElementById('leadSearchInput');
  const statusSelect = document.getElementById('leadStatusFilter');
  const courseSelect = document.getElementById('leadCourseFilter');
  const resetBtn = document.getElementById('btnResetFilter');
  const exportBtn = document.getElementById('btnExportCsv');

  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(loadLeads, 300);
    });
  }

  if (statusSelect) statusSelect.addEventListener('change', loadLeads);
  if (courseSelect) courseSelect.addEventListener('change', loadLeads);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = 'Tất cả';
      if (courseSelect) courseSelect.value = 'Tất cả';
      loadLeads();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportLeadsCsv);
  }
}

async function loadLeads() {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;

  const search = document.getElementById('leadSearchInput')?.value || '';
  const status = document.getElementById('leadStatusFilter')?.value || 'Tất cả';
  const courseId = document.getElementById('leadCourseFilter')?.value || 'Tất cả';

  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Đang tải danh sách học viên...</td></tr>';

  try {
    let url = `/api/admin/registrations?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&course_id=${encodeURIComponent(courseId)}`;
    const res = await authFetch(url);
    const json = await res.json();

    if (json.success && json.data) {
      const leads = json.data;
      document.getElementById('leadsCountDisplay').innerText = `Tổng số: ${leads.length} học viên`;

      if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 40px;">Không tìm thấy học viên phù hợp.</td></tr>';
        return;
      }

      tbody.innerHTML = leads.map(l => `
        <tr>
          <td>#${l.id}</td>
          <td><strong>${escapeHtml(l.full_name)}</strong></td>
          <td>
            <a href="tel:${l.phone}" style="color: var(--admin-navy-700); font-weight: 600;">
              📞 ${escapeHtml(l.phone)}
            </a>
          </td>
          <td>${escapeHtml(l.email)}</td>
          <td><span style="font-size: 0.88rem;">${escapeHtml(l.course_title || 'Tư vấn chung')}</span></td>
          <td>${renderStatusBadge(l.status)}</td>
          <td style="font-size: 0.82rem; color: #64748b;">${formatDateTime(l.created_at)}</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon-action" title="Xem chi tiết & Ghi chú" onclick="openLeadModal(${l.id})">
                ✏️
              </button>
              <button class="btn-icon-action danger" title="Xóa" onclick="deleteLead(${l.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh sách học viên:', err);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function renderStatusBadge(status) {
  let badgeClass = 'status-new-badge';
  if (status === 'Đã liên hệ') badgeClass = 'status-contact-badge';
  if (status === 'Đang tư vấn') badgeClass = 'status-consult-badge';
  if (status === 'Đã ghi danh') badgeClass = 'status-enrolled-badge';
  if (status === 'Đã hoàn thành') badgeClass = 'status-done-badge';
  if (status === 'Đã hủy') badgeClass = 'status-cancel-badge';

  return `<span class="status-pill ${badgeClass}">${escapeHtml(status || 'Mới đăng ký')}</span>`;
}

// Student Lead Modal
window.openLeadModal = async function(id) {
  activeLeadId = id;
  const modal = document.getElementById('leadDetailModal');

  try {
    const res = await authFetch(`/api/admin/registrations/${id}`);
    const json = await res.json();
    if (json.success && json.data) {
      const l = json.data;

      document.getElementById('modalLeadId').innerText = `#${l.id}`;
      document.getElementById('modalLeadName').innerText = l.full_name;
      document.getElementById('modalLeadPhone').innerText = l.phone;
      document.getElementById('modalLeadPhoneLink').href = `tel:${l.phone}`;
      document.getElementById('modalLeadEmail').innerText = l.email;
      document.getElementById('modalLeadCourse').innerText = l.course_title || 'Tư vấn chung';
      document.getElementById('modalLeadNeeds').innerText = l.learning_needs || '(Chưa có thông tin)';
      document.getElementById('modalLeadTime').innerText = formatDateTime(l.created_at);

      // Status dropdown
      document.getElementById('modalLeadStatus').value = l.status || 'Mới đăng ký';

      // Notes
      document.getElementById('modalLeadNotes').value = l.notes || '';

      modal.classList.add('open');
    }
  } catch (err) {
    showToast('Không thể tải thông tin học viên.', 'error');
  }
};

window.saveLeadUpdates = async function() {
  if (!activeLeadId) return;

  const status = document.getElementById('modalLeadStatus').value;
  const notes = document.getElementById('modalLeadNotes').value;

  try {
    const res = await authFetch(`/api/admin/registrations/${activeLeadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });

    const json = await res.json();
    if (json.success) {
      showToast('Đã lưu trạng thái và ghi chú tư vấn!', 'success');
      document.getElementById('leadDetailModal').classList.remove('open');
      loadLeads();
      loadDashboard();
    } else {
      showToast(json.message || 'Lỗi lưu thông tin.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ khi cập nhật.', 'error');
  }
};

window.deleteLead = async function(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi học viên #${id} này không?`)) return;

  try {
    const res = await authFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa bản ghi học viên.', 'success');
      loadLeads();
      loadDashboard();
    }
  } catch (err) {
    showToast('Lỗi khi xóa học viên.', 'error');
  }
};

function exportLeadsCsv() {
  const search = document.getElementById('leadSearchInput')?.value || '';
  const status = document.getElementById('leadStatusFilter')?.value || 'Tất cả';
  const courseId = document.getElementById('leadCourseFilter')?.value || 'Tất cả';

  const url = `/api/admin/export/csv?token=${encodeURIComponent(token)}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&course_id=${encodeURIComponent(courseId)}`;
  window.open(url, '_blank');
}

/* -------------------------------------------------------------------
   5. COURSES CMS
   ------------------------------------------------------------------- */
async function loadAdminCourses() {
  const tbody = document.getElementById('adminCoursesTbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Đang tải danh sách khóa học...</td></tr>';

  try {
    const res = await authFetch('/api/admin/courses');
    const json = await res.json();
    if (json.success && json.data) {
      allCoursesCache = json.data;

      // Populate filter in leads tab too
      const courseFilter = document.getElementById('leadCourseFilter');
      if (courseFilter) {
        courseFilter.innerHTML = '<option value="Tất cả">Tất cả khóa học</option>' +
          allCoursesCache.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
      }

      if (allCoursesCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có khóa học.</td></tr>';
        return;
      }

      tbody.innerHTML = allCoursesCache.map(c => `
        <tr>
          <td><img src="${c.image_url}" alt="" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"></td>
          <td><strong>${escapeHtml(c.title)}</strong><br><small style="color: #64748b;">${escapeHtml(c.slug)}</small></td>
          <td>${escapeHtml(c.format)}</td>
          <td>${escapeHtml(c.schedule)}</td>
          <td><strong style="color: var(--admin-orange);">${formatCurrency(c.tuition_discount)}</strong></td>
          <td>${c.is_active ? '<span class="status-pill status-enrolled-badge">Đang mở</span>' : '<span class="status-pill status-cancel-badge">Tạm ẩn</span>'}</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon-action" title="Sửa khóa học" onclick="openCourseModal(${c.id})">✏️</button>
              <button class="btn-icon-action danger" title="Xóa" onclick="deleteCourse(${c.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi tải khóa học.</td></tr>';
  }
}

window.openCourseModal = function(id = null) {
  activeCourseId = id;
  const modal = document.getElementById('courseEditModal');
  const titleHeader = document.getElementById('courseModalTitle');

  if (id) {
    titleHeader.innerText = 'Chỉnh sửa Khóa học';
    const c = allCoursesCache.find(x => x.id === id);
    if (!c) return;

    document.getElementById('cTitle').value = c.title || '';
    document.getElementById('cBadge').value = c.badge || '';
    document.getElementById('cSlug').value = c.slug || '';
    document.getElementById('cShortDesc').value = c.short_desc || '';
    document.getElementById('cAudience').value = c.target_audience || '';
    document.getElementById('cFormat').value = c.format || '';
    document.getElementById('cDuration').value = c.duration || '';
    document.getElementById('cSchedule').value = c.schedule || '';
    document.getElementById('cTuitionOriginal').value = c.tuition_original || 0;
    document.getElementById('cTuitionDiscount').value = c.tuition_discount || 0;
    document.getElementById('cImageUrl').value = c.image_url || '';
    document.getElementById('cActive').checked = !!c.is_active;
    document.getElementById('cSyllabusJson').value = JSON.stringify(c.syllabus || [], null, 2);
  } else {
    titleHeader.innerText = 'Thêm Khóa học mới';
    document.getElementById('courseForm').reset();
    document.getElementById('cActive').checked = true;
    document.getElementById('cImageUrl').value = '/images/course-leadership.jpg';
    document.getElementById('cSyllabusJson').value = JSON.stringify([
      { module: 'Học phần 1', title: 'Tiêu đề học phần 1', skills: ['Kỹ năng 1', 'Kỹ năng 2'], outcome: 'Kết quả đạt được' }
    ], null, 2);
  }

  modal.classList.add('open');
};

window.saveCourseForm = async function(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('cTitle').value.trim();
  const badge = document.getElementById('cBadge').value.trim();
  const slug = document.getElementById('cSlug').value.trim();
  const short_desc = document.getElementById('cShortDesc').value.trim();
  const target_audience = document.getElementById('cAudience').value.trim();
  const format = document.getElementById('cFormat').value.trim();
  const duration = document.getElementById('cDuration').value.trim();
  const schedule = document.getElementById('cSchedule').value.trim();
  const tuition_original = parseInt(document.getElementById('cTuitionOriginal').value) || 0;
  const tuition_discount = parseInt(document.getElementById('cTuitionDiscount').value) || 0;
  const image_url = document.getElementById('cImageUrl').value.trim();
  const is_active = document.getElementById('cActive').checked ? 1 : 0;
  const syllabusRaw = document.getElementById('cSyllabusJson').value.trim();

  let syllabus = [];
  try {
    syllabus = JSON.parse(syllabusRaw);
  } catch (err) {
    showToast('Lỗi định dạng JSON cho lộ trình học phần.', 'error');
    return;
  }

  const payload = {
    title, badge, slug, short_desc, target_audience, format, duration, schedule,
    tuition_original, tuition_discount, image_url, is_active, syllabus
  };

  try {
    let res;
    if (activeCourseId) {
      res = await authFetch(`/api/admin/courses/${activeCourseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await authFetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const json = await res.json();
    if (json.success) {
      showToast('Lưu khóa học thành công!', 'success');
      document.getElementById('courseEditModal').classList.remove('open');
      loadAdminCourses();
    } else {
      showToast(json.message || 'Lỗi lưu khóa học.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteCourse = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;
  try {
    const res = await authFetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa khóa học.', 'success');
      loadAdminCourses();
    }
  } catch (err) {
    showToast('Lỗi khi xóa khóa học.', 'error');
  }
};

/* -------------------------------------------------------------------
   6. SPEAKER SETTINGS CMS
   ------------------------------------------------------------------- */
async function loadAdminSettings() {
  try {
    const res = await authFetch('/api/admin/settings');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      const setVal = (id, k) => {
        const el = document.getElementById(id);
        if (el && d[k] !== undefined) el.value = d[k];
      };

      setVal('setSpeakerName', 'speaker_name');
      setVal('setSpeakerTitle', 'speaker_title');
      setVal('setSpeakerBadge', 'speaker_badge');
      setVal('setSpeakerPhoto', 'speaker_photo');
      setVal('setSpeakerAboutPhoto', 'speaker_about_photo');
      setVal('setSpeakerSlogan', 'speaker_slogan');
      setVal('setSpeakerBio', 'speaker_bio');
      setVal('setSpeakerQuote', 'speaker_quote');
      setVal('setSpeakerMethodology', 'speaker_methodology');
      setVal('setSpeakerAchievements', 'speaker_achievements');
      setVal('setStatExp', 'stat_experience');
      setVal('setStatStudents', 'stat_students');
      setVal('setStatEnterprises', 'stat_enterprises');
      setVal('setStatSatisfaction', 'stat_satisfaction');
      setVal('setHotline', 'contact_hotline');
      setVal('setZalo', 'contact_zalo');
      setVal('setEmail', 'contact_email');
      setVal('setAddress', 'contact_address');
    }
  } catch (err) {
    console.error('Lỗi tải cài đặt:', err);
  }
}

window.saveSpeakerSettings = async function(e) {
  if (e) e.preventDefault();

  const payload = {
    speaker_name: document.getElementById('setSpeakerName').value.trim(),
    speaker_title: document.getElementById('setSpeakerTitle').value.trim(),
    speaker_badge: document.getElementById('setSpeakerBadge').value.trim(),
    speaker_photo: document.getElementById('setSpeakerPhoto').value.trim(),
    speaker_about_photo: document.getElementById('setSpeakerAboutPhoto').value.trim(),
    speaker_slogan: document.getElementById('setSpeakerSlogan').value.trim(),
    speaker_bio: document.getElementById('setSpeakerBio').value.trim(),
    speaker_quote: document.getElementById('setSpeakerQuote').value.trim(),
    speaker_methodology: document.getElementById('setSpeakerMethodology').value.trim(),
    speaker_achievements: document.getElementById('setSpeakerAchievements').value.trim(),
    stat_experience: document.getElementById('setStatExp').value.trim(),
    stat_students: document.getElementById('setStatStudents').value.trim(),
    stat_enterprises: document.getElementById('setStatEnterprises').value.trim(),
    stat_satisfaction: document.getElementById('setStatSatisfaction').value.trim(),
    contact_hotline: document.getElementById('setHotline').value.trim(),
    contact_zalo: document.getElementById('setZalo') ? document.getElementById('setZalo').value.trim() : '',
    contact_email: document.getElementById('setEmail').value.trim(),
    contact_address: document.getElementById('setAddress').value.trim()
  };

  try {
    const res = await authFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Đã lưu cấu hình thông tin diễn giả thành công!', 'success');
    } else {
      showToast(json.message || 'Lỗi lưu thông tin.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

/* -------------------------------------------------------------------
   7. ARTICLES CMS
   ------------------------------------------------------------------- */
async function loadAdminArticles() {
  const tbody = document.getElementById('adminArticlesTbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Đang tải danh sách bài viết...</td></tr>';

  try {
    const res = await authFetch('/api/admin/articles');
    const json = await res.json();
    if (json.success && json.data) {
      const articles = json.data;
      if (articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có bài viết.</td></tr>';
        return;
      }

      tbody.innerHTML = articles.map(a => `
        <tr>
          <td>#${a.id}</td>
          <td><strong>${escapeHtml(a.title)}</strong></td>
          <td><span class="status-pill status-contact-badge">${escapeHtml(a.category)}</span></td>
          <td>${escapeHtml(a.read_time)}</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon-action" title="Sửa bài viết" onclick="openArticleEditModal(${a.id})">✏️</button>
              <button class="btn-icon-action danger" title="Xóa" onclick="deleteArticle(${a.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi tải bài viết.</td></tr>';
  }
}

window.openArticleEditModal = async function(id = null) {
  activeArticleId = id;
  const modal = document.getElementById('articleEditModal');
  const titleHeader = document.getElementById('articleModalTitle');

  if (id) {
    titleHeader.innerText = 'Chỉnh sửa Bài viết chia sẻ';
    const res = await authFetch(`/api/public/articles/${id}`);
    const json = await res.json();
    if (json.success && json.data) {
      const a = json.data;
      document.getElementById('artTitle').value = a.title || '';
      document.getElementById('artSlug').value = a.slug || '';
      document.getElementById('artCategory').value = a.category || 'Lãnh đạo & Đội ngũ';
      document.getElementById('artSummary').value = a.summary || '';
      document.getElementById('artReadTime').value = a.read_time || '5 phút đọc';
      document.getElementById('artImageUrl').value = a.image_url || '';
      document.getElementById('artContent').value = a.content || '';
    }
  } else {
    titleHeader.innerText = 'Thêm Bài viết mới';
    document.getElementById('articleForm').reset();
    document.getElementById('artImageUrl').value = '/images/course-leadership.jpg';
    document.getElementById('artReadTime').value = '5 phút đọc';
  }

  modal.classList.add('open');
};

window.saveArticleForm = async function(e) {
  if (e) e.preventDefault();

  const payload = {
    title: document.getElementById('artTitle').value.trim(),
    slug: document.getElementById('artSlug').value.trim(),
    category: document.getElementById('artCategory').value.trim(),
    summary: document.getElementById('artSummary').value.trim(),
    read_time: document.getElementById('artReadTime').value.trim(),
    image_url: document.getElementById('artImageUrl').value.trim(),
    content: document.getElementById('artContent').value.trim()
  };

  try {
    let res;
    if (activeArticleId) {
      res = await authFetch(`/api/admin/articles/${activeArticleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await authFetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const json = await res.json();
    if (json.success) {
      showToast('Đã lưu bài viết thành công!', 'success');
      document.getElementById('articleEditModal').classList.remove('open');
      loadAdminArticles();
    } else {
      showToast(json.message || 'Lỗi lưu bài viết.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteArticle = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
  try {
    const res = await authFetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa bài viết.', 'success');
      loadAdminArticles();
    }
  } catch (err) {
    showToast('Lỗi khi xóa bài viết.', 'error');
  }
};

/* -------------------------------------------------------------------
   8. CHANGE PASSWORD
   ------------------------------------------------------------------- */
window.submitChangePassword = async function(e) {
  if (e) e.preventDefault();

  const oldPassword = document.getElementById('pwOld').value;
  const newPassword = document.getElementById('pwNew').value;
  const confirmPassword = document.getElementById('pwConfirm').value;

  if (newPassword !== confirmPassword) {
    showToast('Mật khẩu xác nhận không khớp.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
    return;
  }

  try {
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const json = await res.json();
    if (json.success) {
      showToast('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.', 'success');
      document.getElementById('changePwForm').reset();
    } else {
      showToast(json.message || 'Đổi mật khẩu thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ khi đổi mật khẩu.', 'error');
  }
};

/* -------------------------------------------------------------------
   MODAL & TOAST UTILITIES
   ------------------------------------------------------------------- */
function initModals() {
  document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });
}

window.closeAdminModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
};

function showToast(msg, type = 'success') {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerText = msg;
  toast.className = `toast-notice ${type}`;

  setTimeout(() => {
    toast.className = 'toast-notice';
    toast.style.display = 'none';
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(val) {
  if (!val) return '0 đ';
  return Number(val).toLocaleString('vi-VN') + ' đ';
}

function formatDateTime(str) {
  if (!str) return '-';
  try {
    const d = new Date(str);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return str;
  }
}
