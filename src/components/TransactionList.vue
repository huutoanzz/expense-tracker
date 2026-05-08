<template>
  <div class="transaction-list-view">
    <!-- ✅ CẢNH BÁO THEME-FRIENDLY -->
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

    <!-- ── Desktop: Table ── -->
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

      <!-- Footer -->
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

    <!-- ── Mobile: Card List ── -->
    <div class="mobile-only">
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

      <div class="mobile-tx-list" v-auto-animate>
        <div
          v-for="row in filteredTransactions"
          :key="row.id"
          class="mobile-tx-card"
        >
          <div
            class="mobile-tx-icon"
            :style="{ background: getCatColor(row.category) + '22', color: getCatColor(row.category) }"
          >
            <el-icon :size="18"><component :is="getCatIcon(row.category)" /></el-icon>
          </div>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'

const store = useExpenseStore()
const tableLoading = ref(false)
const selectedRows = ref([])

// ── Filters ──────────────────────────────────────────────
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

function handleSelectionChange(val) {
  selectedRows.value = val
}

// ── Category helpers ─────────────────────────────────────
function getCatInfo(categoryValue) {
  return CATEGORIES.find(c => c.value === categoryValue) ?? CATEGORIES[CATEGORIES.length - 1]
}
const getCatIcon  = (v) => getCatInfo(v).icon
const getCatColor = (v) => getCatInfo(v).color
const getCatLabel = (v) => getCatInfo(v).label

// ── Formatters ────────────────────────────────────────────
const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const formatDate = (dateStr) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))

// ── Delete helpers ────────────────────────────────────────
function getDissolvedJarName(row) {
  if (row.type === 'internal' && row.sourceType === 'MAIN' && row.targetType === 'JAR') {
    const jar = store.jars.find(j => j.id === row.targetId)
    if (!jar) return row.description?.replace('Nạp tiền vào ', '') ?? 'Hũ đã xóa'
  }
  if (row.type === 'internal' && row.sourceType === 'JAR' && row.targetType === 'MAIN') {
    const jar = store.jars.find(j => j.id === row.sourceId)
    if (!jar) return row.description?.replace('Rút tiền từ ', '').replace('Giải thể hũ ', '').replace(' - Hoàn trả ví', '') ?? 'Hũ đã xóa'
  }
  return null
}

async function confirmDelete(row) {
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
        customClass: 'premium-alert-box'
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
  } catch (err) {
    tableLoading.value = false
    if (err && err !== 'cancel' && err !== 'close') {
      const msg = err.message || 'Có lỗi xảy ra khi xóa giao dịch.'
      ElMessageBox.alert(
        `<div style="line-height:1.8;font-size:14px">
          <p>${msg}</p>
          <p style="margin-top:10px">Hành động này bị chặn để tránh việc số dư hũ bị <b>âm</b>, gây sai lệch báo cáo tài chính của bạn.</p>
          <div style="margin-top:15px;padding:12px 16px;background:rgba(245,158,11,0.1);border-radius:10px;color:#f59e0b;display:flex;gap:10px;align-items:flex-start">
            <span style="font-size:18px">⚠️</span>
            <span><b>Lời khuyên:</b> Hãy kiểm tra lại các khoản chi tiêu từ hũ này hoặc nạp thêm tiền vào hũ trước khi xóa giao dịch nạp tiền này.</span>
          </div>
        </div>`,
        'Không thể xóa giao dịch',
        {
          confirmButtonText: 'Đã hiểu',
          type: 'warning',
          dangerouslyUseHTMLString: true,
          center: false,
          customClass: 'premium-alert-box'
        }
      )
    }
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
    await store.deleteTransaction(ids)
    tableLoading.value = false
    selectedRows.value = []
    ElMessage({ type: 'success', message: `Đã xóa ${ids.length} giao dịch thành công!`, duration: 2000 })
  } catch (err) {
    tableLoading.value = false
    if (err && err !== 'cancel' && err !== 'close') {
      const msg = err.message || 'Có lỗi xảy ra khi xóa hàng loạt.'
      ElMessageBox.alert(
        `<div style="line-height:1.8;font-size:14px">
          <p>${msg}</p>
          <p style="margin-top:10px">Một hoặc nhiều giao dịch không thể xóa để đảm bảo tính nhất quán của số dư các hũ.</p>
          <div style="margin-top:15px;padding:12px 16px;background:rgba(245,158,11,0.1);border-radius:10px;color:#f59e0b;display:flex;gap:10px;align-items:flex-start">
            <span style="font-size:18px">⚠️</span>
            <span>Vui lòng kiểm tra lại số dư hũ liên quan trước khi thực hiện xóa hàng loạt các giao dịch nạp tiền/thu nhập.</span>
          </div>
        </div>`,
        'Lỗi xóa hàng loạt',
        {
          confirmButtonText: 'Đã hiểu',
          type: 'error',
          dangerouslyUseHTMLString: true,
          center: false
        }
      )
    }
  }
}
</script>

