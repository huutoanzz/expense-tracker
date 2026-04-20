<template>
  <div class="app-layout">
    <!-- ── Sidebar ───────────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-logo">
        <el-icon :size="28" class="logo-icon"><Wallet /></el-icon>
        <span v-if="!sidebarCollapsed" class="logo-text">SmartExpense</span>
      </div>

      <nav class="sidebar-nav">
        <a
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeTab === item.key }"
          @click="activeTab = item.key"
        >
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          <el-badge
            v-if="item.badge && !sidebarCollapsed"
            :value="item.badge"
            class="nav-badge"
          />
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-actions">
          <el-button class="footer-icon-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon :size="18">
              <component :is="sidebarCollapsed ? 'ArrowRight' : 'ArrowLeft'" />
            </el-icon>
          </el-button>
          <el-button class="footer-icon-btn" @click="settingsVisible = true">
            <el-icon :size="18"><Setting /></el-icon>
          </el-button>
        </div>
      </div>
    </aside>

    <!-- ── Main Content ──────────────────────────────── -->
    <main class="main-content">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon :size="22"><Menu /></el-icon>
          </button>
          <div class="page-info">
            <h1 class="page-title">{{ currentPage.title }}</h1>
            <p class="page-subtitle">{{ currentPage.subtitle }}</p>
          </div>
        </div>
        <div class="topbar-right">
          <span class="current-date">{{ formattedDate }}</span>
          <ExpenseForm />
        </div>
      </header>

      <!-- ── Dashboard Tab ──────────────────────────── -->
      <section v-if="activeTab === 'dashboard'" class="tab-section animate__animated animate__fadeIn">
        <ExpenseSummary />
        <ExpenseChart />
      </section>

      <!-- ── Jars Tab ─────────────────────────────── -->
      <section v-if="activeTab === 'jars'" class="tab-section animate__animated animate__fadeIn">
        <JarDashboard />
      </section>

      <!-- ── Profile Tab ────────────────────────────── -->
      <section v-if="activeTab === 'profile'" class="tab-section animate__animated animate__fadeIn">
        <UserProfile />
      </section>

      <!-- ── Transactions Tab ───────────────────────── -->
      <section v-if="activeTab === 'transactions'" class="tab-section animate__animated animate__fadeIn">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <el-input
            v-model="search"
            placeholder="Tìm kiếm giao dịch..."
            clearable
            size="large"
            class="search-input"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select
            v-model="filterType"
            placeholder="Lọc theo loại"
            clearable
            size="large"
            style="width: 180px"
          >
            <el-option label="Tất cả" value="" />
            <el-option label="Thu nhập" value="income" />
            <el-option label="Chi tiêu" value="expense" />
          </el-select>

          <el-select
            v-model="filterCategory"
            placeholder="Danh mục"
            clearable
            size="large"
            style="width: 180px"
          >
            <el-option label="Tất cả" value="" />
            <el-option
              v-for="cat in CATEGORIES"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div v-auto-animate>
            <el-table
              v-loading="tableLoading"
              element-loading-text="Đang xử lý..."
              element-loading-background="rgba(0, 0, 0, 0.5)"
              :data="filteredTransactions"
              style="width: 100%"
              empty-text="Không có giao dịch nào"
              row-key="id"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" align="center" />

              <el-table-column label="Danh Mục" width="150" align="center">
                <template #default="{ row }">
                  <div
                    class="cat-icon-wrap"
                    :style="{ background: getCatColor(row.category) + '22', color: getCatColor(row.category) }"
                  >
                    <el-icon :size="16"><component :is="getCatIcon(row.category)" /></el-icon>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="Mô Tả" prop="description" min-width="180">
                <template #default="{ row }">
                  <div class="tx-description">
                    <span class="tx-name">{{ row.description }}</span>
                    <span class="tx-cat-label">{{ getCatLabel(row.category) }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="Loại" width="140" align="center">
                <template #default="{ row }">
                  <el-tag
                    v-if="row.type === 'income'"
                    type="success"
                    size="small"
                    round
                  >
                    ↑ Thu nhập
                  </el-tag>
                  <el-tag
                    v-else-if="row.type === 'expense'"
                    type="danger"
                    size="small"
                    round
                  >
                    ↓ Chi tiêu
                  </el-tag>
                  <el-tag
                    v-else-if="row.type === 'internal'"
                    type="info"
                    size="small"
                    round
                  >
                    ⇅ Chuyển nội bộ
                  </el-tag>
                  <el-tag
                    v-else-if="row.type === 'adjustment'"
                    type="warning"
                    size="small"
                    round
                  >
                    ⚖ Điều chỉnh
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="Số Tiền" width="180" align="right">
                <template #default="{ row }">
                  <span
                    class="tx-amount"
                    :class="{
                      'income-amount': row.type === 'income',
                      'expense-amount': row.type === 'expense',
                      'internal-amount': row.type === 'internal',
                      'adjustment-amount': row.type === 'adjustment'
                    }"
                  >
                    {{ (row.type === 'income' || (row.type === 'internal' && row.targetType === 'JAR')) ? '+' : '-' }}{{ formatVND(row.amount) }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="Ngày" width="130" align="center">
                <template #default="{ row }">
                  <span class="tx-date">{{ formatDate(row.date) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="" width="70" align="center">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    plain
                    :disabled="tableLoading"
                    @click="confirmDelete(row)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Pagination & Bulk Actions info -->
          <div class="table-footer">
            <div class="footer-left">
              <el-button
                v-if="selectedRows.length > 0"
                type="danger"
                size="small"
                plain
                :disabled="tableLoading"
                @click="confirmDeleteMultiple"
              >
                <el-icon class="mr-1"><Delete /></el-icon>
                Xóa {{ selectedRows.length }} mục đã chọn
              </el-button>
            </div>
            <span class="table-count">
              Hiển thị <b>{{ filteredTransactions.length }}</b> / {{ store.transactions.length }} giao dịch
            </span>
          </div>
        </div>
      </section>
    </main>

    <!-- ── Settings Dialog ───────────────────────────── -->
    <el-dialog
      v-model="settingsVisible"
      title="Cài Đặt Hệ Thống"
      width="440px"
      center
      destroy-on-close
      class="settings-dialog"
    >
      <div class="settings-content">
        <!-- Interface Section -->
        <div class="settings-section mb-6">
          <h3 class="section-title">Giao Diện</h3>
          <p class="section-desc">Chọn phong cách màu sắc phù hợp với bạn.</p>
          
          <div class="theme-options">
            <div
              v-for="t in [
                { key: 'white', label: 'Sáng', icon: 'Sunny' },
                { key: 'blue', label: 'Xanh', icon: 'Cloudy' },
                { key: 'black', label: 'Tối', icon: 'Moon' }
              ]"
              :key="t.key"
              class="theme-option"
              :class="[t.key, { active: store.theme === t.key }]"
              @click="store.setTheme(t.key)"
            >
              <div class="theme-preview">
                <el-icon><component :is="t.icon" /></el-icon>
              </div>
              <span class="theme-label">{{ t.label }}</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3 class="section-title">Quản Lý Dữ Liệu</h3>
          <p class="section-desc">Các thao tác này sẽ ảnh hưởng trực tiếp đến dữ liệu của bạn.</p>
          
          <div class="settings-actions">
            <el-button
              type="danger"
              plain
              class="action-btn mb-3"
              @click="handleClearData"
            >
              <el-icon><Delete /></el-icon>
              Xóa Tất Cả Giao Dịch
            </el-button>
            
            <el-button
              type="danger"
              class="action-btn"
              @click="handleResetDefault"
            >
              <el-icon><RefreshLeft /></el-icon>
              Đặt Lại Mặc Định
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { useExpenseStore, CATEGORIES } from './stores/expenseStore'
import ExpenseSummary from './components/ExpenseSummary.vue'
import ExpenseChart from './components/ExpenseChart.vue'
import ExpenseForm from './components/ExpenseForm.vue'
import UserProfile from './components/UserProfile.vue'
import JarDashboard from './components/JarDashboard.vue'

const store = useExpenseStore()
const tableLoading = ref(false)
const selectedRows = ref([])
const settingsVisible = ref(false)

// ── Theme Management ──────────────────────────────────────
watch(() => store.theme, (newTheme) => {
  document.body.className = `theme-${newTheme}`
}, { immediate: true })

onMounted(() => {
  document.body.className = `theme-${store.theme}`
})

function handleSelectionChange(val) {
  selectedRows.value = val
}

// ── Sidebar ───────────────────────────────────────────────
const sidebarCollapsed = ref(false)
const activeTab = ref('dashboard')

const navItems = computed(() => [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'DataBoard',
  },
  {
    key: 'jars',
    label: 'Hũ Chi Tiêu',
    icon: 'GoldMedal',
  },
  {
    key: 'transactions',
    label: 'Giao Dịch',
    icon: 'List',
    badge: store.transactions.length,
  },
  {
    key: 'profile',
    label: 'Cá Nhân',
    icon: 'User',
  },
])

const pageMap = {
  dashboard: { title: 'Dashboard', subtitle: 'Tổng quan tài chính của bạn' },
  jars: { title: 'Hũ Chi Tiêu', subtitle: 'Quản lý ngân sách thông minh' },
  transactions: { title: 'Giao Dịch', subtitle: 'Quản lý thu chi chi tiết' },
  profile: { title: 'Thông Tin Cá Nhân', subtitle: 'Quản lý tài khoản của bạn' },
}
const currentPage = computed(() => pageMap[activeTab.value])

// ── Date ──────────────────────────────────────────────────
const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
})

