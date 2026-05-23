<template>
  <div class="imgup-container animate__animated animate__fadeIn">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="imgup-header">
      <div>
        <h3 class="imgup-title">Thư viện ảnh</h3>
        <p class="imgup-subtitle">Upload không giới hạn • Lưu trên Cloudinary</p>
      </div>
      <div class="imgup-header-actions">
        <button class="imgup-upload-btn" @click="openSheet" :disabled="anyUploading">
          <el-icon><Plus /></el-icon>
          Thêm ảnh
        </button>
      </div>
    </div>

    <!-- ── Drop zone ───────────────────────────────────────── -->
    <div
      class="imgup-dropzone"
      :class="{ 'imgup-dropzone--active': isDragging, 'imgup-dropzone--disabled': anyUploading }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="openSheet"
    >
      <div class="imgup-dropzone-inner">
        <div class="imgup-dropzone-icon">
          <el-icon><Upload /></el-icon>
        </div>
        <p class="imgup-dropzone-text">
          <span class="imgup-dropzone-cta">Kéo thả ảnh vào đây</span>
          hoặc nhấn để chọn
        </p>
        <p class="imgup-dropzone-hint">JPG, PNG, WEBP, GIF • Không giới hạn số lượng</p>
      </div>
    </div>

    <!-- Two inputs — same mobile camera fix as avatar -->
    <input ref="inputCamera"  type="file" accept="image/*" capture="environment" multiple class="imgup-hidden-input" @change="handleFiles" />
    <input ref="inputGallery" type="file" accept="image/*"                        multiple class="imgup-hidden-input" @change="handleFiles" />

    <!-- Mobile action sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="sheetOpen" class="sheet-backdrop" @click.self="sheetOpen = false">
          <div class="sheet-panel">
            <div class="sheet-handle"></div>
            <p class="sheet-title">Thêm ảnh</p>
            <button class="sheet-btn" @click="pickCamera">
              <el-icon><Camera /></el-icon>
              Chụp ảnh
            </button>
            <button class="sheet-btn" @click="pickGallery">
              <el-icon><Picture /></el-icon>
              Chọn từ thư viện
            </button>
            <button class="sheet-btn sheet-btn--cancel" @click="sheetOpen = false">Huỷ</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Upload queue (in-progress) ─────────────────────── -->
    <div v-if="queue.length" class="imgup-queue">
      <div v-for="item in queue" :key="item.id" class="imgup-queue-item">
        <img :src="item.preview" class="imgup-queue-thumb" alt="" />
        <div class="imgup-queue-info">
          <span class="imgup-queue-name">{{ item.name }}</span>
          <div class="imgup-queue-bar-wrap">
            <div class="imgup-queue-bar" :style="{ width: item.progress + '%' }"></div>
          </div>
        </div>
        <span class="imgup-queue-status">
          <span v-if="item.status === 'uploading'" class="queue-spinner"></span>
          <el-icon v-else-if="item.status === 'done'" class="queue-done"><CircleCheck /></el-icon>
          <el-icon v-else class="queue-err"><CircleClose /></el-icon>
        </span>
      </div>
    </div>

    <!-- ── Stats bar ───────────────────────────────────────── -->
    <div v-if="images.length" class="imgup-stats">
      <span>{{ images.length }} ảnh</span>
      <div class="imgup-stats-actions">
        <button class="imgup-stats-btn imgup-stats-btn--danger" @click="confirmClearAll" title="Xoá tất cả">
          <el-icon><Delete /></el-icon>
          Xoá tất cả
        </button>
      </div>
    </div>

    <!-- ── Gallery grid ────────────────────────────────────── -->
    <TransitionGroup name="gallery" tag="div" class="imgup-gallery" v-if="images.length">
      <div v-for="img in images" :key="img.id" class="imgup-card" @click="openLightbox(img)">
        <img :src="img.url" class="imgup-card-img" :alt="img.name" loading="lazy" />
        <div class="imgup-card-overlay">
          <button class="imgup-card-btn imgup-card-btn--view" @click.stop="openLightbox(img)" title="Xem">
            <el-icon><ZoomIn /></el-icon>
          </button>
          <button class="imgup-card-btn imgup-card-btn--copy" @click.stop="copyUrl(img.url)" title="Copy URL">
            <el-icon><CopyDocument /></el-icon>
          </button>
          <button class="imgup-card-btn imgup-card-btn--del" @click.stop="removeImage(img.id)" title="Xoá">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-else-if="!queue.length" class="imgup-empty">
      <el-icon class="imgup-empty-icon"><PictureFilled /></el-icon>
      <p>Chưa có ảnh nào. Hãy upload ảnh đầu tiên!</p>
    </div>

    <!-- ── Lightbox ────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="lightboxImg" class="lightbox-backdrop" @click.self="lightboxImg = null">
          <button class="lightbox-close" @click="lightboxImg = null"><el-icon><Close /></el-icon></button>
          <button v-if="lightboxIndex > 0" class="lightbox-nav lightbox-nav--prev" @click.stop="lightboxStep(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <img :src="lightboxImg.url" class="lightbox-img" :alt="lightboxImg.name" />
          <button v-if="lightboxIndex < images.length - 1" class="lightbox-nav lightbox-nav--next" @click.stop="lightboxStep(1)">
            <el-icon><ArrowRight /></el-icon>
          </button>
          <div class="lightbox-caption">
            {{ lightboxImg.name }} &nbsp;·&nbsp; {{ lightboxIndex + 1 }} / {{ images.length }}
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ── Cloudinary ─────────────────────────────────────────────
const CLOUD_NAME    = 'dgrxajiru'
const UPLOAD_PRESET = 'avatar_upload_expense_tracker'
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

