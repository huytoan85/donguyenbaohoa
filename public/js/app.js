/**
 * LANDING PAGE CLIENT APP
 * Chuyên gia Đào tạo & Diễn giả Cao cấp
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initFaqAccordion();
  loadSpeakerInfo();
  loadCourses();
  loadArticles('Tất cả');
  initArticleFilters();
  initRegistrationForm();
  initModals();
});

// State
let coursesData = [];
let activeArticleId = null;

/* -------------------------------------------------------------------
   1. MOBILE MENU & SMOOTH SCROLL
   ------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = '#ffffff';
        navLinks.style.padding = '20px';
        navLinks.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
      }
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
        }
      });
    });
  }
}

/* -------------------------------------------------------------------
   2. FAQ ACCORDION
   ------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

/* -------------------------------------------------------------------
   3. LOAD SPEAKER INFO & HYDRATION
   ------------------------------------------------------------------- */
async function loadSpeakerInfo() {
  try {
    const res = await fetch('/api/public/info');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;

      // Hydrate dynamically if elements exist
      const fullName = d.speaker_name || 'ĐỖ NGUYỄN BẢO HÒA';
      updateText('speakerNameHero', fullName);
      updateText('aboutSpeakerName', `Diễn giả ${fullName}`);
      updateText('brandSpeakerName', fullName);
      updateText('footerBrandSpeakerName', fullName);
      updateText('speakerTitleHero', d.speaker_title || 'Phó Viện Trưởng CISD');
      updateText('speakerBadgeHero', d.speaker_badge || 'Phó Viện Trưởng - Viện Nghiên cứu Tư vấn Phát triển Bền vững (CISD)');
      updateText('speakerSloganHero', d.speaker_slogan);
      updateText('speakerBioText', d.speaker_bio);
      updateText('speakerQuoteText', d.speaker_quote);
      updateText('speakerMethodologyText', d.speaker_methodology);

      // Achievements list dynamic render
      if (d.speaker_achievements) {
        const achList = document.getElementById('speakerAchievementsList');
        if (achList) {
          const lines = d.speaker_achievements.split('\n').filter(l => l.trim().length > 0);
          achList.innerHTML = lines.map(line => {
            const clean = line.replace(/^[•\-\*]\s*/, '');
            return `<li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>${clean}</span>
            </li>`;
          }).join('');
        }
      }

      // Stats
      updateText('statExpNum', d.stat_experience || '27+');
      updateText('statStudentsNum', d.stat_students || '19+');
      updateText('statEnterprisesNum', d.stat_enterprises || '150+');
      updateText('statSatisfactionNum', d.stat_satisfaction || '2020');

      // Contact & Hotline
      const hotlineRaw = (d.contact_hotline || '090 859 4174').trim();
      const hotlineNumber = hotlineRaw.replace(/\s/g, '');
      const zaloRaw = (d.contact_zalo || d.contact_hotline || '090 859 4174').trim();
      const zaloNumber = zaloRaw.replace(/\s/g, '');
      const zaloUrl = `https://zalo.me/${zaloNumber}`;

      updateText('hotlineDisplay', hotlineRaw);
      updateText('hotlineDisplay2', hotlineRaw);
      updateText('hotlineDisplayFooter', hotlineRaw);
      updateHref('hotlineLink', `tel:${hotlineNumber}`);
      updateHref('contactSectionHotlineLink', `tel:${hotlineNumber}`);
      updateHref('footerHotlineLink', `tel:${hotlineNumber}`);
      updateHref('floatingMobileCallBtn', `tel:${hotlineNumber}`);
      updateHref('floatingQuickCallBtn', `tel:${hotlineNumber}`);

      // Zalo bindings
      updateText('zaloDisplay', zaloRaw);
      updateText('headerZaloDisplay', zaloRaw);
      updateText('zaloDisplayFooter', zaloRaw);
      updateHref('zaloLink', zaloUrl);
      updateHref('headerZaloLink', zaloUrl);
      updateHref('footerZaloLink', zaloUrl);
      updateHref('footerZaloSocialBtn', zaloUrl);
      updateHref('floatingMobileZaloBtn', zaloUrl);
      updateHref('floatingQuickZaloBtn', zaloUrl);

      // Email & Address
      const emailVal = d.contact_email || 'hoado9791@gmail.com';
      updateText('emailDisplay', emailVal);
      updateText('emailDisplayFooter', emailVal);
      updateHref('emailLink', `mailto:${emailVal}`);
      updateHref('footerEmailLink', `mailto:${emailVal}`);
      updateText('addressDisplay', d.contact_address);

      // Speaker photos
      if (d.speaker_photo) {
        const heroImg = document.getElementById('heroSpeakerImg');
        if (heroImg) heroImg.src = d.speaker_photo;
      }
      if (d.speaker_about_photo) {
        const aboutImg = document.getElementById('aboutSpeakerImg');
        if (aboutImg) aboutImg.src = d.speaker_about_photo;
      }
    }
  } catch (err) {
    console.error('Lỗi nạp thông tin diễn giả:', err);
  }
}

