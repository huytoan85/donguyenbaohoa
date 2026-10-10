# HỆ THỐNG LANDING PAGE DIỄN GIẢ & CRM QUẢN LÝ HỌC VIÊN

Website landing page giới thiệu thương hiệu cá nhân cho diễn giả, chuyên gia huấn luyện đào tạo cấp cao, tích hợp hệ thống tiếp nhận đăng ký khóa học và cổng CRM quản lý học viên thực chiến.

---

## 🌟 TỔNG QUAN TÍNH NĂNG HỆ THỐNG

### 1. Landing Page Diễn Giả (Giao Diện Công Khai)
- **Hero Section**: Ảnh chân dung diễn giả chất lượng cao, tên, chức danh đào tạo, thông điệp giá trị (Value Proposition), 4 chỉ số tác động nổi bật (12+ năm, 50,000+ học viên, 250+ doanh nghiệp, 98.8% hài lòng), 2 nút CTA "Khám phá khóa học" và "Đăng ký tư vấn".
- **Giới thiệu Diễn giả**: Tiểu sử, kinh nghiệm điều hành thực chiến, thành tựu, triết lý đào tạo và **Mô hình đào tạo độc quyền 4D Model** (Discover - Develop - Demonstrate - Drive).
- **Danh mục Khóa học**: Hiển thị các khóa học chuyên sâu với ảnh bìa thực tế, hình thức đào tạo (Hybrid, Trực tiếp), thời lượng, lịch khai giảng gần nhất, học phí gốc và học phí ưu đãi sớm, nút "Xem học phần" và "Đăng ký ngay".
- **Chi tiết Khung năng lực & Lộ trình**: Từng học phần mô đun, danh sách kỹ năng thực hành và kết quả bàn giao (outcomes) sau khóa học.
- **Góc chia sẻ Kỹ năng**: Các bài viết kiến thức chuyên sâu có bộ lọc danh mục (Lãnh đạo & Đội ngũ, Kỹ năng Thuyết trình, Đàm phán & Giao tiếp) cùng popup đọc bài viết mượt mà.
- **Cảm nhận Học viên & Hoạt động**: Đánh giá chân thực từ các Giám đốc/Quản lý cùng thư viện ảnh buổi lễ tốt nghiệp và trao chứng chỉ.
- **FAQ**: Giải đáp thắc mắc thường gặp với hiệu ứng mở/đóng Accordion.
- **Biểu mẫu Đăng ký Tư vấn**: Form thu gọn tối ưu tỷ lệ chuyển đổi (Họ tên, SĐT, Email, Khóa học quan tâm, Mục tiêu học tập, Ô cam kết đồng ý tư vấn), chống click lặp/gửi trùng lặp và lưu trữ trực tiếp vào cơ sở dữ liệu.

### 2. Cổng Quản Trị & CRM Học Viên (`/admin`)
- **Bảo mật**: Xác thực Token JWT, mã hóa mật khẩu bằng `bcrypt`, bảo vệ dữ liệu học viên ở tầng máy chủ, không lộ thông tin cá nhân.
- **Dashboard Thống kê**: Đo lường tổng lượt đăng ký, số hồ sơ mới cần gọi, tỷ lệ ghi danh thành công, biểu đồ phân bổ học viên theo từng khóa học và theo từng trạng thái.
- **Quản lý Học viên (Student CRM)**:
  - Bảng dữ liệu: Mã, Họ tên, SĐT, Email, Khóa học, Trạng thái, Ngày đăng ký.
  - Tìm kiếm tức thời theo tên, số điện thoại hoặc email.
  - Bộ lọc theo Trạng thái và Khóa học.
  - **Xuất file CSV (Excel)**: File tải về tích hợp mã hóa UTF-8 BOM (`\uFEFF`), mở trực tiếp bằng Microsoft Excel tại Việt Nam không bao giờ bị lỗi dấu tiếng Việt.
  - **Modal Chi tiết & Ghi chú tư vấn**: Chuyển trạng thái linh hoạt (*Mới đăng ký, Đã liên hệ, Đang tư vấn, Đã ghi danh, Đã hoàn thành, Đã hủy*) và lưu lại lịch sử ghi chú cuộc gọi tư vấn của nhân viên.
- **CMS Quản lý Nội dung**:
  - Thêm, sửa, xóa hoặc ẩn/hiện khóa học, cấu hình lộ trình học phần.
  - Chỉnh sửa thông tin diễn giả, các chỉ số thống kê, hotline, email, địa chỉ.
  - Thêm, sửa, xóa các bài viết chia sẻ kinh nghiệm trên blog.
  - Chức năng đổi mật khẩu quản trị viên an toàn.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu môi trường:
- Node.js version 18 trở lên (đã kiểm thử hoàn hảo trên Node v24).
- npm đi kèm.

### Các bước chạy:

1. **Cài đặt thư viện dependencies:**
```bash
npm install
```

2. **Cấu hình biến môi trường:**
Tệp `.env` đã được tạo sẵn trong thư mục gốc:
```env
PORT=3000
JWT_SECRET=vietnam_speaker_crm_jwt_secret_key_2026_super_secure
ADMIN_DEFAULT_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=Admin@2026!Speaker
```

