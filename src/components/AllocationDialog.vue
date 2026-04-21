<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="⚙️ Phân bổ thu nhập tự động"
    width="700px"
    destroy-on-close
    append-to-body
    class="allocation-dialog"
    :close-on-click-modal="false"
  >
    <div class="alloc-body">

      <!-- Toggle + warning -->
      <div class="alloc-header-card">
        <div class="alloc-toggle-row">
          <div class="alloc-toggle-info">
            <span class="alloc-toggle-title">Kích hoạt phân bổ tự động</span>
            <span class="alloc-toggle-desc">
              Khi có thu nhập mới, tiền sẽ tự chia vào các hũ theo tỷ lệ bên dưới.
            </span>
          </div>
          <el-switch v-model="localEnabled" :disabled="isOverLimit" active-color="#6366f1" />
        </div>
        <div v-if="isOverLimit" class="alloc-warn-banner">
          <el-icon><WarningFilled /></el-icon>
          Tổng phân bổ vượt 100% — tính năng đã tắt tự động. Vui lòng điều chỉnh trước khi bật lại.
        </div>
      </div>

      <!-- Mode toggle + total bar inline -->
      <div class="mode-toggle-row">
        <span class="section-label">Chế độ</span>
        <div class="mode-pill-group">
          <button class="mode-pill" :class="{ active: localMode === 'percent' }" @click="localMode = 'percent'">
            <span class="pill-icon">%</span> Theo phần trăm
          </button>
          <!-- <button class="mode-pill" :class="{ active: localMode === 'fixed' }" @click="localMode = 'fixed'">
            <span class="pill-icon">₫</span> Số tiền cố định
          </button> -->
        </div>

        <div class="spacer" />

        <div v-if="localMode === 'percent'" class="total-inline" :class="{ over: isOverLimit, perfect: totalPercent === 100 }">
          <div class="total-bar-mini">
            <div
              class="total-bar-mini-fill"
              :style="{
                width: Math.min(totalPercent, 100) + '%',
                background: isOverLimit ? '#ef4444' : totalPercent === 100 ? '#22c55e' : '#6366f1'
              }"
            />
          </div>
          <span class="total-label">
            <template v-if="isOverLimit">⚠️ {{ totalPercent }}% (vượt {{ totalPercent - 100 }}%)</template>
            <template v-else-if="totalPercent === 100"> {{ totalPercent }}% — Hoàn hảo</template>
            <template v-else>{{ totalPercent }}% phân bổ · còn {{ 100 - totalPercent }}% vào ví</template>
          </span>
        </div>

        <el-button size="small" text type="danger" @click="resetAll">Xóa tất cả</el-button>
      </div>

      <!-- Danh sách hũ — layout ngang -->
      <div class="alloc-rules">
        <div v-for="jar in store.jars" :key="jar.id" class="rule-row">
          <!-- Jar info -->
          <div class="rule-jar">
            <div class="rule-icon" :style="{ background: jar.color + '22', color: jar.color }">
              <el-icon><component :is="jar.icon" /></el-icon>
            </div>
            <div class="rule-name-wrap">
              <span class="rule-name">{{ jar.name }}</span>
              <span class="rule-sub">{{ jar.balance.toLocaleString('vi-VN') }} / {{ jar.limit.toLocaleString('vi-VN') }} đ</span>
            </div>
          </div>

          <!-- Slider (mode % only) -->
          <div class="rule-slider-wrap">
            <input
              v-if="localMode === 'percent'"
              type="range"
              class="rule-slider"
              min="0" max="100" step="1"
              :value="localRules[jar.id] || 0"
              @input="onSlider(jar.id, $event.target.value)"
            />
            <div v-else class="rule-slider-placeholder" />
          </div>

          <!-- Custom input -->
          <div class="rule-input-wrap">
            <div class="custom-input-box" :class="{ focused: focusedId === jar.id }">
              <input
                type="number"
                class="custom-input"
                :min="0"
                :max="localMode === 'percent' ? 100 : undefined"
                :step="localMode === 'percent' ? 1 : 50000"
                :value="localRules[jar.id] || 0"
                @focus="focusedId = jar.id"
                @blur="focusedId = null"
                @input="onInput(jar.id, $event.target.value)"
              />
              <span class="input-unit">{{ localMode === 'percent' ? '%' : 'đ' }}</span>
            </div>
          </div>

          <!-- Preview amount -->
          <div class="rule-preview" :class="{ visible: previewIncome > 0 }">
            <span v-if="previewIncome > 0">≈ {{ previewAmount(jar.id).toLocaleString('vi-VN') }} đ</span>
            <span v-else class="preview-dash">—</span>
          </div>
        </div>
      </div>

      <!-- Preview section -->
      <div class="preview-card" :class="{ over: isOverLimit }">
        <div class="preview-header">
          <span class="section-label" style="margin:0">Thử với thu nhập</span>
          <div class="custom-input-box preview-income-input" :class="{ focused: focusedId === 'preview' }">
            <input
              type="number"
              class="custom-input"
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

        <div v-if="previewIncome > 0" class="preview-grid">
          <div v-for="jar in store.jars" :key="jar.id" class="preview-item">
            <div class="preview-jar-icon" :style="{ background: jar.color + '22', color: jar.color }">
              <el-icon><component :is="jar.icon" /></el-icon>
            </div>
            <span class="preview-jar-name">{{ jar.name }}</span>
            <span class="preview-jar-amount">+{{ previewAmount(jar.id).toLocaleString('vi-VN') }} đ</span>
          </div>
          <div class="preview-item wallet-item">
            <div class="preview-jar-icon" style="background:rgba(99,102,241,0.1);font-size:15px">💼</div>
            <span class="preview-jar-name">Ví chính (còn lại)</span>
            <span class="preview-jar-amount green">+{{ previewWallet.toLocaleString('vi-VN') }} đ</span>
          </div>
        </div>
        <div v-else class="preview-placeholder">
          Nhập thu nhập để xem phân bổ dự kiến
        </div>
      </div>

    </div>

    <template #footer>
      <div class="alloc-footer">
        <el-button @click="$emit('update:modelValue', false)">Huỷ</el-button>
        <el-button type="primary" :disabled="isOverLimit" @click="save">Lưu cài đặt</el-button>
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
.alloc-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 72vh;
  overflow-y: auto;
  padding-right: 2px;
}

