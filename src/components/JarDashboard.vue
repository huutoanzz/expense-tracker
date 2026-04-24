<template>
  <div class="jar-dashboard">
    <div class="dashboard-header mb-6">
      <div class="main-stats">
        <div class="stat-card wallet-stat animate__animated animate__fadeInLeft">
          <div class="stat-icon wallet-icon">
            <el-icon :size="22"><Wallet /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">Ví chính</span>
            <span class="stat-value">{{ formatVND(store.walletBalance) }}</span>
          </div>
          <div class="stat-glow" style="background:#10b981"></div>
        </div>
        <div class="stat-card jars-stat animate__animated animate__fadeInLeft" style="animation-delay:0.1s">
          <div class="stat-icon jars-icon">
            <el-icon :size="22"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">Tổng trong hũ</span>
            <span class="stat-value">{{ formatVND(store.totalJarBalance) }}</span>
          </div>
          <div class="stat-glow" style="background:#f59e0b"></div>
        </div>
      </div>

      <div class="header-actions">
        <el-button type="primary" size="large" @click="handleAddJar" round>
          <el-icon class="mr-2"><Plus /></el-icon>Thêm hũ mới
        </el-button>
        <el-button
          size="large" plain round
          :type="store.allocationSettings.enabled ? 'success' : 'info'"
          @click="allocationVisible = true"
        >
          <el-icon class="mr-2"><Setting /></el-icon>
          Phân bổ tự động
          <el-tag v-if="store.allocationSettings.enabled" size="small" type="success" style="margin-left:8px;border-radius:6px">BẬT</el-tag>
          <el-tag v-else size="small" type="info" style="margin-left:8px;border-radius:6px">TẮT</el-tag>
        </el-button>
      </div>
    </div>

    <div v-auto-animate class="jar-grid">
      <JarCard
        v-for="jar in store.jars" :key="jar.id" v-bind="jar"
        @edit="handleEditJar" @delete="handleDeleteJar"
        @deposit="handleDeposit" @withdraw="handleWithdraw"
      />
    </div>

    <!-- ── Add / Edit Jar Dialog ── -->
    <el-dialog
      v-model="jarDialogVisible"
      width="460px"
      destroy-on-close
      append-to-body
      class="jar-dialog"
      :show-close="false"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="jd-topbar">
          <div style="width:36px"></div>
          <div class="jd-title-wrap">
            <div
              class="jd-preview-icon"
              :style="{ background: jarForm.color + '25', color: jarForm.color }"
            >
              <el-icon :size="22"><component :is="jarForm.icon || 'Box'" /></el-icon>
            </div>
            <div>
              <div class="jd-title">{{ editingJar ? 'Chỉnh sửa hũ' : 'Thêm hũ mới' }}</div>
              <div class="jd-sub">{{ editingJar ? (jarForm.name || '...') : 'Tạo hũ tiết kiệm mới' }}</div>
            </div>
          </div>
          <button class="close-pill" @click="jarDialogVisible = false">✕</button>
        </div>
      </template>

      <div class="jd-body">

        <!-- Tên hũ -->
        <div class="jd-field">
          <div class="jd-label">Tên hũ</div>
          <el-input
            v-model="jarForm.name"
            placeholder="Ví dụ: Hũ du lịch, Hũ khẩn cấp..."
            size="large"
            class="jd-input"
          >
            <template #prefix><el-icon><EditPen /></el-icon></template>
          </el-input>
        </div>

        <!-- Hạn mức -->
        <div class="jd-field">
          <div class="jd-label">
          Hạn mức ngân sách
          <span class="jd-label-hint">tối đa chi mỗi tháng (max 500M)</span>
        </div>
        <div class="limit-input-wrap">
          <input
            class="limit-input"
            type="text"
            inputmode="numeric"
            :value="jarForm.limit ? jarForm.limit.toLocaleString('vi-VN') : ''"
            placeholder="5.000.000"
            @input="onLimitInput"
          />
          <span class="limit-unit">đ</span>
          <div v-if="jarForm.limit > 500_000_000" class="limit-max-warning">
            ⚠️ Tối đa 500M
          </div>
        </div>
          <div class="limit-chips">
            <button
              v-for="lv in limitPresets" :key="lv.value"
              type="button" class="limit-chip"
              :class="{ active: jarForm.limit === lv.value }"
              @click="jarForm.limit = lv.value"
            >{{ lv.label }}</button>
          </div>
        </div>

        <!-- Danh mục -->
        <div class="jd-field">
          <div class="jd-label">Danh mục liên kết</div>
          <div class="cat-grid">
            <button
              v-for="cat in CATEGORIES.filter(c => c.value !== 'income')"
              :key="cat.value"
              type="button" class="cat-chip"
              :class="{ selected: jarForm.categoryValue === cat.value }"
              :style="jarForm.categoryValue === cat.value
                ? { background: cat.color + '22', borderColor: cat.color, color: cat.color }
                : {}"
              @click="onCategorySelect(cat)"
            >
              <span class="cat-dot" :style="{ background: cat.color }"></span>
              <el-icon><component :is="cat.icon" /></el-icon>
              <span>{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <!-- Màu sắc -->
        <div class="jd-field">
          <div class="jd-label">
            Màu sắc hũ
            <span class="jd-label-hint">preset hoặc tuỳ chỉnh</span>
          </div>
          <div class="color-row">
            <div class="color-swatches">
              <button
                v-for="sw in colorSwatches" :key="sw"
                type="button" class="swatch"
                :style="{ background: sw }"
                :class="{ active: jarForm.color === sw }"
                @click="jarForm.color = sw"
              >
                <el-icon v-if="jarForm.color === sw" style="color:#fff;font-size:12px"><Check /></el-icon>
              </button>
            </div>
            <!-- Native color picker -->
            <div class="custom-color-wrap" :title="'Tuỳ chỉnh: ' + jarForm.color">
              <div
                class="custom-color-preview"
                :style="{ background: jarForm.color }"
              ></div>
              <input
                type="color"
                class="color-picker-native"
                :value="jarForm.color"
                @input="jarForm.color = $event.target.value"
              />
              <span class="custom-color-label">Tùy chỉnh</span>
            </div>
          </div>

          <!-- Live preview badge -->
          <div class="color-preview-row">
            <div class="color-hex-badge">
              <div class="color-hex-dot" :style="{ background: jarForm.color }"></div>
              <span>{{ jarForm.color }}</span>
            </div>
            <div
              class="color-preview-badge"
              :style="{
                background: jarForm.color + '20',
                border: `1.5px solid ${jarForm.color}50`,
                color: jarForm.color
              }"
            >
              <el-icon :size="13"><component :is="jarForm.icon || 'Box'" /></el-icon>
              <span>{{ jarForm.name || 'Hũ mẫu' }}</span>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <div class="jd-footer">
          <button class="jd-save-btn" @click="saveJar">
            <el-icon><Check /></el-icon>
            {{ editingJar ? 'Lưu thay đổi' : 'Tạo hũ' }}
          </button>
          <button class="jd-cancel-btn" @click="jarDialogVisible = false">Huỷ</button>
        </div>
      </template>
    </el-dialog>

    <!-- Refill Modal -->
    <JarRefillModal
      v-if="refillVisible"
      v-model="refillVisible"
      :jar-id="currentJarId"
      :mode="refillMode"
    />

    <!-- Allocation Dialog -->
    <AllocationDialog v-model="allocationVisible" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'
