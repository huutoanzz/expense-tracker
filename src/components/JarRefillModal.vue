<template>
  <!-- Modal nạp/rút tiền chính -->
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="mode === 'deposit' ? 'Nạp tiền vào hũ' : 'Rút tiền từ hũ'"
    width="400px"
    destroy-on-close
    append-to-body
    class="refill-dialog"
  >
    <div class="refill-container">
      <div class="balance-info mb-4">
        <div class="info-item">
          <span class="label">Ví chính:</span>
          <span class="value">{{ fmt(store.walletBalance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Số dư hũ:</span>
          <span class="value">{{ fmt(jar?.balance || 0) }}</span>
        </div>
        <div v-if="mode === 'deposit'" class="info-item">
          <span class="label">Hạn mức hũ:</span>
          <span class="value">{{ fmt(jar?.limit || 0) }}</span>
        </div>
      </div>

      <el-form label-position="top">
        <el-form-item label="Số tiền">
          <el-input-number
            v-model="amount"
            :min="1000"
            :max="maxAmount"
            :step="50000"
            style="width: 100%"
            placeholder="Nhập số tiền"
          />
          <div class="quick-amounts mt-2">
            <el-button
              v-for="p in [0.25, 0.5, 1]"
              :key="p"
              size="small"
              plain
              @click="amount = Math.floor(maxAmount * p)"
            >
              {{ p * 100 }}%
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="transaction-preview mt-4" v-if="amount > 0">
        <el-icon><InfoFilled /></el-icon>
        <span v-if="mode === 'deposit'">
          Ví chính sẽ còn <b>{{ fmt(store.walletBalance - amount) }}</b>
        </span>
        <span v-else>
          Ví chính sẽ tăng lên <b>{{ fmt(store.walletBalance + amount) }}</b>
        </span>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">Hủy</el-button>
      <el-button
        :type="mode === 'deposit' ? 'primary' : 'warning'"
        :disabled="amount <= 0 || amount > maxAmount"
        @click="handleConfirm"
      >
        Xác nhận
      </el-button>
    </template>
  </el-dialog>

  <!-- Popup cảnh báo vượt hạn mức -->
  <el-dialog
    v-model="showOverLimitDialog"
    title="⚠️ Vượt hạn mức hũ"
    width="420px"
    append-to-body
    destroy-on-close
    class="overlimit-dialog"
    :close-on-click-modal="false"
  >
    <div class="overlimit-body">
      <p class="overlimit-desc">
        Nạp <b>{{ fmt(amount) }}</b> vào hũ <b>{{ jar?.name }}</b> sẽ vượt hạn mức
        <b>{{ fmt(jar?.limit || 0) }}</b>.
      </p>

      <div class="overlimit-preview">
        <div class="preview-row">
          <span class="preview-label">Hiện có trong hũ</span>
          <span class="preview-val">{{ fmt(jar?.balance || 0) }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Sau khi nạp</span>
          <span class="preview-val over">{{ fmt((jar?.balance || 0) + amount) }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Hạn mức hiện tại</span>
          <span class="preview-val">{{ fmt(jar?.limit || 0) }}</span>
        </div>
      </div>

      <p class="overlimit-question">Bạn muốn xử lý thế nào?</p>
    </div>

    <template #footer>
      <div class="overlimit-actions">
        <el-button type="primary" @click="handleIncreaseLimit">
          Tăng hạn mức lên {{ fmt((jar?.balance || 0) + amount) }}
        </el-button>
        <el-button @click="handleCapDeposit">
          Chỉ nạp {{ fmt((jar?.limit || 0) - (jar?.balance || 0)) }} (vừa đủ)
        </el-button>
        <el-button plain @click="showOverLimitDialog = false">Huỷ</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExpenseStore } from '../stores/expenseStore'
import { ElNotification } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  jarId: String,
  mode: {
    type: String,
    default: 'deposit'
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useExpenseStore()
const amount = ref(0)
const showOverLimitDialog = ref(false)

const jar = computed(() => store.jars.find(j => j.id === props.jarId))

const maxAmount = computed(() => {
  if (props.mode === 'deposit') return store.walletBalance
  return jar.value ? jar.value.balance : 0
})

const fmt = (v) => (v ?? 0).toLocaleString('vi-VN') + ' đ'

function handleConfirm() {
  if (props.mode === 'deposit') {
    const afterDeposit = (jar.value?.balance || 0) + amount.value
    if (afterDeposit > (jar.value?.limit || 0)) {
      // Chặn lại, mở popup cảnh báo
      showOverLimitDialog.value = true
      return
    }
  }
  doDeposit(amount.value)
}

// Option 1: Tăng hạn mức rồi nạp
function handleIncreaseLimit() {
  const newLimit = (jar.value?.balance || 0) + amount.value
  store.updateJar(props.jarId, { limit: newLimit })
  showOverLimitDialog.value = false
  doDeposit(amount.value)
}

// Option 2: Chỉ nạp đúng phần còn thiếu đến limit
function handleCapDeposit() {
  const cappedAmount = (jar.value?.limit || 0) - (jar.value?.balance || 0)
  showOverLimitDialog.value = false
  doDeposit(cappedAmount)
}

function doDeposit(depositAmount) {
  if (depositAmount <= 0) return

  let success = false
  if (props.mode === 'deposit') {
    success = store.depositToJar(props.jarId, depositAmount)
  } else {
    success = store.withdrawFromJar(props.jarId, depositAmount)
  }

  if (success) {
    ElNotification({ type: 'success', title: 'Thành công', message: 'Giao dịch đã được ghi', duration: 2500 })
    amount.value = 0
    emit('update:modelValue', false)
  } else {
    ElNotification({ type: 'error', title: '❌ Lỗi', message: 'Có lỗi xảy ra, thử lại', duration: 2500 })
  }
}
</script>

<style scoped>
.refill-container {
  padding: 10px 0;
}

.balance-info {
  background: rgba(99, 102, 241, 0.05);
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-item .label { color: var(--text-secondary); }
.info-item .value { font-weight: 600; color: var(--text-primary); }

.quick-amounts {
  display: flex;
  gap: 8px;
}

.transaction-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-main);
  padding: 8px 12px;
  border-radius: 8px;
}

/* Overlimit dialog */
.overlimit-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.overlimit-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.overlimit-preview {
  background: var(--bg-main);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.preview-label {
  color: var(--text-secondary);
}

.preview-val {
  font-weight: 700;
  color: var(--text-primary);
}

.preview-val.over {
  color: #ef4444;
}

.overlimit-question {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.overlimit-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.overlimit-actions .el-button {
  width: 100%;
  margin: 0 !important;
  height: 44px;
  font-size: 14px;
}

:deep(.overlimit-dialog) {
  border-radius: 20px;
  background: var(--sidebar-bg) !important;
}

:deep(.overlimit-dialog .el-dialog__footer) {
  padding: 0 24px 24px !important;
}

.mb-4 { margin-bottom: 16px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
</style>