3. **Khởi chạy máy chủ:**
```bash
npm start
```
*(Hoặc dùng lệnh `npm run dev` để tự động khởi động lại khi sửa code)*

4. **Truy cập ứng dụng trên trình duyệt:**
- **Landing Page Diễn Giả**: [http://localhost:3000](http://localhost:3000)
- **Cổng Quản Trị CRM**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔑 THÔNG TIN ĐĂNG NHẬP QUẢN TRỊ VIÊN MẶC ĐỊNH

- **Tài khoản**: `admin`
- **Mật khẩu**: `Admin@2026!Speaker`

> 💡 **Khuyến nghị bảo mật**: Sau khi đăng nhập lần đầu tiên, hãy vào tab **"Đổi mật khẩu"** trong trang quản trị để đổi sang mật khẩu riêng của bạn. Mật khẩu mới sẽ được mã hóa chuẩn `bcrypt` và lưu vào cơ sở dữ liệu SQLite an toàn.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
gioithieudiengia/
├── data/
│   └── database.sqlite         # Cơ sở dữ liệu SQLite lưu trữ học viên, khóa học, bài viết
├── public/                     # Tài nguyên phía máy khách (Frontend)
│   ├── index.html              # Giao diện Landing Page Diễn Giả
│   ├── admin.html              # Giao diện Cổng Quản trị & CRM Học viên
│   ├── css/
│   │   ├── styles.css          # Design system & giao diện Landing Page (Xanh navy + Cam)
│   │   └── admin.css           # Giao diện CRM SaaS & Bảng biểu thống kê
│   ├── js/
│   │   ├── app.js              # Xử lý tương tác, modal, nạp dữ liệu, gửi form đăng ký
│   │   └── admin.js            # Xử lý CRM, xác thực JWT, bộ lọc, xuất CSV, chỉnh sửa CMS
│   └── images/                 # Ảnh chân dung diễn giả và ảnh workshop thực tế
│       ├── speaker-hero.jpg
│       ├── course-leadership.jpg
│       ├── course-speaking.jpg
│       ├── course-negotiation.jpg
│       └── workshop-gallery.jpg
├── server/                     # Máy chủ phụ trợ (Backend API)
│   ├── app.js                  # Cấu hình Express server & định tuyến static
│   ├── db.js                   # Kết nối SQLite, khởi tạo bảng và seed dữ liệu mẫu tiếng Việt
│   ├── middleware/
│   │   └── auth.js             # Middleware kiểm tra và giải mã mã thông báo JWT
│   └── routes/
│       ├── api.js              # REST API công khai (thông tin, khóa học, bài viết, gửi đăng ký)
│       ├── admin.js            # REST API bảo mật cho CRM (leads, thống kê, xuất CSV, CMS)
│       └── auth.js             # API đăng nhập và đổi mật khẩu quản trị
├── .env                        # Cấu hình môi trường nội bộ
├── .env.example                # Tệp mẫu cấu hình
├── package.json                # Cấu hình gói và dependencies
└── README.md                   # Tài liệu hướng dẫn sử dụng và triển khai
```

---

## 📝 HƯỚNG DẪN THAY THẾ DỮ LIỆU MẪU SANG DỮ LIỆU THẬT

Dự án được thiết kế có sẵn dữ liệu mẫu bằng tiếng Việt và đánh dấu rõ ràng các trường thông tin:
- `[Tên diễn giả]`: Bạn có thể đổi trong **CRM -> Quản lý Diễn giả & CMS** hoặc trong `public/index.html`.
- `[Lĩnh vực đào tạo]`: Ví dụ: *Đào tạo Lãnh đạo, Thuyết trình trước công chúng, Kỹ năng Đàm phán*.
- `[Tiểu sử]` & `[Phương pháp đào tạo]`: Chỉnh sửa trực tiếp tại giao diện CMS mà không cần sửa code.
- `[Ảnh diễn giả]`: Bạn chỉ cần copy ảnh chân dung mới của diễn giả vào thư mục `public/images/speaker-hero.jpg` hoặc cập nhật đường dẫn ảnh trong tab CMS.
- `[Khóa học, Học phí, Lịch khai giảng]`: Thêm mới, cập nhật giá ưu đãi, thời gian khai giảng bất kỳ lúc nào trong tab **Quản lý Khóa học**.

---

## 🌐 HƯỚNG DẪN TRIỂN KHAI LÊN MÔI TRƯỜNG THỰC TẾ (PRODUCTION)

1. **Triển khai trên VPS (Ubuntu/Debian) với PM2 và Nginx:**
   ```bash
   # Cài đặt PM2
   npm install -g pm2
   
   # Khởi chạy ứng dụng chạy ngầm
   pm2 start server/app.js --name "speaker-crm"
   
   # Tự động khởi động cùng hệ điều hành
   pm2 startup
   pm2 save
   ```

2. **Triển khai trên Render.com hoặc Railway.app:**
   - Kết nối GitHub Repository.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Đặt biến môi trường (Environment Variables): `PORT=3000`, `JWT_SECRET=chuoi_khoa_bao_mat_cua_ban`, `ADMIN_DEFAULT_PASSWORD=MatKhauKhoDoan123!`
