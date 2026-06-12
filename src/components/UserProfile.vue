<template>
  <div class="profile-container animate__animated animate__fadeIn">
    <div class="profile-layout">

      <!-- ── Left: Preview Card ─────────────────────────────── -->
      <div class="profile-preview">
        <div
          class="avatar-wrap"
          :class="{ 'avatar-uploading': avatarUploading }"
          @click="openAvatarSheet"
          :title="avatarUploading ? 'Đang tải lên...' : 'Thay ảnh đại diện'"
        >
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar-circle avatar-image" alt="Avatar" />
          <div v-else class="avatar-circle">{{ avatarInitials }}</div>
          <div class="avatar-glow"></div>
          <div v-if="avatarUploading" class="avatar-overlay avatar-overlay-loading">
            <span class="avatar-spinner"></span>
          </div>
          <div v-else class="avatar-overlay">
            <el-icon class="avatar-overlay-icon"><Camera /></el-icon>
          </div>
        </div>

        <!--
          TWO hidden inputs — this is the correct mobile pattern:
          - inputCamera: capture="user" (front cam) → camera only, no gallery
          - inputGallery: no capture attr → gallery + file picker
          Both accept image/* so iOS/Android handle them natively.
        -->
        <input
          ref="inputCamera"
          type="file"
          accept="image/*"
          capture="user"
          class="avatar-file-input"
          @change="handleAvatarChange"
        />
        <input
          ref="inputGallery"
          type="file"
          accept="image/*"
          class="avatar-file-input"
          @change="handleAvatarChange"
        />

        <button
          class="change-photo-btn"
          :class="{ 'change-photo-btn--loading': avatarUploading }"
          :disabled="avatarUploading"
          @click="openAvatarSheet"
        >
          <span v-if="avatarUploading" class="btn-spinner"></span>
          <el-icon v-else><Camera /></el-icon>
          {{ avatarUploading ? 'Đang tải lên...' : 'Đổi ảnh' }}
        </button>

        <!-- Mobile action sheet -->
        <Teleport to="body">
          <Transition name="sheet">
            <div v-if="sheetOpen" class="sheet-backdrop" @click.self="sheetOpen = false">
              <div class="sheet-panel">
                <div class="sheet-handle"></div>
                <p class="sheet-title">Chọn ảnh đại diện</p>
                <button class="sheet-btn" @click="pickCamera">
                  <el-icon><Camera /></el-icon>
                  Chụp ảnh
                </button>
                <button class="sheet-btn" @click="pickGallery">
                  <el-icon><Picture /></el-icon>
                  Chọn từ thư viện
                </button>
                <button class="sheet-btn sheet-btn--cancel" @click="sheetOpen = false">
                  Huỷ
                </button>
              </div>
            </div>
          </Transition>
        </Teleport>

        <h2 class="preview-name">{{ store.userProfile.name || 'Tên của bạn' }}</h2>
        <p v-if="store.userProfile.email" class="preview-email">{{ store.userProfile.email }}</p>
        <p v-if="store.userProfile.company" class="preview-meta">
          <el-icon><OfficeBuilding /></el-icon> {{ store.userProfile.company }}
        </p>
        <p v-if="store.userProfile.location" class="preview-meta">
          <el-icon><Location /></el-icon> {{ store.userProfile.location }}
        </p>
        <p v-if="store.userProfile.website" class="preview-meta">
          <el-icon><Link /></el-icon>
          <a :href="normalizeUrl(store.userProfile.website)" target="_blank" class="preview-link">
            {{ store.userProfile.website }}
          </a>
        </p>

        <div v-if="store.userProfile.socialLinks?.length" class="preview-socials">
          <a
            v-for="(link, i) in store.userProfile.socialLinks"
            :key="i"
            :href="normalizeUrl(link.url)"
            target="_blank"
            class="preview-social-icon"
            :title="getSocialInfo(link.url).label"
          >
            <img :src="getSocialInfo(link.url).favicon" class="social-favicon" :alt="getSocialInfo(link.url).label" />
          </a>
        </div>

        <!-- Logout Button -->
        <div class="logout-btn-wrap" style="margin-top: 24px; width: 100%;">
          <el-button 
            type="danger" 
            plain 
            class="logout-btn"
            style="width: 100%; border-radius: 20px; font-weight: 600;"
            @click="handleLogout"
          >
            <el-icon><SwitchButton /></el-icon>&nbsp; Đăng xuất
          </el-button>
        </div>
      </div>

      <!-- ── Right: Form ────────────────────────────────────── -->
      <div class="profile-form-wrap">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="profile-form"
        >
          <!-- Basic Info -->
          <div class="form-group">
            <div class="group-label">Thông tin cơ bản</div>
            <el-form-item label="Họ và Tên" prop="name">
              <el-input v-model="form.name" placeholder="Nguyễn Văn A" size="default" />
            </el-form-item>
            <el-form-item label="Email" prop="email">
              <el-input v-model="form.email" placeholder="email@example.com" size="default" />
            </el-form-item>
          </div>

          <!-- Personal Info -->
          <div class="form-group">
            <div class="group-label">Thông tin cá nhân</div>
            <el-form-item prop="company">
              <el-input v-model="form.company" placeholder="Company" size="default">
                <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="location">
              <el-input v-model="form.location" placeholder="Location" size="default">
                <template #prefix><el-icon><Location /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="website">
              <el-input v-model="form.website" placeholder="Website (https://...)" size="default">
                <template #prefix><el-icon><Link /></el-icon></template>
              </el-input>
            </el-form-item>
          </div>

          <!-- Social Accounts -->
          <div class="form-group">
            <div class="group-label">Social accounts</div>
            <div v-for="(link, index) in form.socialLinks" :key="index" class="social-row">
              <div class="social-icon-slot">
                <img
                  v-if="link.url && getSocialInfo(link.url).favicon"
                  :src="getSocialInfo(link.url).favicon"
                  class="social-favicon-sm"
                  :alt="getSocialInfo(link.url).label"
                />
                <el-icon v-else class="social-fallback-icon"><Share /></el-icon>
              </div>
              <el-form-item
                :prop="`socialLinks.${index}.url`"
                :rules="socialUrlRule"
                class="social-input-item"
              >
                <el-input
                  v-model="link.url"
                  :placeholder="`Link to social profile ${index + 1}`"
                  size="default"
                  clearable
                  @blur="normalizeField(link)"
                />
              </el-form-item>
              <el-button class="remove-social-btn" text type="danger" @click="removeLink(index)">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <el-button v-if="form.socialLinks.length < 8" class="add-social-btn" text @click="addLink">
              <el-icon><Plus /></el-icon>
              Add social link
            </el-button>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <el-button type="primary" class="save-btn" :loading="saving" @click="handleSave">
              Lưu thay đổi
            </el-button>
          </div>
        </el-form>

        <!-- ── Photo Library ────────────────────────────────────── -->
        <div class="photo-library-section">
          <ImageUpload :userId="store.user?.id" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useExpenseStore } from '../stores/expenseStore'
import ImageUpload from './ImageUpload.vue'

const store = useExpenseStore()
const router = useRouter()
const formRef = ref(null)
const saving = ref(false)

// ── Cloudinary config ────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dgrxajiru'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'avatar_upload_expense_tracker'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

// ── Avatar state ───────────────────────────────────────────
const inputCamera  = ref(null)   // capture="user"  → opens camera directly
const inputGallery = ref(null)   // no capture      → opens gallery / file picker
const avatarUrl      = ref(store.userProfile.avatar || null)
const avatarUploading = ref(false)
const sheetOpen       = ref(false)

/**
 * On desktop: skip the sheet, go straight to gallery picker.
 * On mobile/touch: show the action sheet so user picks camera vs gallery.
 */
