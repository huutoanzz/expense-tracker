<template>
  <!-- Trigger Button -->
  <el-button type="primary" size="large" round @click="open" class="add-btn">
    <el-icon class="mr-1"><Plus /></el-icon>
    <span class="btn-text">Thêm Giao Dịch</span>
  </el-button>

  <!-- ── Main Dialog ── -->
  <el-dialog
    v-model="visible"
    width="min(460px, 96vw)"
    destroy-on-close
    class="expense-dialog"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-topbar">
        <div style="width:36px"></div>
        <div class="type-switcher">
          <button
            class="type-btn"
            :class="{ active: form.type === 'expense', expense: form.type === 'expense' }"
            @click="form.type = 'expense'; onTypeChange()"
          >
            <el-icon><ArrowDown /></el-icon> Chi tiêu
          </button>
          <button
            class="type-btn"
            :class="{ active: form.type === 'income', income: form.type === 'income' }"
            @click="form.type = 'income'; onTypeChange()"
          >
            <el-icon><ArrowUp /></el-icon> Thu nhập
          </button>
        </div>
        <button class="close-pill" @click="close">✕</button>
      </div>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" class="expense-form">

      <!-- ① AMOUNT — hero -->
      <div class="amount-hero" :class="form.type">
        <div class="amount-label">Số tiền</div>
        <el-form-item prop="amount" class="amount-form-item">
          <div class="amount-display-wrap">
            <input
              class="amount-input"
              :class="{ 'input-error': form.amount >= currentMax }"
              type="text"
              inputmode="numeric"
              :value="displayAmount"
              placeholder="0"
              @input="onAmountInput"
            />
            <span class="amount-currency">đ</span>
          </div>
        </el-form-item>

        <div v-if="form.amount >= currentMax" class="amount-warning amount-warning-limit">
           Đã đạt giới hạn tối đa {{ currentMax.toLocaleString('vi-VN') }} đ
        </div>
        <div v-else-if="form.amount >= 100000000" class="amount-warning">
          ⚠️ Số tiền lớn — vui lòng kiểm tra lại
        </div>

        <div class="quick-chips">
          <button
            v-for="chip in quickAmounts"
            :key="chip.value"
            class="chip"
            :class="{ active: form.amount === chip.value }"
            @click="setAmount(chip.value)"
            type="button"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>

      <!-- ② CATEGORY -->
      <div class="field-section">
        <div class="field-label">Danh mục</div>
        <el-form-item prop="category" class="no-margin">
          <div class="cat-grid">
            <button
              v-for="cat in filteredCategories"
              :key="cat.value"
              type="button"
              class="cat-chip"
              :class="{ selected: form.category === cat.value }"
              :style="form.category === cat.value
                ? { background: cat.color + '22', borderColor: cat.color, color: cat.color }
                : {}"
              @click="form.category = cat.value"
            >
              <span class="cat-chip-dot" :style="{ background: cat.color }"></span>
              <el-icon><component :is="cat.icon" /></el-icon>
              <span>{{ cat.label }}</span>
            </button>
          </div>
          <el-select v-model="form.category" style="display:none" />
        </el-form-item>
      </div>

      <!-- ③ DESCRIPTION -->
      <div class="field-section">
        <div class="field-label">
          Mô tả <span class="optional-tag">tùy chọn</span>
        </div>
        <el-form-item prop="description" class="no-margin">
          <el-input
            v-model="form.description"
            placeholder="Ví dụ: Ăn trưa, Lương tháng..."
            clearable
            size="large"
            class="clean-input"
          >
            <template #prefix><el-icon><EditPen /></el-icon></template>
          </el-input>
        </el-form-item>
      </div>

      <!-- ④ DATE -->
      <div class="field-section">
        <div class="field-label">Ngày giao dịch</div>
        <el-form-item prop="date" class="no-margin">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="Chọn ngày"
            size="large"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="clean-input"
          />
        </el-form-item>
      </div>

      <!-- ⑤ AUTO ALLOCATION -->
      <el-collapse-transition>
        <div v-if="form.type === 'income' && store.allocationSettings.enabled" class="alloc-toggle">
          <div class="alloc-toggle-left">
            <span class="alloc-title">Phân bổ tự động</span>
            <span class="alloc-desc">Chia tiền vào các hũ theo cấu hình</span>
          </div>
          <el-switch v-model="form.autoAllocation" active-color="#6366f1" />
        </div>
      </el-collapse-transition>

    </el-form>

    <template #footer>
      <el-button
        type="primary"
        size="large"
        :loading="submitting"
        @click="submit"
        class="submit-btn"
        :class="form.type"
      >
        <el-icon v-if="!submitting"><Check /></el-icon>&nbsp;
        {{ submitting ? 'Đang lưu...' : (form.type === 'expense' ? 'Ghi chi tiêu' : 'Ghi thu nhập') }}
      </el-button>
    </template>
  </el-dialog>

  <!-- ── Insufficient Balance Dialog ── -->
  <el-dialog
    v-model="showInsufficientDialog"
    title="💸 Không đủ tiền trong hũ"
    width="min(460px, 96vw)"
    append-to-body
    destroy-on-close
    class="insufficient-dialog"
    :close-on-click-modal="false"
  >
    <div class="insufficient-body" v-if="insufficientData">
      <p class="insufficient-desc">
        Hũ <b>{{ insufficientData.jarName }}</b> chỉ còn
        <b>{{ fmt(insufficientData.jarBalance) }}</b>, thiếu
        <b class="text-red">{{ fmt(insufficientData.shortfall) }}</b>.
      </p>

      <div
        class="option-card"
        :class="{ selected: selectedOption === 1, disabled: !insufficientData.canSplit }"
        @click="insufficientData.canSplit && (selectedOption = 1)"
      >
        <div class="option-header">
          <div class="option-radio" :class="{ active: selectedOption === 1 }"></div>
          <div class="option-title">Dùng hũ + Ví chính</div>
          <span v-if="!insufficientData.canSplit" class="option-badge disabled">
            {{ insufficientData.jarBalance === 0 ? 'Hũ rỗng' : 'Không đủ' }}
          </span>
        </div>
        <p class="option-desc">
          Dùng hết <b>{{ fmt(insufficientData.jarBalance) }}</b> trong hũ,
          trừ thêm <b>{{ fmt(insufficientData.shortfall) }}</b> từ Ví chính
        </p>
        <div class="option-preview">
          <div class="preview-row">
            <span>Hũ {{ insufficientData.jarName }}</span>
            <span>
              <span class="prev-before">{{ fmt(insufficientData.jarBalance) }}</span>
              <span class="prev-arrow">→</span>
              <span class="prev-after zero">0 đ</span>
            </span>
          </div>
          <div class="preview-row">
            <span>Ví chính</span>
            <span>
              <span class="prev-before">{{ fmt(store.walletBalance) }}</span>
              <span class="prev-arrow">→</span>
              <span class="prev-after" :class="{ zero: insufficientData.walletAfterSplit <= 0 }">
                {{ fmt(insufficientData.walletAfterSplit) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div
        class="option-card"
        :class="{ selected: selectedOption === 2, disabled: !insufficientData.canFull }"
        @click="insufficientData.canFull && (selectedOption = 2)"
      >
        <div class="option-header">
          <div class="option-radio" :class="{ active: selectedOption === 2 }"></div>
          <div class="option-title">Trừ toàn bộ từ Ví chính</div>
          <span v-if="!insufficientData.canFull" class="option-badge disabled">Không đủ</span>
        </div>
        <p class="option-desc">
          Bỏ qua hũ, trừ toàn bộ <b>{{ fmt(insufficientData.amount) }}</b> từ Ví chính
        </p>
        <div class="option-preview">
          <div class="preview-row">
            <span>Ví chính</span>
            <span>
              <span class="prev-before">{{ fmt(store.walletBalance) }}</span>
              <span class="prev-arrow">→</span>
              <span class="prev-after" :class="{ zero: insufficientData.walletAfterFull <= 0 }">
                {{ fmt(insufficientData.walletAfterFull) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <p v-if="!insufficientData.canSplit && !insufficientData.canFull" class="text-red warn-text">
        ⚠️ Ví chính không đủ số dư để thực hiện giao dịch này
      </p>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showInsufficientDialog = false">Huỷ</el-button>
        <el-button type="primary" :disabled="!canConfirmInsufficient" @click="confirmInsufficient">
          Xác nhận
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'

const store = useExpenseStore()

// ── Giới hạn số tiền tối đa ──────────────────────────────
const MAX_INCOME  = 500_000_000   // Thu nhập: tối đa 500 triệu
const MAX_EXPENSE = 500_000_000   // Chi tiêu: tối đa 500 triệu (có thể điều chỉnh)
const MAX_AMOUNT  = MAX_INCOME    // Dùng chung cho input clamp (sẽ tính dynamic)

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const showInsufficientDialog = ref(false)
const insufficientData = ref(null)
const selectedOption = ref(1)

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  type: 'expense',
  description: '',
  amount: null,
  category: '',
  date: today,
  autoAllocation: true
})

const rules = {
  description: [{ required: true, message: 'Vui lòng nhập mô tả', trigger: 'blur' }],
  amount: [
    { required: true, message: 'Vui lòng nhập số tiền', trigger: 'blur' },
    {
      validator: (_, value, cb) => {
        if (!value || value <= 0) {
          cb(new Error('Số tiền phải lớn hơn 0'))
        } else if (form.type === 'income' && value > MAX_INCOME) {
          cb(new Error(`Thu nhập tối đa ${MAX_INCOME.toLocaleString('vi-VN')} đ`))
        } else if (form.type === 'expense' && value > MAX_EXPENSE) {
          cb(new Error(`Chi tiêu tối đa ${MAX_EXPENSE.toLocaleString('vi-VN')} đ`))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
  category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
}

const quickAmounts = [
  { label: '50k',  value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1M',   value: 1000000 },
  { label: '5M',   value: 5000000 },
  { label: '10M',   value: 10000000 },
  { label: '20M',   value: 20000000 }
]

const displayAmount = computed(() =>
  form.amount ? form.amount.toLocaleString('vi-VN') : ''
)

// Giới hạn động theo loại giao dịch
const currentMax = computed(() =>
  form.type === 'income' ? MAX_INCOME : MAX_EXPENSE
)

function onAmountInput(e) {
  const raw = e.target.value.replace(/[^\d]/g, '')
  let num = parseInt(raw, 10)

  if (isNaN(num)) {
    form.amount = null
    return
  }

  // Clamp về max
  if (num > currentMax.value) {
    num = currentMax.value
  }

  form.amount = num
}

function setAmount(val) {
  form.amount = val
}

const filteredCategories = computed(() =>
  form.type === 'income'
    ? CATEGORIES.filter(c => c.value === 'income' || c.value === 'other')
    : CATEGORIES.filter(c => c.value !== 'income')
)

const canConfirmInsufficient = computed(() => {
  if (!insufficientData.value) return false
  if (selectedOption.value === 1) return insufficientData.value.canSplit
  if (selectedOption.value === 2) return insufficientData.value.canFull
  return false
})

const fmt = (v) => (v ?? 0).toLocaleString('vi-VN') + ' đ'

function onTypeChange() { form.category = '' }
function open() { visible.value = true }
function close() {
  visible.value = false
  formRef.value?.resetFields()
  form.amount = null
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (form.type === 'expense') {
    const jar = store.jars.find(j => j.categoryValue === form.category)
      || store.jars.find(j => j.categoryValue === 'other')

    if (jar && form.amount > jar.balance) {
      const shortfall = form.amount - jar.balance
      insufficientData.value = {
        jarId: jar.id,
        jarName: jar.name,
        jarBalance: jar.balance,
        amount: form.amount,
        shortfall,
        walletAfterSplit: store.walletBalance - shortfall,
        walletAfterFull: store.walletBalance - form.amount,
        canSplit: jar.balance > 0 && store.walletBalance >= shortfall,  
        canFull: store.walletBalance >= form.amount,
      }
      selectedOption.value = insufficientData.value.canSplit ? 1 : 2
      showInsufficientDialog.value = true
      return
    }
  }

  await doSaveTransaction()
}

async function confirmInsufficient() {
  const data = insufficientData.value
  showInsufficientDialog.value = false

  submitting.value = true
  await new Promise(r => setTimeout(r, 400))

  const payload = {
    description: form.description,
    type: 'expense',
    category: form.category,
    date: form.date,
  }

  if (selectedOption.value === 1) {
    const jar = store.jars.find(j => j.id === data.jarId)
    if (jar) jar.balance = 0
    store.walletBalance -= data.shortfall
    store.addTransaction({
      ...payload,
      amount: data.amount,
      splitFromJar: data.jarId,
      jarAmount: data.jarBalance,
      walletAmount: data.shortfall,
    }, true)
  } else {
    store.walletBalance -= data.amount
    store.addTransaction({ ...payload, amount: data.amount }, true)
  }

  ElNotification({ type: 'success', title: 'Thành công', message: `Đã thêm "${form.description}"`, duration: 2500 })
  submitting.value = false
  close()
}

async function doSaveTransaction() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 400))

  store.addTransaction({
    description: form.description,
    amount: form.amount,
    type: form.type,
    category: form.category,
    date: form.date,
    skipAutoAllocation: !form.autoAllocation
  })

  ElNotification({ type: 'success', title: 'Thành Công', message: `Đã thêm "${form.description}"`, duration: 2500 })
  submitting.value = false
  close()
}
</script>

<style scoped>
/* ── Trigger button ── */
.add-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.add-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 25px -5px rgba(99, 102, 241, 0.5);
  filter: brightness(1.1);
}
.add-btn .mr-1 { margin-right: 8px; }

/* ── Dialog shell ── */
:deep(.expense-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 24px !important;
  overflow: hidden !important;
}
:deep(.expense-dialog .el-dialog__header) { padding: 0 !important; margin: 0 !important; }
:deep(.expense-dialog .el-dialog__body)   { padding: 0 !important; }
:deep(.expense-dialog .el-dialog__footer) { padding: 0 20px 20px !important; }

/* ── Topbar ── */
.dialog-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.close-pill {
  width: 36px; height: 36px; border-radius: 50%;
  border: none; background: var(--bg-main);
  color: var(--text-secondary); font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.close-pill:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

/* ── Type switcher ── */
.type-switcher {
  display: flex; background: var(--bg-main);
  border-radius: 12px; padding: 4px; gap: 4px;
}

.type-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 9px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.22s ease; font-family: inherit;
}

.type-btn.active.expense {
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.3);
}
.type-btn.active.income {
  background: linear-gradient(135deg, #10b981, #22c55e);
  color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

/* ── Amount hero ── */
.amount-hero {
  padding: 20px 20px 18px;
  text-align: center;
  transition: background 0.3s ease;
}
.amount-hero.expense {
  background: linear-gradient(180deg, rgba(239,68,68,0.07) 0%, transparent 100%);
}
.amount-hero.income {
  background: linear-gradient(180deg, rgba(16,185,129,0.07) 0%, transparent 100%);
}

.amount-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
}

.amount-form-item { margin-bottom: 0 !important; }
:deep(.amount-form-item .el-form-item__content) { justify-content: center; }
:deep(.amount-form-item .el-form-item__error)   { text-align: center; }

.amount-display-wrap {
  display: flex; align-items: baseline;
  justify-content: center; gap: 6px;
}

.amount-input {
  border: none; background: transparent; outline: none;
  font-size: 44px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -2px; text-align: right;
  width: auto; min-width: 60px; max-width: 260px;
  font-family: inherit; caret-color: #6366f1;
}
.amount-input::placeholder { color: var(--card-border); }

.amount-currency {
  font-size: 22px; font-weight: 700; color: var(--text-secondary); flex-shrink: 0;
}

.amount-warning {
  margin-top: 6px; font-size: 12px; font-weight: 600; color: #f59e0b;
  background: rgba(245,158,11,0.1); border-radius: 8px;
  padding: 6px 12px; display: inline-block;
}
.amount-warning-limit {
  color: #ef4444 !important;
  background: rgba(239,68,68,0.1) !important;
}

/* ── Quick chips ── */
.quick-chips {
  display: flex; justify-content: center;
  gap: 8px; margin-top: 14px; flex-wrap: wrap;
}

.chip {
  padding: 7px 14px; border-radius: 20px;
  border: 1.5px solid var(--card-border);
  background: var(--bg-main); color: var(--text-secondary);
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.18s ease; font-family: inherit;
}
.chip:hover {
  border-color: #6366f1; color: #6366f1;
  background: rgba(99,102,241,0.06); transform: translateY(-1px);
}
.chip.active {
  background: #6366f1; border-color: #6366f1; color: #fff;
  box-shadow: 0 4px 12px rgba(99,102,241,0.35); transform: translateY(-1px);
}

/* ── Field sections ── */
.expense-form {
  padding: 0 20px;
  display: flex; flex-direction: column; gap: 16px;
}

.field-section { display: flex; flex-direction: column; gap: 8px; }

.field-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.6px;
  display: flex; align-items: center; gap: 8px;
}

.optional-tag {
  font-size: 10px; font-weight: 600; color: var(--text-secondary);
  background: var(--bg-main); padding: 2px 7px; border-radius: 6px;
  text-transform: none; letter-spacing: 0; opacity: 0.7;
}

.no-margin { margin-bottom: 0 !important; }

/* ── Category grid ── */
.cat-grid { display: flex; flex-wrap: wrap; gap: 7px; }

.cat-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 11px; border-radius: 10px;
  border: 1.5px solid var(--card-border);
  background: var(--bg-main); color: var(--text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.18s ease; font-family: inherit; white-space: nowrap;
}
.cat-chip:hover {
  border-color: rgba(99,102,241,0.4);
  color: var(--text-primary); transform: translateY(-1px);
}
.cat-chip.selected {
  font-weight: 700; transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
}
.cat-chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* ── Clean inputs ── */
:deep(.clean-input .el-input__wrapper) {
  border-radius: 12px !important;
  border: 1.5px solid var(--card-border) !important;
  background: var(--bg-main) !important;
  box-shadow: none !important;
}

/* ── Auto allocation ── */
.alloc-toggle {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(99,102,241,0.05);
  border: 1px solid rgba(99,102,241,0.12);
  border-radius: 14px; padding: 14px 16px;
}
.alloc-toggle-left { display: flex; flex-direction: column; gap: 3px; }
.alloc-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.alloc-desc { font-size: 12px; color: var(--text-secondary); }

/* ── Submit button ── */
.submit-btn {
  width: 100% !important; height: 52px;
  font-size: 16px !important; font-weight: 700 !important;
  border-radius: 14px !important; border: none !important;
  letter-spacing: 0.3px; transition: all 0.25s ease !important;
}
.submit-btn.expense {
  background: linear-gradient(135deg, #ef4444, #f97316) !important;
  box-shadow: 0 8px 20px -4px rgba(239,68,68,0.4) !important;
}
.submit-btn.income {
  background: linear-gradient(135deg, #10b981, #22c55e) !important;
  box-shadow: 0 8px 20px -4px rgba(16,185,129,0.4) !important;
}
.submit-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }

/* ── Insufficient dialog ── */
.insufficient-body { display: flex; flex-direction: column; gap: 14px; }
.insufficient-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

.option-card {
  border: 2px solid var(--card-border); border-radius: 14px;
  padding: 14px 16px; display: flex; flex-direction: column;
  gap: 10px; cursor: pointer; transition: all 0.2s ease;
}
.option-card:hover:not(.disabled) { border-color: #6366f1; background: rgba(99,102,241,0.04); }
.option-card.selected { border-color: #6366f1; background: rgba(99,102,241,0.07); }
.option-card.disabled { opacity: 0.45; cursor: not-allowed; }

.option-header { display: flex; align-items: center; gap: 10px; }
.option-radio {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid var(--card-border); flex-shrink: 0; transition: all 0.2s;
}
.option-radio.active {
  border-color: #6366f1; background: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}
.option-title { font-size: 14px; font-weight: 700; color: var(--text-primary); flex: 1; }
.option-badge.disabled {
  font-size: 11px; font-weight: 600;
  background: rgba(239,68,68,0.1); color: #ef4444;
  padding: 2px 8px; border-radius: 6px;
}
.option-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
.option-preview {
  background: var(--bg-main); border-radius: 10px;
  padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;
}
.preview-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--text-secondary);
}
.prev-before { color: var(--text-secondary); }
.prev-arrow { margin: 0 6px; }
.prev-after { font-weight: 700; color: #22c55e; }
.prev-after.zero { color: #ef4444; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; width: 100%; }
.dialog-footer .el-button { min-width: 110px; }
.text-red { color: #ef4444; }
.warn-text { font-size: 13px; font-weight: 600; text-align: center; }

.input-error {
  color: #ef4444;
  animation: shake 0.25s;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}
/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  /* Dialog fits screen */
  :deep(.expense-dialog),
  :deep(.insufficient-dialog) {
    margin: 0 !important;
    border-radius: 20px 20px 0 0 !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-height: 95dvh !important;
  }
  :deep(.expense-dialog .el-dialog__body),
  :deep(.insufficient-dialog .el-dialog__body) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Amount hero compact */
  .amount-input { font-size: 36px !important; }
  .amount-currency { font-size: 18px !important; }

  /* Quick chips wrap tighter */
  .quick-chips { gap: 6px; }
  .chip { padding: 6px 11px; font-size: 12px; }

  /* Category grid — 3 per row max */
  .cat-grid { gap: 6px; }
  .cat-chip { padding: 7px 9px; font-size: 11.5px; }

  /* Submit button full height */
  .submit-btn { height: 54px !important; font-size: 15px !important; }

  /* Insufficient dialog options */
  .option-card { padding: 12px 13px; }
  .option-preview { padding: 8px 10px; }
  .preview-row { font-size: 11px; }

  /* Compact button on mobile */
  .btn-text { display: none; }
  .add-btn { 
    padding: 0 !important; 
    width: 42px !important; 
    height: 42px !important; 
    min-width: unset !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .add-btn .mr-1 { margin-right: 0 !important; font-size: 18px; }
  
  /* Footer stacked */
  .dialog-footer { flex-direction: column-reverse; gap: 8px; }
  .dialog-footer .el-button { width: 100% !important; height: 48px; min-width: unset; }
}

</style>