function updateText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.innerText = text;
}

function updateHref(id, href) {
  const el = document.getElementById(id);
  if (el && href) el.href = href;
}

/* -------------------------------------------------------------------
   4. LOAD COURSES & CURRICULUM
   ------------------------------------------------------------------- */
async function loadCourses() {
  const container = document.getElementById('coursesGrid');
  const courseSelect = document.getElementById('courseSelect');
  if (!container) return;

  try {
    const res = await fetch('/api/public/courses');
    const json = await res.json();
    if (json.success && json.data) {
      coursesData = json.data;
      renderCourses(coursesData);
      populateCourseSelect(coursesData);
      renderCurriculumTabs(coursesData);
    }
  } catch (err) {
    console.error('Lỗi nạp danh sách khóa học:', err);
  }
}

function renderCourses(courses) {
  const container = document.getElementById('coursesGrid');
  if (!container) return;

  container.innerHTML = courses.map(c => `
    <article class="course-card">
      <div class="course-media">
        <img src="${c.image_url || '/images/course-leadership.jpg'}" alt="${c.title}" loading="lazy">
        ${c.badge ? `<span class="course-badge">${c.badge}</span>` : ''}
      </div>
      <div class="course-body">
        <div class="course-meta-tags">
          <span class="meta-tag format">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${c.format}
          </span>
          <span class="meta-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${c.duration}
          </span>
        </div>

        <h3 class="course-title">${c.title}</h3>
        <p class="course-desc">${c.short_desc}</p>

        <div class="course-specs">
          <div class="spec-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span><strong>Đối tượng:</strong> ${c.target_audience}</span>
          </div>
          <div class="spec-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span><strong>Lịch học:</strong> ${c.schedule}</span>
          </div>
        </div>

        <div class="course-pricing">
          <div>
            ${c.tuition_original > c.tuition_discount ? `<div class="price-original">${formatCurrency(c.tuition_original)}</div>` : ''}
            <div class="price-current">${formatCurrency(c.tuition_discount)}</div>
          </div>
        </div>

        <div class="course-actions">
          <button class="btn btn-outline btn-sm" onclick="openSyllabusModal(${c.id})">
            Xem học phần
          </button>
          <button class="btn btn-primary btn-sm" onclick="selectCourseToRegister(${c.id})">
            Đăng ký ngay
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function populateCourseSelect(courses) {
  const select = document.getElementById('courseSelect');
  if (!select) return;

  // Preserve first option
  select.innerHTML = '<option value="">-- Chọn khóa học bạn quan tâm --</option>' +
    courses.map(c => `<option value="${c.id}">${c.title} (${formatCurrency(c.tuition_discount)})</option>`).join('');
}

function selectCourseToRegister(courseId) {
  const select = document.getElementById('courseSelect');
  if (select) {
    select.value = courseId;
  }
  const regSection = document.getElementById('register');
  if (regSection) {
    regSection.scrollIntoView({ behavior: 'smooth' });
    const nameInput = document.getElementById('regFullName');
    if (nameInput) setTimeout(() => nameInput.focus(), 600);
  }
}

// Curriculum tabs & modules
function renderCurriculumTabs(courses) {
  const tabsContainer = document.getElementById('curriculumTabs');
  const modulesContainer = document.getElementById('curriculumContent');
  if (!tabsContainer || !modulesContainer || courses.length === 0) return;

  tabsContainer.innerHTML = courses.map((c, idx) => `
    <button class="curr-tab-btn ${idx === 0 ? 'active' : ''}" onclick="switchCurriculumTab(${c.id}, this)">
      ${c.title.split(':')[0]}
    </button>
  `).join('');

  renderCurriculumModules(courses[0]);
}

function switchCurriculumTab(courseId, btnEl) {
  document.querySelectorAll('.curr-tab-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  const course = coursesData.find(c => c.id === courseId);
  if (course) {
    renderCurriculumModules(course);
  }
}

function renderCurriculumModules(course) {
  const container = document.getElementById('curriculumContent');
  if (!container) return;

  const syllabus = course.syllabus || [];
  if (syllabus.length === 0) {
    container.innerHTML = '<p class="text-muted">Chi tiết lộ trình đang được cập nhật.</p>';
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--navy-900); margin-bottom: 6px;">${course.title}</h3>
      <p style="color: var(--slate-600); font-size: 0.95rem;">${course.short_desc}</p>
    </div>
    <div class="modules-timeline">
      ${syllabus.map(m => `
        <div class="module-item">
          <div class="module-header">
            <span class="module-badge">${m.module || 'Học phần'}</span>
            <h4 class="module-title">${m.title}</h4>
          </div>
          <div class="module-skills">
            <ul class="skills-list">
              ${(m.skills || []).map(s => `
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${s}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ${m.outcome ? `
            <div class="module-outcome">
              <span class="outcome-tag">🎯 Kết quả sau học phần:</span>
              <span>${m.outcome}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    <div style="margin-top: 30px; text-align: center;">
      <button class="btn btn-primary btn-lg" onclick="selectCourseToRegister(${course.id})">
        Đăng ký học khóa này ngay
      </button>
    </div>
  `;
}

/* -------------------------------------------------------------------
   5. ARTICLES & SKILLS CORNER
   ------------------------------------------------------------------- */
function initArticleFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      loadArticles(cat);
    });
  });
}

async function loadArticles(category) {
  const container = document.getElementById('articlesGrid');
  if (!container) return;

  try {
    let url = '/api/public/articles';
    if (category && category !== 'Tất cả') {
      url += `?category=${encodeURIComponent(category)}`;
    }
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && json.data) {
      if (json.data.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--slate-500); padding: 40px;">Chưa có bài viết trong danh mục này.</p>';
        return;
      }
      container.innerHTML = json.data.map(a => `
        <article class="article-card">
          <div class="article-img-wrap">
            <img src="${a.image_url || '/images/course-speaking.jpg'}" alt="${a.title}" loading="lazy">
            <span class="article-category">${a.category}</span>
          </div>
          <div class="article-body">
            <h4 class="article-title">${a.title}</h4>
            <p class="article-summary">${a.summary}</p>
            <div class="article-footer">
              <span>⏱ ${a.read_time || '5 phút'}</span>
              <button class="read-btn" onclick="openArticleModal(${a.id})">
                Đọc bài ➔
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }
  } catch (err) {
    console.error('Lỗi tải bài viết:', err);
  }
}

/* -------------------------------------------------------------------
   6. REGISTRATION FORM WITH VALIDATION & FEEDBACK
   ------------------------------------------------------------------- */
function initRegistrationForm() {
  const form = document.getElementById('registrationForm');
  const alertBox = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset alert
    alertBox.className = 'form-alert';
    alertBox.style.display = 'none';

    // Grab values
    const fullName = document.getElementById('regFullName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const courseId = document.getElementById('courseSelect').value;
    const learningNeeds = document.getElementById('regNeeds').value.trim();
    const consent = document.getElementById('regConsent').checked;

    // Validate Full Name
    if (fullName.length < 2) {
      showAlert('Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).', 'error');
      document.getElementById('regFullName').focus();
      return;
    }

    // Validate Phone (Vietnamese phone regex)
    const phoneClean = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      showAlert('Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (VD: 0912345678).', 'error');
      document.getElementById('regPhone').focus();
      return;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.', 'error');
      document.getElementById('regEmail').focus();
      return;
    }

    // Validate Consent
    if (!consent) {
      showAlert('Vui lòng đánh dấu đồng ý để chuyên gia và ban tổ chức liên hệ tư vấn.', 'error');
      return;
    }

    // Set Loading State (prevents duplicate clicks)
    submitBtn.disabled = true;
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    if (btnText) btnText.innerText = 'Đang xử lý đăng ký...';

    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: phoneClean,
          email,
          course_id: courseId ? parseInt(courseId) : null,
          learning_needs: learningNeeds,
          consent: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert(`🎉 ${result.message}`, 'success');
        form.reset();
      } else {
        showAlert(`⚠️ ${result.message || 'Không thể lưu đăng ký. Vui lòng thử lại.'}`, 'error');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      showAlert('⚠️ Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc liên hệ qua hotline.', 'error');
    } finally {
      submitBtn.disabled = false;
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (btnText) btnText.innerText = 'Gửi đăng ký tư vấn ngay';
    }
  });

  function showAlert(msg, type) {
    alertBox.innerText = msg;
    alertBox.className = `form-alert ${type}`;
    alertBox.style.display = 'block';
  }
}