// ── Filters ───────────────────────────────────────────────
const search = ref('')
const filterType = ref('')
const filterCategory = ref('')

const filteredTransactions = computed(() => {
  return store.transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.value.toLowerCase())
    const matchType = filterType.value ? t.type === filterType.value : true
    const matchCat = filterCategory.value ? t.category === filterCategory.value : true
    return matchSearch && matchType && matchCat
  })
})

// ── Category helpers ─────────────────────────────────────
function getCatInfo(categoryValue) {
  return CATEGORIES.find(c => c.value === categoryValue) ?? CATEGORIES[CATEGORIES.length - 1]
}
const getCatIcon = (v) => getCatInfo(v).icon
const getCatColor = (v) => getCatInfo(v).color
const getCatLabel = (v) => getCatInfo(v).label

// ── Formatters ────────────────────────────────────────────
const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatDate = (dateStr) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))

// ── Table row class ───────────────────────────────────────
const rowClass = ({ row }) => (row.type === 'income' ? 'income-row' : 'expense-row')

// ── Delete ────────────────────────────────────────────────
async function confirmDelete(row) {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa giao dịch "<b>${row.description}</b>"?`,
      'Xác Nhận Xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    )
    
    tableLoading.value = true
    await store.deleteTransaction(row.id)        // ← đã hỗ trợ single
    tableLoading.value = false
    
    ElMessage({ type: 'success', message: 'Đã xóa giao dịch thành công!', duration: 2000 })
  } catch {
    tableLoading.value = false
  }
}

async function confirmDeleteMultiple() {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa <b>${selectedRows.value.length}</b> giao dịch đã chọn?`,
      'Xác Nhận Xóa Hàng Loạt',
      {
        confirmButtonText: 'Xóa Tất Cả',
        cancelButtonText: 'Hủy',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    )
    
    tableLoading.value = true
    const ids = selectedRows.value.map(r => r.id)
    
    await store.deleteTransaction(ids)           // ← quan trọng: dùng cùng hàm deleteTransaction
    
    tableLoading.value = false
    selectedRows.value = [] // clear selection
    
    ElMessage({ 
      type: 'success', 
      message: `Đã xóa ${ids.length} giao dịch thành công!`, 
      duration: 2000 
    })
  } catch {
    tableLoading.value = false
  }
}