function openAvatarSheet() {
  if (avatarUploading.value) return
  const isMobile = window.matchMedia('(pointer: coarse)').matches
  if (isMobile) {
    sheetOpen.value = true
  } else {
    inputGallery.value?.click()
  }
}

function pickCamera() {
  sheetOpen.value = false
  // Small delay so the sheet closes before the native camera dialog opens
  setTimeout(() => inputCamera.value?.click(), 120)
}

function pickGallery() {
  sheetOpen.value = false
  setTimeout(() => inputGallery.value?.click(), 120)
}

async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  // Upload avatar vào folder riêng theo userId
  if (store.user?.id) {
    formData.append('folder', `expense_tracker/${store.user.id}/avatar`)
  }

  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `Upload failed (${response.status})`)
  }
  const data = await response.json()
  if (!data.secure_url) throw new Error('Cloudinary did not return a URL')
  return data.secure_url
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // reset so re-selecting same file fires again

  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage({ message: 'Vui lòng chọn file ảnh hợp lệ', type: 'warning' })
    return
  }

  avatarUploading.value = true
  try {
    const secureUrl = await uploadToCloudinary(file)
    avatarUrl.value = secureUrl
    store.updateProfile({ avatar: secureUrl })
    ElMessage({ message: 'Ảnh đại diện đã được cập nhật!', type: 'success', duration: 2000 })
  } catch (err) {
    console.error('Avatar upload error:', err)
    ElMessage({ message: `Tải ảnh thất bại: ${err.message || 'Vui lòng thử lại'}`, type: 'error', duration: 4000 })
  } finally {
    avatarUploading.value = false
  }
}