import { ElMessageBox, ElMessage } from 'element-plus'
import JarCard from './JarCard.vue'
import JarRefillModal from './JarRefillModal.vue'
import AllocationDialog from './AllocationDialog.vue'

const store = useExpenseStore()

const jarDialogVisible = ref(false)
const refillVisible    = ref(false)
const refillMode       = ref('deposit')
const editingJar       = ref(null)
const currentJarId     = ref(null)
const allocationVisible = ref(false)

const jarForm = reactive({
  name: '',
  limit: 5000000,
  categoryValue: 'other',
  color: '#6366f1',
  icon: 'Box'
})

const colorSwatches = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981',
  '#22c55e', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#a855f7', '#14b8a6', '#6b7280',
]

const limitPresets = [
  { label: '1M',  value: 1_000_000  },
  { label: '2M',  value: 2_000_000  },
  { label: '5M',  value: 5_000_000  },
  { label: '10M', value: 10_000_000 },
  { label: '20M', value: 20_000_000 },
  { label: '50M', value: 50_000_000 },
  { label: '100M', value: 100_000_000 },
  { label: '200M', value: 200_000_000 },
  { label: '500M',value: 500_000_000 }
]

const formatVND = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

function onLimitInput(e) {
  const raw = e.target.value.replace(/[^\d]/g, '')
  const num = parseInt(raw, 10) || 0
  jarForm.limit = Math.min(num, 500_000_000) 
}