// ── Settings Actions ──────────────────────────────────────
async function handleClearData() {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc muốn <b>xóa sạch tất cả giao dịch</b>? Thao tác này không thể hoàn tác.',
      'Cảnh Báo',
      {
        confirmButtonText: 'Xác Nhận Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    )
    
    store.clearAllData()
    settingsVisible.value = false
    ElMessage({ type: 'success', message: 'Đã xóa toàn bộ dữ liệu giao dịch!' })
  } catch {
    // cancelled
  }
}

async function handleResetDefault() {
  try {
    await ElMessageBox.confirm(
      'Hệ thống sẽ <b>xóa toàn bộ dữ liệu</b> (bao gồm cả Profile) và quay về trạng thái ban đầu. Bạn có chắc chắn?',
      'Xác Nhận Reset',
      {
        confirmButtonText: 'Reset Ngay',
        cancelButtonText: 'Hủy',
        type: 'error',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    )
    
    store.resetToDefault()
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-main);
}

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 68px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid var(--card-border);
  overflow: hidden;
  white-space: nowrap;
}
.logo-icon {
  color: #6366f1;
  flex-shrink: 0;
}
.logo-text {
  font-size: 17px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 10px;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
}
.nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.nav-item.active {
  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.12));
  color: #6366f1;
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: #6366f1;
  border-radius: 0 3px 3px 0;
}

