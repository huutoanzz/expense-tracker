<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="min(700px, 96vw)"
    destroy-on-close
    append-to-body
    class="allocation-dialog"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="ad-header">
        <div class="ad-header-left">
          <div class="ad-header-icon">⚙️</div>
          <div>
            <div class="ad-title">Phân bổ tự động</div>
            <div class="ad-subtitle">Tự động chia thu nhập vào các hũ</div>
          </div>
        </div>
        <button class="ad-close" @click="$emit('update:modelValue', false)">✕</button>
      </div>
    </template>

    <div class="alloc-body">

      <!-- Toggle card -->
      <div class="alloc-header-card" :class="{ 'is-over': isOverLimit }">
        <div class="alloc-toggle-row">
          <div class="alloc-toggle-info">
            <span class="alloc-toggle-title">Kích hoạt phân bổ</span>
            <span class="alloc-toggle-desc">
              Khi có thu nhập, tiền tự chia vào các hũ theo tỷ lệ bên dưới.
            </span>
          </div>
          <el-switch v-model="localEnabled" :disabled="isOverLimit" active-color="#6366f1" />
        </div>
        <div v-if="isOverLimit" class="alloc-warn-banner">
          <el-icon><WarningFilled /></el-icon>
          <span>Tổng vượt 100% — tính năng đã tắt. Điều chỉnh trước khi bật lại.</span>
        </div>
      </div>

      <!-- Total progress bar + reset -->
      <div class="total-summary" :class="{ over: isOverLimit, perfect: totalPercent === 100 }">
        <div class="total-summary-top">
          <span class="total-summary-label">
            <template v-if="isOverLimit">⚠️ Vượt {{ totalPercent - 100 }}%</template>
            <template v-else-if="totalPercent === 100">✅ Đã phân bổ đủ 100%</template>
            <template v-else>{{ totalPercent }}% · còn {{ 100 - totalPercent }}% vào ví</template>
          </span>
          <el-button size="small" text type="danger" @click="resetAll" class="reset-btn">
            Xóa tất cả
          </el-button>
        </div>
        <div class="total-bar-track">
          <div
            class="total-bar-fill"
            :style="{
              width: Math.min(totalPercent, 100) + '%',
              background: isOverLimit ? '#ef4444' : totalPercent === 100 ? '#22c55e' : '#6366f1'
            }"
          />
        </div>
      </div>

      <!-- Jar rules — card per jar -->
      <div class="alloc-rules">
        <div
          v-for="jar in store.jars"
          :key="jar.id"
          class="rule-card"
          :class="{ 'has-value': (localRules[jar.id] || 0) > 0 }"
        >
          <div class="rule-card-top">
            <div class="rule-jar">
              <div class="rule-icon" :style="{ background: jar.color + '22', color: jar.color }">
                <el-icon><component :is="jar.icon" /></el-icon>
              </div>
              <div class="rule-name-wrap">
                <span class="rule-name">{{ jar.name }}</span>
                <span class="rule-sub">
                  {{ jar.balance.toLocaleString('vi-VN') }} / {{ jar.limit.toLocaleString('vi-VN') }} đ
                </span>
              </div>
            </div>

            <div class="rule-right">
              <div v-if="previewIncome > 0" class="rule-preview-amount">
                ≈ {{ previewAmount(jar.id).toLocaleString('vi-VN') }} đ
              </div>
              <div class="custom-input-box" :class="{ focused: focusedId === jar.id }">
                <input
                  type="number"
                  class="custom-input"
                  inputmode="decimal"
                  :min="0"
                  :max="localMode === 'percent' ? 100 : undefined"
                  :step="localMode === 'percent' ? 1 : 50000"
                  :value="localRules[jar.id] || 0"
                  @focus="focusedId = jar.id"
                  @blur="focusedId = null"
                  @input="onInput(jar.id, $event.target.value)"
                />
                <span class="input-unit">%</span>
              </div>
            </div>
          </div>

          <!-- Full-width slider with large thumb -->
          <div class="rule-slider-wrap">
            <input
              type="range"
              class="rule-slider"
              min="0" max="100" step="1"
              :value="localRules[jar.id] || 0"
              @input="onSlider(jar.id, $event.target.value)"
            />
            <div class="slider-labels">
              <span>0%</span>
              <span class="slider-current" :style="{ color: jar.color }">
                {{ localRules[jar.id] || 0 }}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview section -->
      <div class="preview-card" :class="{ over: isOverLimit }">
        <div class="preview-header">
          <span class="section-label">Thử với thu nhập</span>
          <div class="custom-input-box preview-income-input" :class="{ focused: focusedId === 'preview' }">
            <input
              type="number"
              class="custom-input"
              inputmode="numeric"
              min="0"
              :step="500000"
              :value="previewIncome || ''"
              placeholder="0"
              @focus="focusedId = 'preview'"
              @blur="focusedId = null"
              @input="previewIncome = Number($event.target.value) || 0"
            />
            <span class="input-unit">đ</span>
          </div>
        </div>

        <div v-if="previewIncome > 0" class="preview-list">
          <div v-for="jar in store.jars" :key="jar.id" class="preview-row-item">
            <div class="preview-row-left">
              <div class="preview-jar-icon" :style="{ background: jar.color + '22', color: jar.color }">
                <el-icon><component :is="jar.icon" /></el-icon>
              </div>
              <span class="preview-jar-name">{{ jar.name }}</span>
            </div>
            <span class="preview-jar-amount">
              +{{ previewAmount(jar.id).toLocaleString('vi-VN') }} đ
            </span>
          </div>
          <div class="preview-row-item wallet-row">
            <div class="preview-row-left">
              <div class="preview-jar-icon wallet-icon">💼</div>
              <span class="preview-jar-name">Ví chính (còn lại)</span>
            </div>
            <span class="preview-jar-amount green">
              +{{ previewWallet.toLocaleString('vi-VN') }} đ
            </span>
          </div>
        </div>
        <div v-else class="preview-placeholder">
          Nhập thu nhập để xem phân bổ dự kiến
        </div>
      </div>

    </div>

    <template #footer>
      <div class="alloc-footer">
        <el-button @click="$emit('update:modelValue', false)" class="cancel-btn">Huỷ</el-button>
        <el-button type="primary" :disabled="isOverLimit" @click="save" class="save-btn">
          Lưu cài đặt
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useExpenseStore } from '../stores/expenseStore'
import { ElNotification } from 'element-plus'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const store = useExpenseStore()

