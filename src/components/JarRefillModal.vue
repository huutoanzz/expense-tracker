<template>
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
          <span class="value">{{ formatVND(store.walletBalance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Số dư hũ:</span>
          <span class="value">{{ formatVND(jar?.balance || 0) }}</span>
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
          Ví chính sẽ còn <b>{{ formatVND(store.walletBalance - amount) }}</b>
        </span>
        <span v-else>
          Ví chính sẽ tăng lên <b>{{ formatVND(store.walletBalance + amount) }}</b>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExpenseStore } from '../stores/expenseStore'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  jarId: String,
  mode: {
    type: String,
    default: 'deposit' // 'deposit' or 'withdraw'
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useExpenseStore()
const amount = ref(0)

const jar = computed(() => store.jars.find(j => j.id === props.jarId))

const maxAmount = computed(() => {
  if (props.mode === 'deposit') {
    return store.walletBalance
  } else {
    return jar.value ? jar.value.balance : 0
  }
})

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

function handleConfirm() {
  let success = false
  if (props.mode === 'deposit') {
    success = store.depositToJar(props.jarId, amount.value)
  } else {
    success = store.withdrawFromJar(props.jarId, amount.value)
  }

  if (success) {
    ElMessage.success('Giao dịch thành công!')
    emit('update:modelValue', false)
  } else {
    ElMessage.error('Số dư không khả dụng cho thao tác này.')
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

.mb-4 { margin-bottom: 16px; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }

:deep(.refill-dialog) {
  border-radius: 20px;
  background: var(--sidebar-bg) !important;
}
</style>
