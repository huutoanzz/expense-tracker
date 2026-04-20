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

  <!-- Dialog -->
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
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'

const store = useExpenseStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

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

function onTypeChange() {
  form.category = ''
}

function open() {
  visible.value = true
}

function close() {
  visible.value = false
  formRef.value?.resetFields()
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  await new Promise(r => setTimeout(r, 400)) // simulate async

  store.addTransaction({
    description: form.description,
    amount: form.amount,
    type: form.type,
    category: form.category,
    date: form.date,
    skipAutoAllocation: !form.autoAllocation
  })

   ElNotification({
    title: '✅ Thành Công',
    message: `Đã thêm "${form.description}"`,
    type: 'success',
    duration: 2500,
    position: 'top-right',
  })

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

.add-btn .mr-1 {
  margin-right: 8px;
}

.expense-form {
  padding-top: 8px;
}

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

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.expense-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.expense-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.cat-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

.dialog-footer .el-button {
  min-width: 110px;
}

.mb-4 { margin-bottom: 16px; }
</style>