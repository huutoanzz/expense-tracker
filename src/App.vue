<template>
  <div class="app-layout" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- ── Mobile overlay backdrop ──────────────────── -->
    <div
      class="mobile-overlay"
      :class="{ visible: mobileNavOpen }"
      @click="mobileNavOpen = false"
    />

    <!-- ── Sidebar ───────────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileNavOpen }">
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
          <button class="mobile-menu-btn" @click="mobileNavOpen = !mobileNavOpen">
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
        <DashboardView />
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
        <!-- ✅ CẢNH BÁO THEME-FRIENDLY (KHÔNG CAM) -->
        <div class="delete-warning-card mb-4">
          <div class="warning-header">
            <el-icon class="warning-icon"><Warning /></el-icon>
            <span class="warning-title">Lưu ý khi xóa giao dịch</span>
          </div>
          <p class="warning-text">
            Xóa giao dịch có thể làm sai lệch dòng tiền, 
            <strong>đặc biệt với giao dịch phức tạp (hũ, phân chia tự động)</strong>.<br>
            <em>Chỉ dùng để chỉnh sửa đơn giản, không xóa tùy tiện hoặc sai trình tự</em>
          </p>
        </div>
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

        <!-- ── Desktop: Table ───────────────────────────────── -->
        <div class="table-card desktop-only">
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
                  <el-tag v-if="row.type === 'income'" type="success" size="small" round>↑ Thu nhập</el-tag>
                  <el-tag v-else-if="row.type === 'expense'" type="danger" size="small" round>↓ Chi tiêu</el-tag>
                  <el-tag v-else-if="row.type === 'internal'" type="info" size="small" round>⇅ Chuyển nội bộ</el-tag>
                  <el-tag v-else-if="row.type === 'adjustment'" type="warning" size="small" round>⚖ Điều chỉnh</el-tag>
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

        <!-- ── Mobile: Card List ─────────────────────────────── -->
        <div class="mobile-only">
          <!-- Summary strip -->
          <div class="mobile-tx-summary">
            <div class="mts-item">
              <span class="mts-label">Tổng</span>
              <span class="mts-value">{{ filteredTransactions.length }} giao dịch</span>
            </div>
            <div class="mts-divider" />
            <div class="mts-item">
              <span class="mts-label">Thu</span>
              <span class="mts-value mts-income">+{{ formatVND(filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)) }}</span>
            </div>
            <div class="mts-divider" />
            <div class="mts-item">
              <span class="mts-label">Chi</span>
              <span class="mts-value mts-expense">-{{ formatVND(filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)) }}</span>
            </div>
          </div>

          <!-- Card list -->
          <div class="mobile-tx-list" v-auto-animate>
            <div
              v-for="row in filteredTransactions"
              :key="row.id"
              class="mobile-tx-card"
            >
              <!-- Icon -->
              <div
                class="mobile-tx-icon"
                :style="{ background: getCatColor(row.category) + '22', color: getCatColor(row.category) }"
              >
                <el-icon :size="18"><component :is="getCatIcon(row.category)" /></el-icon>
              </div>

              <!-- Info -->
              <div class="mobile-tx-info">
                <p class="mobile-tx-name">{{ row.description }}</p>
                <div class="mobile-tx-meta">
                  <span
                    class="mobile-tx-type-chip"
                    :class="{
                      'chip-income': row.type === 'income',
                      'chip-expense': row.type === 'expense',
                      'chip-internal': row.type === 'internal',
                      'chip-adjustment': row.type === 'adjustment',
                    }"
                  >
                    <span v-if="row.type === 'income'">↑ Thu</span>
                    <span v-else-if="row.type === 'expense'">↓ Chi</span>
                    <span v-else-if="row.type === 'internal'">⇅ Nội bộ</span>
                    <span v-else-if="row.type === 'adjustment'">⚖ Điều chỉnh</span>
                  </span>
                  <span class="mobile-tx-cat">{{ getCatLabel(row.category) }}</span>
                  <span class="mobile-tx-dot">·</span>
                  <span class="mobile-tx-date">{{ formatDate(row.date) }}</span>
                </div>
              </div>

              <!-- Right: amount + delete -->
              <div class="mobile-tx-right">
                <span
                  class="mobile-tx-amount"
                  :class="{
                    'income-amount': row.type === 'income',
                    'expense-amount': row.type === 'expense',
                    'internal-amount': row.type === 'internal',
                    'adjustment-amount': row.type === 'adjustment',
                  }"
                >
                  {{ (row.type === 'income' || (row.type === 'internal' && row.targetType === 'JAR')) ? '+' : '-' }}{{ formatVND(row.amount) }}
                </span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  plain
                  :disabled="tableLoading"
                  @click="confirmDelete(row)"
                  class="mobile-tx-delete-btn"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="filteredTransactions.length === 0" class="mobile-tx-empty">
              <span class="mobile-tx-empty-icon">📭</span>
              <p>Không có giao dịch nào</p>
              <p class="mobile-tx-empty-sub">Thử thay đổi bộ lọc hoặc thêm giao dịch mới</p>
            </div>
          </div>

          <div class="mobile-tx-footer">
            Hiển thị <b>{{ filteredTransactions.length }}</b> / {{ store.transactions.length }} giao dịch
          </div>
        </div>
      </section>
    </main>

    <!-- ── Mobile Bottom Navigation ────────────────── -->
    <nav class="mobile-bottom-nav">
      <a
        v-for="item in navItems"
        :key="item.key"
        class="bottom-nav-item"
        :class="{ active: activeTab === item.key }"
        @click="activeTab = item.key; mobileNavOpen = false"
      >
        <div class="bottom-nav-icon-wrap">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <span v-if="item.badge" class="bottom-nav-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
        </div>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </a>
    </nav>

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
              <el-icon><Delete /></el-icon>&nbsp;
              Xóa Tất Cả Giao Dịch
            </el-button>
            
            <el-button
              type="danger"
              class="action-btn"
              @click="handleResetDefault"
            >
              <el-icon><RefreshLeft /></el-icon>&nbsp;
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
import DashboardView from './components/DashboardView.vue'
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
const mobileNavOpen = ref(false)