/* -------------------------------------------------------------------
   7. MODALS (SYLLABUS & ARTICLE)
   ------------------------------------------------------------------- */
function initModals() {
  const modalOverlay = document.getElementById('siteModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (closeBtn && modalOverlay) {
    closeBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('open');
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
      }
    });
  }
}

window.openSyllabusModal = function(courseId) {
  const course = coursesData.find(c => c.id === courseId);
  if (!course) return;

  const modalOverlay = document.getElementById('siteModal');
  const modalBody = document.getElementById('modalBody');

  const syllabus = course.syllabus || [];

  modalBody.innerHTML = `
    <div style="margin-bottom: 24px;">
      <span class="meta-tag format" style="margin-bottom: 8px;">${course.format}</span>
      <h3 style="font-size: 1.6rem; font-weight: 800; color: var(--navy-900); margin: 8px 0;">${course.title}</h3>
      <p style="color: var(--slate-600); font-size: 0.95rem;">${course.short_desc}</p>
    </div>

    <div style="background: var(--slate-50); border-radius: var(--radius-md); padding: 16px; margin-bottom: 24px; font-size: 0.9rem;">
      <div style="margin-bottom: 6px;"><strong>Thời lượng:</strong> ${course.duration}</div>
      <div style="margin-bottom: 6px;"><strong>Lịch khai giảng:</strong> ${course.schedule}</div>
      <div><strong>Học phí ưu đãi:</strong> <span style="color: var(--orange-600); font-weight: 800; font-size: 1.1rem;">${formatCurrency(course.tuition_discount)}</span> (Gốc: ${formatCurrency(course.tuition_original)})</div>
    </div>

    <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--navy-900); margin-bottom: 16px;">Chi tiết các học phần đào tạo</h4>
    <div class="modules-timeline">
      ${syllabus.map(m => `
        <div class="module-item">
          <div class="module-header">
            <span class="module-badge">${m.module}</span>
            <h5 class="module-title">${m.title}</h5>
          </div>
          <div class="module-skills">
            <ul class="skills-list">
              ${(m.skills || []).map(s => `
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${s}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ${m.outcome ? `
            <div class="module-outcome">
              <span class="outcome-tag">🎯 Kết quả đạt được:</span>
              <span>${m.outcome}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <div style="margin-top: 30px; display: flex; gap: 14px; justify-content: flex-end;">
      <button class="btn btn-primary" onclick="closeModalAndRegister(${course.id})">
        Đăng ký học khóa này
      </button>
    </div>
  `;

  modalOverlay.classList.add('open');
};

window.closeModalAndRegister = function(courseId) {
  document.getElementById('siteModal').classList.remove('open');
  selectCourseToRegister(courseId);
};

window.openArticleModal = async function(articleId) {
  const modalOverlay = document.getElementById('siteModal');
  const modalBody = document.getElementById('modalBody');

  modalBody.innerHTML = '<div style="text-align: center; padding: 40px;">Đang tải nội dung...</div>';
  modalOverlay.classList.add('open');

  try {
    const res = await fetch(`/api/public/articles/${articleId}`);
    const json = await res.json();
    if (json.success && json.data) {
      const a = json.data;
      modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
          <span class="article-category" style="position: static; display: inline-block; margin-bottom: 10px;">${a.category}</span>
          <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--navy-900); line-height: 1.3; margin-bottom: 8px;">${a.title}</h2>
          <div style="font-size: 0.85rem; color: var(--slate-500); margin-bottom: 20px;">
            <span>⏱ ${a.read_time || '5 phút đọc'}</span> • <span>Chia sẻ bởi Diễn giả ĐỖ NGUYỄN BẢO HÒA</span>
          </div>
        </div>
        <div style="border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px;">
          <img src="${a.image_url || '/images/course-leadership.jpg'}" alt="${a.title}" style="width: 100%; height: 320px; object-fit: cover;">
        </div>
        <div style="font-size: 1.02rem; line-height: 1.8; color: var(--slate-700); white-space: pre-line;">
          ${a.content}
        </div>
        <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid var(--slate-200); text-align: center;">
          <p style="font-weight: 700; color: var(--navy-900); margin-bottom: 12px;">Bạn muốn rèn luyện kỹ năng thực chiến cùng chuyên gia?</p>
          <button class="btn btn-primary" onclick="document.getElementById('siteModal').classList.remove('open'); document.getElementById('register').scrollIntoView({ behavior: 'smooth' });">
            Đăng ký nhận tư vấn lộ trình đào tạo
          </button>
        </div>
      `;
    }
  } catch (err) {
    modalBody.innerHTML = '<p class="text-danger">Không thể tải bài viết. Vui lòng thử lại sau.</p>';
  }
};

function formatCurrency(val) {
  if (!val) return '0 đ';
  return Number(val).toLocaleString('vi-VN') + ' đ';
}