.nav-label { flex: 1; }
.nav-badge { flex-shrink: 0; }

.sidebar-footer {
  padding: 14px 10px;
  border-top: 1px solid var(--card-border);
  display: flex;
  justify-content: center;
  gap: 8px;
}
.sidebar.collapsed .sidebar-footer {
  padding: 16px 0;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;
}
.sidebar.collapsed .footer-actions {
  flex-direction: column;
  align-items: center;
}

.footer-icon-btn {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: 10px;
  width: 36px !important;
  height: 36px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  padding: 0 !important;
  margin: 0 !important;
}
.footer-icon-btn:hover {
  background: rgba(99,102,241,0.1) !important;
  color: #6366f1 !important;
  border-color: #6366f1 !important;
}

/* ── Settings Dialog ─────────────────────────────────────── */
.settings-content {
  padding: 10px 0;
}
.settings-section {
  text-align: center;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-primary);
}
.section-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
.settings-actions {
  display: flex;
  flex-direction: column;
}
.w-full { width: 100%; }
.mb-3 { margin-bottom: 12px; }

:deep(.settings-dialog) {
  border-radius: 18px;
  background: var(--sidebar-bg) !important;
}
:deep(.settings-dialog .el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 16px;
}
:deep(.settings-dialog .el-dialog__title) {
  color: var(--text-primary) !important;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
}
:deep(.settings-dialog .el-dialog__body) {
  padding: 30px 25px;
}
:deep(.settings-dialog .el-button) {
  height: 44px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-left: 0 !important;
  width: 100%;
}
:deep(.settings-dialog .el-icon) {
  font-size: 18px;
}

/* ── Main Content ────────────────────────────────────────── */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* ── Topbar ──────────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--card-border);
  position: sticky;
  top: 0;
  z-index: 10;
  gap: 16px;
  flex-wrap: wrap;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 6px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.page-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.current-date {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ── Tab Sections ────────────────────────────────────────── */
.tab-section {
  padding: 28px;
  flex: 1;
}

/* ── Filter Bar ──────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 200px;
}

/* ── Table Card ──────────────────────────────────────────── */
.table-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  overflow: hidden;
}

.table-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-left {
  display: flex;
  align-items: center;
  padding-left: 2px; /* Align with selection checkbox */
}
.table-count {
  font-size: 13px;
  color: var(--text-secondary);
}


/* ── Table cell elements ─────────────────────────────────── */
.cat-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.tx-description {
  display: flex;
  flex-direction: column;
}
.tx-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}
.tx-cat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.tx-amount {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.3px;
}
.income-amount { color: #10b981; }
.expense-amount { color: #ef4444; }
.internal-amount { color: #6366f1; }
.adjustment-amount { color: #f59e0b; }

.tx-date {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    height: 100vh;
    transform: translateX(0);
  }
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 240px;
  }
  .mobile-menu-btn {
    display: flex;
  }
  .tab-section {
    padding: 16px;
  }
  .topbar {
    padding: 14px 16px;
  }
  .current-date {
    display: none;
  }
}
</style>