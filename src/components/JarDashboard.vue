<template>
  <div class="jar-dashboard">
    <div class="dashboard-header mb-6">
      <div class="main-stats">
        <div class="stat-card wallet-stat animate__animated animate__fadeInLeft">
          <div class="stat-icon"><Wallet /></div>
          <div class="stat-info">
            <span class="stat-label">Ví chính (Main Balance)</span>
            <span class="stat-value">{{ formatVND(store.walletBalance) }}</span>
          </div>
          <div class="stat-glow"></div>
        </div>
        <div class="stat-card jars-stat animate__animated animate__fadeInLeft" style="animation-delay: 0.1s">
          <div class="stat-icon"><Money /></div>
          <div class="stat-info">
            <span class="stat-label">Tổng trong hũ</span>
            <span class="stat-value">{{ formatVND(store.totalJarBalance) }}</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <el-button type="primary" size="large" @click="handleAddJar" round>
          <el-icon class="mr-2"><Plus /></el-icon>Thêm hũ mới
        </el-button>

        <!-- Nút mở AllocationDialog -->
        <el-button
          size="large"
          plain
          round
          :type="store.allocationSettings.enabled ? 'success' : 'info'"
          @click="allocationVisible = true"
        >
          <el-icon class="mr-2"><Setting /></el-icon>
          Phân bổ tự động
          <el-tag
            v-if="store.allocationSettings.enabled"
            size="small"
            type="success"
            style="margin-left: 8px; border-radius: 6px;"
          >
            BẬT
          </el-tag>
          <el-tag
            v-else
            size="small"
            type="info"
            style="margin-left: 8px; border-radius: 6px;"
          >
            TẮT
          </el-tag>
        </el-button>
      </div>
    </div>

    <div v-auto-animate class="jar-grid">
      <JarCard
        v-for="jar in store.jars"
        :key="jar.id"
        v-bind="jar"
        @edit="handleEditJar"
        @delete="handleDeleteJar"
        @deposit="handleDeposit"
        @withdraw="handleWithdraw"
      />
    </div>

    <!-- Edit/Add Jar Dialog -->
    <el-dialog
      v-model="jarDialogVisible"
      :title="editingJar ? 'Chỉnh sửa hũ' : 'Thêm hũ mới'"
      width="400px"
      destroy-on-close
      append-to-body
      class="jar-dialog"
    >
      <el-form :model="jarForm" label-position="top">
        <el-form-item label="Tên hũ">
          <el-input v-model="jarForm.name" placeholder="Ví dụ: Hũ ăn chơi" />
        </el-form-item>
        <el-form-item label="Hạn mức hàng tháng (Budget)">
          <el-input-number
            v-model="jarForm.limit"
            :min="0"
            :step="500000"
            style="width: 100%"
            placeholder="Số tiền tối đa muốn tiêu"
          />
        </el-form-item>
        <el-form-item label="Danh mục liên kết">
          <el-select v-model="jarForm.categoryValue" placeholder="Chọn danh mục" style="width: 100%">
            <el-option
              v-for="cat in CATEGORIES.filter(c => c.value !== 'income')"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <div class="icon-color-pickers">
          <el-form-item label="Màu sắc">
            <el-color-picker v-model="jarForm.color" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="jarDialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveJar">Lưu lại</el-button>
      </template>
    </el-dialog>

    <!-- Refill Modal (Deposit/Withdraw) -->
    <JarRefillModal
      v-if="refillVisible"
      v-model="refillVisible"
      :jar-id="currentJarId"
      :mode="refillMode"
    />

    <!-- Allocation Dialog (tách riêng) -->
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
const refillVisible = ref(false)
const refillMode = ref('deposit')
const editingJar = ref(null)
const currentJarId = ref(null)
const allocationVisible = ref(false)

const jarForm = reactive({
  name: '',
  limit: 5000000,
  categoryValue: 'other',
  color: '#6366f1',
  icon: 'Box'
})

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

function handleAddJar() {
  editingJar.value = null
  Object.assign(jarForm, { name: '', limit: 5000000, categoryValue: 'other', color: '#6366f1', icon: 'Box' })
  jarDialogVisible.value = true
}

function handleEditJar(id) {
  const jar = store.jars.find(j => j.id === id)
  if (jar) {
    editingJar.value = jar
    Object.assign(jarForm, {
      name: jar.name,
      limit: jar.limit,
      categoryValue: jar.categoryValue,
      color: jar.color,
      icon: jar.icon
    })
    jarDialogVisible.value = true
  }
}

async function handleDeleteJar(id) {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc muốn xóa hũ này? Số dư còn lại sẽ được chuyển trả vào Ví chính.',
      'Xác nhận xóa',
      { type: 'warning' }
    )
    store.deleteJar(id)
    ElMessage.success('Đã xóa hũ và hoàn tiền về ví chính')
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
  const cat = CATEGORIES.find(c => c.value === jarForm.categoryValue)
  if (cat) jarForm.icon = cat.icon

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
.jar-dashboard {
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.main-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 260px;
  overflow: hidden;
}

.wallet-stat { border-left: 4px solid #10b981; }
.jars-stat { border-left: 4px solid #f59e0b; }

.stat-icon {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }

.stat-glow {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 60px;
  height: 60px;
  background: #10b981;
  filter: blur(30px);
  opacity: 0.1;
}

.header-actions { display: flex; gap: 12px; }

.jar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.icon-color-pickers { display: flex; gap: 20px; }

.mb-6 { margin-bottom: 24px; }
.mr-2 { margin-right: 8px; }

:deep(.jar-dialog) {
  border-radius: 20px;
  background: var(--sidebar-bg) !important;
}
</style>