const localEnabled = ref(store.allocationSettings.enabled)
const localMode = ref(store.allocationSettings.mode || 'percent')
const localRules = ref({ ...store.allocationSettings.rules })
const previewIncome = ref(0)
const focusedId = ref(null)

watch(() => props.modelValue, (open) => {
  if (open) {
    localEnabled.value = store.allocationSettings.enabled
    localMode.value = store.allocationSettings.mode || 'percent'
    localRules.value = { ...store.allocationSettings.rules }
    previewIncome.value = 0
  }
})

const totalPercent = computed(() =>
  Object.values(localRules.value).reduce((a, b) => a + (Number(b) || 0), 0)
)

const isOverLimit = computed(() =>
  localMode.value === 'percent' && totalPercent.value > 100
)

watch(isOverLimit, (over) => { if (over) localEnabled.value = false })

function onSlider(jarId, val) {
  localRules.value[jarId] = Number(val)
  if (isOverLimit.value) localEnabled.value = false
}

function onInput(jarId, val) {
  localRules.value[jarId] = Number(val) || 0
  if (isOverLimit.value) localEnabled.value = false
}

function resetAll() {
  store.jars.forEach(j => { localRules.value[j.id] = 0 })
}

function previewAmount(jarId) {
  if (!previewIncome.value) return 0
  const rule = Number(localRules.value[jarId]) || 0
  return localMode.value === 'percent'
    ? Math.round(previewIncome.value * rule / 100)
    : rule
}

const previewWallet = computed(() => {
  if (!previewIncome.value) return 0
  const totalOut = store.jars.reduce((sum, j) => sum + previewAmount(j.id), 0)
  return Math.max(0, previewIncome.value - totalOut)
})

