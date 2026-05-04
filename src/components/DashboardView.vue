<template>
  <div class="dashboard">

    <!-- ── Period Selector ─────────────────────────────────── -->
    <div class="period-bar">
      <div class="period-tabs">
        <button
          v-for="p in periods"
          :key="p.key"
          class="period-tab"
          :class="{ active: activePeriod === p.key }"
          @click="activePeriod = p.key"
        >{{ p.label }}</button>
      </div>

      <el-date-picker
        v-if="activePeriod === 'month'"
        v-model="selectedMonth"
        type="month"
        placeholder="Chọn tháng"
        format="MM/YYYY"
        value-format="YYYY-MM"
        :clearable="false"
        :editable="false"
        class="month-picker-el"
        popper-class="month-picker-popper"
      />
    </div>

    <!-- ── Summary Cards ───────────────────────────────────── -->
    <div class="summary-grid">

      <!-- Thu Nhập -->
      <div class="summary-card income-card animate__animated animate__fadeInUp" style="animation-delay:0ms">
        <div class="card-icon-wrap" style="background: rgba(16,185,129,0.12)">
          <span class="card-emoji">💰</span>
        </div>
        <div class="card-body">
          <p class="card-label">Thu Nhập</p>
          <p class="card-value">{{ formatVND(displayData.income) }}</p>
          <p class="card-sub income-sub">
            <span class="trend-up">↑</span> {{ activePeriodLabel }}
          </p>
        </div>
      </div>

      <!-- Chi Tiêu -->
      <div class="summary-card expense-card animate__animated animate__fadeInUp" style="animation-delay:80ms">
        <div class="card-icon-wrap" style="background: rgba(239,68,68,0.12)">
          <span class="card-emoji">🧾</span>
        </div>
        <div class="card-body">
          <p class="card-label">Chi Tiêu</p>
          <p class="card-value">{{ formatVND(displayData.expense) }}</p>
          <div class="mini-progress-wrap">
            <div class="mini-progress-bar">
              <div
                class="mini-progress-fill"
                :style="{ width: spendingRate + '%' }"
              />
            </div>
            <span class="mini-progress-label">{{ spendingRate }}% thu nhập</span>
          </div>
        </div>
      </div>

      <!-- Tiết Kiệm -->
      <div class="summary-card saving-card animate__animated animate__fadeInUp" style="animation-delay:160ms">
        <div class="card-icon-wrap" style="background: rgba(16,185,129,0.12)">
          <span class="card-emoji">🏦</span>
        </div>
        <div class="card-body">
          <p class="card-label">Tiết Kiệm</p>
          <p class="card-value">{{ formatVND(displayData.saving) }}</p>
          <p class="card-sub" :class="displayData.saving >= 0 ? 'saving-sub' : 'expense-sub'">
            {{ displayData.saving > 0 ? '✅' : (displayData.saving < 0 ? '⚠️' : 'ℹ️') }} {{ savingMessage }}
          </p>
        </div>
      </div>

      <!-- Sức Khỏe Ngân Sách -->
      <div class="summary-card health-card animate__animated animate__fadeInUp" style="animation-delay:240ms">
        <div class="card-icon-wrap" style="background: rgba(26,107,138,0.12)">
          <span class="card-emoji">📊</span>
        </div>
        <div class="card-body">
          <p class="card-label">Sức Khỏe Ngân Sách</p>
          <p class="card-value health-value" :class="healthClass">{{ healthLabel }}</p>
          <p class="card-sub health-sub">{{ healthDesc }}</p>
        </div>
      </div>
    </div>

    <!-- ── AI Insight Banner ────────────────────────────────── -->
    <div class="insight-banner animate__animated animate__fadeIn" style="animation-delay:300ms">
      <div class="insight-left">
        <span class="insight-robot">🤖</span>
        <div class="insight-text">
          <p class="insight-title">Nhận xét của trợ lý</p>
          <p class="insight-body">{{ insightMessage }}</p>
        </div>
      </div>
      <button class="insight-btn" @click="showInsightDetail = !showInsightDetail">
        {{ showInsightDetail ? 'Ẩn bớt' : 'Xem chi tiết' }}
      </button>
    </div>

    <!-- Insight detail expand -->
    <div v-if="showInsightDetail" class="insight-detail animate__animated animate__fadeIn">
      <div v-for="tip in insightTips" :key="tip.id" class="insight-tip">
        <span class="tip-icon">{{ tip.icon }}</span>
        <div>
          <p class="tip-title">{{ tip.title }}</p>
          <p class="tip-desc">{{ tip.desc }}</p>
        </div>
      </div>
    </div>

    <!-- ── Two-column section: Donut + Bar ─────────────────── -->
    <div class="charts-row">

      <!-- Tiền đi đâu -->
      <div class="chart-card animate__animated animate__fadeInLeft" style="animation-delay:200ms">
        <div class="chart-header">
          <div>
            <p class="chart-title">💸 Tiền của tôi đi đâu?</p>
            <p class="chart-subtitle">{{ activePeriodLabel }}</p>
          </div>
        </div>

        <div v-if="hasExpenseData">
          <!-- Donut chart (hidden on mobile via CSS) -->
          <div class="donut-wrapper">
            <v-chart :option="donutOption" autoresize style="height:200px" />
          </div>

          <!-- Category list — always visible -->
          <div class="cat-list">
            <template v-for="cat in topCategories" :key="cat.id">
              <div
                class="cat-row"
                @click="toggleCatDetail(cat.id)"
              >
                <div class="cat-row-left">
                  <span class="cat-dot" :style="{ background: cat.color }" />
                  <span class="cat-emoji-icon">{{ cat.emoji }}</span>
                  <span class="cat-name">{{ cat.name }}</span>
                </div>
                <div class="cat-row-right">
                  <span class="cat-amount">{{ formatVND(cat.value) }}</span>
                  <span class="cat-pct">{{ cat.pct }}%</span>
                  <el-icon class="cat-chevron" :class="{ rotated: expandedCat === cat.id }">
                    <ArrowDown />
                  </el-icon>
                </div>
              </div>

              <!-- Chi tiết giao dịch của danh mục -->
              <div v-if="expandedCat === cat.id" class="cat-detail-dropdown animate__animated animate__fadeIn">
                <div class="cat-detail-tx-list">
                  <div v-for="tx in getRecentTransactionsForCat(cat.id)" :key="tx.id" class="cat-detail-tx">
                    <div class="cat-tx-left">
                      <span class="cat-tx-date">{{ formatDateShort(tx.date) }}</span>
                      <span class="cat-tx-desc">{{ tx.description }}</span>
                    </div>
                    <span class="cat-tx-amount">-{{ formatVND(tx.amount) }}</span>
                  </div>
                  <div v-if="getRecentTransactionsForCat(cat.id).length === 0" class="cat-tx-empty">
                    Không có giao dịch gần đây.
                  </div>
                </div>
                <button class="cat-see-all-btn" @click="goToTransactionsFiltered(cat.id)">
                  Xem thêm tất cả <span class="see-all-arrow">→</span>
                </button>
              </div>
            </template>

            <!-- Expense progress bars -->
            <div class="cat-bars" v-if="topCategories.length">
              <div v-for="cat in topCategories" :key="'bar-' + cat.name" class="cat-bar-row">
                <span class="cat-bar-label">{{ cat.name }}</span>
                <div class="cat-bar-track">
                  <div
                    class="cat-bar-fill"
                    :style="{ width: cat.pct + '%', background: cat.color }"
                  />
                </div>
                <span class="cat-bar-pct">{{ cat.pct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-data-msg">
          <span class="no-data-emoji">📭</span>
          <p>Chưa có dữ liệu chi tiêu</p>
          <p class="no-data-sub">Thêm giao dịch đầu tiên để xem phân tích</p>
        </div>
      </div>

      <!-- So sánh các tháng -->
      <div class="chart-card animate__animated animate__fadeInRight" style="animation-delay:200ms">
        <div class="chart-header">
          <div>
            <p class="chart-title">📅 So sánh các tháng</p>
            <p class="chart-subtitle">Thu nhập vs Chi tiêu (6 tháng gần nhất)</p>
          </div>
        </div>
        <div class="chart-wrapper">
          <v-chart :option="barOption" autoresize style="height:260px" />
        </div>
        <!-- Mobile fallback: mini summary -->
        <div class="mobile-bar-summary">
          <div class="mbs-row" v-for="(m, i) in realMonthlyData" :key="i">
            <span class="mbs-label">{{ m.label }}</span>
            <span class="mbs-income">+{{ formatShort(m.income) }}</span>
            <span class="mbs-expense">-{{ formatShort(m.expense) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Recent Transactions ──────────────────────────────── -->
    <div class="section-header">
      <p class="section-title-text">🕐 Giao dịch gần đây</p>
      <button class="see-all-btn" @click="emit('navigate', 'transactions')">
        Xem tất cả <span class="see-all-arrow">→</span>
      </button>
    </div>
    <div class="tx-list animate__animated animate__fadeIn" style="animation-delay:400ms">
      <div
        v-for="tx in recentTransactions"
        :key="tx.id"
        class="tx-row"
      >
        <div
          class="tx-icon-wrap"
          :style="{ background: getCatColor(tx.category) + '22', color: getCatColor(tx.category) }"
        >
          <el-icon :size="16"><component :is="getCatIcon(tx.category)" /></el-icon>
        </div>
        <div class="tx-info">
          <p class="tx-name">{{ tx.description }}</p>
          <p class="tx-meta">{{ getCatLabel(tx.category) }} · {{ formatDate(tx.date) }}</p>
        </div>
        <span
          class="tx-amount-tag"
          :class="tx.type === 'income' ? 'tx-income' : 'tx-expense'"
        >
          {{ tx.type === 'income' ? '+' : '-' }}{{ formatVND(tx.amount) }}
        </span>
      </div>

      <div v-if="recentTransactions.length === 0" class="no-tx-msg">
        <span>📭</span>
        <p>Chưa có giao dịch nào. Bắt đầu bằng cách thêm thu nhập!</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart as EPieChart, BarChart as EBarChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'

use([CanvasRenderer, EPieChart, EBarChart, TooltipComponent, LegendComponent, GridComponent])

const store = useExpenseStore()

// ── Period ──────────────────────────────────────────────────
const periods = [
  { key: 'month',   label: 'Theo tháng'  },
  { key: 'last',    label: 'Tháng trước' },
  { key: 'quarter', label: 'Quý này'     },
  { key: 'year',    label: 'Năm nay'     },
]
const activePeriod = ref('month')
const activePeriodLabel = computed(() => periods.find(p => p.key === activePeriod.value)?.label)

// ── Month Picker ─────────────────────────────────────────────
const _now = new Date()
// Mặc định: tháng hiện tại, format "YYYY-MM"
const selectedMonth = ref(
  `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}`
)

// Parse selectedMonth → { year, month (0-indexed) }
const selectedMonthMeta = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  return { year: y, month: m - 1 }
})

// ── Real Data Calculation ───────────────────────────────────
const getFilteredTransactions = (period) => {
  const now = new Date()
  const currentYear  = now.getFullYear()
  const currentMonth = now.getMonth()

  return store.transactions.filter(t => {
    const tDate  = new Date(t.date)
    const tYear  = tDate.getFullYear()
    const tMonth = tDate.getMonth()

    if (period === 'month') {
      return tYear === selectedMonthMeta.value.year && tMonth === selectedMonthMeta.value.month
    }
    if (period === 'last') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastYear  = currentMonth === 0 ? currentYear - 1 : currentYear
      return tYear === lastYear && tMonth === lastMonth
    }
    if (period === 'quarter') {
      const currentQuarter = Math.floor(currentMonth / 3)
      const tQuarter       = Math.floor(tMonth / 3)
      return tYear === currentYear && tQuarter === currentQuarter
    }
    if (period === 'year') {
      return tYear === currentYear
    }
    return true
  })
}

const displayData = computed(() => {
  const txs = getFilteredTransactions(activePeriod.value)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return {
    income,
    expense,
    saving: income - expense,
  }
})

const spendingRate = computed(() => {
  const inc = displayData.value.income
  const exp = displayData.value.expense
  if (!inc) return exp > 0 ? 100 : 0
  return Math.min(100, Math.round((exp / inc) * 100))
})

const savingMessage = computed(() => {
  const s = displayData.value.saving
  if (s > 0) return 'Bạn đang tiết kiệm tốt!'
  if (s < 0) return 'Chi tiêu vượt thu nhập!'
  return 'Chưa có khoản tiết kiệm.'
})

// ── Health label ─────────────────────────────────────────────
const healthLabel = computed(() => {
  const inc = displayData.value.income
  const exp = displayData.value.expense
  
  if (inc === 0 && exp === 0) return 'Chưa có dữ liệu'
  if (inc === 0 && exp > 0) return 'Cần chú ý ❗'
  if (exp > inc) return 'Báo động 🚨'
  
  const r = 100 - spendingRate.value
  if (r >= 60) return 'Xuất sắc 🌟'
  if (r >= 40) return 'Khá tốt 👍'
  if (r >= 20) return 'Trung bình ⚠️'
  return 'Cần chú ý ❗'
})
const healthClass = computed(() => {
  const inc = displayData.value.income
  const exp = displayData.value.expense
  
  if (inc === 0 && exp > 0) return 'health-bad'
  if (exp > inc) return 'health-bad'
  
  const r = 100 - spendingRate.value
  if (r >= 60) return 'health-excellent'
  if (r >= 40) return 'health-good'
  if (r >= 20) return 'health-mid'
  return 'health-bad'
})
const healthDesc = computed(() => {
  const inc = displayData.value.income
  const exp = displayData.value.expense
  const saved = 100 - spendingRate.value

  if (inc === 0 && exp > 0) return 'Bạn đang chi tiêu khi chưa có thu nhập ghi nhận.'
  if (exp > inc) return `Cảnh báo: Bạn đang chi vượt thu nhập ${formatVND(exp - inc)}`
  if (inc === 0) return 'Bắt đầu ghi chép để theo dõi sức khỏe tài chính'
  return `Bạn đang giữ lại ${saved}% thu nhập trong giai đoạn này`
})

// ── AI Insight ───────────────────────────────────────────────
const showInsightDetail = ref(false)
const insightMessage = computed(() => {
  const inc = displayData.value.income
  const exp = displayData.value.expense

  if (inc === 0 && exp > 0) return 'Cảnh báo: Bạn đang phát sinh chi phí khi chưa có nguồn thu. Hãy bổ sung thu nhập để tránh thâm hụt tài chính!'
  if (inc === 0) return 'Bạn chưa có thu nhập trong kỳ này. Hãy ghi lại các nguồn thu để trợ lý phân tích chính xác hơn.'
  
  if (exp > inc) return `Tình hình đang khá nghiêm trọng! Bạn đã chi vượt thu nhập ${formatVND(exp - inc)}. Hãy rà soát ngay các khoản chi không cần thiết.`
  
  if (spendingRate.value > 80) return `Tháng này bạn chi đến ${spendingRate.value}% thu nhập. Bạn đang ở ngưỡng nguy hiểm, hãy thắt chặt chi tiêu ngay!`
  if (spendingRate.value > 60) return `Bạn đã chi ${spendingRate.value}% thu nhập. Mức tiết kiệm đang hơi thấp, hãy thử cắt giảm danh mục "${topCategories.value[0]?.name}" xem sao.`
  if (spendingRate.value > 40) return `Bạn đã chi ${spendingRate.value}% thu nhập. Mức độ kiểm soát khá ổn, cố gắng duy trì nhé!`
  return `Tuyệt vời! Bạn chỉ chi ${spendingRate.value}% thu nhập. Đây là nền tảng tài chính cực kỳ lành mạnh.`
})
const insightTips = computed(() => {
  const tips = []
  if (topCategories.value[0]) {
    tips.push({
      id: 1,
      icon: '🏠',
      title: `Danh mục tốn nhiều nhất: ${topCategories.value[0].name}`,
      desc: `Chiếm ${topCategories.value[0].pct}% tổng chi tiêu của bạn trong kỳ này.`,
    })
  }
  tips.push({
    id: 2,
    icon: '📈',
    title: 'Gợi ý tiết kiệm',
    desc: 'Thử đặt mục tiêu tiết kiệm ít nhất 20% thu nhập mỗi tháng.',
  })
  tips.push({
    id: 3,
    icon: '🔔',
    title: 'Nhắc nhở',
    desc: 'Ghi lại giao dịch ngay khi phát sinh giúp bạn kiểm soát chi tiêu tốt hơn.',
  })
  return tips
})

// ── Categories ───────────────────────────────────────────────
const EMOJI_MAP = {
  food: '🍜', transport: '🚗', shopping: '🛒', entertainment: '🎮',
  health: '💊', education: '🎓', housing: '🏠', utilities: '💡',
  savings: '🏦', income: '💰', other: '📌',
}

const topCategories = computed(() => {
  const txs = getFilteredTransactions(activePeriod.value)
  const map = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })

  const total = Object.values(map).reduce((s, v) => s + v, 0)
  
  return Object.entries(map).map(([key, value]) => {
    const cat = CATEGORIES.find(c => c.value === key)
    return {
      id: key,
      name: cat?.label ?? key,
      value,
      color: cat?.color ?? '#6b7280',
      pct: total ? Math.round((value / total) * 100) : 0,
      emoji: EMOJI_MAP[key] ?? '📌',
    }
  })
  .sort((a, b) => b.value - a.value)
  .slice(0, 6)
})

