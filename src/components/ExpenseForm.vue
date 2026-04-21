<template>
  <!-- Trigger Button -->
  <el-button
    type="primary"
    size="large"
    round
    @click="open"
    class="add-btn"
  >
    <el-icon class="mr-1"><Plus /></el-icon>
    Thêm Giao Dịch
  </el-button>

  <!-- Dialog thêm giao dịch -->
  <el-dialog
    v-model="visible"
    title="Thêm Giao Dịch Mới"
    width="480px"
    destroy-on-close
    center
    class="expense-dialog"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="expense-form"
    >
      <!-- Transaction Type -->
      <el-form-item label="Loại Giao Dịch" prop="type">
        <el-radio-group v-model="form.type" class="type-group" @change="onTypeChange">
          <el-radio-button value="expense">
            <el-icon><ArrowDown /></el-icon> Chi Tiêu
          </el-radio-button>
          <el-radio-button value="income">
            <el-icon><ArrowUp /></el-icon> Thu Nhập
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- Auto Allocation Toggle (Income Only) -->
      <el-collapse-transition>
        <div v-if="form.type === 'income' && store.allocationSettings.enabled" class="allocation-toggle-box mb-4">
          <div class="toggle-content">
            <div class="toggle-text">
              <span class="toggle-title">Tự động phân bổ</span>
              <span class="toggle-desc">Chia tiền vào các hũ theo cấu hình sẵn có.</span>
            </div>
            <el-switch v-model="form.autoAllocation" />
          </div>
        </div>
      </el-collapse-transition>

      <!-- Description -->
      <el-form-item label="Mô Tả" prop="description">
        <el-input
          v-model="form.description"
          placeholder="Ví dụ: Ăn trưa, Lương tháng..."
          clearable
          size="large"
        >
          <template #prefix><el-icon><EditPen /></el-icon></template>
        </el-input>
      </el-form-item>

      <!-- Amount -->
      <el-form-item label="Số Tiền (VNĐ)" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="1"
          :step="10000"
          size="large"
          controls-position="right"
          style="width: 100%"
          :formatter="(v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''"
          :parser="(v) => Number(String(v).replace(/\./g, ''))"
          placeholder="0"
        />
      </el-form-item>

      <!-- Category -->
      <el-form-item label="Danh Mục" prop="category">
        <el-select
          v-model="form.category"
          placeholder="Chọn danh mục"
          size="large"
          style="width: 100%"
        >
          <el-option
            v-for="cat in filteredCategories"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          >
            <div class="cat-option">
              <span class="cat-dot" :style="{ background: cat.color }"></span>
              <el-icon><component :is="cat.icon" /></el-icon>
              {{ cat.label }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Date -->
      <el-form-item label="Ngày" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="Chọn ngày"
          size="large"
          style="width: 100%"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" size="large">Hủy</el-button>
        <el-button
          type="primary"
          size="large"
          :loading="submitting"
          @click="submit"
          round
        >
          <el-icon><Check /></el-icon>
          Lưu Giao Dịch
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Popup: Không đủ tiền trong hũ -->
  <el-dialog
    v-model="showInsufficientDialog"
    title="💸 Không đủ tiền trong hũ"
    width="460px"
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

      <!-- Option 1: Hũ + Ví chính -->
      <div
        class="option-card"
        :class="{ selected: selectedOption === 1, disabled: !insufficientData.canSplit }"
        @click="insufficientData.canSplit && (selectedOption = 1)"
      >
        <div class="option-header">
          <div class="option-radio" :class="{ active: selectedOption === 1 }"></div>
          <div class="option-title">Dùng hũ + Ví chính</div>
          <span v-if="!insufficientData.canSplit" class="option-badge disabled">Không đủ</span>
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

      <!-- Option 2: Toàn bộ từ Ví chính -->
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

      <!-- Cảnh báo nếu cả 2 đều không khả dụng -->
      <p v-if="!insufficientData.canSplit && !insufficientData.canFull" class="text-red warn-text">
        ⚠️ Ví chính không đủ số dư để thực hiện giao dịch này
      </p>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showInsufficientDialog = false">Huỷ</el-button>
        <el-button
          type="primary"
          :disabled="!canConfirmInsufficient"
          @click="confirmInsufficient"
        >
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
        if (!value || value <= 0) cb(new Error('Số tiền phải lớn hơn 0'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
  category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
  date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
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
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // Chỉ kiểm tra hũ khi là chi tiêu
  if (form.type === 'expense') {
    const jar = store.jars.find(j => j.categoryValue === form.category)
      || store.jars.find(j => j.categoryValue === 'other')

    if (jar && form.amount > jar.balance) {
      // Tính toán trước rồi mở popup
      const shortfall = form.amount - jar.balance
      insufficientData.value = {
        jarId: jar.id,
        jarName: jar.name,
        jarBalance: jar.balance,
        amount: form.amount,
        shortfall,
        walletAfterSplit: store.walletBalance - shortfall,
        walletAfterFull: store.walletBalance - form.amount,
        canSplit: store.walletBalance >= shortfall,
        canFull: store.walletBalance >= form.amount,
      }
      // Chọn option mặc định khả dụng
      selectedOption.value = insufficientData.value.canSplit ? 1 : 2
      showInsufficientDialog.value = true
      return
    }
  }

  // Bình thường không vượt hũ
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
    // ==================== OPTION 1: HŨ + VÍ CHÍNH ====================
    const jar = store.jars.find(j => j.id === data.jarId)
    if (jar) jar.balance = 0

    // Trừ shortfall từ ví TRƯỚC (hoặc sau cũng được vì skip)
    store.walletBalance -= data.shortfall

    // Phải skip balance update vì chúng ta đã xử lý thủ công
    store.addTransaction({
      ...payload,
      amount: data.amount,
      splitFromJar: data.jarId,
      jarAmount: data.jarBalance,
      walletAmount: data.shortfall,
    }, true)   // ←←← THÊM , true ở đây là quan trọng nhất

  } else {
    // ==================== OPTION 2: TOÀN BỘ TỪ VÍ CHÍNH ====================
    store.walletBalance -= data.amount
    store.addTransaction({ ...payload, amount: data.amount }, true)
  }

  ElNotification({
    type: 'success',
    title: 'Thành công',
    message: `Đã thêm "${form.description}"`,
    duration: 2500
  })

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
.add-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border: none;
  padding: 14px 32px;
  font-size: 16px;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 25px -5px rgba(99, 102, 241, 0.5);
  filter: brightness(1.1);
}

.add-btn .mr-1 { margin-right: 8px; }

.expense-form { padding-top: 8px; }

.allocation-toggle-box {
  background: rgba(99, 102, 241, 0.05);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.toggle-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-text { display: flex; flex-direction: column; }
.toggle-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.toggle-desc { font-size: 12px; color: var(--text-secondary); }

.expense-form :deep(.el-form-item) { margin-bottom: 24px; }
.expense-form :deep(.el-form-item:last-child) { margin-bottom: 0; }

.cat-option { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; width: 100%; }
.dialog-footer .el-button { min-width: 110px; }

/* Insufficient dialog */
.insufficient-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.insufficient-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.option-card {
  border: 2px solid var(--card-border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card:hover:not(.disabled) {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.04);
}

.option-card.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.07);
}

.option-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--card-border);
  flex-shrink: 0;
  transition: all 0.2s;
}

.option-radio.active {
  border-color: #6366f1;
  background: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.option-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.option-badge.disabled {
  font-size: 11px;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 2px 8px;
  border-radius: 6px;
}

.option-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.option-preview {
  background: var(--bg-main);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.prev-before { color: var(--text-secondary); }
.prev-arrow { margin: 0 6px; color: var(--text-secondary); }
.prev-after { font-weight: 700; color: #22c55e; }
.prev-after.zero { color: #ef4444; }

.text-red { color: #ef4444; }
.warn-text { font-size: 13px; font-weight: 600; text-align: center; }

.mb-4 { margin-bottom: 16px; }
</style>