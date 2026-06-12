<template>
  <div class="login-container animate__animated animate__fadeIn">
    <!-- Background elements -->
    <div class="bg-bubble bubble-1"></div>
    <div class="bg-bubble bubble-2"></div>
    <div class="bg-bubble bubble-3"></div>

    <div class="login-card-wrapper">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-area">
            <el-icon class="logo-icon"><Wallet /></el-icon>
            <span class="logo-title">SmartExpense</span>
          </div>
          <p class="logo-subtitle">Quản lý chi tiêu thông minh theo phong cách tương lai</p>
        </div>

        <!-- Tabs -->
        <div class="tab-selectors">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'signin' }" 
            @click="activeTab = 'signin'"
          >
            Đăng Nhập
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'signup' }" 
            @click="activeTab = 'signup'"
          >
            Đăng Ký
          </button>
        </div>

        <!-- Form Sign In -->
        <div v-if="activeTab === 'signin'" class="form-container">
          <el-form 
            ref="signinFormRef" 
            :model="signinForm" 
            :rules="rules" 
            label-position="top"
            @keyup.enter="handleSignIn"
          >
            <el-form-item label="Email" prop="email">
              <el-input 
                v-model="signinForm.email" 
                placeholder="Nhập email của bạn..." 
                clearable
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Mật khẩu" prop="password">
              <el-input 
                v-model="signinForm.password" 
                type="password" 
                placeholder="Nhập mật khẩu..." 
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="form-actions-row">
              <el-button 
                type="primary" 
                class="submit-btn" 
                :loading="loading" 
                @click="handleSignIn"
              >
                Đăng Nhập
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- Form Sign Up -->
        <div v-if="activeTab === 'signup'" class="form-container">
          <el-form 
            ref="signupFormRef" 
            :model="signupForm" 
            :rules="rules" 
            label-position="top"
            @keyup.enter="handleSignUp"
          >
            <el-form-item label="Họ và tên" prop="name">
              <el-input 
                v-model="signupForm.name" 
                placeholder="Nhập họ và tên..." 
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Email" prop="email">
              <el-input 
                v-model="signupForm.email" 
                placeholder="Nhập email đăng ký..." 
                clearable
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Mật khẩu" prop="password">
              <el-input 
                v-model="signupForm.password" 
                type="password" 
                placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)..." 
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="form-actions-row">
              <el-button 
                type="primary" 
                class="submit-btn register-btn" 
                :loading="loading" 
                @click="handleSignUp"
              >
                Đăng Ký Tài Khoản
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- Social Login -->
        <div class="divider-text">Hoặc tiếp tục với</div>

        <div class="social-actions">
          <el-button 
            class="social-btn google-btn" 
            :loading="googleLoading" 
            @click="handleGoogleSignIn"
          >
            <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-1.5 2.5l2.4 1.86c2.08-1.92 3.28-4.74 3.28-8.21z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.07-2.38c-.85.57-1.95.91-3.13.91-2.42 0-4.47-1.63-5.2-3.82l-3.17 2.46C3.96 21.03 7.7 24 12 24z"/>
              <path fill="#FBBC05" d="M6.8 13.8c-.18-.57-.29-1.18-.29-1.8s.11-1.23.29-1.8L3.63 7.74C2.79 9.4 2.3 11.25 2.3 13.1s.49 3.7 1.33 5.36l3.17-2.46z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.96 2.97 3.63 7.74l3.17 2.46c.73-2.19 2.78-3.82 5.2-3.82z"/>
            </svg>
            &nbsp; Đăng nhập bằng Google
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenseStore } from '../stores/expenseStore'
import { ElMessage } from 'element-plus'

const store = useExpenseStore()
const router = useRouter()

const activeTab = ref('signin')
const loading = ref(false)
const googleLoading = ref(false)

const signinFormRef = ref(null)
const signupFormRef = ref(null)

const signinForm = reactive({
  email: '',
  password: ''
})

const signupForm = reactive({
  name: '',
  email: '',
  password: ''
})

// Validation Rules
const rules = {
  name: [
    { required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' },
    { min: 2, message: 'Tên phải từ 2 ký tự trở lên', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Vui lòng nhập địa chỉ email', trigger: 'blur' },
    { type: 'email', message: 'Địa chỉ email không hợp lệ', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự', trigger: 'blur' }
  ]
}

// Actions
async function handleSignIn() {
  if (!signinFormRef.value) return
  
  await signinFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await store.login(signinForm.email, signinForm.password)
        ElMessage({ type: 'success', message: 'Đăng nhập thành công! Chào mừng trở lại.' })
        router.push({ name: 'dashboard' })
      } catch (err) {
        ElMessage({ type: 'error', message: err.message || 'Sai tài khoản hoặc mật khẩu.' })
      } finally {
        loading.value = false
      }
    }
  })
}

