<template>
  <div class="summary-grid">
    <div
      v-for="card in cards"
      :key="card.label"
      class="summary-card animate__animated animate__fadeInUp"
      :style="{ animationDelay: card.delay }"
    >
      <div class="card-icon-wrap" :style="{ background: card.bg }">
        <el-icon :size="26" :style="{ color: card.color }">
          <component :is="card.icon" />
        </el-icon>
      </div>
      <div class="card-body">
        <span class="card-label">{{ card.label }}</span>
        <span class="card-value" :style="{ color: card.color }">
          {{ formatVND(card.value) }}
        </span>
      </div>
      <div class="card-glow" :style="{ background: card.color }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExpenseStore } from '../stores/expenseStore'

const store = useExpenseStore()

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const cards = computed(() => [
  {
    label: 'Số Dư',
    value: store.balance,
    icon: 'Wallet',
    color: store.balance >= 0 ? '#10b981' : '#ef4444',
    bg: store.balance >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
    delay: '0s',
  },
  {
    label: 'Tổng Thu Nhập',
    value: store.totalIncome,
    icon: 'TrendCharts',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    delay: '0.1s',
  },
  {
    label: 'Tổng Chi Tiêu',
    value: store.totalExpense,
    icon: 'Money',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    delay: '0.2s',
  },
])

</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.summary-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 22px 24px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

.card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  flex-shrink: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.card-glow {
  position: absolute;
  right: -24px;
  bottom: -24px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: 0.08;
  filter: blur(12px);
  pointer-events: none;
}
</style>