function save() {
  if (isOverLimit.value) return
  store.updateAllocationSettings({
    enabled: localEnabled.value,
    mode: localMode.value,
    rules: { ...localRules.value }
  })
  ElNotification({ type: 'success', title: 'Đã lưu', message: 'Cài đặt phân bổ đã được cập nhật', duration: 2000 })
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* ── Dialog ── */
:deep(.allocation-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  margin: 8px auto !important;
}
:deep(.allocation-dialog .el-dialog__header) { padding: 0 !important; margin: 0 !important; }
:deep(.allocation-dialog .el-dialog__body)   { padding: 0 !important; }
:deep(.allocation-dialog .el-dialog__footer) { padding: 0 16px 16px !important; }

/* ── Header ── */
.ad-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--card-border);
}
.ad-header-left { display: flex; align-items: center; gap: 12px; }
.ad-header-icon { font-size: 22px; line-height: 1; }
.ad-title   { font-size: 16px; font-weight: 800; color: var(--text-primary); }
.ad-subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 1px; }
.ad-close {
  width: 34px; height: 34px; border-radius: 50%;
  border: none; background: var(--bg-main); color: var(--text-secondary);
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.ad-close:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

/* ── Body ── */
.alloc-body {
  display: flex; flex-direction: column; gap: 14px;
  padding: 16px;
  max-height: 72vh; overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ── Toggle ── */
.alloc-header-card {
  background: rgba(99,102,241,0.05);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 14px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.2s;
}
.alloc-header-card.is-over {
  background: rgba(239,68,68,0.04);
  border-color: rgba(239,68,68,0.2);
}
.alloc-toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.alloc-toggle-info { display: flex; flex-direction: column; gap: 3px; }
.alloc-toggle-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.alloc-toggle-desc  { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.alloc-warn-banner {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(239,68,68,0.1); color: #ef4444;
  font-size: 12px; font-weight: 600;
  padding: 10px 12px; border-radius: 10px; line-height: 1.5;
}

/* ── Total bar ── */
.total-summary {
  background: var(--bg-main); border: 1px solid var(--card-border);
  border-radius: 12px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color 0.2s;
}
.total-summary.over    { border-color: rgba(239,68,68,0.3); }
.total-summary.perfect { border-color: rgba(34,197,94,0.3); }
.total-summary-top { display: flex; justify-content: space-between; align-items: center; }
.total-summary-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.total-summary.over    .total-summary-label { color: #ef4444; }
.total-summary.perfect .total-summary-label { color: #22c55e; }
.reset-btn { font-size: 12px !important; padding: 4px 8px !important; }
.total-bar-track { height: 6px; background: var(--card-border); border-radius: 99px; overflow: hidden; }
.total-bar-fill  { height: 100%; border-radius: 99px; transition: width 0.25s, background 0.25s; }

/* ── Rule cards ── */
.alloc-rules { display: flex; flex-direction: column; gap: 10px; }

.rule-card {
  background: var(--bg-main); border: 1.5px solid var(--card-border);
  border-radius: 14px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.2s;
}
.rule-card.has-value { border-color: rgba(99,102,241,0.25); }

.rule-card-top {
  display: flex; align-items: center;
  justify-content: space-between; gap: 12px;
}
.rule-jar { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.rule-icon {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.rule-name-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.rule-name { font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rule-sub  { font-size: 11px; color: var(--text-secondary); }

.rule-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.rule-preview-amount { font-size: 11px; font-weight: 600; color: #6366f1; white-space: nowrap; }

/* ── Input box ── */
.custom-input-box {
  display: flex; align-items: center;
  background: var(--card-bg); border: 1.5px solid var(--card-border);
  border-radius: 10px; padding: 0 10px;
  height: 40px; gap: 5px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 88px;
}
.custom-input-box.focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.custom-input {
  flex: 1; border: none; background: transparent;
  color: var(--text-primary); font-size: 15px; font-weight: 700;
  font-family: inherit; outline: none;
  width: 0; min-width: 0; text-align: right;
}
.custom-input::-webkit-outer-spin-button,
.custom-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.input-unit { font-size: 13px; font-weight: 700; color: #6366f1; flex-shrink: 0; }

/* ── Slider ── */
.rule-slider-wrap { display: flex; flex-direction: column; gap: 4px; }

.rule-slider {
  width: 100%; height: 6px; border-radius: 99px;
  appearance: none; background: var(--card-border);
  outline: none; cursor: pointer; accent-color: #6366f1;
  /* Increase tap area on mobile */
  padding: 8px 0; box-sizing: content-box;
}
.rule-slider::-webkit-slider-thumb {
  appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: #6366f1; cursor: pointer;
  box-shadow: 0 2px 8px rgba(99,102,241,0.45);
  border: 2px solid #fff; transition: transform 0.15s;
}
.rule-slider::-webkit-slider-thumb:hover,
.rule-slider::-webkit-slider-thumb:active { transform: scale(1.18); }
.rule-slider::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 50%;
  background: #6366f1; cursor: pointer;
  box-shadow: 0 2px 8px rgba(99,102,241,0.45);
  border: 2px solid #fff;
}

.slider-labels {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--text-secondary); padding: 0 2px;
}
.slider-current { font-weight: 700; font-size: 11px; }

/* ── Preview card ── */
.preview-card {
  background: var(--bg-main); border: 1px solid var(--card-border);
  border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color 0.2s;
}
.preview-card.over { border-color: rgba(239,68,68,0.3); }

.preview-header {
  display: flex; align-items: center;
  justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.section-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.6px;
}
.preview-income-input { width: 160px; }

.preview-list { display: flex; flex-direction: column; gap: 7px; }

.preview-row-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 10px;
}
.wallet-row { border-style: dashed; }
.preview-row-left { display: flex; align-items: center; gap: 9px; }
.preview-jar-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0;
}
.wallet-icon { background: rgba(99,102,241,0.1); }
.preview-jar-name   { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.preview-jar-amount { font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
.green { color: #22c55e !important; }

.preview-placeholder {
  font-size: 13px; color: var(--text-secondary);
  text-align: center; padding: 10px 0; opacity: 0.6;
}

/* ── Footer ── */
.alloc-footer { display: flex; justify-content: flex-end; gap: 10px; }
.cancel-btn { min-width: 80px; }
.save-btn   { min-width: 120px; }

/* ── Mobile ── */
@media (max-width: 600px) {
  .alloc-body  { padding: 12px; gap: 12px; max-height: 78vh; }
  .ad-header   { padding: 14px 14px 12px; }
  .ad-title    { font-size: 15px; }

  .alloc-footer { flex-direction: column-reverse; gap: 8px; }
  .cancel-btn, .save-btn { width: 100% !important; height: 48px; font-size: 15px; }

  .preview-income-input { width: 100% !important; }
  .preview-header { flex-direction: column; align-items: flex-start; gap: 8px; }

  .custom-input-box { width: 80px; height: 44px; }
  .custom-input     { font-size: 16px; }
}
</style>