<style scoped>
.transaction-list-view {
  padding: 0;
}

/* ── Warning Card ── */
.delete-warning-card {
  background: linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02));
  border: 1px solid rgba(245,158,11,0.25);
  border-left: 4px solid #f59e0b;
  border-radius: 14px;
  padding: 14px 18px;
}
.mb-4 { margin-bottom: 16px; }
.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.warning-icon { color: #f59e0b; font-size: 16px; }
.warning-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.warning-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-input { flex: 1; min-width: 200px; }

/* ── Table Card ── */
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
.footer-left { display: flex; align-items: center; padding-left: 2px; }
.table-count { font-size: 13px; color: var(--text-secondary); }
.mr-1 { margin-right: 4px; }

/* ── Desktop / Mobile ── */
.desktop-only { display: block; }
.mobile-only  { display: none; }

/* ── Table cell elements ── */
.cat-icon-wrap {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; margin: 0 auto;
}
.tx-description { display: flex; flex-direction: column; }
.tx-name { font-weight: 600; color: var(--text-primary); font-size: 14px; }
.tx-cat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.tx-amount { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
.tx-date { font-size: 13px; color: var(--text-secondary); }

.income-amount     { color: #10b981; }
.expense-amount    { color: #ef4444; }
.internal-amount   { color: #6366f1; }
.adjustment-amount { color: #f59e0b; }

/* ── Mobile Summary ── */
.mobile-tx-summary {
  display: flex; align-items: center;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 16px; padding: 14px 18px; margin-bottom: 12px;
}
.mts-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.mts-divider { width: 1px; height: 32px; background: var(--card-border); flex-shrink: 0; }
.mts-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.4px; }
.mts-value { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.mts-income  { color: #10b981; }
.mts-expense { color: #ef4444; }

/* ── Mobile Card List ── */
.mobile-tx-list {
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 18px; overflow: hidden; margin-bottom: 10px;
}
.mobile-tx-card {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; border-bottom: 1px solid var(--card-border);
  transition: background 0.15s ease;
}
.mobile-tx-card:last-child { border-bottom: none; }
.mobile-tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mobile-tx-info { flex: 1; min-width: 0; }
.mobile-tx-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mobile-tx-meta { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; overflow: hidden; }
.mobile-tx-type-chip { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
.chip-income     { background: rgba(16,185,129,0.12);  color: #10b981; }
.chip-expense    { background: rgba(239,68,68,0.1);    color: #ef4444; }
.chip-internal   { background: rgba(99,102,241,0.1);   color: #6366f1; }
.chip-adjustment { background: rgba(245,158,11,0.12);  color: #f59e0b; }
.mobile-tx-cat  { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
.mobile-tx-dot  { font-size: 11px; color: var(--text-secondary); opacity: 0.4; flex-shrink: 0; }
.mobile-tx-date { font-size: 11px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; }
.mobile-tx-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.mobile-tx-amount { font-size: 14px; font-weight: 700; letter-spacing: -0.3px; white-space: nowrap; }
.mobile-tx-delete-btn { width: 28px !important; height: 28px !important; }

.mobile-tx-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 20px; text-align: center; }
.mobile-tx-empty-icon { font-size: 38px; }
.mobile-tx-empty p { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.mobile-tx-empty-sub { font-size: 12px !important; }

.mobile-tx-footer { font-size: 12px; color: var(--text-secondary); text-align: center; padding: 4px 0 2px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .filter-bar { flex-direction: column !important; gap: 10px !important; }
  .filter-bar .el-select { width: 100% !important; }
  .search-input { width: 100% !important; }
  .desktop-only { display: none !important; }
  .mobile-only  { display: block !important; }
  .table-footer { flex-direction: column; gap: 10px; align-items: flex-start !important; }
  .delete-warning-card { padding: 12px 14px; margin-bottom: 14px; }
  .warning-text { font-size: 12.5px; }
}
</style>
