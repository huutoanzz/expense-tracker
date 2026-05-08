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

## ✨ Tính năng nổi bật

### 📊 Dashboard Tổng Quan
- Thẻ số liệu nhanh: số dư, tổng thu, tổng chi, tỷ lệ tiết kiệm
- Biểu đồ cơ cấu chi tiêu (Donut Chart) và so sánh thu/chi theo tháng (Bar Chart)
- Trợ lý AI phân tích thói quen & đưa ra gợi ý tối ưu ngân sách

### 💰 Theo Dõi Ngân Sách (Budget)
- Hỗ trợ các quy tắc phân bổ phổ biến: **50/30/20**, **60/20/20**, **50/25/25**, **40/15/45**
- Tuỳ chỉnh tỷ lệ linh hoạt với thanh trượt interactive, tự cân bằng tổng 100%
- Phân tích 3 nhóm chi tiêu: **Thiết yếu / Cá nhân / Tiết kiệm**
- Lọc theo **tháng / tháng trước / quý / năm**
- Thanh tiến độ với mốc mục tiêu động, chỉ báo trạng thái (Rất tốt / Ổn định / Vượt ngân sách)
- **Budget Projection**: nhập tổng thu giả định để mô phỏng phân bổ tức thì
- Lưu preset đang chọn & tỷ lệ tuỳ chỉnh vào `localStorage`

### 🏺 Hệ Thống Hũ Chi Tiêu (Jar System)
- Tạo / chỉnh sửa / giải thể hũ với icon và màu sắc tùy chỉnh
- Nạp / rút tiền nội bộ giữa ví chính và hũ
- Thanh tiến độ với các mốc milestone (50% / 80% / 100%)
- **Tự động phân bổ thu nhập** vào các hũ theo tỷ lệ cấu hình sẵn

### 📝 Quản Lý Giao Dịch
- 4 loại giao dịch: Thu nhập / Chi tiêu / Chuyển nội bộ / Điều chỉnh
- Lọc theo loại, danh mục; tìm kiếm theo mô tả
- Xóa đơn lẻ hoặc **xóa hàng loạt** với checkbox
- **Bảo vệ toàn vẹn dữ liệu**: chặn xóa nếu số dư hũ sẽ âm sau khi hoàn tác

### 🎨 Cá Nhân Hóa
- 3 chủ đề giao diện: **Sáng (White) / Xanh (Blue) / Tối (Black)**
- Responsive hoàn hảo: Sidebar Desktop ↔ Bottom Navigation Mobile
- Vuốt cạnh màn hình để mở sidebar trên mobile
- Quản lý profile cá nhân & đặt lại dữ liệu từ trang Settings

### 💾 Lưu Trữ
- Toàn bộ dữ liệu lưu cục bộ qua `localStorage` — không cần đăng nhập, không cần server

---

## 🚀 Công nghệ sử dụng

| Layer | Công nghệ |
|---|---|
| **Framework** | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| **Build Tool** | [Vite 7](https://vitejs.dev/) |
| **Routing** | [Vue Router 4](https://router.vuejs.org/) (Hash History) |
| **State Management** | [Pinia 3](https://pinia.vuejs.org/) |
| **UI Components** | [Element Plus 2](https://element-plus.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Vanilla CSS |
| **Charts** | [Apache ECharts 6](https://echarts.apache.org/) + [Vue-ECharts](https://github.com/ecomfe/vue-echarts) |
| **Animations** | [Animate.css](https://animate.style/) + [FormKit Auto-animate](https://auto-animate.formkit.com/) |

---

## 🛠️ Cài đặt và Chạy

### Yêu cầu
- **Node.js** ≥ 18.x
- **npm** hoặc **yarn**

### Các bước

```bash
# 1. Clone dự án
git clone https://github.com/huutoanzz/expense-tracker
cd expense-tracker

# 2. Cài đặt dependencies
npm install

# 3. Chạy development server
npm run dev
# → http://localhost:5173

# 4. Build production
npm run build
```

---

## 📂 Cấu trúc thư mục

```text
src/
├── assets/              # Hình ảnh, icon, font
├── components/
│   ├── AllocationDialog.vue   # Dialog cấu hình tự động phân bổ thu nhập
│   ├── BudgetDashboard.vue    # Tab Theo Dõi Ngân Sách (50/30/20 + custom)
│   ├── DashboardView.vue      # Tab Dashboard tổng quan
│   ├── ExpenseChart.vue       # Biểu đồ ECharts (Donut + Bar)
│   ├── ExpenseForm.vue        # Form thêm giao dịch
│   ├── JarCard.vue            # Card hiển thị một hũ
│   ├── JarDashboard.vue       # Tab Hũ Chi Tiêu
│   ├── JarRefillModal.vue     # Modal nạp/rút tiền hũ
│   ├── TransactionList.vue    # Tab Giao Dịch (table + mobile cards)
│   └── UserProfile.vue        # Tab Cá Nhân / Settings
├── composables/         # Reusable composition functions
├── router/
│   └── index.js         # Cấu hình Vue Router (5 routes)
├── stores/
│   └── expenseStore.js  # Pinia store (transactions, jars, wallet, theme)
├── utils/               # Helpers & formatters
├── App.vue              # Root component (Sidebar + Topbar + Router View)
├── main.js              # Entry point
└── style.css            # CSS variables & global styles (themes)
```

---

## 🗺️ Các trang (Routes)

| Route | Component | Mô tả |
|---|---|---|
| `/dashboard` | `DashboardView` | Tổng quan tài chính |
| `/budget` | `BudgetDashboard` | Phân tích ngân sách 50/30/20 |
| `/jars` | `JarDashboard` | Quản lý hũ chi tiêu |
| `/transactions` | `TransactionList` | Danh sách giao dịch |
| `/profile` | `UserProfile` | Hồ sơ & cài đặt |

---

## 📱 Responsive Design

| Màn hình | Layout |
|---|---|
| Desktop (>768px) | Sidebar cố định + Main content |
| Mobile (≤768px) | Bottom Navigation bar (5 tabs) + Sidebar drawer |

---

## 📄 License

MIT © [huutoanzz](https://github.com/huutoanzz)