async function handleSignUp() {
  if (!signupFormRef.value) return
  
  await signupFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await store.register(signupForm.email, signupForm.password, signupForm.name)
        ElMessage({ 
          type: 'success', 
          message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
          duration: 4000 
        })
        activeTab.value = 'signin'
        signinForm.email = signupForm.email
        signinForm.password = ''
      } catch (err) {
        ElMessage({ type: 'error', message: err.message || 'Lỗi khi đăng ký tài khoản.' })
      } finally {
        loading.value = false
      }
    }
  })
}

async function handleGoogleSignIn() {
  googleLoading.value = true
  try {
    await store.loginWithGoogle()
  } catch (err) {
    ElMessage({ type: 'error', message: err.message || 'Lỗi đăng nhập Google OAuth.' })
    googleLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-main, #0f0f12);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 9999;
}

/* Beautiful dynamic background bubbles */
.bg-bubble {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 1;
  opacity: 0.25;
}
.bubble-1 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  top: -50px;
  left: -50px;
  animation: pulse-bubble 10s infinite alternate;
}
.bubble-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  bottom: -100px;
  right: -50px;
  animation: pulse-bubble 12s infinite alternate-reverse;
}
.bubble-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  top: 40%;
  left: 30%;
  opacity: 0.15;
}

@keyframes pulse-bubble {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.2) translate(30px, 40px); }
}

.login-card-wrapper {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 0 20px;
  z-index: 10;
}

.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(230, 162, 60, 0.15);
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #e6a23c;
  backdrop-filter: blur(10px);
}
.warning-banner .el-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}
.warning-text {
  font-size: 13px;
  line-height: 1.5;
}
.warning-text code {
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.login-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

body.theme-white .login-card {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.08);
}
body.theme-blue .login-card {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(99, 102, 241, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}
.logo-icon {
  font-size: 32px;
  color: #6366f1;
}
.logo-title {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}
.logo-subtitle {
  font-size: 13px;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
}

/* Tabs */
.tab-selectors {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}
body.theme-white .tab-selectors {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.05);
}
.tab-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  border-radius: 9px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.tab-btn.active {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

/* Forms styling */
:deep(.el-form-item__label) {
  color: var(--text-secondary, #94a3b8) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  margin-bottom: 4px !important;
}
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: none !important;
  border-radius: 12px !important;
  height: 44px;
  transition: border-color 0.3s ease;
}
body.theme-white :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.01) !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}
:deep(.el-input__wrapper.is-focus), :deep(.el-input__wrapper:hover) {
  border-color: #6366f1 !important;
}
:deep(.el-input__inner) {
  color: var(--text-primary, #f8fafc) !important;
}
body.theme-white :deep(.el-input__inner) {
  color: #1e293b !important;
}
:deep(.el-input__prefix-inner) {
  font-size: 16px;
  color: #94a3b8;
}

.form-actions-row {
  margin-top: 10px;
}
.submit-btn {
  width: 100%;
  height: 46px !important;
  border-radius: 12px !important;
  background: linear-gradient(135deg, #6366f1, #3b82f6) !important;
  border: none !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.25) !important;
  transition: all 0.3s ease !important;
}
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4) !important;
}
.register-btn {
  background: linear-gradient(135deg, #a855f7, #ec4899) !important;
  box-shadow: 0 8px 25px rgba(168, 85, 247, 0.25) !important;
}
.register-btn:hover {
  box-shadow: 0 12px 30px rgba(168, 85, 247, 0.4) !important;
}

.divider-text {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  margin: 24px 0;
}
.divider-text::before, .divider-text::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}
body.theme-white .divider-text::before, body.theme-white .divider-text::after {
  background: rgba(0, 0, 0, 0.08);
}
.divider-text::before { margin-right: 15px; }
.divider-text::after { margin-left: 15px; }

.social-actions {
  display: flex;
  justify-content: center;
}
.social-btn {
  width: 100%;
  height: 44px !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: var(--text-primary, #f8fafc) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease !important;
}
body.theme-white .social-btn {
  background: #fff !important;
  border-color: rgba(0,0,0,0.1) !important;
  color: #1e293b !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
}
.social-btn:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}
body.theme-white .social-btn:hover {
  background: #f8fafc !important;
  border-color: rgba(0,0,0,0.15) !important;
}
.google-icon {
  flex-shrink: 0;
}


</style>
