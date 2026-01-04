<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas } from '../../composables/useCanvas'
import RenderElement from './RenderElement.vue'
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Hand } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'

const { elements, selectedId } = useElements()
const { 
  posterSize, bgColor, scale, panOffset, isPanning,
  backgroundType, gradientStyle, showGrid,
  manualScale, activeTool
} = useCanvas()

const containerRef = ref<HTMLElement | null>(null)

const updateAutoScale = () => {
    if (!containerRef.value) return
    const padding = 64
    const availableW = containerRef.value.clientWidth - padding
    const availableH = containerRef.value.clientHeight - padding
    const scaleW = availableW / posterSize.value.w
    const scaleH = availableH / posterSize.value.h
    scale.value = Math.min(scaleW, scaleH, 1)
}

onMounted(() => {
    updateAutoScale()
    window.addEventListener('resize', updateAutoScale)
})

watch(posterSize, updateAutoScale, { deep: true })

const handleCanvasClick = (e: MouseEvent | TouchEvent) => {
    if (e.target === e.currentTarget) {
        selectedId.value = null
    }
}

// Global Zoom Controls Actions
const zoomIn = () => manualScale.value = Math.min(manualScale.value + 0.1, 5)
const zoomOut = () => manualScale.value = Math.max(manualScale.value - 0.1, 0.2)
const resetZoom = () => { manualScale.value = 1; panOffset.value = { x: 0, y: 0 } }

// --- Touch Gestures ---
const lastTouchDistance = ref<number | null>(null)
const lastTouchCenter = ref<{ x: number, y: number } | null>(null)

const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
}

const getCenter = (t1: Touch, t2: Touch) => {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    }
}

const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
        lastTouchDistance.value = getDistance(e.touches[0], e.touches[1])
        lastTouchCenter.value = getCenter(e.touches[0], e.touches[1])
    } else {
        handleCanvasClick(e)
    }
}

const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
        e.preventDefault() // Prevent page scroll (important) via CSS too if needed

        // Pinch Zoom
        const dist = getDistance(e.touches[0], e.touches[1])
        if (lastTouchDistance.value) {
            const zoomDelta = dist / lastTouchDistance.value
            manualScale.value = Math.min(Math.max(manualScale.value * zoomDelta, 0.2), 5)
        }
        lastTouchDistance.value = dist

        // Two-Finger Pan
        const center = getCenter(e.touches[0], e.touches[1])
        if (lastTouchCenter.value) {
            const dx = center.x - lastTouchCenter.value.x
            const dy = center.y - lastTouchCenter.value.y
            panOffset.value = { x: panOffset.value.x + dx, y: panOffset.value.y + dy }
        }
        lastTouchCenter.value = center
    }
}

const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
        lastTouchDistance.value = null
        lastTouchCenter.value = null
    }
}

// --- Trackpad Gestures ---
const handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey || e.metaKey) {
        // Pinch / Zoom (Trackpads often send Ctrl+Wheel for pinch)
        // Adjust sensitivity as needed
        const zoomDelta = -e.deltaY * 0.01 
        manualScale.value = Math.min(Math.max(manualScale.value + zoomDelta, 0.2), 5)
    } else {
        // Pan
        panOffset.value = {
            x: panOffset.value.x - e.deltaX,
            y: panOffset.value.y - e.deltaY
        }
    }
}

</script>

<template>
  <div 
    ref="containerRef"
    id="poster-canvas-container"
    class="flex-1 bg-surface-lowest relative overflow-hidden flex items-center justify-center cursor-crosshair theme-transition"
    @mousedown="handleCanvasClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @wheel="handleWheel"
  >
    <!-- Background Grid / Texture -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>

    <!-- Zoomable/Pannable Viewport -->
    <div 
       class="relative transition-transform duration-200 ease-out preserve-3d"
       :style="{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale * manualScale})`,
          width: `${posterSize.w}px`,
          height: `${posterSize.h}px`
       }"
    >
       <!-- The Poster Surface -->
       <div 
          id="poster-content"
          class="w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-outline/5 relative overflow-hidden theme-transition"
          :style="{ 
            backgroundColor: backgroundType === 'solid' ? bgColor : undefined,
            backgroundImage: backgroundType === 'gradient' ? gradientStyle : undefined,
          }"
       >
          <!-- Grid Overlay -->
          <div v-if="showGrid" class="absolute inset-0 pointer-events-none z-[1]" 
               style="background-image: linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px); background-size: 50px 50px;">
          </div>
          <RenderElement 
            v-for="element in elements" 
            :key="element.id" 
            :element="element" 
          />
       </div>
    </div>

    <!-- Floating UI: Zoom & Tools -->
    <div class="absolute bottom-8 right-8 flex flex-col gap-2 z-40">
        <div class="bg-surface-high rounded-[28px] p-2 flex flex-col gap-1 shadow-lg border border-outline/10 backdrop-blur-md">
            <md-icon-button @click="zoomIn"><ZoomIn :size="20" /></md-icon-button>
            <div class="h-px bg-outline/10 mx-2"></div>
            <md-icon-button @click="zoomOut"><ZoomOut :size="20" /></md-icon-button>
            <div class="h-px bg-outline/10 mx-2"></div>
            <md-icon-button @click="resetZoom"><Maximize :size="20" /></md-icon-button>
        </div>
        <div class="bg-primary-container text-on-primary-container rounded-[28px] p-2 flex flex-col gap-1 shadow-lg shadow-primary/10">
            <md-icon-button @click="activeTool = 'select'" :selected="activeTool === 'select'"><MousePointer2 :size="20" /></md-icon-button>
            <md-icon-button @click="activeTool = 'hand'" :selected="activeTool === 'hand'"><Hand :size="20" /></md-icon-button>
        </div>
    </div>

    <!-- Scale Indicator -->
    <div class="absolute bottom-8 left-8 bg-surface-high px-4 py-2 rounded-full border border-outline/10 shadow-sm backdrop-blur-md z-40">
       <span class="label-medium text-on-surface-variant font-mono">{{ Math.round(scale * manualScale * 100) }}%</span>
    </div>

  </div>
</template>

<style scoped>
@reference "../../index.css";

.preserve-3d { transform-style: preserve-3d; }
.bg-surface-lowest { background-color: var(--md-sys-color-surface-container-lowest); }
.bg-surface-high { background-color: var(--md-sys-color-surface-container-high); }
.bg-primary-container { background-color: var(--md-sys-color-primary-container); }
.text-on-primary-container { color: var(--md-sys-color-on-primary-container); }
</style>
