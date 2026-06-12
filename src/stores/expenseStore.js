import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, hasSupabaseConfig } from '../services/supabase'

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

// Mapping DB Helpers
function mapTxFromDb(row) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    sourceType: row.source_type,
    targetType: row.target_type,
    targetId: row.target_id,
    sourceId: row.source_id,
    isInternal: row.is_internal,
    skipAutoAllocation: row.skip_auto_allocation,
    sourceBreakdown: row.source_breakdown,
  }
}

function mapTxToDb(tx, userId) {
  return {
    id: tx.id,
    user_id: userId,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    date: tx.date,
    source_type: tx.sourceType || null,
    target_type: tx.targetType || null,
    target_id: tx.targetId || null,
    source_id: tx.sourceId || null,
    is_internal: tx.isInternal || false,
    skip_auto_allocation: tx.skipAutoAllocation || false,
    source_breakdown: tx.sourceBreakdown || null,
  }
}

function mapJarFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    balance: Number(row.balance),
    limit: Number(row.limit),
    milestones: row.milestones || [50, 80, 100],
    categoryValue: row.category_value,
  }
}

function mapJarToDb(jar, userId) {
  return {
    id: jar.id,
    user_id: userId,
    name: jar.name,
    icon: jar.icon,
    color: jar.color,
    balance: jar.balance,
    limit: jar.limit,
    milestones: jar.milestones,
    category_value: jar.categoryValue,
  }
}

