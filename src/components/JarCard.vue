<template>
  <div class="jar-card animate__animated animate__fadeInUp" :style="{ borderColor: color + '44' }">
    <div class="jar-header">
      <div class="jar-icon-wrap" :style="{ background: color + '18', color: color }">
        <el-icon :size="20"><component :is="icon" /></el-icon>
      </div>
      <div class="jar-info">
        <h3 class="jar-name">{{ name }}</h3>
        <span class="jar-category">{{ categoryLabel }}</span>
      </div>
      <el-dropdown trigger="click" @command="handleCommand">
        <el-button class="more-btn" circle plain size="small">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit"><el-icon><Edit /></el-icon>Chỉnh sửa</el-dropdown-item>
            <el-dropdown-item command="deposit"><el-icon><CirclePlus /></el-icon>Nạp tiền</el-dropdown-item>
            <el-dropdown-item command="withdraw"><el-icon><Remove /></el-icon>Rút tiền</el-dropdown-item>
            <el-dropdown-item command="delete" divided class="delete-item">
              <el-icon><Delete /></el-icon>Xóa hũ
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="jar-balance-section">
      <div class="balance-item">
        <span class="label">Số dư hiện tại</span>
        <span class="value" :class="{ 'negative': balance < 0 }">
          {{ balance.toLocaleString('vi-VN') }} đ
        </span>
      </div>
    </div>

    <div class="jar-progress-section">
      <div class="progress-info">
        <!-- Trường hợp chưa phân bổ -->
        <span v-if="isUnallocated" class="usage-text unallocated">Chưa phân bổ</span>
        <!-- Các trường hợp còn lại -->
        <span v-else class="usage-text" :style="{ color: statusConfig.color }">
          {{ statusConfig.label }}
        </span>
        <span class="limit-text">Hạn mức: {{ limit.toLocaleString('vi-VN') }} đ</span>
      </div>

      <el-progress
        :percentage="fillPercent"
        :color="statusConfig.color"
        :stroke-width="8"
        :show-text="false"
        class="custom-progress"
      />

      <div class="milestones">
        <div
          v-for="m in milestones"
          :key="m"
          class="milestone-dot"
          :style="{ left: m + '%', background: m <= fillPercent ? statusConfig.color : 'var(--card-border)' }"
          :title="'Mốc ' + m + '%'"
        ></div>
      </div>
    </div>

    <!-- Banner cảnh báo trạng thái -->
    <div v-if="statusConfig.alertType === 'error'" class="jar-alert error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ statusConfig.label }}</span>
    </div>
    <div v-else-if="statusConfig.alertType === 'warning'" class="jar-alert warning">
      <el-icon><InfoFilled /></el-icon>
      <span>{{ statusConfig.label }}</span>
    </div>

    <!-- Banner vượt hạn mức: balance > limit -->
    <div v-if="isOverLimit" class="jar-alert over-limit">
      <div class="over-limit-main">
        <el-icon><WarningFilled /></el-icon>
        <div class="over-limit-text">
          <span class="over-limit-title">Vượt hạn mức {{ overAmount.toLocaleString('vi-VN') }} đ</span>
          <span class="over-limit-desc">Hũ đang chứa nhiều hơn hạn mức đặt ra. Bạn có thể rút bớt hoặc tăng hạn mức.</span>
        </div>
      </div>
      <div class="over-limit-actions">
        <el-button size="small" type="warning" plain @click.stop="$emit('withdraw', id)">
          Rút bớt
        </el-button>
        <el-button size="small" plain @click.stop="$emit('edit', id)">
          Tăng hạn mức
        </el-button>
      </div>
    </div>

    <div class="card-glow" :style="{ background: color }"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CATEGORIES, useExpenseStore } from '../stores/expenseStore'

const props = defineProps({
  id: String,
  name: String,
  icon: String,
  color: String,
  balance: Number,
  limit: Number,
  milestones: Array,
  categoryValue: String
})

const emit = defineEmits(['edit', 'delete', 'deposit', 'withdraw'])
const store = useExpenseStore()

const categoryLabel = computed(() => {
  const cat = CATEGORIES.find(c => c.value === props.categoryValue)
  return cat ? cat.label : 'Khác'
})