// Chọn category: chỉ update icon + auto-fill màu khi tạo mới + màu còn là default
function onCategorySelect(cat) {
  jarForm.categoryValue = cat.value
  jarForm.icon = cat.icon
  // Auto-suggest màu chỉ khi tạo mới và user chưa đổi màu
  if (!editingJar.value && jarForm.color === '#6366f1') {
    jarForm.color = cat.color
  }
}

function handleAddJar() {
  editingJar.value = null
  Object.assign(jarForm, {
    name: '', limit: 5_000_000,
    categoryValue: 'other', color: '#6366f1', icon: 'Box'
  })
  jarDialogVisible.value = true
}

function handleEditJar(id) {
  const jar = store.jars.find(j => j.id === id)
  if (!jar) return
  editingJar.value = jar
  // Load đúng màu đã lưu, không override
  Object.assign(jarForm, {
    name: jar.name,
    limit: jar.limit,
    categoryValue: jar.categoryValue,
    color: jar.color,
    icon: jar.icon
  })
  jarDialogVisible.value = true
}

async function handleDeleteJar(id) {
  const jar = store.jars.find(j => j.id === id)
  if (!jar) return

  // Đếm số giao dịch liên quan đến hũ này
  const relatedTxCount = store.transactions.filter(t =>
    (t.type === 'expense' && t.category === jar.categoryValue) ||
    (t.type === 'internal' && (t.targetId === id || t.sourceId === id))
  ).length

  const balanceText = jar.balance > 0
    ? `<p style="margin-top:10px">Số dư còn lại <b>${jar.balance.toLocaleString('vi-VN')} đ</b> sẽ được hoàn về Ví chính.</p>`
    : ''

  const txWarning = relatedTxCount > 0
    ? `<div style="margin-top:12px;padding:12px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;">
        <p style="color:#ef4444;font-weight:700;font-size:13px">⛔ Cảnh báo không thể khôi phục</p>
        <p style="color:#ef4444;font-size:13px;margin-top:4px">
          Hũ này có <b>${relatedTxCount} giao dịch</b> liên quan.<br>
          Sau khi xóa hũ, <b>các giao dịch nội bộ của hũ sẽ không thể xóa hoặc chỉnh sửa</b> — chúng sẽ bị khoá vĩnh viễn.
        </p>
       </div>`
    : `<div style="margin-top:12px;padding:10px 14px;background:rgba(245,158,11,0.08);border-radius:10px;">
        <p style="color:#f59e0b;font-size:13px">⚠️ Thao tác này không thể hoàn tác.</p>
       </div>`

  try {
    await ElMessageBox.confirm(
      `<div style="line-height:1.7;font-size:14px">
        <p>Bạn sắp xóa hũ <b>"${jar.name}"</b>.</p>
        ${balanceText}
        ${txWarning}
      </div>`,
      '🗑️ Xóa hũ vĩnh viễn',
      {
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Huỷ',
        type: 'error',
        dangerouslyUseHTMLString: true,
        confirmButtonClass: 'el-button--danger',
      }
    )
    store.deleteJar(id)
    ElMessage({
      type: 'warning',
      message: `Đã xóa hũ "${jar.name}". Các giao dịch liên quan đã bị khoá.`,
      duration: 4000,
    })
  } catch { /* cancelled */ }
}

