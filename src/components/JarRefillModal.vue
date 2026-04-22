<template>
  <!-- ── Main Modal ── -->
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="420px"
    destroy-on-close
    append-to-body
    class="refill-dialog"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
        <div class="dialog-topbar">
          <div style="width:36px"></div>
          <div class="mode-switcher">
            <div class="mode-active-pill" :class="mode">
              <el-icon v-if="mode === 'deposit'"><CirclePlus /></el-icon>
              <el-icon v-else><Remove /></el-icon>
              {{ mode === 'deposit' ? 'Nạp tiền' : 'Rút tiền' }}
            </div>
          </div>
          <button class="close-pill" @click="$emit('update:modelValue', false)">✕</button>
        </div>

      <!-- Jar identity -->
      <div class="jar-identity" v-if="jar">
        <div class="jar-icon-wrap" :style="{ background: jar.color + '22', color: jar.color }">
          <el-icon :size="20"><component :is="jar.icon" /></el-icon>
        </div>
        <div class="jar-meta">
          <span class="jar-name">{{ jar.name }}</span>
          <span class="jar-sub">{{ jarCategoryLabel }}</span>
        </div>
      </div>
    </template>

    <div class="refill-body">

      <!-- ① AMOUNT HERO -->
      <div class="amount-hero" :class="mode">
        <div class="amount-label">Số tiền</div>
        <div class="amount-display-wrap">
          <input
            class="amount-input"
            type="text"
            inputmode="numeric"
            :value="displayAmount"
            placeholder="0"
            @input="onAmountInput"
          />
          <span class="amount-currency">đ</span>
        </div>

        <div v-if="amount > maxAmount && maxAmount > 0" class="amount-warning">
          ⚠️ Vượt số dư khả dụng ({{ fmt(maxAmount) }})
        </div>
        <div v-if="mode === 'withdraw' && jar?.balance === 0" class="amount-warning jar-empty">
          ⚠️ Hũ đã rỗng, không thể rút tiền
        </div>
        <div v-if="mode === 'withdraw' && amount > jar?.balance" class="amount-warning jar-insufficient">
          ⚠️ Hũ chỉ còn {{ fmt(jar.balance) }} - thiếu {{ fmt(amount - jar.balance) }}
        </div>

        <!-- Quick fixed chips + percent shortcuts -->
        <div class="quick-chips">
          <button
            v-for="chip in quickChips"
            :key="chip.label"
            class="chip"
            :class="{ active: amount === chip.value }"
            type="button"
            @click="setAmount(chip.value)"
          >{{ chip.label }}</button>
          <button
            v-for="pct in [25, 50, 100]"
            :key="'p' + pct"
            class="chip chip-pct"
            :class="{ active: amount === Math.floor(maxAmount * pct / 100) }"
            type="button"
            @click="setAmount(Math.floor(maxAmount * pct / 100))"
          >{{ pct }}%</button>
        </div>
      </div>

      <!-- ② BALANCE CARDS -->
      <div class="balance-row">
        <div class="balance-card">
          <span class="balance-card-label">Ví chính</span>
          <span class="balance-card-value">{{ fmt(store.walletBalance) }}</span>
          <span v-if="amount > 0 && mode === 'deposit'" class="balance-card-after deposit">
            → {{ fmt(store.walletBalance - amount) }}
          </span>
          <span v-if="amount > 0 && mode === 'withdraw'" class="balance-card-after withdraw">
            → {{ fmt(store.walletBalance + amount) }}
          </span>
        </div>

        <div class="balance-divider">
          <el-icon v-if="mode === 'deposit'"><ArrowRight /></el-icon>
          <el-icon v-else><ArrowLeft /></el-icon>
        </div>

        <div class="balance-card jar-card-inner" :class="{ 'insufficient-jar': mode === 'withdraw' && amount > (jar?.balance || 0) }">
          <span class="balance-card-label">{{ jar?.name ?? 'Hũ' }}</span>
          <span class="balance-card-value">{{ fmt(jar?.balance || 0) }}</span>
          <span v-if="amount > 0 && mode === 'deposit'" class="balance-card-after deposit">
            → {{ fmt((jar?.balance || 0) + amount) }}
          </span>
          <span v-if="amount > 0 && mode === 'withdraw'" class="balance-card-after withdraw">
            → {{ fmt((jar?.balance || 0) - amount) }}
          </span>
        </div>
      </div>

      <!-- ③ LIMIT PROGRESS BAR (deposit only) -->
      <div v-if="mode === 'deposit' && jar" class="limit-section">
        <div class="limit-row">
          <span class="limit-label">Hạn mức hũ</span>
          <span class="limit-value" :style="{ color: limitBarColor }">
            {{ fmt((jar.balance || 0) + (amount || 0)) }} / {{ fmt(jar.limit) }}
          </span>
        </div>
        <div class="limit-bar-track">
          <div
            class="limit-bar-fill"
            :style="{
              width: Math.min(100, ((jar.balance + amount) / jar.limit) * 100) + '%',
              background: limitBarColor
            }"
          />
          <div
            class="limit-marker"
            :style="{ left: Math.min(100, (jar.balance / jar.limit) * 100) + '%' }"
          />
        </div>
        <div class="limit-bar-labels">
          <span>0</span>
          <span :style="{ color: limitBarColor, fontWeight: 700 }">{{ limitStatusText }}</span>
          <span>{{ fmt(jar.limit) }}</span>
        </div>
      </div>

    </div>

    <template #footer>
      <el-button
        class="confirm-btn"
        :class="mode"
        :disabled="amount <= 0 || amount > maxAmount"
        @click="handleConfirm"
      >
        <el-icon v-if="mode === 'deposit'"><CirclePlus /></el-icon>
        <el-icon v-else><Remove /></el-icon>
        {{ mode === 'deposit'
          ? `Nạp ${amount > 0 ? fmt(amount) : '...'} vào hũ`
          : `Rút ${amount > 0 ? fmt(amount) : '...'} về ví` }}
      </el-button>
    </template>
  </el-dialog>

  <!-- ── Over-limit Dialog ── -->
  <el-dialog
    v-model="showOverLimitDialog"
    width="420px"
    append-to-body
    destroy-on-close
    class="overlimit-dialog"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="ol-header">
        <div class="ol-icon">⚠️</div>
        <div class="ol-title">Vượt hạn mức hũ</div>
        <div class="ol-sub">
          Nạp <b>{{ fmt(amount) }}</b> sẽ đẩy hũ <b>{{ jar?.name }}</b>
          vượt hạn mức <b>{{ fmt(jar?.limit || 0) }}</b>
        </div>
      </div>
    </template>

    <div class="ol-body">
      <div class="ol-compare">
        <div class="ol-compare-col">
          <span class="ol-compare-label">Hiện tại</span>
          <span class="ol-compare-val neutral">{{ fmt(jar?.balance || 0) }}</span>
        </div>
        <div class="ol-compare-arrow">→</div>
        <div class="ol-compare-col">
          <span class="ol-compare-label">Sau khi nạp</span>
          <span class="ol-compare-val over">{{ fmt((jar?.balance || 0) + amount) }}</span>
        </div>
        <div class="ol-compare-arrow">vs</div>
        <div class="ol-compare-col">
          <span class="ol-compare-label">Hạn mức</span>
          <span class="ol-compare-val neutral">{{ fmt(jar?.limit || 0) }}</span>
        </div>
      </div>

      <div class="ol-question">Chọn cách xử lý:</div>

      <div class="ol-option" @click="handleIncreaseLimit">
        <div class="ol-option-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
          <el-icon><ArrowUp /></el-icon>
        </div>
        <div class="ol-option-text">
          <span class="ol-option-title">Tăng hạn mức & nạp đủ</span>
          <span class="ol-option-desc">Hạn mức mới: {{ fmt((jar?.balance || 0) + amount) }}</span>
        </div>
        <el-icon class="ol-option-arrow"><ArrowRight /></el-icon>
      </div>

      <div class="ol-option" @click="handleCapDeposit">
        <div class="ol-option-icon" style="background:rgba(16,185,129,0.1);color:#10b981">
          <el-icon><Check /></el-icon>
        </div>
        <div class="ol-option-text">
          <span class="ol-option-title">Chỉ nạp vừa đủ hạn mức</span>
          <span class="ol-option-desc">Nạp {{ fmt((jar?.limit || 0) - (jar?.balance || 0)) }}</span>
        </div>
        <el-icon class="ol-option-arrow"><ArrowRight /></el-icon>
      </div>

      <button class="ol-cancel" @click="showOverLimitDialog = false">Huỷ, nhập lại</button>
    </div>

    <template #footer><span /></template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'
