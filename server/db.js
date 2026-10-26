const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbPath;
if (process.env.VERCEL) {
  // In Vercel serverless environment, root filesystem is read-only.
  // Copy seed database to /tmp if not already present.
  const bundledDb = path.join(__dirname, '..', 'data', 'database.sqlite');
  const tmpDb = '/tmp/database.sqlite';
  try {
    if (!fs.existsSync(tmpDb) && fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, tmpDb);
      console.log('[DB] Copied bundled database to /tmp/database.sqlite');
    }
  } catch (err) {
    console.error('[DB] Error copying database to /tmp:', err);
  }
  dbPath = fs.existsSync(tmpDb) ? tmpDb : bundledDb;
} else {
  dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  console.warn('[DB] Journal mode WAL warning:', e.message);
}

function initDb() {
  // 1. Admins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Settings table (key-value)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      badge TEXT,
      slug TEXT UNIQUE NOT NULL,
      short_desc TEXT,
      target_audience TEXT,
      format TEXT,
      duration TEXT,
      schedule TEXT,
      tuition_original INTEGER,
      tuition_discount INTEGER,
      image_url TEXT,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      syllabus_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT,
      summary TEXT,
      content TEXT,
      read_time TEXT,
      image_url TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      course_id INTEGER,
      course_title TEXT,
      learning_needs TEXT,
      consent INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Mới đăng ký',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Testimonials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      role TEXT,
      company TEXT,
      content TEXT NOT NULL,
      avatar_url TEXT,
      rating INTEGER DEFAULT 5,
      order_index INTEGER DEFAULT 0
    );
  `);

  // Seed default admin if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    const defaultUser = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2026!Speaker';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPass, salt);

    db.prepare(`
      INSERT INTO admins (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `).run(defaultUser, hash, 'Quản Trị Viên Hệ Thống', 'hoado9791@gmail.com');
    console.log(`[DB] Created default admin account: ${defaultUser}`);
  }

  // Seed settings if empty
  const settingCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingCount === 0) {
    const defaultSettings = [
      ['speaker_name', 'ĐỖ NGUYỄN BẢO HÒA'],
      ['speaker_title', 'Giám Đốc Đào Tạo Viện Nghiên Cứu Tư Vấn Phát Triển CISD'],
      ['speaker_badge', 'Giám Đốc Đào Tạo Viện Nghiên Cứu Tư Vấn Phát Triển CISD'],
      ['speaker_slogan', 'Với 27 năm kinh nghiệm thực tiễn và 19 năm gắn bó tại Manulife Việt Nam, mang đến giải pháp thực tế về xây dựng đội ngũ, nâng cao năng lực bán hàng và phát triển kỹ năng lãnh đạo.'],
      ['speaker_bio', 'Diễn giả ĐỖ NGUYỄN BẢO HÒA hiện là Giám Đốc Đào Tạo Viện Nghiên Cứu Tư Vấn Phát Triển CISD.\n\nVới 27 năm kinh nghiệm trong tuyển dụng, quản lý và phát triển nguồn nhân lực, bà mang đến góc nhìn thực tiễn về xây dựng đội ngũ, nâng cao năng lực bán hàng và phát triển kỹ năng lãnh đạo.\n\nTrong 19 năm công tác tại Manulife Việt Nam, bà từng đảm nhiệm vai trò Giám đốc Đào tạo vùng miền Nam, trực tiếp xây dựng lộ trình đào tạo, quản lý đội ngũ giảng viên và triển khai các chương trình huấn luyện dành cho tư vấn viên, quản lý và lãnh đạo kinh doanh.'],
      ['speaker_quote', 'Với nền tảng sư phạm kết hợp kinh nghiệm điều hành thực tế, diễn giả ĐỖ NGUYỄN BẢO HÒA tập trung chia sẻ những phương pháp giúp người học nâng cao năng lực, giúp nhà quản lý phát triển đội ngũ và giúp doanh nghiệp xây dựng hệ thống đào tạo phù hợp với mục tiêu phát triển lâu dài.'],
      ['speaker_methodology', 'Phương pháp đào tạo thực tiễn kết hợp nền tảng Sư phạm và kinh nghiệm quản trị: Thấu hiểu tâm lý & năng lực từng cá nhân -> Chuẩn hóa quy trình rèn luyện kỹ năng gắn với mục tiêu kinh doanh -> Rèn luyện phản xạ thực tế qua tình huống thực chiến -> Xây dựng hệ thống đào tạo đội ngũ kế thừa bền vững.'],
      ['speaker_achievements', '• Giám Đốc Đào Tạo Viện Nghiên Cứu Tư Vấn Phát Triển CISD.\n• Được vinh danh Trưởng vùng Đào tạo Xuất sắc toàn quốc năm 2020 tại Manulife Việt Nam.\n• Từng xây dựng và dẫn dắt đội ngũ gồm 129 tư vấn viên và 20 quản lý khi đảm nhiệm vai trò Giám đốc Kinh doanh.\n• Có kinh nghiệm thiết kế chương trình đào tạo, coaching và phát triển đội ngũ gắn với mục tiêu kinh doanh.\n• Sở hữu nền tảng Cử nhân Sư phạm, cùng các chứng chỉ chuyên môn quốc tế CIAM, ACS và ALMI.'],
      ['speaker_photo', '/images/speaker-stage.png'],
      ['speaker_about_photo', '/images/speaker-about.jpg'],
      ['stat_experience', '27+'],
      ['stat_experience_label', 'Năm kinh nghiệm nhân sự'],
      ['stat_students', '19+'],
      ['stat_students_label', 'Năm tại Manulife VN'],
      ['stat_enterprises', '150+'],
      ['stat_enterprises_label', 'Tư vấn viên & Quản lý dẫn dắt'],
      ['stat_satisfaction', '2020'],
      ['stat_satisfaction_label', 'Trưởng vùng Đào tạo Xuất sắc'],
      ['contact_hotline', '090 859 4174'],
      ['contact_zalo', '090 859 4174'],
      ['contact_email', 'hoado9791@gmail.com'],
      ['contact_address', 'Tầng 12, Tòa nhà Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1, TP. Hồ Chí Minh'],
      ['social_facebook', 'https://facebook.com'],
      ['social_youtube', 'https://youtube.com'],
      ['social_linkedin', 'https://linkedin.com'],
      ['social_tiktok', 'https://tiktok.com']
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of defaultSettings) {
      insertSetting.run(k, v);
    }
    console.log('[DB] Seeded default speaker settings.');
  }

  // Seed courses if empty
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  if (courseCount === 0) {
    const sampleCourses = [
      {
        title: 'Mastering Leadership: Nghệ thuật Lãnh đạo & Dẫn dắt Đội ngũ Đỉnh cao',
        badge: 'Khóa học được đăng ký nhiều nhất',
        slug: 'mastering-leadership',
        short_desc: 'Chuyển hóa từ nhà quản lý thụ động thành nhà lãnh đạo truyền cảm hứng. Nắm vững nghệ thuật trao quyền, gắn kết đội ngũ và giải quyết xung đột hiệu quả.',
        target_audience: 'Chủ doanh nghiệp, Quản lý cấp trung, Trưởng bộ phận, Giám đốc dự án và những ai chuẩn bị bước lên vị trí lãnh đạo.',
        format: 'Hybrid (3 ngày Offline thực chiến + 4 tuần Mentoring 1:1 online)',
        duration: '6 buổi chuyên sâu (18 giờ đào tạo + 30 ngày hỗ trợ ứng dụng)',
        schedule: 'Khai giảng 25/11/2026 (Học tối Thứ 3 & Thứ 5, 19:00 - 21:30)',
        tuition_original: 12000000,
        tuition_discount: 8500000,
        image_url: '/images/course-leadership.jpg',
        order_index: 1,
        is_active: 1,
        syllabus_json: JSON.stringify([
          {
            module: 'Học phần 1',
            title: 'Tái định hình Tư duy Lãnh đạo trong kỷ nguyên mới',
            skills: ['Thấu hiểu phong cách lãnh đạo cá nhân', 'Chuyển đổi từ Micromanagement sang Trao quyền thông minh', 'Xây dựng Văn hóa chịu trách nhiệm cao'],
            outcome: 'Xác định rõ ràng phong cách lãnh đạo cá nhân và lập kế hoạch phát triển năng lực đội ngũ trong 90 ngày.'
          },
          {
            module: 'Học phần 2',
            title: 'Nghệ thuật Giao tiếp & Gắn kết Đội ngũ Đỉnh cao',
            skills: ['Kỹ năng lắng nghe thấu cảm & phản hồi mang tính xây dựng', 'Kỹ thuật đặt câu hỏi khai vấn (Coaching Questions)', 'Xử lý mâu thuẫn nội bộ mà không làm rạn nứt lòng tin'],
            outcome: 'Làm chủ ma trận phản hồi SBI (Situation - Behavior - Impact) và quy trình khai vấn 1:1 hiệu quả.'
          },
          {
            module: 'Học phần 3',
            title: 'Kích hoạt Động lực & Giữ chân Nhân tài',
            skills: ['Nhận diện động lực nội tại của từng thế hệ nhân sự (Gen Y, Gen Z)', 'Thiết kế lộ trình thăng tiến và gắn kết', 'Ủy quyền công việc theo cấp độ năng lực'],
            outcome: 'Tạo lập hệ thống động lực phi tài chính giúp tăng 40% hiệu suất làm việc của cấp dưới.'
          },
          {
            module: 'Học phần 4',
            title: 'Lãnh đạo trong Bất định & Quản trị Thay đổi',
            skills: ['Tư duy phản biện và ra quyết định dưới áp lực', 'Truyền thông về sự thay đổi giúp nhân sự an tâm đồng hành', 'Đo lường OKRs và duy trì kỷ luật hành động'],
            outcome: 'Bản kế hoạch hành động dẫn dắt chuyển đổi số / chuyển đổi vận hành cho phòng ban của bạn.'
          }
        ])
      },
      {
        title: 'Speak to Inspire: Bậc thầy Thuyết trình & Diễn thuyết Trước Đám đông',
        badge: 'Khai mở sự tự tin sân khấu',
        slug: 'speak-to-inspire',
        short_desc: 'Xóa bỏ hoàn toàn nỗi sợ sân khấu, làm chủ giọng nói, ngôn ngữ hình thể và cấu trúc bài nói truyền cảm hứng thu hút hàng ngàn thính giả.',
        target_audience: 'Diễn giả, Quản lý, Giảng viên nội bộ, Chuyên viên bán hàng cao cấp, người thường xuyên phải thuyết trình trước đám đông hoặc đối tác.',
        format: 'Trực tiếp 100% tại khán phòng tiêu chuẩn (Giới hạn 20 học viên/lớp)',
        duration: '2 ngày cuối tuần thực chiến liên tục (16 giờ đào tạo + Ghi hình chỉnh sửa)',
        schedule: 'Khai giảng 15/11/2026 - 16/11/2026 (08:30 - 17:30)',
        tuition_original: 15000000,
        tuition_discount: 9900000,
        image_url: '/images/course-speaking.jpg',
        order_index: 2,
        is_active: 1,
        syllabus_json: JSON.stringify([
          {
            module: 'Học phần 1',
            title: 'Giải phóng Tâm lý & Làm chủ Ngôn ngữ Cơ thể',
            skills: ['Kỹ thuật thở bụng và điều tiết nhịp tim xóa tan run sợ', 'Tư thế sân khấu quyền lực (Power Poses)', 'Ánh mắt kết nối và cử chỉ tay tự nhiên'],
            outcome: 'Làm chủ cảm xúc hoàn toàn trong 60 giây đầu tiên bước lên sân khấu.'
          },
          {
            module: 'Học phần 2',
            title: 'Cấu trúc Bài diễn thuyết Chuẩn TED Talk',
            skills: ['Mở đầu thôi miên bằng "The Hook"', 'Khung cấu trúc kim tự tháp Minto và mô hình 3 hồi', 'Nghệ thuật lồng ghép chuyện kể (Storytelling) đánh trúng cảm xúc'],
            outcome: 'Tự biên soạn được bài thuyết trình 10-20 phút cuốn hút từ đầu đến cuối.'
          },
          {
            module: 'Học phần 3',
            title: 'Luyện Giọng nói Trầm ấm & Ngữ điệu Cuốn hút',
            skills: ['Mở khẩu hình, phát âm tròn vành rõ chữ', 'Điểm dừng quyền lực (The Dramatic Pause)', 'Biến chuyển cao độ, tốc độ tạo nhịp điệu lôi cuốn'],
            outcome: 'Khắc phục giọng nói đều đều, tạo ra chất giọng truyền cảm và có uy lực.'
          },
          {
            module: 'Học phần 4',
            title: 'Tương tác Thính giả & Xử lý Tình huống Bất ngờ',
            skills: ['Kỹ thuật tương tác giữ năng lượng hội trường', 'Xử lý câu hỏi khó từ thính giả khó tính', 'Tốt nghiệp thực hành trực tiếp trên sân khấu có ghi hình'],
            outcome: 'Video ghi hình bài thuyết trình tốt nghiệp được chuyên gia nhận xét chi tiết 1:1.'
          }
        ])
      },
      {
        title: 'High-Impact Negotiation: Nghệ thuật Đàm phán & Thuyết phục Trong Kinh doanh',
        badge: 'Tối ưu thỏa thuận win-win',
        slug: 'high-impact-negotiation',
        short_desc: 'Chiến lược đàm phán hợp đồng giá trị cao, đọc vị tâm lý đối tác và chốt thỏa thuận đôi bên cùng có lợi mà không phải nhân nhượng về giá.',
        target_audience: 'Giám đốc kinh doanh, Chủ doanh nghiệp, Trưởng phòng mua hàng, Quản lý tài chính, Luật sư và chuyên viên thương thảo hợp đồng.',
        format: 'Trực tiếp tương tác mô phỏng bàn đàm phán thực tế (Case study thực chiến)',
        duration: '4 buổi tối (12 giờ thực hành mô phỏng case study)',
        schedule: 'Khai giảng 02/12/2026 (Tối Thứ 2 & Thứ 4, 19:00 - 21:30)',
        tuition_original: 9500000,
        tuition_discount: 6800000,
        image_url: '/images/course-negotiation.jpg',
        order_index: 3,
        is_active: 1,
        syllabus_json: JSON.stringify([
          {
            module: 'Học phần 1',
            title: 'Chuẩn bị Chiến lược & Định vị Thế cờ Đàm phán',
            skills: ['Xác định vùng thỏa thuận ZOPA và lựa chọn thay thế tốt nhất BATNA', 'Nghiên cứu đối tác và phân tích ma trận quyền lực', 'Thiết lập các mỏ neo giá trị (Value Anchors)'],
            outcome: 'Bộ checklist 12 bước chuẩn bị trước mọi cuộc đàm phán thương mại quan trọng.'
          },
          {
            module: 'Học phần 2',
            title: 'Đọc vị Tâm lý & Chiến thuật Giao tiếp Chiến lược',
            skills: ['Đọc vi biểu cảm và ngôn ngữ phi ngôn từ của đối tác', 'Kỹ thuật hỏi xoáy mở rộng giá trị trên bàn đàm phán', 'Chiến thuật phản đòn khi bị ép giá kịch sàn'],
            outcome: 'Nhận diện ngay lập tức các đòn tâm lý của đối tác và ứng biến phản xạ không nhượng bộ.'
          },
          {
            module: 'Học phần 3',
            title: 'Nghệ thuật Trao đổi Nhượng bộ & Đạt thỏa thuận Win-Win',
            skills: ['Quy tắc vàng: Không bao giờ nhượng bộ miễn phí', 'Đóng gói các gói đề xuất linh hoạt (Concession Packaging)', 'Vượt qua thế bế tắc (Deadlock Breakout)'],
            outcome: 'Kỹ năng giữ vững biên lợi nhuận mục tiêu mà vẫn tạo sự hài lòng cho đối tác.'
          },
          {
            module: 'Học phần 4',
            title: 'Chốt Hợp đồng & Xây dựng Quan hệ Dài hạn',
            skills: ['Kỹ thuật đóng thỏa thuận dứt khoát không để trì hoãn', 'Bảo vệ cam kết thực thi sau ký kết', 'Mô phỏng đàm phán thực tế với giám khảo chấm điểm'],
            outcome: 'Tự tin bước vào bất kỳ bàn đàm phán triệu đô nào với tâm thế vững vàng.'
          }
        ])
      }
    ];

    const insertCourse = db.prepare(`
      INSERT INTO courses (title, badge, slug, short_desc, target_audience, format, duration, schedule, tuition_original, tuition_discount, image_url, order_index, is_active, syllabus_json)
      VALUES (@title, @badge, @slug, @short_desc, @target_audience, @format, @duration, @schedule, @tuition_original, @tuition_discount, @image_url, @order_index, @is_active, @syllabus_json)
    `);

    for (const c of sampleCourses) {
      insertCourse.run(c);
    }
    console.log('[DB] Seeded 3 default courses.');
  }

  // Seed articles if empty
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  if (articleCount === 0) {
    const sampleArticles = [
      {
        title: '5 Nguyên tắc vàng giúp bạn làm chủ sân khấu và xóa bỏ nỗi sợ nói trước đám đông',
        slug: '5-nguyen-tac-lam-chu-san-khau',
        category: 'Kỹ năng Thuyết trình',
        summary: 'Nỗi sợ nói trước đám đông là nỗi sợ phổ biến hàng đầu thế giới. Khám phá kỹ thuật thở 4-7-8 và quy tắc 3 giây đầu tiên để tự tin như một diễn giả chuyên nghiệp.',
        content: `Khi bước lên sân khấu hoặc đứng trước một phòng họp đông người, cơ thể bạn thường phản ứng bằng cách tăng nhịp tim, đổ mồ hôi tay và nghẹn giọng. Đây là phản xạ sinh học tự nhiên "chiến hay biến" (fight or flight). 

1. Kỹ thuật thở điều hòa nhịp tim: Hãy hít vào sâu 4 giây bằng bụng, giữ hơi 2 giây và thở ra từ từ trong 6 giây. Lặp lại 3 lần trước khi cầm micro.
2. Quy tắc 3 giây kết nối bằng mắt: Đừng nhìn vu vơ lên trần nhà hay màn hình máy chiếu. Hãy chọn 3 vị trí thân thiện ở cánh trái, trung tâm và cánh phải để gửi ánh mắt ấm áp.
3. Chuyển hóa trọng tâm: Thay vì lo lắng "Người ta nghĩ gì về mình?", hãy tự nhủ "Mình đang mang đến món quà giá trị nào cho khán giả hôm nay?".
4. Dừng lại một nhịp trước khi nói: Đừng vội vàng nói ngay khi cầm micro. Hãy đứng vững, mỉm cười và dừng lại 2 giây để khán giả tập trung vào bạn.
5. Thực hành ghi âm và soi gương: Không có diễn giả bẩm sinh, chỉ có người kiên trì mài giũa phản xạ qua hàng trăm giờ luyện tập.`,
        read_time: '5 phút đọc',
        image_url: '/images/course-speaking.jpg',
        order_index: 1
      },
      {
        title: 'Mô hình Servant Leadership: Bí quyết lãnh đạo bằng sự phụng sự và trao quyền',
        slug: 'mo-hinh-servant-leadership-trao-quyen',
        category: 'Lãnh đạo & Đội ngũ',
        summary: 'Thời đại của người sếp chỉ tay năm ngón đã chấm dứt. Lãnh đạo hiện đại là người dọn đường, tháo gỡ rào cản và truyền cảm hứng để đội ngũ tự tin tỏa sáng.',
        content: `Một trong những sai lầm lớn nhất của các quản lý mới thăng chức là ôm đồm công việc vì sợ cấp dưới làm hỏng. Lãnh đạo thực thụ không phải là người có tất cả câu trả lời, mà là người biết đặt ra những câu hỏi đúng để nhân viên tự tìm giải pháp.

1. Lắng nghe trước khi chỉ đạo: Hãy tạo không gian an toàn tâm lý để nhân viên dám nói thật về các khó khăn trong dự án.
2. Trao quyền đi đôi với trách nhiệm: Xác định rõ kết quả kỳ vọng (What & Why), nhưng hãy để nhân viên tự do sáng tạo cách thực hiện (How).
3. Đóng vai trò người gỡ rối: Thay vì hỏi "Tại sao chưa xong việc?", hãy hỏi "Anh/Chị có thể hỗ trợ điều gì để em hoàn thành mục tiêu này nhanh nhất?".
4. Công nhận công sức kịp thời: Lời khen ngợi chân thành và kịp thời trước tập thể có sức mạnh gấp 10 lần những quy chế khen thưởng khô khan cuối năm.`,
        read_time: '7 phút đọc',
        image_url: '/images/course-leadership.jpg',
        order_index: 2
      },
      {
        title: 'Chiến lược BATNA: Làm sao để luôn giữ thế chủ động trên bàn đàm phán thương mại?',
        slug: 'chien-luoc-batna-dam-phan-thuong-mai',
        category: 'Đàm phán & Giao tiếp',
        summary: 'BATNA (Best Alternative to a Negotiated Agreement) là vũ khí tối thượng của mọi nhà thương thuyết sành sỏi. Đừng bao giờ ngồi vào bàn đàm phán nếu chưa chuẩn bị đường lui.',
        content: `Tại sao bạn lại bị đối tác ép giá kịch sàn? Lý do duy nhất là đối tác nhận ra bạn không còn phương án thay thế nào khác nếu cuộc đàm phán này đổ vỡ.

1. Xác định BATNA trước khi gặp mặt: Nếu đối tác này không ký hợp đồng, bạn sẽ làm gì tiếp theo? Bạn đã có 2 khách hàng tiềm năng khác đang chờ hay chưa?
2. Nâng cao giá trị của BATNA: Hãy tích cực tìm kiếm và phát triển các phương án dự phòng. Khi bạn không ở thế bắt buộc phải bán, bạn sẽ có phong thái đĩnh đạc nhất.
3. Thăm dò BATNA của đối tác: Liệu đối tác có tìm được nhà cung cấp nào có năng lực tương đương với bạn trong vòng 2 tuần tới không?
4. Nguyên tắc không bao giờ nhân nhượng đơn phương: Khi đối tác yêu cầu giảm 10% giá, bạn phải yêu cầu đổi lại điều kiện thanh toán sớm 100% hoặc kéo dài thời hạn giao hàng.`,
        read_time: '6 phút đọc',
        image_url: '/images/course-negotiation.jpg',
        order_index: 3
      },
      {
        title: '3 Kỹ thuật đặt câu hỏi khai vấn (Coaching) giúp nhân viên tự giác giải quyết vấn đề',
        slug: '3-ky-thuat-dat-cau-hoi-coaching',
        category: 'Lãnh đạo & Đội ngũ',
        summary: 'Thay vì đưa ra chỉ đạo trực tiếp khiến cấp dưới phụ thuộc, hãy sử dụng mô hình GROW và câu hỏi mở để kích hoạt tư duy phản biện của đội ngũ.',
        content: `Mỗi khi nhân viên bước vào phòng bạn và hỏi "Sếp ơi, vụ này làm sao bây giờ?", bạn phản ứng thế nào? Nếu bạn đưa ngay giải pháp, bạn vừa huấn luyện cho nhân viên thói quen lười suy nghĩ.

Áp dụng quy trình 3 câu hỏi khai vấn:
1. "Theo em, nguyên nhân gốc rễ của vấn đề này đang nằm ở đâu?" (Giúp nhân viên nhìn nhận khách quan).
2. "Nếu có toàn quyền quyết định, em nghĩ có 2-3 phương án nào có thể giải quyết được việc này?" (Kích hoạt tư duy sáng tạo).
3. "Trong các phương án đó, phương án nào tối ưu nhất và em cần anh hỗ trợ nguồn lực gì?" (Giao trách nhiệm và đồng hành).`,
        read_time: '4 phút đọc',
        image_url: '/images/workshop-gallery.jpg',
        order_index: 4
      }
    ];

    const insertArticle = db.prepare(`
      INSERT INTO articles (title, slug, category, summary, content, read_time, image_url, order_index)
      VALUES (@title, @slug, @category, @summary, @content, @read_time, @image_url, @order_index)
    `);

    for (const a of sampleArticles) {
      insertArticle.run(a);
    }
    console.log('[DB] Seeded 4 default articles.');
  }

  // Seed testimonials if empty
  const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;
  if (testimonialCount === 0) {
    const sampleTestimonials = [
      {
        student_name: 'Nguyễn Văn An',
        role: 'Giám đốc Kinh doanh',
        company: 'Tập đoàn Công nghệ TechGlobal',
        content: 'Khóa học Mastering Leadership đã thay đổi hoàn toàn cách tôi giao tiếp và giao việc cho đội ngũ 45 nhân sự. Trước đây tôi luôn quá tải vì ôm việc, nhưng sau khóa học tôi đã biết cách phân quyền và xây dựng động lực tự thân cho các trưởng nhóm.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        order_index: 1
      },
      {
        student_name: 'Trần Thị Thu Mai',
        role: 'Trưởng phòng Nhân sự & Đào tạo',
        company: 'Hệ thống Bán lẻ SunRetail Group',
        content: 'Phương pháp đào tạo của cô Bảo Hòa cực kỳ thực tế và sâu sắc. Nhờ nền tảng sư phạm và kinh nghiệm quản trị nhân sự thực tế, đội ngũ quản lý của chúng tôi đã thay đổi toàn diện cách thức kèm cặp và phát triển nhân viên.',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        order_index: 2
      },
      {
        student_name: 'Lê Hoàng Phúc',
        role: 'Nhà sáng lập & CEO',
        company: 'FinEdu EdTech',
        content: 'Trước đây tôi rất sợ nói trước đám đông trên 30 người, tim đập chân run. Nhờ khóa Speak to Inspire, tôi vừa đại diện công ty thuyết trình gọi vốn thành công 1.2 triệu USD trước hội đồng 10 quỹ đầu tư quốc tế!',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        order_index: 3
      },
      {
        student_name: 'Đặng Phương Thảo',
        role: 'Phó Tổng Giám Đốc Vận Hành',
        company: 'VinaLogistics',
        content: 'Tôi đánh giá rất cao khóa High-Impact Negotiation. Các kịch bản mô phỏng bàn đàm phán rất sát thực tế, giúp công ty tôi vừa đàm phán thành công hợp đồng gia hạn 3 năm với đối tác cảng biển lớn.',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        order_index: 4
      }
    ];

    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (student_name, role, company, content, avatar_url, rating, order_index)
      VALUES (@student_name, @role, @company, @content, @avatar_url, @rating, @order_index)
    `);

    for (const t of sampleTestimonials) {
      insertTestimonial.run(t);
    }
    console.log('[DB] Seeded 4 testimonials.');
  }

  // Seed sample student registrations if empty
  const regCount = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
  if (regCount === 0) {
    const sampleRegistrations = [
      {
        full_name: 'Phạm Minh Tuấn',
        phone: '0912345678',
        email: 'tuan.pham@fpt.com.vn',
        course_id: 1,
        course_title: 'Mastering Leadership: Nghệ thuật Lãnh đạo & Dẫn dắt Đội ngũ Đỉnh cao',
        learning_needs: 'Vừa được thăng chức Trưởng phòng Công nghệ, cần học cách quản trị đội ngũ 15 bạn lập trình viên Gen Z.',
        consent: 1,
        status: 'Mới đăng ký',
        notes: 'Đăng ký qua website lúc 09:30 sáng. Cần xếp lịch gọi tư vấn khung giờ 12h-13h.',
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
      },
      {
        full_name: 'Vũ Hải Yến',
        phone: '0987654321',
        email: 'haiyen.vu@gmail.com',
        course_id: 2,
        course_title: 'Speak to Inspire: Bậc thầy Thuyết trình & Diễn thuyết Trước Đám đông',
        learning_needs: 'Muốn rèn luyện giọng nói và phong thái tự tin khi thuyết trình báo cáo với Tổng giám đốc.',
        consent: 1,
        status: 'Đã liên hệ',
        notes: 'Đã gọi điện lúc 11:00. Học viên rất hào hứng, hỏi về địa điểm học offline tại TP.HCM. Đã gửi qua Zalo giáo trình chi tiết.',
        created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
      },
      {
        full_name: 'Ngô Quốc Bảo',
        phone: '0903112233',
        email: 'bao.ngo@vincommerce.vn',
        course_id: 3,
        course_title: 'High-Impact Negotiation: Nghệ thuật Đàm phán & Thuyết phục Trong Kinh doanh',
        learning_needs: 'Chuẩn bị đàm phán hợp đồng cung ứng cuối năm với đối tác bán lẻ lớn, cần chiến thuật chốt deal.',
        consent: 1,
        status: 'Đang tư vấn',
        notes: 'Học viên muốn đăng ký gói cho 3 nhân sự cấp quản lý. Đang gửi báo giá ưu đãi doanh nghiệp.',
        created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
      },
      {
        full_name: 'Trịnh Thúy Hằng',
        phone: '0977889900',
        email: 'hang.trinh@vingroup.net',
        course_id: 1,
        course_title: 'Mastering Leadership: Nghệ thuật Lãnh đạo & Dẫn dắt Đội ngũ Đỉnh cao',
        learning_needs: 'Muốn học cách xây dựng văn hóa gắn kết và giải quyết xung đột nội bộ.',
        consent: 1,
        status: 'Đã ghi danh',
        notes: 'Đã hoàn tất thanh toán học phí sớm qua chuyển khoản Vietcombank. Đã add vào group Zalo lớp học.',
        created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString()
      },
      {
        full_name: 'Lê Thanh Tùng',
        phone: '0933445566',
        email: 'tung.le@startup.io',
        course_id: 2,
        course_title: 'Speak to Inspire: Bậc thầy Thuyết trình & Diễn thuyết Trước Đám đông',
        learning_needs: 'Cần chuẩn bị pitch deck và nói trước nhà đầu tư thiên thần.',
        consent: 1,
        status: 'Đã hoàn thành',
        notes: 'Đã tốt nghiệp khóa K15 xuất sắc, đạt danh hiệu Diễn giả triển vọng của khóa.',
        created_at: new Date(Date.now() - 3600 * 1000 * 240).toISOString()
      }
    ];

    const insertReg = db.prepare(`
      INSERT INTO registrations (full_name, phone, email, course_id, course_title, learning_needs, consent, status, notes, created_at)
      VALUES (@full_name, @phone, @email, @course_id, @course_title, @learning_needs, @consent, @status, @notes, @created_at)
    `);

    for (const r of sampleRegistrations) {
      insertReg.run(r);
    }
    console.log('[DB] Seeded 5 sample student registrations.');
  }
}

initDb();

module.exports = db;