// "Chưa phân bổ" = balance = 0 VÀ chưa từng có:
//   1. giao dịch nạp tiền vào hũ (internal deposit)
//   2. auto-allocation đã chạy vào hũ này
const isUnallocated = computed(() => {
  if (props.balance > 0) return false
  // Có transaction nạp thủ công vào hũ này
  const hasDeposit = store.transactions.some(
    t => t.type === 'internal' && t.targetType === 'JAR' && t.targetId === props.id
  )
  if (hasDeposit) return false
  // Có expense từ hũ này
  const hasExpense = store.transactions.some(
    t => t.type === 'expense' && t.category === props.categoryValue
  )
  if (hasExpense) return false
  // Nếu auto-allocation từng chạy và có rule cho hũ này
  const hasAutoRule = store.allocationSettings.enabled &&
    Number(store.allocationSettings.rules?.[props.id] || 0) > 0
  if (hasAutoRule) return false
  // Không có gì cả → chưa phân bổ
  return true
})

// Vượt hạn mức: balance > limit
const isOverLimit = computed(() => props.limit > 0 && props.balance > props.limit)
const overAmount = computed(() => props.balance - props.limit)

// Thanh tiến trình = balance / limit (cap 100%, có thể tràn nếu vượt)
const fillPercent = computed(() => {
  if (!props.limit) return 0
  return Math.min(100, Math.max(0, Math.round((props.balance / props.limit) * 100)))
})

// Config hiển thị
const statusConfig = computed(() => {
  if (isUnallocated.value) {
    return { label: 'Chưa phân bổ', color: '#6b7280', alertType: null }
  }
  const pct = fillPercent.value
  if (pct === 0) {
    return { label: 'Đã dùng hết', color: '#ef4444', alertType: 'error' }
  }
  if (pct < 20) {
    return {
      label: `Sắp cạn tiền (còn ${props.balance.toLocaleString('vi-VN')} đ)`,
      color: '#ef4444',
      alertType: 'warning'
    }
  }
  if (pct <= 50) {
    return {
      label: `Còn ${props.balance.toLocaleString('vi-VN')} đ`,
      color: '#f59e0b',
      alertType: null
    }
  }
  return {
    label: `Còn ${props.balance.toLocaleString('vi-VN')} đ`,
    color: '#22c55e',
    alertType: null
  }
})

const handleCommand = (cmd) => emit(cmd, props.id)
</script>

<style scoped>
.jar-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 24px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jar-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(99, 102, 241, 0.3);
}

.jar-header {
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 1;
}

.jar-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.jar-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jar-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.jar-category {
  font-size: 12px;
  color: var(--text-secondary);
}

.more-btn {
  background: transparent !important;
  border-color: var(--card-border) !important;
  color: var(--text-secondary) !important;
}

.jar-balance-section {
  z-index: 1;
}

.balance-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-item .label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.balance-item .value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.balance-item .value.negative {
  color: #ef4444;
}

.jar-progress-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.usage-text {
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.usage-text.unallocated {
  color: #6b7280;
  font-style: italic;
}

.limit-text {
  color: var(--text-secondary);
}

.custom-progress :deep(.el-progress-bar__outer) {
  background-color: var(--card-border) !important;
}

.milestones {
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  height: 8px;
  pointer-events: none;
}

.milestone-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 12px;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.jar-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  z-index: 1;
}

.jar-alert.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.jar-alert.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.jar-alert.over-limit {
  flex-direction: column;
  gap: 10px;
  background: rgba(251, 146, 60, 0.08);
  border: 1px solid rgba(251, 146, 60, 0.25);
  color: #fb923c;
}

.over-limit-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.over-limit-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.over-limit-title {
  font-size: 13px;
  font-weight: 700;
  color: #fb923c;
}

.over-limit-desc {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.5;
}

.over-limit-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.over-limit-actions .el-button {
  flex: 1;
  font-size: 12px;
}

.card-glow {
  position: absolute;
  right: -30px;
  bottom: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.05;
  filter: blur(20px);
  pointer-events: none;
}

.delete-item {
  color: #ef4444 !important;
}
</style>