// ── Swipe gesture to open/close sidebar on mobile ─────────
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  // Only horizontal swipe (more x than y movement)
  if (Math.abs(dx) < Math.abs(dy) * 1.5) return
  if (dx > 60 && touchStartX < 40) mobileNavOpen.value = true   // swipe right from edge
  if (dx < -60 && mobileNavOpen.value) mobileNavOpen.value = false // swipe left to close
}

// Close sidebar when tab changes on mobile
watch(activeTab, () => {
  if (window.innerWidth <= 768) mobileNavOpen.value = false
})

const navItems = computed(() => [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'DataBoard',
  },
  {
    key: 'jars',
    label: 'Hũ Chi Tiêu',
    icon: 'Wallet',
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
  profile: { title: 'Profile', subtitle: 'Quản lý tài khoản của bạn' },
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
  return store.transactions
    .filter(t => {
      const matchSearch = t.description.toLowerCase().includes(search.value.toLowerCase())
      const matchType = filterType.value ? t.type === filterType.value : true
      const matchCat = filterCategory.value ? t.category === filterCategory.value : true
      return matchSearch && matchType && matchCat
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
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
// ── Helper: kiem tra giao dich co lien quan hu da giai the khong ──
// Tra ve ten hu (string) neu giai the, null neu ok
function getDissolvedJarName(row) {
  // Chỉ khoá các giao dịch INTERNAL của hũ đã giải thể.
  // Expense của hũ đã giải thể → vẫn cho phép xóa (hoàn về ví chính).

  // Case 1: internal MAIN->JAR (log nạp tiền) mà hũ không còn → KHOÁ
  if (row.type === 'internal' &&
      row.sourceType === 'MAIN' &&
      row.targetType === 'JAR') {
    const jar = store.jars.find(j => j.id === row.targetId)
    if (!jar) {
      return row.description?.replace('Nạp tiền vào ', '') ?? 'Hũ đã xóa'
    }
  }

  // Case 2: internal JAR->MAIN (log rút/giải thể) mà hũ không còn → KHOÁ
  if (row.type === 'internal' &&
      row.sourceType === 'JAR' &&
      row.targetType === 'MAIN') {
    const jar = store.jars.find(j => j.id === row.sourceId)
    if (!jar) {
      return row.description?.replace('Rút tiền từ ', '').replace('Giải thể hũ ', '').replace(' - Hoàn trả ví', '') ?? 'Hũ đã xóa'
    }
  }

  // Expense (dù hũ còn hay đã giải thể) → CHO PHÉP xóa, hoàn về ví chính
  return null
}

async function confirmDelete(row) {
  // ── Kiem tra giao dich lien quan hu da giai the ──────────────
  const dissolvedJarName = getDissolvedJarName(row)
  if (dissolvedJarName !== null) {
    await ElMessageBox.alert(
      `<div style="line-height:1.8;font-size:14px">
        <p>Giao dịch này liên quan đến hũ <b>"${dissolvedJarName}"</b> đã bị giải thể.</p>
        <p style="margin-top:10px">Ấn xóa giao dịch này có thể <b>gây sai lệch số dư</b> vì tiền đã được hoàn về ví khi giải thể hũ.</p>
        <p style="margin-top:10px;padding:10px 14px;background:rgba(245,158,11,0.1);border-radius:8px;color:#f59e0b">
          ⚠️ Để đảm bảo tính chính xác, vui lòng <b>không xóa</b> các giao dịch thuộc hũ đã giải thể.
        </p>
      </div>`,
      'Hũ đã giải thể — Không thể xóa',
      {
        confirmButtonText: 'Đã hiểu',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        center: false,
      }
    )
    return
  }

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
    await store.deleteTransaction(row.id)
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

/* ── Desktop / Mobile visibility helpers ─────────────────── */
.desktop-only { display: block; }
.mobile-only  { display: none; }

/* ── Mobile Transaction Cards ────────────────────────────── */
.mobile-tx-summary {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 12px;
  gap: 0;
}
.mts-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.mts-divider {
  width: 1px;
  height: 32px;
  background: var(--card-border);
  flex-shrink: 0;
}
.mts-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.mts-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.mts-income  { color: #2D6A4F; }
.mts-expense { color: #ef4444; }

.mobile-tx-list {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 10px;
}

.mobile-tx-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--card-border);
  transition: background 0.15s ease;
}
.mobile-tx-card:last-child { border-bottom: none; }
.mobile-tx-card:active { background: rgba(47,164,168,0.05); }

.mobile-tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-tx-info {
  flex: 1;
  min-width: 0;
}
.mobile-tx-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mobile-tx-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.mobile-tx-type-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.chip-income     { background: rgba(45,106,79,0.12);  color: #2D6A4F; }
.chip-expense    { background: rgba(239,68,68,0.1);   color: #ef4444; }
.chip-internal   { background: rgba(99,102,241,0.1);  color: #6366f1; }
.chip-adjustment { background: rgba(245,158,11,0.12); color: #f59e0b; }

.mobile-tx-cat {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.mobile-tx-dot  { font-size: 11px; color: var(--text-secondary); opacity: 0.4; flex-shrink: 0; }
.mobile-tx-date { font-size: 11px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; }

.mobile-tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.mobile-tx-amount {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.3px;
  white-space: nowrap;
}
.mobile-tx-delete-btn {
  width: 28px !important;
  height: 28px !important;
}

.mobile-tx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
}
.mobile-tx-empty-icon { font-size: 38px; }
.mobile-tx-empty p    { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.mobile-tx-empty-sub  { font-size: 12px !important; }

.mobile-tx-footer {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  padding: 4px 0 2px;
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
/* ── Mobile overlay ──────────────────────────────────────── */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(2px);
  z-index: 99;
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.mobile-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

/* ── Bottom nav (hidden on desktop) ─────────────────────── */
.mobile-bottom-nav { display: none; }

/* ── Mobile breakpoint ───────────────────────────────────── */
@media (max-width: 768px) {
  /* Overlay visible on mobile */
  .mobile-overlay { display: block; }

  /* Sidebar: hidden by default, slides in from left */
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    height: 100vh;
    width: 240px !important;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 24px rgba(0,0,0,0.3);
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  /* Hide collapse button on mobile — sidebar is full-width always */
  .sidebar.collapsed {
    width: 240px !important;
    transform: translateX(-100%);
  }
  .sidebar.collapsed.mobile-open {
    transform: translateX(0);
  }
  /* Always show nav labels on mobile sidebar */
  .sidebar .nav-label { display: block !important; opacity: 1 !important; }
  .sidebar .sidebar-logo .logo-text { display: block !important; opacity: 1 !important; }
  .sidebar-footer .footer-actions { justify-content: flex-end; }
  .footer-icon-btn:first-child { display: none; } /* hide collapse toggle on mobile */

  /* Mobile menu button */
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
  }

  /* Main layout — no sidebar space */
  .main-content {
    padding-bottom: 72px; /* room for bottom nav */
  }

  /* Topbar */
  .topbar {
    padding: 12px 16px;
    gap: 10px;
  }
  .topbar-right {
    gap: 10px;
  }
  .current-date { display: none; }
  .page-title { font-size: 17px; }
  .page-subtitle { display: none; }

  /* Tab sections */
  .tab-section { padding: 14px 12px; }

  /* Filter bar — stack on mobile */
  .filter-bar {
    flex-direction: column !important;
    gap: 10px !important;
  }
  .filter-bar .el-select {
    width: 100% !important;
  }
  .search-input { width: 100% !important; }

  /* Table — hide less important columns */
  .el-table .el-table__cell:nth-child(1) { /* checkbox */
    min-width: 40px;
  }

  /* Show mobile cards, hide desktop table */
  .desktop-only { display: none !important; }
  .mobile-only  { display: block !important; }

  /* Table footer */
  .table-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start !important;
  }

  /* ── Bottom Navigation Bar ── */
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 90;
    background: var(--sidebar-bg);
    border-top: 1px solid var(--card-border);
    height: 64px;
    padding: 0 4px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    backdrop-filter: blur(12px);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    padding: 6px 4px;
    border-radius: 12px;
    margin: 6px 2px;
    transition: all 0.2s ease;
    color: var(--text-secondary);
    text-decoration: none;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }

  .bottom-nav-item.active {
    color: #6366f1;
    background: rgba(99,102,241,0.1);
  }

  .bottom-nav-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bottom-nav-badge {
    position: absolute;
    top: -6px;
    right: -8px;
    background: #ef4444;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 99px;
    min-width: 16px;
    text-align: center;
    line-height: 14px;
  }

  .bottom-nav-label {
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Stat cards — full width on mobile */
  .main-stats {
    flex-direction: column;
  }
  .stat-card {
    min-width: unset !important;
    width: 100%;
  }

  /* Jar grid — single column */
  .jar-grid {
    grid-template-columns: 1fr !important;
  }

  /* Dialog width on mobile */
  :deep(.el-dialog) {
    width: 94vw !important;
    margin: 0 auto !important;
  }

  /* Warning card compact */
  .delete-warning-card {
    padding: 12px 14px;
    margin-bottom: 14px;
  }
  .warning-text { font-size: 12.5px; }
}

/* ── Very small screens ──────────────────────────────────── */
@media (max-width: 380px) {
  .bottom-nav-label { display: none; }
  .bottom-nav-item { justify-content: center; padding: 8px 4px; }
  .topbar { padding: 10px 12px; }
}
</style>