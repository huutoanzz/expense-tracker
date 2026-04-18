<template>
  <div class="profile-container animate__animated animate__fadeIn">
    <div class="profile-layout">

      <!-- ── Left: Preview Card ─────────────────────────────── -->
      <div class="profile-preview">
        <div class="avatar-wrap">
          <div class="avatar-circle">{{ avatarInitials }}</div>
          <div class="avatar-glow"></div>
        </div>
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

            <div
              v-for="(link, index) in form.socialLinks"
              :key="index"
              class="social-row"
            >
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

              <el-button
                class="remove-social-btn"
                text
                type="danger"
                @click="removeLink(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <el-button
              v-if="form.socialLinks.length < 8"
              class="add-social-btn"
              text
              @click="addLink"
            >
              <el-icon><Plus /></el-icon>
              Add social link
            </el-button>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <el-button
              type="primary"
              class="save-btn"
              :loading="saving"
              @click="handleSave"
            >
              Lưu thay đổi
            </el-button>
          </div>
        </el-form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useExpenseStore } from '../stores/expenseStore'

const store = useExpenseStore()
const formRef = ref(null)
const saving = ref(false)

// ── Social service map ──────────────────────────────────────
// Uses cdn.simpleicons.org — supports all brand/social icons
const SOCIAL_MAP = [
  { hosts: ['github.com'],                       label: 'GitHub',    icon: 'github',    color: 'ffffff' },
  { hosts: ['facebook.com', 'm.facebook.com'],   label: 'Facebook',  icon: 'facebook',  color: '1877F2' },
  { hosts: ['twitter.com', 'x.com'],             label: 'X / Twitter', icon: 'x',       color: 'ffffff' },
  { hosts: ['linkedin.com', 'www.linkedin.com'], label: 'LinkedIn',  icon: 'linkedin',  color: '0A66C2' },
  { hosts: ['instagram.com'],                    label: 'Instagram', icon: 'instagram', color: 'E4405F' },
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
  try {
    return new URL(withProto).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function getSocialInfo(raw) {
  const hostname = extractHostname(raw)
  if (!hostname) return { label: 'Link', favicon: null }

  const match = SOCIAL_MAP.find(s =>
    s.hosts.some(h => hostname === h || hostname.endsWith('.' + h))
  )

  if (match) {
    // cdn.simpleicons.org — brand SVG icons with brand color, supports all social platforms
    return {
      label: match.label,
      favicon: `https://cdn.simpleicons.org/${match.icon}/${match.color}`,
    }
  }

  // Fallback: Google favicon service for unknown domains
  return {
    label: hostname,
    favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
  }
}

function normalizeUrl(url) {
  if (!url) return '#'
  return url.startsWith('http') ? url : `https://${url}`
}

function normalizeField(link) {
  if (link.url && !link.url.startsWith('http') && link.url.includes('.')) {
    link.url = `https://${link.url}`
  }
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
  try {
    new URL(withProto)
    callback()
  } catch {
    callback(new Error('URL không hợp lệ'))
  }
}

const rules = {
  name: [
    { required: true, message: 'Vui lòng nhập tên', trigger: 'blur' },
    { min: 2, message: 'Tên quá ngắn', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: 'Email không hợp lệ', trigger: ['blur', 'change'] },
  ],
  website: [{ validator: generalUrlValidator, trigger: 'blur' }],
}

const socialUrlRule = [{ validator: generalUrlValidator, trigger: 'blur' }]

// ── Dynamic links ──────────────────────────────────────────
function addLink() {
  form.socialLinks.push({ url: '' })
}

function removeLink(index) {
  form.socialLinks.splice(index, 1)
}

// ── Computed ───────────────────────────────────────────────
const avatarInitials = computed(() => {
  const name = store.userProfile.name || 'U'
  return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

// ── Save ───────────────────────────────────────────────────
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  await new Promise(r => setTimeout(r, 500))

  // Auto-normalize all social URLs before saving
  const normalized = form.socialLinks
    .filter(l => l.url.trim())
    .map(l => ({
      url: l.url.startsWith('http') ? l.url : `https://${l.url}`,
    }))

  store.updateProfile({
    name: form.name,
    email: form.email,
    company: form.company,
    location: form.location,
    website: form.website ? normalizeUrl(form.website) : '',
    socialLinks: normalized,
  })

  ElMessage({ message: 'Đã lưu thông tin!', type: 'success', duration: 2500 })
  saving.value = false
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────── */
.profile-container {
  padding: 28px;
  max-width: 960px;
  margin: 0 auto;
}

.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 700px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

/* ── Preview card ────────────────────────────────────────── */
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

.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 12px;
}

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
  border: 3px solid var(--card-border);
  position: relative;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  inset: -6px;
  background: rgba(99, 102, 241, 0.25);
  filter: blur(14px);
  border-radius: 50%;
  z-index: 1;
}

.preview-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.preview-email {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 13px;
  word-break: break-all;
}
.preview-link:hover { text-decoration: underline; }

.preview-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--card-border);
  width: 100%;
}

.preview-social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  transition: all 0.2s ease;
  overflow: hidden;
}
.preview-social-icon:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  background: rgba(99, 102, 241, 0.08);
}

/* ── Form ────────────────────────────────────────────────── */
.profile-form-wrap {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 28px 28px;
}

.profile-form { display: flex; flex-direction: column; gap: 0; }

.form-group {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--card-border);
}
.form-group:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.group-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.4px;
  margin-bottom: 14px;
  text-transform: uppercase;
}

:deep(.el-form-item) { margin-bottom: 12px; }
:deep(.el-form-item:last-child) { margin-bottom: 0; }
:deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 4px;
  line-height: 1.4;
}
:deep(.el-input__inner) { font-size: 14px; }

/* ── Social rows ─────────────────────────────────────────── */
.social-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.social-icon-slot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  overflow: hidden;
}

.social-favicon,
.social-favicon-sm {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
}

.social-fallback-icon {
  font-size: 16px;
  color: var(--text-secondary);
}

.social-input-item {
  flex: 1;
  margin-bottom: 0 !important;
}
:deep(.social-input-item .el-form-item__content) { margin-left: 0 !important; }

.remove-social-btn {
  flex-shrink: 0;
  padding: 6px;
  height: 32px;
  width: 32px;
}

.add-social-btn {
  color: #6366f1;
  font-size: 13px;
  padding: 0;
  height: auto;
  gap: 4px;
  margin-top: 4px;
}
.add-social-btn:hover {
  color: #818cf8 !important;
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateY(-1px);
}

/* ── Actions ─────────────────────────────────────────────── */
.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--card-border);
}

.save-btn {
  background: #6366f1;
  border-color: #6366f1;
  border-radius: 6px;
  font-weight: 600;
  padding: 10px 24px;
  font-size: 14px;
  transition: all 0.2s ease;
}
.save-btn:hover {
  background: #4f46e5;
  border-color: #4f46e5;
  transform: translateY(-1px);
}
</style>