export const useExpenseStore = defineStore('expense', () => {
  // Auth states
  const user = ref(null)
  const authLoading = ref(hasSupabaseConfig)
  let checkAuthResolve
  const checkAuthPromise = new Promise((resolve) => {
    checkAuthResolve = resolve
  })

  // Data states
  const transactions = ref([])
  const jars = ref([])
  const walletBalance = ref(0)
  const allocationSettings = ref({ enabled: false, rules: {} })
  const userProfile = ref({ name: '', email: '', company: '', location: '', website: '', socialLinks: [] })
  const theme = ref('black')

  // ── Database Sync Helpers ───────────────────────────────
  async function dbSaveTransaction(tx) {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('transactions').upsert(mapTxToDb(tx, user.value.id))
  }

  async function dbDeleteTransactions(ids) {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('transactions').delete().in('id', ids)
  }

  async function dbSaveJar(jar) {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('jars').upsert(mapJarToDb(jar, user.value.id))
  }

  async function dbDeleteJar(id) {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('jars').delete().eq('id', id)
  }

  async function dbSaveUserSettings() {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      wallet_balance: walletBalance.value,
      theme: theme.value,
      allocation_enabled: allocationSettings.value.enabled,
      allocation_rules: allocationSettings.value.rules,
    })
  }

  async function dbSaveProfile() {
    if (!supabase || !user.value || user.value.id === 'demo-user') return
    await supabase.from('profiles').upsert({
      id: user.value.id,
      name: userProfile.value.name,
      avatar_url: userProfile.value.avatar || userProfile.value.avatarUrl || userProfile.value.avatar_url || '',
      company: userProfile.value.company || '',
      location: userProfile.value.location || '',
      website: userProfile.value.website || '',
      social_links: userProfile.value.socialLinks || [],
    })
  }

  // Load cloud data
  async function loadUserDataFromCloud(userId) {
    if (!supabase) return

    // 1. Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (profileData) {
      userProfile.value = {
        name: profileData.name || '',
        email: user.value?.email || '',
        avatar: profileData.avatar_url || '',
        avatarUrl: profileData.avatar_url || '',
        company: profileData.company || '',
        location: profileData.location || '',
        website: profileData.website || '',
        socialLinks: profileData.social_links || [],
      }
    } else {
      const defaultName = user.value?.user_metadata?.full_name || user.value?.email?.split('@')[0] || 'User'
      userProfile.value = { name: defaultName, email: user.value?.email || '', avatar: '', avatarUrl: '', company: '', location: '', website: '', socialLinks: [] }
      await supabase.from('profiles').insert({
        id: userId,
        name: defaultName,
        avatar_url: '',
        company: '',
        location: '',
        website: '',
        social_links: [],
      })
    }

    // 2. Settings
    const { data: settingsData } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
    if (settingsData) {
      walletBalance.value = Number(settingsData.wallet_balance)
      theme.value = settingsData.theme || 'black'
      allocationSettings.value = {
        enabled: settingsData.allocation_enabled,
        rules: settingsData.allocation_rules || {},
      }
    } else {
      walletBalance.value = 0
      theme.value = 'black'
      allocationSettings.value = { enabled: false, rules: {} }
      await supabase.from('user_settings').insert({
        user_id: userId,
        wallet_balance: 0,
        theme: 'black',
        allocation_enabled: false,
        allocation_rules: {},
      })
    }

    // 3. Jars
    const { data: jarsData } = await supabase.from('jars').select('*').eq('user_id', userId)
    if (jarsData && jarsData.length > 0) {
      jars.value = jarsData.map(mapJarFromDb)
    } else {
      const defaultJars = CATEGORIES.filter(c => c.value !== 'income').map(c => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: `Hũ ${c.label}`,
        icon: c.icon,
        color: c.color,
        balance: 0,
        limit: 5000000,
        milestones: [50, 80, 100],
        categoryValue: c.value,
      }))
      jars.value = defaultJars
      for (const jar of defaultJars) {
        await supabase.from('jars').insert(mapJarToDb(jar, userId))
      }
    }

    // 4. Transactions
    const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
    if (txData) {
      transactions.value = txData.map(mapTxFromDb)
    } else {
      transactions.value = []
    }
  }

  // Local storage migration to Cloud
  async function migrateLocalStorageToCloud() {
    if (!supabase || !user.value || user.value.id === 'demo-user') return

    const localTransactions = loadFromStorage()
    const localJars = loadJarsFromStorage()
    const localWalletBalance = loadWalletBalance()
    const localAllocationSettings = loadAllocationSettings()
    const localProfile = loadProfileFromStorage()

    if (localProfile) {
      userProfile.value = { ...userProfile.value, ...localProfile }
      await dbSaveProfile()
    }
    if (localWalletBalance !== null) walletBalance.value = localWalletBalance
    if (localAllocationSettings) allocationSettings.value = localAllocationSettings
    await dbSaveUserSettings()

    if (localJars && localJars.length > 0) {
      jars.value = localJars
      for (const jar of localJars) {
        await dbSaveJar(jar)
      }
    }
    if (localTransactions && localTransactions.length > 0) {
      transactions.value = localTransactions
      const batch = localTransactions.map(tx => mapTxToDb(tx, user.value.id))
      for (let i = 0; i < batch.length; i += 50) {
        const chunk = batch.slice(i, i + 50)
        await supabase.from('transactions').upsert(chunk)
      }
    }
  }

  // ── Auth Actions ─────────────────────────────────────────
  async function register(email, password, name) {
    if (!hasSupabaseConfig) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })
    if (error) throw error
    return data
  }

  async function login(email, password) {
    if (!hasSupabaseConfig) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function loginWithGoogle() {
    if (!hasSupabaseConfig) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
    if (error) throw error
    return data
  }

  async function logout() {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut()
    }
    user.value = null
    clearStoreData()
  }

  function enterDemoMode() {
    user.value = {
      id: 'demo-user',
      email: 'demo@smartexpense.io',
      user_metadata: { full_name: 'Demo Account' },
    }
    const localTx = loadFromStorage()
    const localJars = loadJarsFromStorage()
    const localWallet = loadWalletBalance()
    const localAllocation = loadAllocationSettings()
    const localProfile = loadProfileFromStorage()
    const localTheme = loadThemeFromStorage()

    transactions.value = localTx ?? SEED_DATA
    jars.value = localJars ?? CATEGORIES.filter(c => c.value !== 'income').map(c => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: `Hũ ${c.label}`,
      icon: c.icon,
      color: c.color,
      balance: 0,
      limit: 5000000,
      milestones: [50, 80, 100],
      categoryValue: c.value,
    }))
    walletBalance.value = localWallet ?? 0
    allocationSettings.value = localAllocation
    userProfile.value = localProfile
    theme.value = localTheme
  }

  function clearStoreData() {
    transactions.value = []
    jars.value = []
    walletBalance.value = 0
    allocationSettings.value = { enabled: false, rules: {} }
    userProfile.value = { name: '', email: '', company: '', location: '', website: '', socialLinks: [] }
    theme.value = 'black'
  }

  // Initialize Auth
  if (hasSupabaseConfig) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        user.value = session.user
        loadUserDataFromCloud(session.user.id).then(() => {
          authLoading.value = false
          checkAuthResolve()
        })
      } else {
        user.value = null
        authLoading.value = false
        checkAuthResolve()
      }
    })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        user.value = session.user
        authLoading.value = true
        await loadUserDataFromCloud(session.user.id)
        authLoading.value = false
      } else {
        user.value = null
        clearStoreData()
        authLoading.value = false
      }
      checkAuthResolve()
    })
  } else {
    authLoading.value = false
    checkAuthResolve()
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
      return { name: cat?.label ?? category, value, color: cat?.color ?? '#6b7280', key: category }
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
        if (jar && jar.balance > 0) {
          if (jar.balance >= newTx.amount) {
            jar.balance -= newTx.amount
            newTx.sourceBreakdown = { jarId: jar.id, fromJar: newTx.amount, fromWallet: 0 }
          } else {
            const fromJar = jar.balance
            const fromWallet = newTx.amount - fromJar
            jar.balance = 0
            walletBalance.value -= fromWallet
            newTx.sourceBreakdown = { jarId: jar.id, fromJar, fromWallet }
          }
        } else {
          walletBalance.value -= newTx.amount
          newTx.sourceBreakdown = { jarId: null, fromJar: 0, fromWallet: newTx.amount }
        }
      }
    }

    if (user.value && user.value.id !== 'demo-user') {
      dbSaveTransaction(newTx)
      dbSaveUserSettings()
      if (newTx.type === 'expense' || (newTx.type === 'income' && allocationSettings.value.enabled && !newTx.skipAutoAllocation)) {
        jars.value.forEach(j => dbSaveJar(j))
      }
    } else {
      saveToStorage(transactions.value)
      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
    }
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

  async function deleteTransaction(ids) {
    const idArray = Array.isArray(ids) ? ids : [ids]
    if (idArray.length === 0) return

    const formatVNDLocal = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
    const jarBalanceSim = {}
    jars.value.forEach(j => { jarBalanceSim[j.id] = j.balance })

    for (const id of idArray) {
      const tx = transactions.value.find(t => t.id === id)
      if (!tx) continue

      if (tx.type === 'internal' && tx.sourceType === 'MAIN' && tx.targetType === 'JAR') {
        const jar = jars.value.find(j => j.id === tx.targetId)
        if (!jar) {
          throw new Error(`Không thể xóa giao dịch "${tx.description}": Hũ liên quan đã bị xóa.`)
        }
        if (jarBalanceSim[jar.id] < tx.amount) {
          throw new Error(`Không thể xóa giao dịch "${tx.description}": Hũ "${jar.name}" không đủ số dư để hoàn trả ${formatVNDLocal(tx.amount)} (Hiện có: ${formatVNDLocal(jarBalanceSim[jar.id])}).`)
        }
        jarBalanceSim[jar.id] -= tx.amount
      }

      if (tx.type === 'income' && allocationSettings.value.enabled && !tx.skipAutoAllocation) {
        const rules = allocationSettings.value.rules || {}
        for (const [jarId, percent] of Object.entries(rules)) {
          const jar = jars.value.find(j => j.id === jarId)
          if (jar && percent > 0) {
            const share = Math.round((tx.amount * Number(percent)) / 100)
            if (jarBalanceSim[jar.id] < share) {
              throw new Error(`Không thể xóa giao dịch "${tx.description}": Hũ "${jar.name}" không đủ số dư để thu hồi ${formatVNDLocal(share)} đã phân bổ (Hiện có: ${formatVNDLocal(jarBalanceSim[jar.id])}).`)
            }
            jarBalanceSim[jar.id] -= share
          }
        }
      }
    }

    let totalRefundToWallet = 0
    for (const id of idArray) {
      const tx = transactions.value.find(t => t.id === id)
      if (!tx) continue

      if (tx.type === 'expense') {
        totalRefundToWallet += tx.amount
      } else if (tx.type === 'income') {
        if (allocationSettings.value.enabled && !tx.skipAutoAllocation) {
          const rules = allocationSettings.value.rules || {}
          let allocatedTotal = 0
          Object.entries(rules).forEach(([jarId, percent]) => {
            const jar = jars.value.find(j => j.id === jarId)
            if (jar && percent > 0) {
              const share = Math.round((tx.amount * Number(percent)) / 100)
              jar.balance = Math.max(0, jar.balance - share)
              allocatedTotal += share
            }
          })
          walletBalance.value -= (tx.amount - allocatedTotal)
        } else {
          walletBalance.value -= tx.amount
        }
      } else if (tx.type === 'internal') {
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
    }

    if (totalRefundToWallet > 0) {
      walletBalance.value += totalRefundToWallet
    }

    await new Promise(resolve => setTimeout(resolve, idArray.length > 1 ? 600 : 400))
    transactions.value = transactions.value.filter(t => !idArray.includes(t.id))

    if (user.value && user.value.id !== 'demo-user') {
      await dbDeleteTransactions(idArray)
      await dbSaveUserSettings()
      for (const j of jars.value) {
        await dbSaveJar(j)
      }
    } else {
      saveToStorage(transactions.value)
      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
    }
  }

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
        isInternal: true,
      }, true)

      if (user.value && user.value.id !== 'demo-user') {
        dbSaveJar(jar)
        dbSaveUserSettings()
      } else {
        saveJarsToStorage(jars.value)
        saveWalletToStorage(walletBalance.value)
      }
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
        isInternal: true,
      }, true)

      if (user.value && user.value.id !== 'demo-user') {
        dbSaveJar(jar)
        dbSaveUserSettings()
      } else {
        saveJarsToStorage(jars.value)
        saveWalletToStorage(walletBalance.value)
      }
      return true
    }
    return false
  }

  function addJar(jar) {
    const newJar = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      balance: 0,
      limit: 5000000,
      milestones: [50, 80, 100],
      ...jar,
    }
    jars.value.push(newJar)

    if (user.value && user.value.id !== 'demo-user') {
      dbSaveJar(newJar)
    } else {
      saveJarsToStorage(jars.value)
    }
  }

  function updateJar(id, payload) {
    const index = jars.value.findIndex(j => j.id === id)
    if (index !== -1) {
      jars.value[index] = { ...jars.value[index], ...payload }
      if (user.value && user.value.id !== 'demo-user') {
        dbSaveJar(jars.value[index])
      } else {
        saveJarsToStorage(jars.value)
      }
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
          isInternal: true,
        }, true)
      }
      jars.value = jars.value.filter(j => j.id !== id)

      if (user.value && user.value.id !== 'demo-user') {
        dbDeleteJar(id)
        dbSaveUserSettings()
      } else {
        saveJarsToStorage(jars.value)
        saveWalletToStorage(walletBalance.value)
      }
    }
  }

  function updateAllocationSettings(settings) {
    allocationSettings.value = { ...allocationSettings.value, ...settings }
    if (user.value && user.value.id !== 'demo-user') {
      dbSaveUserSettings()
    } else {
      saveAllocationToStorage(allocationSettings.value)
    }
  }

  function updateProfile(payload) {
    userProfile.value = { ...userProfile.value, ...payload }
    if (user.value && user.value.id !== 'demo-user') {
      dbSaveProfile()
    } else {
      saveProfileToStorage(userProfile.value)
    }
  }

  function setTheme(t) {
    theme.value = t
    localStorage.setItem(THEME_KEY, t)
    if (user.value && user.value.id !== 'demo-user') {
      dbSaveUserSettings()
    }
  }

  function clearAllData() {
    transactions.value = []
    jars.value.forEach(j => j.balance = 0)
    walletBalance.value = 0

    if (user.value && user.value.id !== 'demo-user') {
      supabase.from('transactions').delete().eq('user_id', user.value.id).then()
      dbSaveUserSettings()
      jars.value.forEach(j => dbSaveJar(j))
    } else {
      saveToStorage(transactions.value)
      saveJarsToStorage(jars.value)
      saveWalletToStorage(walletBalance.value)
    }
  }

  function resetToDefault() {
    if (user.value && user.value.id !== 'demo-user') {
      logout().then(() => window.location.reload())
    } else {
      localStorage.clear()
      window.location.reload()
    }
  }

  return {
    // State
    user,
    authLoading,
    checkAuthPromise,
    hasSupabaseConfig,
    transactions,
    jars,
    walletBalance,
    allocationSettings,
    userProfile,
    theme,

    // Getters
    totalIncome,
    totalExpense,
    balance,
    totalJarBalance,
    expenseByCategory,

    // Auth Actions
    register,
    login,
    loginWithGoogle,
    logout,
    enterDemoMode,
    migrateLocalStorageToCloud,

    // Data Actions
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