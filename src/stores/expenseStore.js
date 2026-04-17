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

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    const defaults = { name: '', email: '', company: '', location: '', website: '', socialLinks: [] }
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    // Migrate old flat social fields into socialLinks array
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

function saveToStorage(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
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
  const isFirstVisit = !localStorage.getItem('expense_tracker_initialized')
  const stored = loadFromStorage()
  
  // Initialize: if first time, use seeds. Otherwise, use what's in storage.
  const transactions = ref(stored ?? (isFirstVisit ? SEED_DATA : []))
  
  // User Profile state
  const userProfile = ref(loadProfileFromStorage())
  
  // Set flag if it's the first visit
  if (isFirstVisit) {
    saveToStorage(transactions.value)
    localStorage.setItem('expense_tracker_initialized', 'true')
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

  const balance = computed(() => totalIncome.value - totalExpense.value)

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
  function addTransaction(payload) {
    const newTx = {
      id: Date.now().toString(),
      ...payload,
    }
    transactions.value.unshift(newTx)
    saveToStorage(transactions.value)
  }

  async function deleteTransaction(id) {
    // Simulate API delay for UI loading effect
    await new Promise(resolve => setTimeout(resolve, 600))
    transactions.value = transactions.value.filter(t => t.id !== id)
    saveToStorage(transactions.value)
  }

  async function deleteMultipleTransactions(ids) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    transactions.value = transactions.value.filter(t => !ids.includes(t.id))
    saveToStorage(transactions.value)
  }

  function updateProfile(payload) {
    userProfile.value = { ...userProfile.value, ...payload }
    saveProfileToStorage(userProfile.value)
  }

  function clearAllData() {
    transactions.value = []
    saveToStorage(transactions.value)
  }

  function resetToDefault() {
    localStorage.clear()
    window.location.reload()
  }

  // ── Helpers ───────────────────────────────────────────────
  function getCategoryInfo(value) {
    return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
  }

  return {
    transactions,
    userProfile,
    totalIncome,
    totalExpense,
    balance,
    expenseByCategory,
    addTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    updateProfile,
    clearAllData,
    resetToDefault,
    getCategoryInfo,
  }
})