/* Header */
.alloc-header-card {
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.alloc-toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.alloc-toggle-info { display: flex; flex-direction: column; gap: 3px; }
.alloc-toggle-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.alloc-toggle-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
.alloc-warn-banner {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(239,68,68,0.1); color: #ef4444;
  font-size: 12px; font-weight: 600;
  padding: 10px 14px; border-radius: 10px; line-height: 1.5;
}

/* Mode row */
.mode-toggle-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.section-label {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap;
}
.mode-pill-group {
  display: flex; background: var(--bg-main);
  border: 1px solid var(--card-border); border-radius: 10px; padding: 3px; gap: 3px;
}
.mode-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease; font-family: inherit;
}
.mode-pill:hover { color: var(--text-primary); background: rgba(99,102,241,0.06); }
.mode-pill.active { background: #6366f1; color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.35); }
.pill-icon { font-size: 12px; font-weight: 800; }
.spacer { flex: 1; }

/* Total inline */
.total-inline { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
.total-bar-mini { height: 5px; background: var(--card-border); border-radius: 99px; overflow: hidden; }
.total-bar-mini-fill { height: 100%; border-radius: 99px; transition: width 0.25s, background 0.25s; }
.total-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); }
.total-inline.over .total-label { color: #ef4444; }
.total-inline.perfect .total-label { color: #22c55e; }

/* Rules */
.alloc-rules { display: flex; flex-direction: column; gap: 7px; }

.rule-row {
  display: grid;
  grid-template-columns: 190px 1fr 130px 100px;
  align-items: center;
  gap: 12px;
  background: var(--bg-main);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 10px 14px;
  transition: border-color 0.2s;
}
.rule-row:hover { border-color: rgba(99,102,241,0.3); }

.rule-jar { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rule-icon {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.rule-name-wrap { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.rule-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rule-sub { font-size: 11px; color: var(--text-secondary); }

/* Slider */
.rule-slider-wrap { display: flex; align-items: center; }
.rule-slider-placeholder { height: 5px; width: 100%; }
.rule-slider {
  width: 100%; height: 5px; border-radius: 99px;
  appearance: none; background: var(--card-border);
  outline: none; cursor: pointer; accent-color: #6366f1;
}
.rule-slider::-webkit-slider-thumb {
  appearance: none; width: 16px; height: 16px; border-radius: 50%;
  background: #6366f1; cursor: pointer;
  box-shadow: 0 2px 6px rgba(99,102,241,0.4);
  transition: transform 0.15s;
}
.rule-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

/* Custom input */
.rule-input-wrap { display: flex; justify-content: flex-end; }
.custom-input-box {
  display: flex; align-items: center;
  background: var(--card-bg);
  border: 1.5px solid var(--card-border);
  border-radius: 10px;
  padding: 0 10px 0 10px;
  height: 36px; gap: 5px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 120px;
}
.custom-input-box.focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}
.custom-input {
  flex: 1; border: none; background: transparent;
  color: var(--text-primary); font-size: 14px; font-weight: 700;
  font-family: inherit; outline: none;
  width: 0; min-width: 0; text-align: right;
}
.custom-input::-webkit-outer-spin-button,
.custom-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.input-unit { font-size: 13px; font-weight: 700; color: #6366f1; flex-shrink: 0; }

/* Per-row preview */
.rule-preview { text-align: right; font-size: 12px; font-weight: 600; color: transparent; transition: color 0.2s; }
.rule-preview.visible { color: #6366f1; }
.preview-dash { color: var(--card-border); }

/* Preview card */
.preview-card {
  background: var(--bg-main);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color 0.2s;
}
.preview-card.over { border-color: rgba(239,68,68,0.35); }
.preview-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.preview-income-input { width: 180px; }

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.preview-item {
  display: flex; flex-direction: column; gap: 5px;
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 10px; padding: 10px 12px;
}
.wallet-item { border-style: dashed; }
.preview-jar-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.preview-jar-name { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
.preview-jar-amount { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.green { color: #22c55e !important; }

.preview-placeholder {
  font-size: 13px; color: var(--text-secondary);
  text-align: center; padding: 10px 0; opacity: 0.6;
}

/* Footer */
.alloc-footer { display: flex; justify-content: flex-end; gap: 10px; }

:deep(.allocation-dialog) {
  background: var(--sidebar-bg) !important;
  border-radius: 20px !important;
}
</style>