function handleDeposit(id) {
  currentJarId.value = id
  refillMode.value = 'deposit'
  refillVisible.value = true
}

function handleWithdraw(id) {
  currentJarId.value = id
  refillMode.value = 'withdraw'
  refillVisible.value = true
}

function saveJar() {
  if (!jarForm.name.trim()) {
    ElMessage.warning('Vui lòng nhập tên hũ')
    return
  }
    if (jarForm.limit > 500_000_000) {  
    ElMessage.warning('Hạn mức tối đa là 500 triệu đ')
    return
  }
  // Lưu đúng jarForm.color — KHÔNG ghi đè bằng màu category
  if (editingJar.value) {
    store.updateJar(editingJar.value.id, { ...jarForm })
    ElMessage.success('Đã cập nhật hũ')
  } else {
    store.addJar({ ...jarForm })
    ElMessage.success('Đã thêm hũ mới')
  }
  jarDialogVisible.value = false
}
</script>

<style scoped>
/* ── Dashboard ── */


.jar-dashboard { display: flex; flex-direction: column; }
.dashboard-header {
  display: flex; justify-content: space-between;
  align-items: flex-end; gap: 20px; flex-wrap: wrap;
}
.main-stats { display: flex; gap: 16px; flex-wrap: wrap; }

.stat-card {
  position: relative; background: var(--card-bg);
  border: 1px solid var(--card-border); border-radius: 20px;
  padding: 16px 24px; display: flex; align-items: center;
  gap: 16px; min-width: 260px; overflow: hidden;
}
.wallet-stat { border-left: 4px solid #10b981; }
.jars-stat   { border-left: 4px solid #f59e0b; }

.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.wallet-icon { background: rgba(16,185,129,0.12); color: #10b981; }
.jars-icon   { background: rgba(245,158,11,0.12);  color: #f59e0b; }

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }

.stat-glow {
  position: absolute; right: -20px; bottom: -20px;
  width: 60px; height: 60px; filter: blur(30px); opacity: 0.12;
}

.header-actions { display: flex; gap: 12px; }
.jar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
.mb-6 { margin-bottom: 24px; }
.mr-2 { margin-right: 8px; }

/* ── Dialog shell ── */
:deep(.jar-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 24px !important;
  overflow: hidden !important;
}
:deep(.jar-dialog .el-dialog__header) { padding: 0 !important; margin: 0 !important; }
:deep(.jar-dialog .el-dialog__body)   { padding: 0 !important; }
:deep(.jar-dialog .el-dialog__footer) { padding: 0 20px 20px !important; }

/* ── Topbar ── */
.jd-topbar {
  display: flex; align-items: center;
  justify-content: space-between; padding: 18px 20px 14px;
}
.close-pill {
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: var(--bg-main); color: var(--text-secondary);
  font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.close-pill:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.jd-title-wrap { display: flex; align-items: center; gap: 12px; }
.jd-preview-icon {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.3s ease;
}
.jd-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.jd-sub   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

/* ── Body ── */
.jd-body {
  padding: 0 20px;
  display: flex; flex-direction: column; gap: 18px;
  max-height: 60vh; overflow-y: auto;
}

.jd-field { display: flex; flex-direction: column; gap: 8px; }

.jd-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.6px;
  display: flex; align-items: center; gap: 7px;
}
.jd-label-hint {
  font-size: 10px; font-weight: 500; text-transform: none;
  letter-spacing: 0; opacity: 0.65;
}

:deep(.jd-input .el-input__wrapper) {
  border-radius: 12px !important;
  border: 1.5px solid var(--card-border) !important;
  background: var(--bg-main) !important;
  box-shadow: none !important; height: 44px;
}
:deep(.jd-input .el-input__wrapper:hover),
:deep(.jd-input .el-input__wrapper.is-focus) {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
}

/* ── Limit input ── */
.limit-max-warning {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 11px; color: #ef4444; font-weight: 600;
  background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 4px;
}
.limit-input-wrap { position: relative; }
.limit-input-wrap:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.limit-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 24px; font-weight: 800; color: var(--text-primary);
  font-family: inherit; letter-spacing: -0.5px; padding: 0;
}
.limit-input::placeholder { color: var(--card-border); }
.limit-unit { font-size: 16px; font-weight: 700; color: var(--text-secondary); flex-shrink: 0; }

.limit-chips { display: flex; gap: 7px; flex-wrap: wrap; }
.limit-chip {
  padding: 5px 13px; border-radius: 20px;
  border: 1.5px solid var(--card-border);
  background: var(--bg-main); color: var(--text-secondary);
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.18s; font-family: inherit;
}
.limit-chip:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }
.limit-chip.active {
  background: #6366f1; border-color: #6366f1; color: #fff;
  box-shadow: 0 3px 10px rgba(99,102,241,0.3);
}

/* ── Category grid ── */
.cat-grid { display: flex; flex-wrap: wrap; gap: 7px; }
.cat-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 11px; border-radius: 10px;
  border: 1.5px solid var(--card-border);
  background: var(--bg-main); color: var(--text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.18s; font-family: inherit; white-space: nowrap;
}
.cat-chip:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-1px); }
.cat-chip.selected { font-weight: 700; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.cat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── Color section ── */
.color-row { display: flex; align-items: flex-start; gap: 14px; }

.color-swatches { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }

.swatch {
  width: 30px; height: 30px; border-radius: 9px;
  border: 2.5px solid transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.18s; flex-shrink: 0;
}
.swatch:hover { transform: scale(1.18); border-color: rgba(255,255,255,0.6); }
.swatch.active {
  border-color: rgba(255,255,255,0.9);
  box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 3px 12px rgba(0,0,0,0.25);
  transform: scale(1.18);
}

/* Custom color picker */
.custom-color-wrap {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; position: relative; cursor: pointer; flex-shrink: 0;
}
.custom-color-preview {
  width: 30px; height: 30px; border-radius: 9px;
  border: 2px solid var(--card-border);
  transition: transform 0.18s, border-color 0.2s;
  background-image: conic-gradient(
    #f00 0deg, #ff0 60deg, #0f0 120deg,
    #0ff 180deg, #00f 240deg, #f0f 300deg, #f00 360deg
  );
}
.custom-color-wrap:hover .custom-color-preview {
  transform: scale(1.18);
  border-color: rgba(255,255,255,0.5);
}
.color-picker-native {
  position: absolute; top: 0; left: 0;
  width: 30px; height: 30px; opacity: 0; cursor: pointer;
}
.custom-color-label { font-size: 9px; font-weight: 600; color: var(--text-secondary); }

/* Color preview row */
.color-preview-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; background: var(--bg-main);
  border: 1px solid var(--card-border);
  border-radius: 10px; padding: 9px 13px; margin-top: 2px;
}
.color-hex-badge {
  display: flex; align-items: center; gap: 8px;
}
.color-hex-dot { width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0; }
.color-hex-badge span { font-size: 12px; font-weight: 700; color: var(--text-secondary); font-family: monospace; }
.color-preview-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 700; transition: all 0.3s;
}

/* ── Footer ── */
.jd-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.jd-save-btn {
  width: 100%; height: 52px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border: none; color: #fff;
  border-radius: 14px; font-size: 15px; font-weight: 700;
  box-shadow: 0 6px 18px rgba(99,102,241,0.35);
  transition: all 0.25s ease;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  cursor: pointer; font-family: inherit;
}
.jd-save-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
.jd-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.jd-cancel-btn {
  width: 100%; height: 46px;
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--text-secondary);
  border-radius: 14px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease;
  display: flex; align-items: center; justify-content: center;
}
.jd-cancel-btn:hover { border-color: var(--text-secondary); color: var(--text-primary); }
</style>