onMounted(() => {
  if (store.userProfile.avatar) avatarUrl.value = store.userProfile.avatar
})

// ── Social service map ──────────────────────────────────────
const SOCIAL_MAP = [
  { hosts: ['github.com'],                       label: 'GitHub',    icon: 'github',    color: 'ffffff' },
  { hosts: ['facebook.com', 'm.facebook.com'],   label: 'Facebook',  icon: 'facebook',  color: '1877F2' },
  { hosts: ['twitter.com', 'x.com'],             label: 'X / Twitter', icon: 'x',       color: 'ffffff' },
  { hosts: ['linkedin.com', 'www.linkedin.com', 'linkin.com'], label: 'LinkedIn', icon: 'linkedin', color: '0A66C2' },
  { hosts: ['instagram.com'],                    label: 'Instagram', icon: 'instagram', color: 'E4405F' },
  { hosts: ['zalo.me'],                          label: 'Zalo',      icon: 'zalo',      color: '0068FF' },
  { hosts: ['open.spotify.com', 'spotify.com'],  label: 'Spotify',   icon: 'spotify',   color: '1DB954' },
  { hosts: ['youtube.com', 'youtu.be'],          label: 'YouTube',   icon: 'youtube',   color: 'FF0000' },
  { hosts: ['tiktok.com'],                       label: 'TikTok',    icon: 'tiktok',    color: 'ffffff' },
  { hosts: ['twitch.tv'],                        label: 'Twitch',    icon: 'twitch',    color: '9146FF' },
  { hosts: ['discord.gg', 'discord.com'],        label: 'Discord',   icon: 'discord',   color: '5865F2' },
  { hosts: ['reddit.com'],                       label: 'Reddit',    icon: 'reddit',    color: 'FF4500' },
  { hosts: ['telegram.org', 't.me'],             label: 'Telegram',  icon: 'telegram',  color: '26A5E4' },
  { hosts: ['pinterest.com'],                    label: 'Pinterest', icon: 'pinterest', color: 'E60023' },
  { hosts: ['snapchat.com'],                     label: 'Snapchat',  icon: 'snapchat',  color: 'FFFC00' },
  { hosts: ['threads.net'],                      label: 'Threads',   icon: 'threads',   color: 'ffffff' },
  { hosts: ['behance.net'],                      label: 'Behance',   icon: 'behance',   color: '1769FF' },
  { hosts: ['dribbble.com'],                     label: 'Dribbble',  icon: 'dribbble',  color: 'EA4C89' },
  { hosts: ['medium.com'],                       label: 'Medium',    icon: 'medium',    color: 'ffffff' },
]

function extractHostname(raw) {
  if (!raw) return ''
  const withProto = raw.startsWith('http') ? raw : `https://${raw}`
  try { return new URL(withProto).hostname.replace(/^www\./, '') } catch { return '' }
}

