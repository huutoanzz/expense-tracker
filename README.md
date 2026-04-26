# Smart Expense Tracker

## 📖 Giới thiệu
**Smart Expense Tracker** là một ứng dụng quản lý tài chính cá nhân hiện đại, giúp bạn theo dõi thu nhập và chi tiêu một cách trực quan và hiệu quả. Với giao diện **Dark Mode + Blue Mode** sang trọng, hiệu ứng chuyển động mượt mà và các biểu đồ phân tích chuyên sâu, ứng dụng mang đến trải nghiệm người dùng cao cấp.

## ✨ Tính năng nổi bật
- 📊 **Dashboard Trực Quan**: Tổng quan số dư, tổng thu, tổng chi và tỷ lệ phần trăm tiết kiệm/sức khỏe ngân sách qua các thẻ trực quan.
- 🏺 **Quản Lý "Hũ Chi Tiêu" (Jar System)**: Quản lý ngân sách thông minh thông qua việc phân bổ tiền vào các quỹ/hũ khác nhau, chuyển tiền nội bộ và tự động hóa.
- 🤖 **Trợ Lý Thông Minh (AI Insight)**: Phân tích thói quen chi tiêu và đưa ra gợi ý/cảnh báo giúp tối ưu hóa ngân sách.
- 📈 **Biểu Đồ Phân Tích Chuyên Sâu**: Cơ cấu chi tiêu theo danh mục (Pie Chart / Donut Chart) và so sánh thu/chi qua các tháng (Bar Chart) bằng **ECharts**.
- 📝 **Quản Lý Giao Dịch Nâng Cao**: Theo dõi các loại giao dịch (Thu nhập, Chi tiêu, Chuyển nội bộ, Điều chỉnh). Lọc, tìm kiếm, xóa hàng loạt với cơ chế an toàn cảnh báo bảo toàn quỹ.
- 🎨 **Cá Nhân Hóa Giao Diện (Theming)**: Hỗ trợ 3 phong cách màu sắc: Sáng (White), Xanh (Blue) và Tối (Black).
- 📱 **Thiết Kế Tương Thích (Responsive)**: Trải nghiệm hoàn hảo trên Desktop (Sidebar) và Mobile (Bottom Navigation, vuốt chạm thông minh).
- 💾 **Lưu Trữ Cục Bộ (Local Storage)**: Dữ liệu an toàn, riêng tư tuyệt đối ngay trên trình duyệt mà không cần đăng nhập.
- ⚙️ **Quản Lý Dữ Liệu**: Khả năng đặt lại (reset), xóa toàn bộ giao dịch và cài đặt từ trang Profile nhanh chóng.

## 🚀 Công nghệ sử dụng
Dự án được xây dựng trên những công nghệ mới nhất:
- **Framework**: [Vue 3 (Composition API)](https://vuejs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **UI Architecture**: [Element Plus](https://element-plus.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts**: [Apache ECharts](https://echarts.apache.org/) & [Vue-ECharts](https://github.com/ecomfe/vue-echarts)
- **Animations**: [Animate.css](https://animate.style/) & [FormKit Auto-animate](https://auto-animate.formkit.com/)

## 🛠️ Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Package Manager**: npm hoặc yarn

### Các bước thực hiện

1. **Clone dự án:**
   ```bash
   git clone <[repository-url](https://github.com/huutoanzz/expense-tracker)>
   cd expense-tracker
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Chạy ở chế độ Development (Local):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

4. **Build cho Production:**
   ```bash
   npm run build
   ```

## 📂 Cấu trúc thư mục chính
```text
src/
├── assets/          # Hình ảnh, icon và font
├── components/      # Các component UI (Dashboard, Chart, Form, Table)
├── stores/          # Quản lý trạng thái với Pinia (expenseStore.js)
├── App.vue          # Component gốc của ứng dụng
└── main.js          # Điểm khởi đầu của dự án (khởi tạo Vue, Store, UI Lib)
```