// ── Storage key ────────────────────────────────────────────
const STORAGE_KEY = 'imgup_gallery'

// ── State ─────────────────────────────────────────────────
const images       = ref([])   // { id, url, name, uploadedAt }
const queue        = ref([])   // in-progress uploads
const isDragging   = ref(false)
const sheetOpen    = ref(false)
const lightboxImg  = ref(null)

const inputCamera  = ref(null)
const inputGallery = ref(null)

const anyUploading = computed(() => queue.value.some(q => q.status === 'uploading'))

const lightboxIndex = computed(() =>
  images.value.findIndex(i => i.id === lightboxImg.value?.id)
)

// ── Persistence ────────────────────────────────────────────
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(images.value)) } catch {}
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) images.value = JSON.parse(saved)
  } catch {}
})

// ── Sheet / picker ─────────────────────────────────────────
function openSheet() {
  if (anyUploading.value) return
  const isMobile = window.matchMedia('(pointer: coarse)').matches
  if (isMobile) { sheetOpen.value = true } else { inputGallery.value?.click() }
}

function pickCamera() {
  sheetOpen.value = false
  setTimeout(() => inputCamera.value?.click(), 120)
}

function pickGallery() {
  sheetOpen.value = false
  setTimeout(() => inputGallery.value?.click(), 120)
}

// ── Drop ─────────────────────────────────────────────────
function handleDrop(e) {
  isDragging.value = false
  const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'))
  if (!files.length) { ElMessage({ message: 'Chỉ hỗ trợ file ảnh', type: 'warning' }); return }
  uploadFiles(files)
}

function handleFiles(event) {
  const files = [...(event.target.files || [])].filter(f => f.type.startsWith('image/'))
  event.target.value = ''
  if (files.length) uploadFiles(files)
}

// ── Upload ────────────────────────────────────────────────
async function uploadFiles(files) {
  const items = files.map(f => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: f.name,
    preview: URL.createObjectURL(f),
    file: f,
    progress: 0,
    status: 'uploading',
  }))
  queue.value.push(...items)

  await Promise.allSettled(items.map(item => uploadOne(item)))

  // Remove finished items from queue after a short pause
  setTimeout(() => {
    queue.value = queue.value.filter(q => q.status === 'uploading')
  }, 1800)
}