const hasExpenseData = computed(() => topCategories.value.length > 0)

const expandedCat = ref(null)
function toggleCatDetail(id) {
  expandedCat.value = expandedCat.value === id ? null : id
}

function getRecentTransactionsForCat(categoryId) {
  const txs = getFilteredTransactions(activePeriod.value)
  return txs
    .filter(t => t.category === categoryId && t.type === 'expense')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)
}

function goToTransactionsFiltered(categoryId) {
  emit('navigate', { tab: 'transactions', filter: { type: 'expense', category: categoryId } })
}

// ── Donut chart ─────────────────────────────────────────────
const donutOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: p => `<b>${p.name}</b><br/>${formatVND(p.value)} (${p.percent}%)`,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: '#e2e8f0', fontSize: 13 },
  },
  legend: { show: false },
  series: [{
    type: 'pie',
    radius: ['45%', '72%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary, #0f172a)' },
      itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.3)' },
    },
    data: topCategories.value.map(c => ({
      name: c.name,
      value: c.value,
      itemStyle: { color: c.color },
    })),
  }],
}))

// ── Bar chart (Real Monthly Data) ───────────────────────────
const realMonthlyData = computed(() => {
  const now = new Date()
  const data = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `Th${d.getMonth() + 1}`
    const month = d.getMonth()
    const year = d.getFullYear()

    const txs = store.transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getMonth() === month && tDate.getFullYear() === year
    })

    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    data.push({ label, income, expense })
  }
  return data
})

