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
        <span class="value" :class="{ 'negative': balance < 0 }">{{ formatVND(balance) }}</span>
      </div>
    </div>

    <div class="jar-progress-section">
      <div class="progress-info">
        <span class="usage-text">Đã dùng {{ usagePercent }}%</span>
        <span class="limit-text">Hạn mức: {{ formatVND(limit) }}</span>
      </div>
      <el-progress 
        :percentage="clampedUsagePercent" 
        :color="statusColor" 
        :stroke-width="8"
        :show-text="false"
        class="custom-progress"
      />
      <div class="milestones">
        <div 
          v-for="m in milestones" 
          :key="m" 
          class="milestone-dot" 
          :style="{ left: m + '%', background: m <= usagePercent ? statusColor : 'var(--card-border)' }"
          :title="'Mốc ' + m + '%'"
        ></div>
      </div>
    </div>

    <div v-if="usagePercent >= 100" class="jar-alert error">
      <el-icon><WarningFilled /></el-icon>
      <span>Đã vượt ngân sách!</span>
    </div>
    <div v-else-if="usagePercent >= 80" class="jar-alert warning">
      <el-icon><InfoFilled /></el-icon>
      <span>Sắp chạm giới hạn ({{ usagePercent }}%)</span>
    </div>

    <div class="card-glow" :style="{ background: color }"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CATEGORIES } from '../stores/expenseStore'

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

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const categoryLabel = computed(() => {
  const cat = CATEGORIES.find(c => c.value === props.categoryValue)
  return cat ? cat.label : 'Khác'
})

const usagePercent = computed(() => {
  if (props.limit <= 0) return 0
  // Usage is (Limit - Balance) if Balance is positive, or (Limit + abs(Balance))? 
  // Wait, if Balance is 1M and Limit is 5M, I used 4M.
  // If Balance is -1M and Limit is 5M, I used 6M.
  // Let's assume balance is what's REMAINING in the jar.
  // Actually, in the store logic I spent FROM the jar. 
  // Initial balance is 0. If I add 5M income, balance is 5M.
  // If I spend 1M, balance is 4M. Usage is 1M / 5M = 20%.
  
  const spent = Math.max(0, props.limit - props.balance)
  return Math.round((spent / props.limit) * 100)
})

const clampedUsagePercent = computed(() => Math.min(100, Math.max(0, usagePercent.value)))

const statusColor = computed(() => {
  if (usagePercent.value >= 100) return '#ef4444'
  if (usagePercent.value >= 80) return '#f59e0b'
  if (usagePercent.value >= 50) return '#3b82f6'
  return '#10b981'
})

const handleCommand = (cmd) => {
  emit(cmd, props.id)
}
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
}

.limit-text {
  color: var(--text-secondary);
}

.custom-progress :deep(.el-progress-bar__outer) {
  background-color: var(--card-border) !important;
}

.milestones {
  position: absolute;
  top: 24px; /* Adjust based on label height */
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