async function uploadOne(item) {
  try {
    // Simulate progress while uploading (XHR gives real progress; fetch doesn't)
    const progressTimer = setInterval(() => {
      if (item.progress < 85) item.progress += Math.random() * 18
    }, 200)

    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const response = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
    clearInterval(progressTimer)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    if (!data.secure_url) throw new Error('No URL returned')

    item.progress = 100
    item.status = 'done'

    images.value.unshift({ id: item.id, url: data.secure_url, name: item.name, uploadedAt: Date.now() })
    persist()
    URL.revokeObjectURL(item.preview)
  } catch (err) {
    item.progress = 100
    item.status = 'error'
    console.error('Upload error:', err)
    ElMessage({ message: `Lỗi upload ${item.name}: ${err.message}`, type: 'error', duration: 4000 })
  }
}

// ── Actions ───────────────────────────────────────────────
function removeImage(id) {
  images.value = images.value.filter(i => i.id !== id)
  if (lightboxImg.value?.id === id) lightboxImg.value = null
  persist()
}

async function confirmClearAll() {
  try {
    await ElMessageBox.confirm('Xoá tất cả ảnh khỏi thư viện?', 'Xác nhận', {
      confirmButtonText: 'Xoá tất cả',
      cancelButtonText: 'Huỷ',
      type: 'warning',
    })
    images.value = []
    lightboxImg.value = null
    persist()
    ElMessage({ message: 'Đã xoá tất cả ảnh', type: 'success' })
  } catch {}
}

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage({ message: 'Đã copy URL!', type: 'success', duration: 1500 })
  } catch {
    ElMessage({ message: 'Không thể copy', type: 'error' })
  }
}

// ── Lightbox ──────────────────────────────────────────────
function openLightbox(img) { lightboxImg.value = img }

function lightboxStep(dir) {
  const idx = lightboxIndex.value + dir
  if (idx >= 0 && idx < images.value.length) lightboxImg.value = images.value[idx]
}
</script>

<style scoped>
.imgup-container {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ─────────────────────────────────────────────── */
.imgup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.imgup-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.imgup-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.imgup-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.imgup-upload-btn:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
.imgup-upload-btn:active { transform: translateY(0); }
.imgup-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Dropzone ────────────────────────────────────────────── */
.imgup-dropzone {
  border: 2px dashed var(--card-border);
  border-radius: 12px;
  padding: 36px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--card-bg);
}
.imgup-dropzone:hover,
.imgup-dropzone--active {
  border-color: #6366f1;
  background: rgba(99,102,241,0.04);
}
.imgup-dropzone--active { transform: scale(1.01); }
.imgup-dropzone--disabled { pointer-events: none; opacity: 0.5; }

.imgup-dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  pointer-events: none;
}

