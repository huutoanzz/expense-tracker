# Smart Expense Tracker

<div align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-42b883?style=for-the-badge&logo=vue.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.x-646cff?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Pinia-3.x-ffd859?style=for-the-badge&logo=pinia&logoColor=black" />
  <img src="https://img.shields.io/badge/Element_Plus-2.x-409eff?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</div>

---

## 📖 Giới thiệu

**Smart Expense Tracker** là ứng dụng quản lý tài chính cá nhân hiện đại được xây dựng bằng **Vue 3 + Vite**. Với giao diện **Dark/Blue/White Mode** sang trọng, hiệu ứng chuyển động mượt mà, biểu đồ phân tích sâu và hệ thống phân bổ ngân sách thông minh, ứng dụng mang lại trải nghiệm quản lý tài chính cao cấp ngay trên trình duyệt.

---

# ✨ Tính năng nổi bật

## 📊 Dashboard Tổng Quan

<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" />
</div>

- Thẻ số liệu nhanh: số dư, tổng thu, tổng chi, tỷ lệ tiết kiệm
- Biểu đồ cơ cấu chi tiêu (Donut Chart) và so sánh thu/chi theo tháng (Bar Chart)
- Trợ lý AI phân tích thói quen & đưa ra gợi ý tối ưu ngân sách

---

## 💰 Theo Dõi Ngân Sách (Budget)

<div align="center">
  <img src="docs/screenshots/budget.png" alt="Budget" />
</div>

- Hỗ trợ các quy tắc phân bổ phổ biến: **50/30/20**, **60/20/20**, **50/25/25**, **40/15/45**
- Tuỳ chỉnh tỷ lệ linh hoạt với thanh trượt interactive, tự cân bằng tổng 100%
- Phân tích 3 nhóm chi tiêu: **Thiết yếu / Cá nhân / Tiết kiệm**
- Lọc theo **tháng / tháng trước / quý / năm**
- Thanh tiến độ với mốc mục tiêu động
- **Budget Projection** mô phỏng phân bổ tức thì
- Lưu preset & custom ratio vào `localStorage`

---

## 🏺 Hệ Thống Hũ Chi Tiêu (Jar System)

<div align="center">
  <img src="docs/screenshots/jars.png" alt="Jar System" />
</div>

- Tạo / chỉnh sửa / giải thể hũ với icon và màu sắc tùy chỉnh
- Nạp / rút tiền nội bộ giữa ví chính và hũ
- Milestone progress (50% / 80% / 100%)
- Tự động phân bổ thu nhập theo tỷ lệ cấu hình

---

## 📝 Quản Lý Giao Dịch

<div align="center">
  <img src="docs/screenshots/transactions.png" alt="Transactions" />
</div>

- 4 loại giao dịch: Thu nhập / Chi tiêu / Chuyển nội bộ / Điều chỉnh
- Lọc theo loại, danh mục; tìm kiếm theo mô tả
- Xóa hàng loạt với checkbox
- Chặn xóa gây âm số dư hũ

---

## 📱 Mobile Experience

<div align="center">
  <img 
    src="docs/screenshots/mobile_demo.webp"
    alt="Mobile Demo"
    width="700"
  />
</div>

- Bottom Navigation tối ưu cho mobile
- Vuốt cạnh màn hình để mở sidebar
- Animation & transition mượt mà
- Responsive cho cả tablet và điện thoại

---

## 🎨 Cá Nhân Hóa

- 3 chủ đề giao diện:
  - 🌞 White Mode
  - 🌌 Blue Mode
  - 🌑 Dark Mode

- Quản lý profile cá nhân
- Reset toàn bộ dữ liệu từ Settings

---

## 💾 Lưu Trữ

- Toàn bộ dữ liệu lưu bằng `localStorage`
- Không cần đăng nhập
- Không cần backend/server

---