function getSocialInfo(raw) {
  const hostname = extractHostname(raw)
  if (!hostname) return { label: 'Link', favicon: null }
  const match = SOCIAL_MAP.find(s => s.hosts.some(h => hostname === h || hostname.endsWith('.' + h)))
  if (match) {
    let iconColor = match.color
    if (store.theme === 'white' && iconColor.toLowerCase() === 'ffffff') iconColor = '18181b'
    return { label: match.label, favicon: `https://cdn.simpleicons.org/${match.icon}/${iconColor}` }
  }
  return { label: hostname, favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` }
}

function normalizeUrl(url) {
  if (!url) return '#'
  return url.startsWith('http') ? url : `https://${url}`
}

function normalizeField(link) {
  if (link.url && !link.url.startsWith('http') && link.url.includes('.')) link.url = `https://${link.url}`
}

// ── Form state ─────────────────────────────────────────────
const form = reactive({
  name: store.userProfile.name || '',
  email: store.userProfile.email || '',
  company: store.userProfile.company || '',
  location: store.userProfile.location || '',
  website: store.userProfile.website || '',
  socialLinks: (store.userProfile.socialLinks || []).map(s => ({ url: s.url || '' })),
})

// ── Validation ─────────────────────────────────────────────
const generalUrlValidator = (rule, value, callback) => {
  if (!value) return callback()
  const withProto = value.startsWith('http') ? value : `https://${value}`
  try { new URL(withProto); callback() } catch { callback(new Error('URL không hợp lệ')) }
}

const rules = {
  name: [
    { required: true, message: 'Vui lòng nhập tên', trigger: 'blur' },
    { min: 2, message: 'Tên quá ngắn', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: 'Email không hợp lệ', trigger: ['blur', 'change'] }],
  website: [{ validator: generalUrlValidator, trigger: 'blur' }],
}

const socialUrlRule = [{ validator: generalUrlValidator, trigger: 'blur' }]

function addLink() { form.socialLinks.push({ url: '' }) }
function removeLink(index) { form.socialLinks.splice(index, 1) }

const avatarInitials = computed(() => {
  const name = store.userProfile.name || 'U'
  return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  const normalized = form.socialLinks
    .filter(l => l.url.trim())
    .map(l => ({ url: l.url.startsWith('http') ? l.url : `https://${l.url}` }))
  store.updateProfile({
    name: form.name,
    email: form.email,
    company: form.company,
    location: form.location,
    website: form.website ? normalizeUrl(form.website) : '',
    socialLinks: normalized,
    avatar: avatarUrl.value ?? store.userProfile.avatar ?? null,
  })
  ElMessage({ message: 'Đã lưu thông tin!', type: 'success', duration: 2500 })
  saving.value = false
}

// Watch userProfile to update form fields reactively on load
watch(() => store.userProfile, (newProfile) => {
  if (newProfile) {
    form.name = newProfile.name || ''
    form.email = newProfile.email || ''
    form.company = newProfile.company || ''
    form.location = newProfile.location || ''
    form.website = newProfile.website || ''
    form.socialLinks = (newProfile.socialLinks || []).map(s => ({ url: s.url || '' }))
    if (newProfile.avatar) avatarUrl.value = newProfile.avatar
  }
}, { deep: true, immediate: true })

async function handleLogout() {
  try {
    const { ElMessageBox } = await import('element-plus')
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      'Đăng Xuất',
      {
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    await store.logout()
    ElMessage({ type: 'success', message: 'Đăng xuất thành công!' })
    router.push({ name: 'login' })
  } catch (err) {
    // Cancelled or error
  }
}
</script>

<style scoped>
.profile-container { padding: 28px; }

.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 700px) {
  .profile-layout { grid-template-columns: 1fr; }
}

/* ── Preview card ─────────────────────────────────────────── */
.profile-preview {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  position: sticky;
  top: 20px;
}

/* ── Avatar ─────────────────────────────────────────────── */
.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 50%;
}
.avatar-wrap:hover .avatar-overlay { opacity: 1; }
.avatar-wrap:hover .avatar-circle,
.avatar-wrap:hover .avatar-image { filter: brightness(0.72); }

.avatar-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  color: white;
  border: 3px solid rgba(255,255,255,0.4);
  box-shadow: 0 0 0 1px var(--card-border);
  position: relative;
  z-index: 2;
  transition: filter 0.22s ease;
  user-select: none;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.4);
  box-shadow: 0 0 0 1px var(--card-border);
  position: relative;
  z-index: 2;
  display: block;
  transition: filter 0.22s ease;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.22s ease;
  pointer-events: none;
}
.avatar-overlay-icon { font-size: 22px; color: #fff; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5)); }

.avatar-glow {
  position: absolute;
  inset: -6px;
  background: rgba(99,102,241,0.25);
  filter: blur(14px);
  border-radius: 50%;
  z-index: 1;
}

.avatar-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

/* Loading */
.avatar-uploading { cursor: wait !important; }
.avatar-uploading .avatar-circle,
.avatar-uploading .avatar-image { filter: brightness(0.55) !important; }
.avatar-overlay-loading { opacity: 1 !important; background: rgba(0,0,0,0.45); }

.avatar-spinner {
  display: inline-block;
  width: 28px; height: 28px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Change photo button */
.change-photo-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  margin-bottom: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  line-height: 1.5;
}
.change-photo-btn:hover {
  background: rgba(99,102,241,0.16);
  border-color: #6366f1;
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99,102,241,0.2);
}
.change-photo-btn:active { transform: translateY(0); }
.change-photo-btn--loading { opacity: 0.65; cursor: wait !important; pointer-events: none; }
.change-photo-btn .el-icon { font-size: 12px; }

.btn-spinner {
  display: inline-block;
  width: 11px; height: 11px;
  border: 2px solid rgba(99,102,241,0.35);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}

