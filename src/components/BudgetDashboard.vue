<template>
  <div class="budget-dashboard">
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

      <div v-if="activePeriod === 'quarter'" class="quarter-selector-wrap">
        <el-date-picker
          v-model="quarterYear"
          type="year"
          placeholder="Năm"
          value-format="YYYY"
          :clearable="false"
          :editable="false"
          class="year-picker-el"
          popper-class="month-picker-popper"
        />
        <el-select
          v-model="quarterVal"
          placeholder="Quý"
          class="quarter-select-el"
          popper-class="quarter-select-popper"
        >
          <el-option :value="1" label="Quý 1" />
          <el-option :value="2" label="Quý 2" />
          <el-option :value="3" label="Quý 3" />
          <el-option :value="4" label="Quý 4" />
        </el-select>
      </div>

      <el-date-picker
        v-if="activePeriod === 'year'"
        v-model="selectedYear"
        type="year"
        placeholder="Chọn năm"
        format="YYYY"
        value-format="YYYY"
        :clearable="false"
        :editable="false"
        class="month-picker-el"
        popper-class="month-picker-popper"
      />
    </div>

    <!-- ── Overview Header ─────────────────────────────────── -->
    <div class="budget-overview animate__animated animate__fadeIn">
      <div class="overview-content">
        <div class="overview-title-row">
          <h2 class="overview-title">Nguyên tắc 50/30/20</h2>
          <span class="recommended-badge">✦ Khuyến nghị</span>
        </div>
        <p class="overview-desc">
          Phân bổ thu nhập của bạn thành 3 nhóm chính để duy trì tài chính lành mạnh. Dưới đây là phân tích dựa trên thu nhập <b>{{ formatVND(displayData.income) }}</b> trong {{ activePeriodLabel.toLowerCase() }}.
        </p>
      </div>
    </div>

    <!-- ── Rule Presets ───────────────────────────────────── -->
    <div class="rule-selector-wrap animate__animated animate__fadeIn">
      <div class="rule-presets">
        <button
          v-for="p in ratioPResets"
          :key="p.key"
          class="rule-preset-btn"
          :class="{ active: activePreset === p.key, recommended: p.isRecommended }"
          @click="applyPreset(p.key)"
        >
          <div v-if="p.isRecommended" class="btn-recommended-tag">Khuyến nghị</div>
          <div v-if="activePreset === p.key" class="btn-active-badge">Đang chọn</div>
          <span class="preset-name">{{ p.name }}</span>
        </button>
      </div>

      <!-- Rule Note -->
      <div class="rule-note animate__animated animate__fadeIn">
        <el-icon class="note-icon"><InfoFilled /></el-icon>
        <div class="note-content">
          <span class="note-title">{{ activePresetObj?.name }}:</span>
          <span class="note-text">{{ activePresetObj?.desc }}</span>
        </div>
      </div>

      <!-- Custom Sliders -->
      <transition name="slide-down">
        <div v-if="activePreset === 'custom'" class="custom-ratio-editor">
          <div class="ratio-preview-bar">
            <div class="ratio-seg" :style="{ width: customRatios[0] + '%', background: '#3b82f6' }">
              <span v-if="customRatios[0] >= 10">{{ customRatios[0] }}%</span>
            </div>
            <div class="ratio-seg" :style="{ width: customRatios[1] + '%', background: '#f59e0b' }">
              <span v-if="customRatios[1] >= 10">{{ customRatios[1] }}%</span>
            </div>
            <div class="ratio-seg" :style="{ width: customRatios[2] + '%', background: '#10b981' }">
              <span v-if="customRatios[2] >= 10">{{ customRatios[2] }}%</span>
            </div>
          </div>

          <div class="ratio-sliders">
            <div v-for="(item, i) in ratioSliderDefs" :key="i" class="ratio-slider-row">
              <span class="ratio-dot" :style="{ background: item.color }" />
              <span class="ratio-slider-label">{{ item.label }}</span>
              <input
                type="range" min="5" max="90" step="1"
                :value="customRatios[i]"
                class="ratio-range"
                :style="{ '--thumb-color': item.color }"
                @input="onRatioSlide(i, $event)"
              />
              <span class="ratio-value">{{ customRatios[i] }}%</span>
            </div>
          </div>
          <p class="ratio-sum-hint" :class="{ error: ratioSum !== 100 }">
            Tổng: <b>{{ ratioSum }}%</b>
            <span v-if="ratioSum !== 100"> — Cần đủ 100%</span>
            <span v-else> ✓</span>
          </p>
        </div>
      </transition>
    </div>

    <!-- ── Budget Suggestions (dynamic ratios) ────────────────── -->
    <div class="budget-suggestion-grid animate__animated animate__fadeInUp" style="animation-delay:100ms">
      <div v-for="group in budgetAnalysis" :key="group.key" class="budget-group-card">
        <!-- Top Row: Icon and Usage -->
        <div class="bgc-top">
          <div class="bgc-brand">
            <div class="bgc-icon-circle" :style="{ background: group.color + '15', color: group.color }">
              <el-icon :size="20"><component :is="group.icon" /></el-icon>
            </div>
            <div class="bgc-info">
              <h3 class="bgc-name">{{ group.label }}</h3>
              <div class="bgc-status-chip" :class="group.statusClass">
                <span class="status-dot" />
                {{ group.statusText }}
              </div>
            </div>
          </div>
          <div class="bgc-usage">
            <span class="usage-val" :style="{ color: group.color }">{{ group.percentOfIncome }}%</span>
            <span class="usage-label">Sử dụng</span>
          </div>
        </div>

        <!-- Middle: Unique Progress visualization -->
        <div class="bgc-mid">
          <div class="bgc-gauge-container">
            <div class="bgc-gauge-track">
              <!-- Target zone shadow -->
              <div 
                class="bgc-target-zone" 
                :style="{ 
                  left: 0, 
                  width: group.target + '%', 
                  background: group.color + '10' 
                }"
              />
              <!-- Active progress -->
              <div 
                class="bgc-gauge-fill" 
                :style="{ width: Math.min(100, group.percentOfIncome) + '%', background: group.color }"
              />
              <!-- Target marker -->
              <div class="bgc-marker" :style="{ left: group.target + '%' }">
                <div class="marker-line" />
                <div class="marker-label">Mục tiêu {{ group.target }}%</div>
              </div>
            </div>
          </div>
          
          <div class="bgc-amounts">
            <div class="amt-item">
              <span class="amt-label">Thực tế</span>
              <span class="amt-val">{{ formatVND(group.actual) }}</span>
            </div>
            <div class="amt-sep" />
            <div class="amt-item text-right">
              <span class="amt-label">Hạn mức</span>
              <span class="amt-val secondary">{{ formatVND(group.targetAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Bottom: Categories & Advice -->
        <div class="bgc-bottom">
          <div class="bgc-categories">
            <span v-for="cat in group.catDetails" :key="cat.value" class="bgc-cat-pill">
              {{ cat.label }}
            </span>
            <span v-if="group.key === 'savings'" class="bgc-cat-pill">Số dư còn lại</span>
          </div>
          
          <div class="bgc-tip">
            <div class="tip-icon" :style="{ color: group.color }">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <p class="tip-text">{{ group.advice }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useExpenseStore, CATEGORIES } from '../stores/expenseStore'

const store = useExpenseStore()

// ── Budget Rule Presets ─────────────────────────────────────
const ratioPResets = [
  { key: '503020', name: '50/30/20', ratios: [50, 30, 20], desc: 'Khuyến nghị phổ biến', isRecommended: true },
  { key: '602020', name: '60/20/20', ratios: [60, 20, 20], desc: 'Chi tiêu cao' },
  { key: '502525', name: '50/25/25', ratios: [50, 25, 25], desc: 'Cân bằng & Tích lũy' },
  { key: '401545', name: '40/15/45', ratios: [40, 15, 45], desc: 'Tiết kiệm mạnh mẽ' },
  { key: 'custom',  name: 'Tuỳ chỉnh', ratios: [50, 30, 20], desc: 'Tự thiết lập tỷ lệ' },
]

// ── Persistence ─────────────────────────────────────────────
const STORAGE_KEY_PRESET = 'budget_active_preset'
const STORAGE_KEY_RATIOS = 'budget_custom_ratios'

const activePreset = ref('503020')
const customRatios = ref([50, 30, 20])

onMounted(() => {
  const savedPreset = localStorage.getItem(STORAGE_KEY_PRESET)
  if (savedPreset) activePreset.value = savedPreset

  const savedRatios = localStorage.getItem(STORAGE_KEY_RATIOS)
  if (savedRatios) {
    try {
      customRatios.value = JSON.parse(savedRatios)
    } catch (e) {
      console.error('Error parsing saved ratios', e)
    }
  }
})

watch(activePreset, (newVal) => {
  localStorage.setItem(STORAGE_KEY_PRESET, newVal)
})

watch(customRatios, (newVal) => {
  localStorage.setItem(STORAGE_KEY_RATIOS, JSON.stringify(newVal))
}, { deep: true })

const activePresetObj = computed(() => ratioPResets.find(p => p.key === activePreset.value))

const activePresetName = computed(() => {
  if (activePreset.value === 'custom') return 'Tuỳ chỉnh'
  const p = activePresetObj.value
  return p ? p.name : ''
})

const activeRatioLabel = computed(() => {
  const r = effectiveRatios.value
  return `${r[0]}/${r[1]}/${r[2]}`
})

const effectiveRatios = computed(() => {
  if (activePreset.value === 'custom') return customRatios.value
  return ratioPResets.find(p => p.key === activePreset.value)?.ratios || [50, 30, 20]
})

const ratioSum = computed(() => customRatios.value.reduce((a, b) => a + b, 0))

const ratioSliderDefs = [
  { label: 'Thiết yếu (Needs)', color: '#3b82f6' },
  { label: 'Cá nhân (Wants)',   color: '#f59e0b' },
  { label: 'Tiết kiệm (Savings)', color: '#10b981' },
]

function applyPreset(key) {
  activePreset.value = key
  if (key !== 'custom') {
    const preset = ratioPResets.find(p => p.key === key)
    if (preset) customRatios.value = [...preset.ratios]
  }
}

function onRatioSlide(idx, event) {
  const newVal = Number(event.target.value)
  const old = customRatios.value[idx]
  const diff = newVal - old
  const others = [0, 1, 2].filter(i => i !== idx)
  // Distribute diff across others proportionally (or equally)
  const total = others.reduce((s, i) => s + customRatios.value[i], 0)
  let newRatios = [...customRatios.value]
  newRatios[idx] = newVal
  if (total > 0) {
    let rem = diff
    others.forEach((i, pos) => {
      if (pos === others.length - 1) {
        newRatios[i] = Math.max(5, newRatios[i] - rem)
      } else {
        const share = Math.round((customRatios.value[i] / total) * diff)
        newRatios[i] = Math.max(5, customRatios.value[i] - share)
        rem -= (customRatios.value[i] - newRatios[i])
      }
    })
  }
  // Clamp and re-normalize to 100
  const sum = newRatios.reduce((a, b) => a + b, 0)
  if (sum !== 100) {
    const last = others[others.length - 1]
    newRatios[last] = Math.max(5, newRatios[last] + (100 - sum))
  }
  customRatios.value = newRatios
}

// ── Period ──────────────────────────────────────────────────
const periods = [
  { key: 'month',   label: 'Theo tháng'  },
  { key: 'last',    label: 'Tháng trước' },
  { key: 'quarter', label: 'Theo quý'    },
  { key: 'year',    label: 'Theo năm'    },
]
const activePeriod = ref('month')
const activePeriodLabel = computed(() => {
  if (activePeriod.value === 'month') {
    const { year, month } = selectedMonthMeta.value
    return `Tháng ${month + 1}/${year}`
  }
  if (activePeriod.value === 'quarter') {
    const [y, q] = selectedQuarter.value.split('-Q')
    return `Quý ${q}/${y}`
  }
  if (activePeriod.value === 'year') {
    return `Năm ${selectedYear.value}`
  }
  return periods.find(p => p.key === activePeriod.value)?.label
})

// ── Date Selection Refs ─────────────────────────────────────
const _now = new Date()

// Month: default current month "YYYY-MM"
const selectedMonth = ref(
  `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}`
)

// Quarter selection: year + quarter
const quarterYear = ref(_now.getFullYear().toString())
const quarterVal = ref(Math.floor(_now.getMonth() / 3) + 1)
const selectedQuarter = computed(() => `${quarterYear.value}-Q${quarterVal.value}`)

// Year: default current year "YYYY"
const selectedYear = ref(
  `${_now.getFullYear()}`
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
      const [y, qStr] = selectedQuarter.value.split('-Q')
      const yNum = Number(y)
      const qNum = Number(qStr)
      const tQuarter = Math.floor(tMonth / 3) + 1
      return tYear === yNum && tQuarter === qNum
    }
    if (period === 'year') {
      const yNum = Number(selectedYear.value)
      return tYear === yNum
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

// ── Budget Analysis (dynamic ratios) ─────────────────────────
const budgetAnalysis = computed(() => {
  const inc = displayData.value.income
  const txs = getFilteredTransactions(activePeriod.value)
  const expenseTxs = txs.filter(t => t.type === 'expense')
  const [r0, r1, r2] = effectiveRatios.value

  const groups = [
    {
      key: 'needs',
      label: 'Thiết yếu',
      icon: 'ShoppingCart',
      target: r0,
      color: '#3b82f6',
      categories: ['food', 'transport', 'health', 'housing'],
    },
    {
      key: 'wants',
      label: 'Cá nhân',
      icon: 'User',
      target: r1,
      color: '#f59e0b',
      categories: ['shopping', 'entertainment', 'education', 'other'],
    },
    {
      key: 'savings',
      label: 'Tiết kiệm',
      icon: 'TrendCharts',
      target: r2,
      color: '#10b981',
      categories: [], // Savings is income - total expense
    }
  ]

  return groups.map(g => {
    let actual = 0
    if (g.key === 'savings') {
      actual = Math.max(0, inc - expenseTxs.reduce((s, t) => s + t.amount, 0))
    } else {
      actual = expenseTxs
        .filter(t => g.categories.includes(t.category))
        .reduce((s, t) => s + t.amount, 0)
    }

    const percentOfIncome = inc > 0 ? Math.round((actual / inc) * 100) : 0
    const targetAmount = Math.round((inc * g.target) / 100)
    
    let statusText = 'Ổn định'
    let statusClass = 'status-ok'
    let advice = ''

    if (g.key === 'savings') {
      if (percentOfIncome >= g.target) {
        statusText = 'Rất tốt'
        statusClass = 'status-excellent'
        advice = `Bạn đang tiết kiệm vượt mức mong đợi ${formatVND(actual - targetAmount)}.`
      } else {
        statusText = 'Cần cải thiện'
        statusClass = 'status-warn'
        advice = `Hãy cố gắng cắt giảm chi tiêu không cần thiết để đạt mục tiêu tiết kiệm ${formatVND(targetAmount)}.`
      }
    } else {
      if (percentOfIncome <= g.target) {
        statusText = 'Trong tầm kiểm soát'
        statusClass = 'status-ok'
        advice = `Chi tiêu ${g.label.toLowerCase()} đang ở mức an toàn.`
      } else {
        statusText = 'Vượt ngân sách'
        statusClass = 'status-bad'
        advice = `Bạn đang chi quá hạn mức ${formatVND(actual - targetAmount)}. Hãy xem xét cắt giảm ngay.`
      }
    }


    const catDetails = g.categories.map(cKey => {
      const found = CATEGORIES.find(c => c.value === cKey)
      return { value: cKey, label: found?.label || cKey }
    })

    return { ...g, actual, percentOfIncome, targetAmount, statusText, statusClass, advice, catDetails }
  })
})

const formatVND = v =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
</script>

<style scoped>
.budget-dashboard {
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

.month-picker-el {
  width: 160px !important;
}
.quarter-selector-wrap {
  display: flex;
  gap: 8px;
}
.year-picker-el {
  width: 100px !important;
}
.quarter-select-el {
  width: 105px !important;
}

.month-picker-el :deep(.el-input__wrapper),
.year-picker-el :deep(.el-input__wrapper),
.quarter-select-el :deep(.el-select__wrapper) {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  padding: 0 12px !important;
  height: 36px !important;
  min-height: 36px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
}
.month-picker-el :deep(.el-input__wrapper:hover),
.year-picker-el :deep(.el-input__wrapper:hover),
.quarter-select-el :deep(.el-select__wrapper:hover) {
  border-color: var(--accent) !important;
}
.month-picker-el :deep(.el-input__wrapper.is-focus),
.year-picker-el :deep(.el-input__wrapper.is-focus),
.quarter-select-el :deep(.el-select__wrapper.is-focused) {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(47,164,168,0.15) !important;
}
.month-picker-el :deep(.el-input__inner),
.year-picker-el :deep(.el-input__inner),
.quarter-select-el :deep(.el-select__selected-item) {
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  text-align: center !important;
}

/* ── Overview Header ───────────────────────────────────── */
.budget-overview {
  background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%);
  border: 1px solid rgba(99,102,241,0.2);
  border-left: 4px solid #6366f1;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
body.theme-black .budget-overview {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.35);
}

.overview-desc {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

/* ── Budget Suggestions ──────────────────────────────────── */
.budget-suggestion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.budget-group-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.bgc-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.bgc-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.bgc-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.05);
}
.bgc-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bgc-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.bgc-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-excellent { color: #10b981; }
.status-ok { color: #3b82f6; }
.status-warn { color: #f59e0b; }
.status-bad { color: #ef4444; }

.bgc-usage {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.usage-val {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}
.usage-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.bgc-mid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bgc-gauge-container {
  padding: 10px 0;
}
.bgc-gauge-track {
  height: 12px;
  background: var(--card-border);
  border-radius: 20px;
  position: relative;
  overflow: visible;
}
.bgc-target-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 20px 0 0 20px;
}
.bgc-gauge-fill {
  height: 100%;
  border-radius: 20px;
  position: relative;
  z-index: 2;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bgc-marker {
  position: absolute;
  top: -12px;
  bottom: -12px;
  width: 2px;
  z-index: 3;
}
.marker-line {
  height: 100%;
  width: 2px;
  background: #fff;
  box-shadow: 0 0 8px rgba(0,0,0,0.4);
}
.marker-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 700;
  color: var(--text-secondary);
  white-space: nowrap;
}

.bgc-amounts {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.amt-item {
  display: flex;
  flex-direction: column;
}
.amt-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 2px;
}
.amt-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.amt-val.secondary {
  color: var(--text-secondary);
  font-weight: 600;
}
.amt-sep {
  flex: 1;
  height: 1px;
  border-bottom: 1px dashed var(--card-border);
  margin: 0 12px;
  transform: translateY(8px);
}

.bgc-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid var(--card-border);
  padding-top: 16px;
}
.bgc-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bgc-cat-pill {
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--card-border);
  padding: 3px 10px;
  border-radius: 100px;
  opacity: 0.7;
}

.bgc-tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  padding: 8px 10px;
}
.tip-icon {
  margin-top: 1px;
  flex-shrink: 0;
}
.tip-text {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-secondary);
  margin: 0;
}

.text-right { text-align: right; }
.bgc-advice {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-secondary);
  border-top: 1px dashed var(--card-border);
  padding-top: 12px;
  margin: 0;
  margin-top: auto;
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 992px) {
  .budget-suggestion-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .budget-dashboard {
    padding: 16px;
  }
}

/* ── Overview title row ─────────────────────────────────── */
.overview-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.overview-title {
  font-size: 16px;
  font-weight: 700;
  color: #6366f1;
  margin: 0;
}
.recommended-badge {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.25);
  border-radius: 20px;
  padding: 2px 9px;
}
.custom-badge {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 20px;
  padding: 2px 9px;
}

/* ── Rule Preset Selector ────────────────────────────────── */
.rule-selector-wrap {
  margin-bottom: 24px;
}
.rule-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 0;
}
.rule-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 18px;
  border: 1.5px solid var(--card-border);
  border-radius: 14px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  position: relative;
  overflow: visible;
}
.rule-preset-btn.recommended {
  border-color: rgba(16,185,129,0.2);
}
.rule-preset-btn.recommended.active {
  border-color: #10b981;
  background: rgba(16,185,129,0.12);
  box-shadow: 0 4px 15px rgba(16,185,129,0.25);
  transform: translateY(-2px);
}
.btn-recommended-tag {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(16,185,129,0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 10;
}
.btn-active-badge {
  position: absolute;
  bottom: -9px;
  left: 50%;
  transform: translateX(-50%);
  background: #6366f1;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(99,102,241,0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 11;
  border: 1.5px solid var(--card-bg);
}
.rule-preset-btn.recommended.active .btn-active-badge {
  background: #10b981;
  box-shadow: 0 2px 5px rgba(16,185,129,0.3);
}
.rule-preset-btn:hover {
  border-color: var(--accent);
  background: rgba(99,102,241,0.05);
  transform: translateY(-1px);
}
.rule-preset-btn.active {
  border-color: #6366f1;
  background: rgba(99,102,241,0.15);
  box-shadow: 0 6px 20px rgba(99,102,241,0.3);
  transform: translateY(-3px);
  border-width: 2px;
}
.preset-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.rule-preset-btn.active .preset-name {
  color: #6366f1;
}
.rule-preset-btn.recommended.active .preset-name {
  color: #10b981;
}

/* Rule Note */
.rule-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(99,102,241,0.05);
  border-radius: 12px;
  padding: 10px 16px;
  margin-top: 4px;
}
.note-icon {
  color: #6366f1;
  margin-top: 3px;
  font-size: 14px;
}
.note-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}
.note-title {
  font-weight: 700;
  color: var(--text-primary);
  margin-right: 6px;
}
.note-text {
  font-weight: 500;
}
body.theme-black .rule-note {
  background: rgba(99,102,241,0.1);
}

