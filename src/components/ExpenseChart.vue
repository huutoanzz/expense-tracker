<template>
  <div class="chart-grid">
    <!-- Pie Chart -->
    <div class="chart-card animate__animated animate__fadeInLeft">
      <div class="chart-header">
        <span class="chart-title">
          <el-icon><PieChart /></el-icon>
          Phân Bổ Chi Tiêu
        </span>
        <span class="chart-subtitle">Theo danh mục</span>
      </div>
      <div v-if="hasData" class="chart-wrapper">
        <v-chart :option="pieOption" autoresize style="height: 280px;" />
      </div>
      <div v-else class="no-data">
        <el-empty description="Chưa có dữ liệu chi tiêu" :image-size="80" />
      </div>
    </div>

    <!-- Bar Chart -->
    <div class="chart-card animate__animated animate__fadeInRight">
      <div class="chart-header">
        <span class="chart-title">
          <el-icon><TrendCharts /></el-icon>
          Tổng Quan Tháng
        </span>
        <span class="chart-subtitle">Thu nhập vs Chi tiêu</span>
      </div>
      <div class="chart-wrapper">
        <v-chart :option="barOption" autoresize style="height: 280px;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart as EPieChart, BarChart as EBarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useExpenseStore } from '../stores/expenseStore'

use([
  CanvasRenderer,
  EPieChart,
  EBarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])


const store = useExpenseStore()

const hasData = computed(() => store.expenseByCategory.length > 0)

const pieOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      const val = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(params.value)
      return `<b>${params.name}</b><br/>${val} (${params.percent}%)`
    },
    backgroundColor: '#1e2130',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: '#e2e8f0' },
  },
  legend: {
    bottom: 0,
    left: 'center',
    textStyle: { color: '#94a3b8', fontSize: 12 },
    itemHeight: 10,
  },
  series: [
    {
      type: 'pie',
      radius: ['38%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#141824', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#f1f5f9' },
        itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      data: store.expenseByCategory.map(c => ({
        name: c.name,
        value: c.value,
        itemStyle: { color: c.color },
      })),
    },
  ],
}))

const barOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params) =>
      params.map(p => {
        const val = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.value)
        return `${p.seriesName}: <b>${val}</b>`
      }).join('<br/>'),
    backgroundColor: '#1e2130',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: '#e2e8f0' },
  },
  legend: {
    data: ['Thu nhập', 'Chi tiêu'],
    textStyle: { color: '#94a3b8' },
    bottom: 0,
  },
  grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['Tháng 4/2026'],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    axisLabel: { color: '#94a3b8' },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#94a3b8',
      formatter: (val) => val >= 1000000 ? (val / 1000000).toFixed(0) + 'M' : val,
    },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
  },
  series: [
    {
      name: 'Thu nhập',
      type: 'bar',
      data: [store.totalIncome],
      itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] },
      barWidth: '32%',
    },
    {
      name: 'Chi tiêu',
      type: 'bar',
      data: [store.totalExpense],
      itemStyle: { color: '#f97316', borderRadius: [6, 6, 0, 0] },
      barWidth: '32%',
    },
  ],
}))
</script>

<style scoped>
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 22px 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-wrapper {
  border-radius: 10px;
  overflow: hidden;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
}
</style>