const barOption = computed(() => ({
  color: ['#10b981', '#ef4444'],
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: params =>
      params.map(p => `${p.marker} ${p.seriesName}: <b>${formatVND(p.value)}</b>`).join('<br/>'),
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: '#e2e8f0', fontSize: 13 },
  },
  legend: {
    data: ['Thu nhập', 'Chi tiêu'],
    bottom: 0,
    textStyle: { color: '#94a3b8', fontSize: 12 },
    itemHeight: 10,
  },
  grid: { left: '2%', right: '2%', bottom: 65, top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: realMonthlyData.value.map(m => m.label),
    axisLine: { lineStyle: { color: 'rgba(148,163,184,0.3)' } },
    axisLabel: { color: '#94a3b8', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#94a3b8',
      fontSize: 11,
      formatter: v => v >= 1e6 ? (v / 1e6).toFixed(0) + 'M' : v,
    },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
  },
  series: [
    {
      name: 'Thu nhập',
      type: 'bar',
      data: realMonthlyData.value.map((m, i) => ({
        value: m.income,
        itemStyle: {
          color: '#10b981',
          borderRadius: [5, 5, 0, 0],
          opacity: i === 5 ? 1 : 0.7,
        },
      })),
      barWidth: '30%',
      barGap: '20%',
    },
    {
      name: 'Chi tiêu',
      type: 'bar',
      data: realMonthlyData.value.map((m, i) => ({
        value: m.expense,
        itemStyle: {
          color: '#ef4444',
          borderRadius: [5, 5, 0, 0],
          opacity: i === 5 ? 1 : 0.7,
        },
      })),
      barWidth: '30%',
    },
  ],
}))