/* ── Mobile action sheet (Teleport to body) ─────────────── */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-panel {
  background: var(--card-bg, #1e1e2e);
  border-radius: 20px 20px 0 0;
  padding: 12px 16px 32px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--card-border, rgba(255,255,255,0.15));
  border-radius: 2px;
  margin: 0 auto 12px;
}

.sheet-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #888);
  text-align: center;
  margin: 0 0 4px;
  letter-spacing: 0.3px;
}

.sheet-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #fff);
  background: var(--el-input-bg-color, rgba(255,255,255,0.05));
  border: 1px solid var(--card-border, rgba(255,255,255,0.08));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
  width: 100%;
  text-align: left;
}
.sheet-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }
.sheet-btn .el-icon { font-size: 18px; color: #6366f1; }

.sheet-btn--cancel {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary, #888);
  justify-content: center;
  font-size: 14px;
  margin-top: 4px;
}
.sheet-btn--cancel:hover { background: rgba(255,255,255,0.05); border-color: transparent; }

/* Sheet transition */
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.22s ease; }
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel { transform: translateY(100%); }

/* Mobile */
@media (max-width: 700px) {
  .profile-preview { position: static; }
  .avatar-wrap { width: 96px; height: 96px; }
  .avatar-circle { font-size: 32px; }
}

/* ── Preview text ─────────────────────────────────────────── */
.preview-name { margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
.preview-email { font-size: 13px; color: var(--text-secondary); margin: 0; }
.preview-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary);
  margin: 0; width: 100%; justify-content: center; flex-wrap: wrap;
}
.preview-link { color: #6366f1; text-decoration: none; font-size: 13px; word-break: break-all; }
.preview-link:hover { text-decoration: underline; }

.preview-socials {
  display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
  margin-top: 10px; padding-top: 14px;
  border-top: 1px solid var(--card-border); width: 100%;
}
.preview-social-icon {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--el-input-bg-color); border: 1px solid var(--card-border);
  transition: all 0.2s ease; overflow: hidden;
}
.preview-social-icon:hover { border-color: #6366f1; transform: translateY(-2px); background: rgba(99,102,241,0.08); }
.social-favicon { width: 20px; height: 20px; object-fit: contain; border-radius: 3px; }

/* ── Form ─────────────────────────────────────────────────── */
.profile-form-wrap {
  background: var(--card-bg); border: 1px solid var(--card-border);
  border-radius: 10px; padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.profile-form { display: flex; flex-direction: column; gap: 0; }
.form-group { padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--card-border); }
.form-group:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.group-label {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  letter-spacing: 0.4px; margin-bottom: 14px; text-transform: uppercase;
}
:deep(.el-form-item) { margin-bottom: 12px; }
:deep(.el-form-item:last-child) { margin-bottom: 0; }
:deep(.el-form-item__label) { font-size: 13px; font-weight: 600; color: var(--text-secondary); padding-bottom: 4px; line-height: 1.4; }
:deep(.el-input__inner) { font-size: 14px; }

/* ── Social rows ─────────────────────────────────────────── */
.social-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.social-icon-slot {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; border-radius: 8px;
  background: var(--el-input-bg-color); border: 1px solid var(--card-border); overflow: hidden;
}
.social-favicon-sm { width: 20px; height: 20px; object-fit: contain; border-radius: 3px; }
.social-fallback-icon { font-size: 16px; color: var(--text-secondary); }
.social-input-item { flex: 1; margin-bottom: 0 !important; }
:deep(.social-input-item .el-form-item__content) { margin-left: 0 !important; }
.remove-social-btn { flex-shrink: 0; padding: 6px; height: 32px; width: 32px; }
.add-social-btn { color: #6366f1; font-size: 13px; padding: 0; height: auto; gap: 4px; margin-top: 4px; }
.add-social-btn:hover { color: #818cf8 !important; background: rgba(99,102,241,0.1) !important; transform: translateY(-1px); }

/* ── Actions ─────────────────────────────────────────────── */
.form-actions { display: flex; justify-content: flex-start; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); }
.save-btn { background: #6366f1; border-color: #6366f1; border-radius: 6px; font-weight: 600; padding: 10px 24px; font-size: 14px; transition: all 0.2s ease; }
.save-btn:hover { background: #4f46e5; border-color: #4f46e5; transform: translateY(-1px); }

/* ── Photo Library Section ───────────────────────────────– */
.photo-library-section {
  border-top: 1px solid var(--card-border);
  padding-top: 24px;
  margin-top: 8px;
}

.photo-library-section :deep(.imgup-container) {
  padding: 0;
  background: transparent;
}

@media (max-width: 700px) {
  .photo-library-section {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }
}
</style>