import { ElNotification } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  jarId: String,
  mode: { type: String, default: 'deposit' }
})
const emit = defineEmits(['update:modelValue'])

const store = useExpenseStore()
const amount = ref(0)
const showOverLimitDialog = ref(false)

const jar = computed(() => store.jars.find(j => j.id === props.jarId))

const maxAmount = computed(() =>
  props.mode === 'deposit' ? store.walletBalance : (jar.value?.balance ?? 0)
)

const fmt = (v) => (v ?? 0).toLocaleString('vi-VN') + ' đ'

const jarCategoryLabel = computed(() => {
  const cat = CATEGORIES.find(c => c.value === jar.value?.categoryValue)
  return cat?.label ?? ''
})

const displayAmount = computed(() =>
  amount.value ? amount.value.toLocaleString('vi-VN') : ''
)

function onAmountInput(e) {
  const raw = e.target.value.replace(/[^\d]/g, '')
  const num = parseInt(raw, 10)
  amount.value = isNaN(num) ? 0 : num
}

function setAmount(val) {
  amount.value = Math.max(0, val)
}

const quickChips = computed(() => {
  const base = [50000, 100000, 200000, 500000, 1000000, 2000000]
  return base
    .filter(v => v <= maxAmount.value || maxAmount.value === 0)
    .slice(0, 5)
    .map(v => ({
      label: v >= 1000000 ? (v / 1000000) + 'M' : (v / 1000) + 'k',
      value: v
    }))
})

