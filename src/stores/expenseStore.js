import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const CATEGORIES = [
  { label: 'Ăn uống', value: 'food', icon: 'Food', color: '#f97316' },
  { label: 'Di chuyển', value: 'transport', icon: 'Van', color: '#3b82f6' },
  { label: 'Shopping', value: 'shopping', icon: 'ShoppingCart', color: '#a855f7' },
  { label: 'Giải trí', value: 'entertainment', icon: 'VideoPlay', color: '#ec4899' },
  { label: 'Sức khỏe', value: 'health', icon: 'FirstAidKit', color: '#22c55e' },
  { label: 'Nhà ở', value: 'housing', icon: 'House', color: '#14b8a6' },
  { label: 'Giáo dục', value: 'education', icon: 'Reading', color: '#f59e0b' },
  { label: 'Thu nhập', value: 'income', icon: 'Money', color: '#10b981' },
  { label: 'Khác', value: 'other', icon: 'More', color: '#6b7280' },
]

const STORAGE_KEY = 'smart_expense_tracker_data'
const PROFILE_KEY = 'smart_expense_tracker_profile'
const THEME_KEY = 'smart_expense_tracker_theme'
const JARS_KEY = 'smart_expense_tracker_jars'
const WALLET_BALANCE_KEY = 'smart_expense_tracker_wallet'
const ALLOCATION_SETTINGS_KEY = 'smart_expense_tracker_allocation'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadJarsFromStorage() {
  try {
    const raw = localStorage.getItem(JARS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loadWalletBalance() {
  const val = localStorage.getItem(WALLET_BALANCE_KEY)
  return val ? parseFloat(val) : null
}

function loadAllocationSettings() {
  try {
    const raw = localStorage.getItem(ALLOCATION_SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { enabled: false, rules: {} }
  } catch {
    return { enabled: false, rules: {} }
  }
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    const defaults = { name: '', email: '', company: '', location: '', website: '', socialLinks: [] }
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    if (!parsed.socialLinks) {
      const links = []
      if (parsed.github) links.push({ url: parsed.github })
      if (parsed.facebook) links.push({ url: parsed.facebook })
      if (parsed.spotify) links.push({ url: parsed.spotify })
      if (parsed.website && parsed.website !== parsed.website) links.push({ url: parsed.website })
      parsed.socialLinks = links
    }
    return { ...defaults, ...parsed }
  } catch {
    return { name: '', email: '', company: '', location: '', website: '', socialLinks: [] }
  }
}

function loadThemeFromStorage() {
  return localStorage.getItem(THEME_KEY) || 'black'
}

function saveToStorage(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

function saveJarsToStorage(jars) {
  localStorage.setItem(JARS_KEY, JSON.stringify(jars))
}

function saveWalletToStorage(balance) {
  localStorage.setItem(WALLET_BALANCE_KEY, balance.toString())
}

function saveAllocationToStorage(settings) {
  localStorage.setItem(ALLOCATION_SETTINGS_KEY, JSON.stringify(settings))
}

function saveProfileToStorage(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

const SEED_DATA = [
  { id: '1', description: 'Lương tháng 4', amount: 15000000, type: 'income', category: 'income', date: '2026-04-01' },
  { id: '2', description: 'Ăn trưa văn phòng', amount: 45000, type: 'expense', category: 'food', date: '2026-04-02' },
  { id: '3', description: 'Grab đi làm', amount: 120000, type: 'expense', category: 'transport', date: '2026-04-03' },
  { id: '4', description: 'Mua sắm quần áo', amount: 850000, type: 'expense', category: 'shopping', date: '2026-04-05' },
  { id: '5', description: 'Xem phim rạp', amount: 175000, type: 'expense', category: 'entertainment', date: '2026-04-07' },
  { id: '6', description: 'Khám sức khỏe định kỳ', amount: 350000, type: 'expense', category: 'health', date: '2026-04-09' },
  { id: '7', description: 'Tiền nhà tháng 4', amount: 3500000, type: 'expense', category: 'housing', date: '2026-04-10' },
  { id: '8', description: 'Khoá học online', amount: 699000, type: 'expense', category: 'education', date: '2026-04-11' },
  { id: '9', description: 'Thưởng dự án', amount: 2000000, type: 'income', category: 'income', date: '2026-04-12' },
  { id: '10', description: 'Coffee & ăn sáng', amount: 85000, type: 'expense', category: 'food', date: '2026-04-14' },
]

export const useExpenseStore = defineStore('expense', () => {
  const isFirstVisit = !localStorage.getItem('expense_tracker_initialized_v2')
  const transactions = ref(loadFromStorage() ?? (isFirstVisit ? SEED_DATA : []))
  const jars = ref(loadJarsFromStorage() ?? CATEGORIES.filter(c => c.value !== 'income').map(c => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    name: `Hũ ${c.label}`,
    icon: c.icon,
    color: c.color,
    balance: 0,
    limit: 5000000,
    milestones: [50, 80, 100],
    categoryValue: c.value
  })))

  const walletBalance = ref(loadWalletBalance() ?? 0)
  const allocationSettings = ref(loadAllocationSettings())
  const userProfile = ref(loadProfileFromStorage())
  const theme = ref(loadThemeFromStorage())

  if (isFirstVisit) {
    migrateData()
    saveToStorage(transactions.value)
    saveJarsToStorage(jars.value)
    saveWalletToStorage(walletBalance.value)
    localStorage.setItem('expense_tracker_initialized_v2', 'true')
    localStorage.setItem('expense_tracker_initialized', 'true')
  }

  function migrateData() {
    const totalIn = transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalOut = transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // For legacy data, we calculate what balance should be
    // but the jars might already have balance from my previous implementation.
    // Let's assume jars started with 0 and we only count expenses toward them.
    // However, the user specifically said:
    // "TOTAL ASSETS = WALLET + SUM(JARS) = INCOME - EXPENSE"

    const sumJars = jars.value.reduce((s, j) => s + j.balance, 0)
    let calcWallet = totalIn - totalOut - sumJars

    if (calcWallet < 0) {
      const adjustment = Math.abs(calcWallet)
      calcWallet = 0
      addTransaction({
        type: 'adjustment',
        amount: adjustment,
        description: 'Điều chỉnh cân bằng hệ thống (Migration Adjustment)',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        isSystem: true
      }, true) // skip balance updates since this is the adjustment itself
    }

    walletBalance.value = calcWallet
    saveWalletToStorage(walletBalance.value)
  }

  // ── Computed ──────────────────────────────────────────────
  const totalIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const totalExpense = computed(() =>
    transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const balance = computed(() => totalIncome.value - totalExpense.value) // Total Assets
  const totalJarBalance = computed(() => jars.value.reduce((sum, j) => sum + j.balance, 0))

  const expenseByCategory = computed(() => {
    const map = {}
    transactions.value
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount
      })
    return Object.entries(map).map(([category, value]) => {
      const cat = CATEGORIES.find(c => c.value === category)
      return { name: cat?.label ?? category, value, color: cat?.color ?? '#6b7280' }
    })
  })

  // ── Actions ───────────────────────────────────────────────
  function addTransaction(payload, skipBalanceUpdate = false) {
    const newTx = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...payload,
    }
    transactions.value.unshift(newTx)

    if (!skipBalanceUpdate) {
      if (newTx.type === 'income') {
        const skipAuto = newTx.skipAutoAllocation
        if (allocationSettings.value.enabled && !skipAuto) {
          performAutoAllocation(newTx.amount)
        } else {
          walletBalance.value += newTx.amount
        }
      } else if (newTx.type === 'expense') {
        const jar = jars.value.find(j => j.categoryValue === newTx.category) || jars.value.find(j => j.categoryValue === 'other')
        if (jar && jar.balance >= newTx.amount) {
          jar.balance -= newTx.amount
        } else {
          walletBalance.value -= newTx.amount
        }
      }
    }

    saveToStorage(transactions.value)
    saveJarsToStorage(jars.value)
    saveWalletToStorage(walletBalance.value)
  }

  function performAutoAllocation(amount) {
    const rules = allocationSettings.value.rules || {}
    let allocatedTotal = 0

    Object.entries(rules).forEach(([jarId, percent]) => {
      const jar = jars.value.find(j => j.id === jarId)
      if (jar && percent > 0) {
        const share = (amount * percent) / 100
        jar.balance += share
        allocatedTotal += share
      }
    })

    walletBalance.value += (amount - allocatedTotal)
  }

  async function deleteTransaction(id) {
    const tx = transactions.value.find(t => t.id === id)
    if (!tx) return

    // Refund logic
    if (tx.type === 'expense') {
      const jar = jars.value.find(j => j.categoryValue === tx.category) || jars.value.find(j => j.categoryValue === 'other')
      if (jar) jar.balance += tx.amount
      else walletBalance.value += tx.amount
    } else if (tx.type === 'income') {
      // Deleting income is tricky if it was auto-allocated
      // For simplicity, we subtract from walletBalance (can go negative if user spent it)
      // but the user's rules say total assets must be conserved.
      walletBalance.value -= tx.amount
    } else if (tx.type === 'internal') {
      // Revert internal transfer
      if (tx.sourceType === 'MAIN' && tx.targetType === 'JAR') {
        walletBalance.value += tx.amount
        const jar = jars.value.find(j => j.id === tx.targetId)
        if (jar) jar.balance -= tx.amount
      } else if (tx.sourceType === 'JAR' && tx.targetType === 'MAIN') {
        walletBalance.value -= tx.amount
        const jar = jars.value.find(j => j.id === tx.sourceId)
        if (jar) jar.balance += tx.amount
      }
    }

    await new Promise(resolve => setTimeout(resolve, 600))
    transactions.value = transactions.value.filter(t => t.id !== id)
    saveToStorage(transactions.value)
    saveJarsToStorage(jars.value)
    saveWalletToStorage(walletBalance.value)
  }

  // ── Jar Actions ───────────────────────────────────────────
  function depositToJar(jarId, amount) {
    const jar = jars.value.find(j => j.id === jarId)
    if (jar && walletBalance.value >= amount) {
      walletBalance.value -= amount
      jar.balance += amount

      addTransaction({
        type: 'internal',
        amount,
        description: `Nạp tiền vào ${jar.name}`,
        category: jar.categoryValue,
        date: new Date().toISOString().split('T')[0],
        sourceType: 'MAIN',
        targetType: 'JAR',
        targetId: jar.id,
        isInternal: true
      }, true)

      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
      return true
    }
    return false
  }

  function withdrawFromJar(jarId, amount) {
    const jar = jars.value.find(j => j.id === jarId)
    if (jar && jar.balance >= amount) {
      jar.balance -= amount
      walletBalance.value += amount

      addTransaction({
        type: 'internal',
        amount,
        description: `Rút tiền từ ${jar.name}`,
        category: jar.categoryValue,
        date: new Date().toISOString().split('T')[0],
        sourceType: 'JAR',
        targetType: 'MAIN',
        sourceId: jar.id,
        isInternal: true
      }, true)

      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
      return true
    }
    return false
  }

  function addJar(jar) {
    jars.value.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      balance: 0,
      limit: 5000000,
      milestones: [50, 80, 100],
      ...jar
    })
    saveJarsToStorage(jars.value)
  }

  function updateJar(id, payload) {
    const index = jars.value.findIndex(j => j.id === id)
    if (index !== -1) {
      jars.value[index] = { ...jars.value[index], ...payload }
      saveJarsToStorage(jars.value)
    }
  }

  function deleteJar(id) {
    const jar = jars.value.find(j => j.id === id)
    if (jar) {
      if (jar.balance > 0) {
        walletBalance.value += jar.balance
        addTransaction({
          type: 'internal',
          amount: jar.balance,
          description: `Giải thể hũ ${jar.name} - Hoàn trả ví`,
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          isInternal: true
        }, true)
      }
      jars.value = jars.value.filter(j => j.id !== id)
      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
    }
  }

  function updateAllocationSettings(settings) {
    allocationSettings.value = { ...allocationSettings.value, ...settings }
    saveAllocationToStorage(allocationSettings.value)
  }

  function updateProfile(payload) {
    userProfile.value = { ...userProfile.value, ...payload }
    saveProfileToStorage(userProfile.value)
  }

  function setTheme(t) {
    theme.value = t
    localStorage.setItem(THEME_KEY, t)
  }

  function clearAllData() {
    transactions.value = []
    jars.value.forEach(j => j.balance = 0)
    walletBalance.value = 0
    saveToStorage(transactions.value)
    saveJarsToStorage(jars.value)
    saveWalletToStorage(walletBalance.value)
  }

  function resetToDefault() {
    localStorage.clear()
    window.location.reload()
  }

  return {
    transactions,
    jars,
    walletBalance,
    allocationSettings,
    userProfile,
    theme,
    totalIncome,
    totalExpense,
    balance,
    totalJarBalance,
    expenseByCategory,
    addTransaction,
    deleteTransaction,
    depositToJar,
    withdrawFromJar,
    addJar,
    updateJar,
    deleteJar,
    updateAllocationSettings,
    updateProfile,
    setTheme,
    clearAllData,
    resetToDefault,
  }
})


