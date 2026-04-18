<template>
  <div ref="vantaRef" class="vanta-bg"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import NET from 'vanta/dist/vanta.net.min'
import { useExpenseStore } from '../stores/expenseStore'

const vantaRef = ref(null)
const store = useExpenseStore()
let vantaEffect = null

const getVantaOptions = (theme) => {
  const options = {
    el: vantaRef.value,
    THREE: THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    points: 12.00,
    maxDistance: 22.00,
    spacing: 16.00
  }

  if (theme === 'black') {
    options.backgroundColor = 0x0f172a
    options.color = 0x6366f1
  } else if (theme === 'blue') {
    options.backgroundColor = 0x0d2b4e
    options.color = 0x3b82f6
  } else {
    options.backgroundColor = 0xf8fafc
    options.color = 0x6366f1
  }

  return options
}

const initVanta = () => {
  if (vantaEffect) vantaEffect.destroy()
  vantaEffect = NET(getVantaOptions(store.theme))
}

onMounted(() => {
  initVanta()
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy()
})

watch(() => store.theme, () => {
  initVanta()
})
</script>

<style scoped>
.vanta-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