/* ── Custom Ratio Editor ─────────────────────────────────── */
.custom-ratio-editor {
  margin-top: 16px;
  background: var(--card-bg);
  border: 1.5px solid rgba(99,102,241,0.25);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Preview stacked bar */
.ratio-preview-bar {
  display: flex;
  height: 32px;
  border-radius: 10px;
  overflow: hidden;
  gap: 2px;
}
.ratio-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.35s ease;
  border-radius: 6px;
}
.ratio-seg span {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* Sliders */
.ratio-sliders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ratio-slider-row {
  display: grid;
  grid-template-columns: 10px 140px 1fr 40px;
  align-items: center;
  gap: 10px;
}
.ratio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ratio-slider-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.ratio-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
}
.ratio-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--card-border);
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}
.ratio-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--thumb-color, #6366f1);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ratio-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 10px rgba(0,0,0,0.25);
}
.ratio-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--thumb-color, #6366f1);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* Sum hint */
.ratio-sum-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  text-align: right;
}
.ratio-sum-hint b {
  color: #10b981;
}
.ratio-sum-hint.error b {
  color: #ef4444;
}
.ratio-sum-hint.error {
  color: #ef4444;
}

/* Slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 400px;
  transform: translateY(0);
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 992px) {
  .budget-suggestion-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .budget-dashboard {
    padding: 12px 16px 80px;
  }
  
  .period-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .period-tabs {
    overflow-x: auto;
    padding: 4px;
    -webkit-overflow-scrolling: touch;
  }
  
  .period-tab {
    padding: 6px 12px;
    font-size: 12.5px;
  }
  
  .month-picker-el, .year-picker-el, .quarter-selector-wrap {
    width: 100% !important;
  }
  
  .budget-overview {
    padding: 12px 14px;
    margin-bottom: 18px;
  }
  
  .overview-title {
    font-size: 15px;
  }
  
  .overview-desc {
    font-size: 13px;
  }

  .rule-selector-wrap {
    margin: 0 -16px 20px;
    padding: 0 16px;
  }
  
  .rule-presets {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 10px 4px 15px;
    gap: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Hide scrollbar Firefox */
  }
  .rule-presets::-webkit-scrollbar {
    display: none; /* Hide scrollbar Chrome/Safari */
  }
  
  .rule-preset-btn {
    flex: 0 0 auto;
    padding: 10px 14px;
    min-width: 90px;
  }

  .ratio-slider-row {
    grid-template-columns: 10px 1fr 45px;
    gap: 8px;
  }
  
  .ratio-slider-label {
    display: none;
  }
  
  .custom-ratio-editor {
    padding: 14px;
    border-radius: 14px;
  }

  .budget-group-card {
    padding: 16px;
    border-radius: 16px;
  }
  
  .bgc-amount {
    font-size: 11px;
  }
  
  .bgc-advice {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .budget-dashboard {
    padding: 12px 12px 80px;
  }
}
</style>