.imgup-dropzone-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: rgba(99,102,241,0.1);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.imgup-dropzone-icon .el-icon { font-size: 24px; color: #6366f1; }

.imgup-dropzone-text { margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.imgup-dropzone-cta { font-weight: 600; color: #6366f1; }
.imgup-dropzone-hint { margin: 0; font-size: 12px; color: var(--text-secondary); opacity: 0.6; }

.imgup-hidden-input { display: none; }

/* ── Upload queue ────────────────────────────────────────── */
.imgup-queue {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 12px;
}

.imgup-queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.imgup-queue-thumb {
  width: 44px; height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--card-border);
}

.imgup-queue-info { flex: 1; min-width: 0; }
.imgup-queue-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  margin-bottom: 6px;
}

.imgup-queue-bar-wrap {
  height: 4px;
  background: var(--card-border);
  border-radius: 2px;
  overflow: hidden;
}
.imgup-queue-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.imgup-queue-status { flex-shrink: 0; }
.queue-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(99,102,241,0.25);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.queue-done { font-size: 18px; color: #22c55e; }
.queue-err  { font-size: 18px; color: #ef4444; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Stats bar ───────────────────────────────────────────── */
.imgup-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 0 2px;
}
.imgup-stats-actions { display: flex; gap: 8px; }
.imgup-stats-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; font-size: 12px; font-weight: 600;
  border-radius: 6px; border: 1px solid; cursor: pointer; transition: all 0.18s ease;
  background: transparent;
}
.imgup-stats-btn--danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.imgup-stats-btn--danger:hover { background: rgba(239,68,68,0.08); border-color: #ef4444; }

/* ── Gallery grid ────────────────────────────────────────── */
.imgup-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

@media (max-width: 500px) {
  .imgup-gallery { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
}

.imgup-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  cursor: pointer;
  aspect-ratio: 1 / 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.imgup-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
.imgup-card:hover .imgup-card-overlay { opacity: 1; }

.imgup-card-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.2s ease;
}
.imgup-card:hover .imgup-card-img { filter: brightness(0.65); }

.imgup-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.imgup-card-btn {
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer;
  font-size: 15px;
  transition: all 0.15s ease;
  backdrop-filter: blur(6px);
}
.imgup-card-btn--view { background: rgba(255,255,255,0.15); color: #fff; }
.imgup-card-btn--view:hover { background: rgba(255,255,255,0.28); }
.imgup-card-btn--copy { background: rgba(99,102,241,0.35); color: #fff; }
.imgup-card-btn--copy:hover { background: rgba(99,102,241,0.65); }
.imgup-card-btn--del { background: rgba(239,68,68,0.3); color: #fff; }
.imgup-card-btn--del:hover { background: rgba(239,68,68,0.65); }

/* ── Empty state ─────────────────────────────────────────── */
.imgup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--text-secondary);
  opacity: 0.5;
  text-align: center;
}
.imgup-empty-icon { font-size: 48px; }
.imgup-empty p { margin: 0; font-size: 14px; }

/* ── Gallery transition ──────────────────────────────────── */
.gallery-enter-active { transition: all 0.3s ease; }
.gallery-leave-active { transition: all 0.2s ease; position: absolute; }
.gallery-enter-from { opacity: 0; transform: scale(0.85); }
.gallery-leave-to   { opacity: 0; transform: scale(0.85); }
.gallery-move       { transition: transform 0.3s ease; }

/* ── Lightbox ────────────────────────────────────────────── */
.lightbox-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
}

.lightbox-close {
  position: fixed; top: 16px; right: 16px;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s ease;
  backdrop-filter: blur(8px);
}
.lightbox-close:hover { background: rgba(255,255,255,0.22); }

.lightbox-nav {
  position: fixed; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s ease;
  backdrop-filter: blur(8px);
}
.lightbox-nav:hover { background: rgba(255,255,255,0.22); }
.lightbox-nav--prev { left: 16px; }
.lightbox-nav--next { right: 16px; }

.lightbox-caption {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  font-size: 13px; color: rgba(255,255,255,0.6);
  background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
  padding: 6px 14px; border-radius: 20px;
  white-space: nowrap; max-width: 80vw;
  overflow: hidden; text-overflow: ellipsis;
}

.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.2s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }

/* ── Mobile action sheet ─────────────────────────────────── */
.sheet-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet-panel {
  background: var(--card-bg, #1e1e2e);
  border-radius: 20px 20px 0 0;
  padding: 12px 16px 32px;
  width: 100%; max-width: 480px;
  display: flex; flex-direction: column; gap: 8px;
}
.sheet-handle {
  width: 40px; height: 4px;
  background: var(--card-border, rgba(255,255,255,0.15));
  border-radius: 2px; margin: 0 auto 12px;
}
.sheet-title {
  font-size: 13px; font-weight: 600; color: var(--text-secondary, #888);
  text-align: center; margin: 0 0 4px; letter-spacing: 0.3px;
}
.sheet-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; font-size: 15px; font-weight: 500;
  color: var(--text-primary, #fff);
  background: var(--el-input-bg-color, rgba(255,255,255,0.05));
  border: 1px solid var(--card-border, rgba(255,255,255,0.08));
  border-radius: 12px; cursor: pointer; transition: all 0.18s ease; width: 100%; text-align: left;
}
.sheet-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); }
.sheet-btn .el-icon { font-size: 18px; color: #6366f1; }
.sheet-btn--cancel {
  background: transparent; border-color: transparent;
  color: var(--text-secondary, #888); justify-content: center; font-size: 14px; margin-top: 4px;
}
.sheet-btn--cancel:hover { background: rgba(255,255,255,0.05); border-color: transparent; }

.sheet-enter-active, .sheet-leave-active { transition: opacity 0.22s ease; }
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel { transform: translateY(100%); }
</style>