const limitBarColor = computed(() => {
  if (!jar.value) return '#6366f1'
  const ratio = (jar.value.balance + amount.value) / jar.value.limit
  if (ratio > 1) return '#ef4444'
  if (ratio > 0.8) return '#f59e0b'
  return '#22c55e'
})

const limitStatusText = computed(() => {
  if (!jar.value) return ''
  const ratio = (jar.value.balance + amount.value) / jar.value.limit
  const pct = Math.round(ratio * 100)
  if (ratio > 1) return `Vượt ${pct - 100}%`
  if (ratio === 1) return '✅ Đầy hũ'
  return `${pct}%`
})

function handleConfirm() {
  if (props.mode === 'withdraw' && amount.value > (jar.value?.balance || 0)) {
    ElMessageBox.confirm(
      `Hũ chỉ còn ${fmt(jar.value.balance)}. Bạn muốn rút ${fmt(amount.value)}?`,
      'Hũ không đủ tiền',
      {
        confirmButtonText: 'Rút hết hũ',
        cancelButtonText: 'Nhập lại',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    ).then(() => {
      // Rút hết số dư thực tế
      doDeposit(jar.value.balance)
    }).catch(() => {})
    return
  }
  if (props.mode === 'deposit') {
    const afterDeposit = (jar.value?.balance || 0) + amount.value
    if (afterDeposit > (jar.value?.limit || 0)) {
      showOverLimitDialog.value = true
      return
    }
  }
  doDeposit(amount.value)
}

function handleIncreaseLimit() {
  const newLimit = (jar.value?.balance || 0) + amount.value
  store.updateJar(props.jarId, { limit: newLimit })
  showOverLimitDialog.value = false
  doDeposit(amount.value)
}

function handleCapDeposit() {
  const cappedAmount = (jar.value?.limit || 0) - (jar.value?.balance || 0)
  showOverLimitDialog.value = false
  doDeposit(cappedAmount)
}

function doDeposit(depositAmount) {
  if (depositAmount <= 0) return
  const success = props.mode === 'deposit'
    ? store.depositToJar(props.jarId, depositAmount)
    : store.withdrawFromJar(props.jarId, depositAmount)

  if (success) {
    ElNotification({ type: 'success', title: 'Thành công', message: 'Giao dịch đã được ghi', duration: 2500 })
    amount.value = 0
    emit('update:modelValue', false)
  } else {
    ElNotification({ type: 'error', title: '❌ Lỗi', message: 'Có lỗi xảy ra, thử lại', duration: 2500 })
  }
}
</script>

<style scoped>
/* ── Dialog shell ── */
:deep(.refill-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 24px !important;
  overflow: hidden !important;
}
:deep(.refill-dialog .el-dialog__header) { padding: 0 !important; margin: 0 !important; }
:deep(.refill-dialog .el-dialog__body)   { padding: 0 !important; }
:deep(.refill-dialog .el-dialog__footer) { padding: 0 20px 20px !important; }

/* ── Topbar ── */
.dialog-topbar {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}
.close-pill {
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: var(--bg-main);
  color: var(--text-secondary); font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-pill:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

/* ── Mode pill ── */
.mode-switcher { display: flex; }
.mode-active-pill {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 99px;
  font-size: 14px; font-weight: 700;
}
.mode-active-pill.deposit {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #fff; box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}
.mode-active-pill.withdraw {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,0.35);
}

/* ── Jar identity ── */
.jar-identity {
  display: flex; align-items: center; gap: 12px;
  padding: 0 20px 16px;
}
.jar-icon-wrap {
  width: 42px; height: 42px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.jar-meta { display: flex; flex-direction: column; gap: 2px; }
.jar-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.jar-sub  { font-size: 12px; color: var(--text-secondary); }

/* ── Body ── */
.refill-body {
  padding: 0 20px;
  display: flex; flex-direction: column; gap: 16px;
}

/* ── Amount hero ── */
.amount-hero {
  padding: 20px 0 16px; text-align: center;
  border-radius: 16px; transition: background 0.3s;
}
.amount-hero.deposit {
  background: linear-gradient(180deg, rgba(99,102,241,0.07) 0%, transparent 100%);
}
.amount-hero.withdraw {
  background: linear-gradient(180deg, rgba(245,158,11,0.07) 0%, transparent 100%);
}
.amount-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
}
.amount-display-wrap {
  display: flex; align-items: baseline; justify-content: center; gap: 6px;
}
.amount-input {
  border: none; background: transparent; outline: none;
  font-size: 44px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -2px; text-align: right;
  width: auto; min-width: 60px; max-width: 240px;
  font-family: inherit; caret-color: #6366f1;
}
.amount-input::placeholder { color: var(--card-border); }
.amount-currency { font-size: 22px; font-weight: 700; color: var(--text-secondary); flex-shrink: 0; }
.amount-warning {
  margin-top: 6px; font-size: 12px; font-weight: 600; color: #ef4444;
  background: rgba(239,68,68,0.08); border-radius: 8px;
  padding: 5px 12px; display: inline-block;
}

/* ── Quick chips ── */
.quick-chips {
  display: flex; justify-content: center;
  gap: 7px; margin-top: 14px; flex-wrap: wrap;
}
.chip {
  padding: 6px 13px; border-radius: 20px;
  border: 1.5px solid var(--card-border);
  background: var(--bg-main); color: var(--text-secondary);
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.18s ease; font-family: inherit;
}
.chip:hover {
  border-color: #6366f1; color: #6366f1;
  background: rgba(99,102,241,0.06); transform: translateY(-1px);
}
.chip.active {
  background: #6366f1; border-color: #6366f1; color: #fff;
  box-shadow: 0 3px 10px rgba(99,102,241,0.35); transform: translateY(-1px);
}
.chip-pct { border-style: dashed; }
.chip-pct.active { border-style: solid; }

/* ── Balance row ── */
.balance-row { display: flex; align-items: center; gap: 8px; }
.balance-card {
  flex: 1; background: var(--bg-main);
  border: 1px solid var(--card-border);
  border-radius: 14px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 3px;
}
.jar-card-inner { border-color: rgba(99,102,241,0.2); }
.balance-card-label {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.balance-card-value { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.balance-card-after { font-size: 13px; font-weight: 700; margin-top: 1px; }
.balance-card-after.deposit { color: #6366f1; }
.balance-card-after.withdraw { color: #10b981; }
.balance-divider { color: var(--text-secondary); font-size: 18px; flex-shrink: 0; opacity: 0.5; }

/* ── Limit bar ── */
.limit-section { display: flex; flex-direction: column; gap: 8px; }
.limit-row { display: flex; justify-content: space-between; font-size: 12px; }
.limit-label { color: var(--text-secondary); font-weight: 600; }
.limit-value { font-weight: 700; }
.limit-bar-track {
  height: 7px; background: var(--card-border);
  border-radius: 99px; overflow: visible; position: relative;
}
.limit-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.3s ease, background 0.3s ease; max-width: 100%;
}
.limit-marker {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 3px; height: 14px; background: var(--text-secondary);
  border-radius: 2px; opacity: 0.4;
}
.limit-bar-labels {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--text-secondary);
}

/* ── Confirm button ── */
.confirm-btn {
  width: 100% !important; height: 52px;
  font-size: 15px !important; font-weight: 700 !important;
  border-radius: 14px !important; border: none !important;
  display: flex !important; align-items: center;
  justify-content: center; gap: 8px;
  transition: all 0.25s ease !important;
}
.confirm-btn.deposit {
  background: linear-gradient(135deg, #6366f1, #3b82f6) !important;
  box-shadow: 0 8px 20px -4px rgba(99,102,241,0.4) !important;
}
.confirm-btn.withdraw {
  background: linear-gradient(135deg, #f59e0b, #f97316) !important;
  box-shadow: 0 8px 20px -4px rgba(245,158,11,0.4) !important;
}
.confirm-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); }
.confirm-btn:disabled { opacity: 0.4 !important; }

/* ── Over-limit dialog ── */
:deep(.overlimit-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 24px !important;
  overflow: hidden !important;
}
:deep(.overlimit-dialog .el-dialog__header) { padding: 0 !important; margin: 0 !important; }
:deep(.overlimit-dialog .el-dialog__body)   { padding: 0 !important; }
:deep(.overlimit-dialog .el-dialog__footer) { display: none !important; }

.ol-header {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px 24px 0; text-align: center;
}
.ol-icon { font-size: 36px; line-height: 1; }
.ol-title { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.ol-sub { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

.ol-body {
  padding: 20px 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
}
.ol-compare {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; background: var(--bg-main);
  border-radius: 14px; padding: 14px 16px;
}
.ol-compare-col {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px; flex: 1;
}
.ol-compare-label {
  font-size: 10px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.ol-compare-val { font-size: 14px; font-weight: 800; }
.ol-compare-val.neutral { color: var(--text-primary); }
.ol-compare-val.over { color: #ef4444; }
.ol-compare-arrow { color: var(--text-secondary); font-size: 14px; font-weight: 700; flex-shrink: 0; }

.ol-question {
  font-size: 13px; font-weight: 700;
  color: var(--text-secondary); text-align: center;
}
.ol-option {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-main); border: 1.5px solid var(--card-border);
  border-radius: 14px; padding: 14px 16px;
  cursor: pointer; transition: all 0.18s ease;
}
.ol-option:hover {
  border-color: #6366f1;
  background: rgba(99,102,241,0.04);
  transform: translateY(-1px);
}
.ol-option-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.ol-option-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.ol-option-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.ol-option-desc  { font-size: 12px; color: var(--text-secondary); }
.ol-option-arrow { color: var(--text-secondary); font-size: 14px; }
.ol-cancel {
  width: 100%; padding: 12px;
  background: transparent; border: none;
  color: var(--text-secondary); font-size: 13px; font-weight: 600;
  cursor: pointer; border-radius: 10px;
  transition: all 0.18s; font-family: inherit;
}
.ol-cancel:hover { background: var(--bg-main); color: var(--text-primary); }
/* Thêm vào cuối <style scoped> */
.jar-card-inner.insufficient-jar {
  border-color: #ef4444 !important;
  background: rgba(239,68,68,0.04) !important;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.15);
}

.jar-card-inner.insufficient-jar .balance-card-after {
  color: #ef4444 !important;
  animation: pulse 2s infinite;
}

.jar-empty, 
.jar-insufficient {
  background: rgba(239,68,68,0.1) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239,68,68,0.3) !important;
  animation: shake 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
</style>