// ── Recent transactions ──────────────────────────────────────
const emit = defineEmits(['navigate'])

const recentTransactions = computed(() =>
  [...store.transactions]
    .filter(t => t.type === 'income' || t.type === 'expense')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)
)

// ── Helpers ──────────────────────────────────────────────────
function getCatInfo(v) {
  return CATEGORIES.find(c => c.value === v) ?? CATEGORIES[CATEGORIES.length - 1]
}
const getCatIcon  = v => getCatInfo(v).icon
const getCatColor = v => getCatInfo(v).color
const getCatLabel = v => getCatInfo(v).label

const formatVND = v =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

const formatShort = v => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  return v.toLocaleString('vi-VN')
}

const formatDate = d =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(d))

const formatDateShort = d =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
    .format(new Date(d))
</script>

<style scoped>
/* ── Tokens ─────────────── */
.dashboard {
  padding: 20px 24px 32px;
}

/* ── Period Bar ──────────────────────────────────────────── */
.period-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.period-tabs {
  display: flex;
  gap: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 5px;
}
.period-tab {
  padding: 7px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  white-space: nowrap;
  font-family: inherit;
}
.period-tab.active {
  background: #6366f1;
  color: #fff;
  box-shadow: 0 3px 10px rgba(99,102,241,0.3);
}
/* ── Month Picker (el-date-picker) ───────────────────────── */
.month-picker-el {
  width: 148px !important;
}

