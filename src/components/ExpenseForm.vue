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
  font-weight: 600;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border: none;
  padding: 12px 28px;
  font-size: 15px;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  transition: all 0.25s ease;
}
.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.5);
}

.add-btn .mr-1 {
  margin-right: 6px;
}

.type-group {
  width: 100%;
  display: flex;
}
.type-group :deep(.el-radio-button) {
  flex: 1;
}
.type-group :deep(.el-radio-button__inner) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cat-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.expense-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 16px;
}
:deep(.expense-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
}
:deep(.expense-form .el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
}
</style>
