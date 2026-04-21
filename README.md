# Smart Expense Tracker

## 📖 Giới thiệu
**Smart Expense Tracker** là một ứng dụng quản lý tài chính cá nhân hiện đại, giúp bạn theo dõi thu nhập và chi tiêu một cách trực quan và hiệu quả. Với giao diện **Dark Mode + Blue Mode** sang trọng, hiệu ứng chuyển động mượt mà và các biểu đồ phân tích chuyên sâu, ứng dụng mang đến trải nghiệm người dùng cao cấp.

## ✨ Tính năng nổi bật
- 📊 **Dashboard Trực Quan**: Tổng quan số dư, tổng thu và tổng chi thông qua các thẻ gradient đẹp mắt.
- 📈 **Biểu Đồ Phân Tích**: Sử dụng **ECharts** để hiển thị cơ cấu chi tiêu (Pie Chart) và xu hướng tài chính (Line Chart).
- 📝 **Quản Lý Giao Dịch**: Thêm, sửa, xóa và lọc các giao dịch dễ dàng với bảng dữ liệu tương tác từ **Element Plus**.
- 🛠️ **Bộ Lọc Thông Minh**: Tìm kiếm giao dịch theo tên, loại (Thu/Chi) hoặc danh mục.
- 💾 **Lưu Trữ Cục Bộ**: Dữ liệu được lưu tự động vào `localStorage`, đảm bảo không bị mất khi tải lại trang.
- 🎨 **Giao Diện Hiện Đại**: Thiết kế theo phong cách Glassmorphism, hỗ trợ Responsive hoàn hảo trên mọi thiết bị.
- 🪄 **Hiệu Ứng Mượt Mà**: Tích hợp `Animate.css` và `Auto-animate` cho các tương tác người dùng.

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