/* Override El input wrapper để khớp style period-tabs */
.month-picker-el :deep(.el-input__wrapper) {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  padding: 0 12px !important;
  height: 36px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
}
.month-picker-el :deep(.el-input__wrapper:hover) {
  border-color: var(--accent) !important;
}
.month-picker-el :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(47,164,168,0.15) !important;
}
.month-picker-el :deep(.el-input__inner) {
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  text-align: center !important;
}
.month-picker-el :deep(.el-input__prefix) {
  color: #6366f1 !important;
}

/* ── Summary Grid ─────────────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.summary-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: default;
}
.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.card-icon-wrap {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-emoji { font-size: 22px; }
.card-body { flex: 1; min-width: 0; }
.card-label {
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
}
.card-value {
  font-size: 18px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -0.5px; margin-bottom: 6px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.card-sub { font-size: 12px; font-weight: 500; }
.income-sub { color: #10b981; }
.expense-sub { color: #ef4444; }
.saving-sub { color: #10b981; }
.health-sub { color: var(--text-secondary); font-size: 11px; }
.trend-up   { color: #10b981; }

.mini-progress-wrap { display: flex; align-items: center; gap: 8px; }
.mini-progress-bar  { flex: 1; height: 5px; background: var(--card-border); border-radius: 9px; overflow: hidden; }
.mini-progress-fill { height: 100%; background: #ef4444; border-radius: 9px; transition: width 0.6s ease; }
.mini-progress-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }

.health-value { font-size: 16px !important; }
.health-excellent { color: #10b981 !important; }
.health-good      { color: #3b82f6 !important; }
.health-mid       { color: #f59e0b !important; }
.health-bad       { color: #ef4444 !important; }

/* ── Insight Banner ──────────────────────────────────────── */
.insight-banner {
  background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%);
  border: 1px solid rgba(99,102,241,0.2);
  border-left: 4px solid #6366f1;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 14px;
}
body.theme-black .insight-banner {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.35);
  border-left-color: #6366f1;
}
body.theme-blue .insight-banner {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.25);
}
.insight-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
.insight-robot { font-size: 24px; flex-shrink: 0; }
.insight-title {
  font-size: 12px; font-weight: 700; color: #6366f1;
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
}
.insight-body { font-size: 14px; color: var(--text-primary); line-height: 1.55; }
.insight-btn {
  padding: 8px 16px; border: 1.5px solid #6366f1; border-radius: 10px;
  background: transparent; color: #6366f1; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: inherit;
}
.insight-btn:hover { background: #6366f1; color: #fff; }

.insight-detail {
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px;
  padding: 16px 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 14px;
}
.insight-tip { display: flex; gap: 12px; align-items: flex-start; }
.tip-icon { font-size: 20px; flex-shrink: 0; }
.tip-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.tip-desc  { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* ── Charts Row ──────────────────────────────────────────── */
.charts-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 28px;
}
.chart-card {
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px;
  padding: 20px 22px; transition: transform 0.25s ease, box-shadow 0.25s ease;
  min-width: 0; width: 100%;
}
.chart-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.chart-header { margin-bottom: 16px; }
.chart-title    { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
.chart-subtitle { font-size: 12px; color: var(--text-secondary); }
.chart-wrapper  { border-radius: 10px; overflow: hidden; width: 100%; }
.mobile-bar-summary { display: none; }

.donut-wrapper { margin-bottom: 12px; width: 100%; }
.cat-list { display: flex; flex-direction: column; gap: 0; }
.cat-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 4px; border-radius: 10px; cursor: pointer;
  transition: background 0.15s ease; gap: 8px;
}
.cat-row:hover { background: rgba(47,164,168,0.06); }
.cat-row-left  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.cat-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.cat-emoji-icon { font-size: 16px; }
.cat-name  { font-size: 13.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-amount { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.cat-pct    { font-size: 12px; color: var(--text-secondary); min-width: 32px; text-align: right; }
.cat-chevron { color: var(--text-secondary); font-size: 12px; transition: transform 0.2s; }
.cat-chevron.rotated { transform: rotate(180deg); }

.cat-detail-dropdown {
  background: rgba(99, 102, 241, 0.04);
  border-radius: 8px;
  padding: 12px;
  margin-top: 4px;
  margin-bottom: 8px;
  border: 1px solid var(--card-border);
}
.cat-detail-tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.cat-detail-tx {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.cat-tx-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.cat-tx-date {
  color: var(--text-secondary);
  font-size: 11px;
  background: var(--card-bg);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
.cat-tx-desc {
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-tx-amount {
  font-weight: 600;
  color: #ef4444;
  white-space: nowrap;
}
.cat-tx-empty {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  padding: 8px 0;
}
.cat-see-all-btn {
  width: 100%;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.cat-see-all-btn:hover {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.cat-bars { padding: 12px 0 4px; display: flex; flex-direction: column; gap: 9px; }
.cat-bar-row { display: flex; align-items: center; gap: 8px; }
.cat-bar-label { font-size: 12px; color: var(--text-secondary); width: 68px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-bar-track { flex: 1; height: 7px; background: var(--card-border); border-radius: 9px; overflow: hidden; }
.cat-bar-fill  { height: 100%; border-radius: 9px; transition: width 0.7s cubic-bezier(0.4,0,0.2,1); }
.cat-bar-pct   { font-size: 12px; color: var(--text-secondary); width: 30px; text-align: right; }

.no-data-msg {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 40px 0; text-align: center;
}
.no-data-emoji { font-size: 40px; }
.no-data-msg p { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.no-data-sub   { font-size: 13px !important; }

/* ── Section header ──────────────────────────────────────── */
.section-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.section-title-text { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.see-all-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 600; color: var(--accent);
  background: transparent; border: none; cursor: pointer;
  font-family: inherit; padding: 4px 0;
  transition: opacity 0.2s ease;
}
.see-all-btn:hover { opacity: 0.7; }
.see-all-arrow { transition: transform 0.2s ease; display: inline-block; }
.see-all-btn:hover .see-all-arrow { transform: translateX(4px); }

/* ── Transactions ────────────────────────────────────────── */
.tx-list {
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; overflow: hidden;
}
.tx-row {
  display: flex; align-items: center; gap: 14px; padding: 14px 20px;
  border-bottom: 1px solid var(--card-border); transition: background 0.15s ease;
}
.tx-row:last-child { border-bottom: none; }
.tx-row:hover { background: rgba(47,164,168,0.04); }
.tx-icon-wrap {
  width: 38px; height: 38px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tx-info { flex: 1; min-width: 0; }
.tx-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-meta { font-size: 12px; color: var(--text-secondary); }
.tx-amount-tag { font-size: 14px; font-weight: 700; flex-shrink: 0; letter-spacing: -0.3px; }
.tx-income  { color: #10b981; }
.tx-expense { color: #ef4444; }

.no-tx-msg {
  display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 20px; text-align: center;
}
.no-tx-msg span { font-size: 36px; }
.no-tx-msg p { font-size: 14px; color: var(--text-secondary); font-weight: 500; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row   { grid-template-columns: 1fr; }
  .donut-wrapper { margin-bottom: 24px; }
}

@media (max-width: 768px) {
  .dashboard { padding: 14px 12px 24px; }
  .period-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .period-tabs::-webkit-scrollbar { display: none; }
  .summary-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .summary-card { padding: 14px; gap: 10px; border-radius: 14px; }
  .card-value { font-size: 15px; }
  .insight-banner { flex-direction: column; align-items: flex-start; gap: 12px; padding: 14px 16px; }
  .insight-btn { align-self: flex-start; }
  .chart-card { padding: 16px 16px; }
  .chart-wrapper { margin-bottom: 16px; }
  .mobile-bar-summary { display: block; background: rgba(0,0,0,0.02); border-radius: 12px; padding: 0 12px; }
  .mbs-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid var(--card-border); font-size: 13px;
  }
  .mbs-row:last-child { border-bottom: none; }
  .mbs-label   { font-weight: 600; color: var(--text-primary); width: 36px; }
  .mbs-income  { color: #10b981; font-weight: 700; flex: 1; }
  .mbs-expense { color: #ef4444; font-weight: 700; flex: 1; text-align: right; }
}
</style>