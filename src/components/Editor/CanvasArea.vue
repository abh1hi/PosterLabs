<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas } from '../../composables/useCanvas'
import RenderElement from './RenderElement.vue'
import { RotateCcw, ZoomIn, ZoomOut, Layers } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon.js'

const { elements, selectedId, updateElement, updateStyle, commitHistory } = useElements()
const { bgColor, posterSize, scale, manualScale, panOffset, isPanning, activeTool } = useCanvas()

const containerRef = ref<HTMLElement | null>(null)

// Interaction State
const isDragging = ref(false)
const dragAction = ref<'move' | 'rotate' | 'resize' | null>(null)
const resizeHandle = ref<string | null>(null)
const dragStart = ref<{ x: number, y: number } | null>(null)
const elementStart = ref<{ x: number, y: number, w: number, h: number, rotate: number } | null>(null)
const panStart = ref<{ x: number, y: number }>({ x: 0, y: 0 })

// Filter visible elements
const visibleElements = computed(() => elements.value.filter(e => !e.hidden))

// --- Scale Logic ---
const updateAutoScale = () => {
  if (!containerRef.value) return
  const { clientWidth, clientHeight } = containerRef.value
  const padding = 160 // Buffer for floating controls
  const availableW = clientWidth - padding
  const availableH = clientHeight - padding
  
  const scaleW = availableW / (posterSize.value.w || 500)
  const scaleH = availableH / (posterSize.value.h || 700)
  
  scale.value = Math.min(scaleW, scaleH, 1) 
}

// --- Interaction Handlers ---
const pinchStartDist = ref<number | null>(null)
const pinchStartScale = ref<number>(1)

const getDistance = (touches: TouchList) => {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
}

const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
  if (window.TouchEvent && e instanceof TouchEvent && e.touches.length === 2) {
      if (e.cancelable) e.preventDefault()
      const dist = getDistance(e.touches)
      if (pinchStartDist.value === null) {
          pinchStartDist.value = dist
          pinchStartScale.value = manualScale.value
      } else {
          const ratio = dist / pinchStartDist.value
          manualScale.value = Math.min(Math.max(pinchStartScale.value * ratio, 0.5), 5)
      }
      return
  } else {
      pinchStartDist.value = null
  }

  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  if (isDragging.value && dragStart.value && selectedId.value && elementStart.value) {
    if (e.cancelable) e.preventDefault()
    
    const el = elements.value.find(el => el.id === selectedId.value)
    if (!el || el.locked) return

    const dx = clientX - dragStart.value.x
    const dy = clientY - dragStart.value.y
    const totalScale = (scale.value || 1) * (manualScale.value || 1)
    const scaledDx = dx / totalScale
    const scaledDy = dy / totalScale

    if (dragAction.value === 'move') {
      updateElement(selectedId.value, {
        x: elementStart.value.x + scaledDx,
        y: elementStart.value.y + scaledDy
      })
    } else if (dragAction.value === 'rotate') {
        const rect = document.querySelector(`[data-element-frame="true"]`)?.getBoundingClientRect()
        if (rect) {
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI)
          updateStyle(selectedId.value, { rotate: Math.round(angle + 90) })
        }
    } else if (dragAction.value === 'resize') {
       if (el.type === 'shape' || el.type === 'image') {
          let newW = elementStart.value.w
          let newH = elementStart.value.h
          
          if (resizeHandle.value?.includes('right')) newW = elementStart.value.w + scaledDx
          if (resizeHandle.value?.includes('bottom')) newH = elementStart.value.h + scaledDy
          if (resizeHandle.value?.includes('left')) {
              newW = elementStart.value.w - scaledDx
              updateElement(el.id, { x: elementStart.value.x + scaledDx })
          }
          if (resizeHandle.value?.includes('top')) {
              newH = elementStart.value.h - scaledDy
              updateElement(el.id, { y: elementStart.value.y + scaledDy })
          }

          updateStyle(selectedId.value, { 
              width: Math.max(newW, 20), 
              height: Math.max(newH, 20) 
          })
       }
    }
  } else if (isPanning.value) {
    if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) return 
    if (e.cancelable) e.preventDefault()

    panOffset.value = {
      x: clientX - panStart.value.x,
      y: clientY - panStart.value.y
    }
  }
}

const handleGlobalUp = () => {
  if (isDragging.value || isPanning.value) {
      if (isDragging.value) commitHistory()
      isDragging.value = false
      dragStart.value = null
      dragAction.value = null
      resizeHandle.value = null
      isPanning.value = false
  }
}

const handleElementDown = (e: MouseEvent | TouchEvent, id: number) => {
  if (activeTool.value === 'hand') return
  
  const el = elements.value.find(el => el.id === id)
  if (!el || el.hidden) return

  const target = e.target as HTMLElement
  const action = target.getAttribute('data-action') as any || 'move'
  const handle = target.getAttribute('data-handle')
  
  if(target.closest('[contenteditable="true"]')) return 
  
  e.stopPropagation()
  selectedId.value = id
  
  if (el.locked) return // Allow selection of locked elements, but no dragging

  isDragging.value = true
  dragAction.value = action
  resizeHandle.value = handle
  
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  dragStart.value = { x: clientX, y: clientY }
  
  elementStart.value = { 
    x: el.x, 
    y: el.y, 
    w: el.style.width || 0, 
    h: el.style.height || 0,
    rotate: el.style.rotate || 0
  }
}

const handleCanvasDown = (e: MouseEvent | TouchEvent) => {
   const target = e.target as HTMLElement
   
   if (activeTool.value === 'hand' || target === e.currentTarget || target.classList.contains('canvas-area-container')) {
     if (activeTool.value === 'select') selectedId.value = null
     
     isPanning.value = true
     const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
     const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
     
     panStart.value = {
        x: clientX - panOffset.value.x,
        y: clientY - panOffset.value.y
     }
   }
}

onMounted(() => {
  window.addEventListener('resize', updateAutoScale)
  window.addEventListener('mousemove', handleGlobalMove, { passive: false })
  window.addEventListener('mouseup', handleGlobalUp)
  window.addEventListener('touchmove', handleGlobalMove, { passive: false })
  window.addEventListener('touchend', handleGlobalUp)
  
  window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && activeTool.value !== 'hand') {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return
          activeTool.value = 'hand'
      }
      if (e.key === 'v') {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return
          activeTool.value = 'select'
      }
      if (e.key === 'h') {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return
          activeTool.value = 'hand'
      }
  })
  window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && activeTool.value === 'hand') {
          activeTool.value = 'select'
      }
  })

  nextTick(updateAutoScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateAutoScale)
  window.removeEventListener('mousemove', handleGlobalMove)
  window.removeEventListener('mouseup', handleGlobalUp)
  window.removeEventListener('touchmove', handleGlobalMove)
  window.removeEventListener('touchend', handleGlobalUp)
})

watch(() => posterSize.value, updateAutoScale, { deep: true })
</script>

<template>
  <div 
     ref="containerRef"
     class="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative touch-none canvas-area-container theme-transition"
     :class="[
       activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : (isDragging ? 'cursor-grabbing' : 'cursor-default')
     ]"
     style="background-color: var(--bg-surface);"
     @mousedown="handleCanvasDown"
     @touchstart="handleCanvasDown"
  >
     <!-- Canvas Content -->
     <div
       class="relative transition-transform duration-75 ease-out shadow-2xl"
       :style="{
          width: `${posterSize.w}px`,
          height: `${posterSize.h}px`,
          backgroundColor: bgColor,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale * manualScale})`,
          opacity: 1
       }"
     >
        <!-- Grid -->
        <div class="absolute inset-0 pointer-events-none opacity-10"
             :style="{ 
               backgroundImage: `linear-gradient(${bgColor === '#121212' ? '#333' : '#ccc'} 1px, transparent 1px), linear-gradient(90deg, ${bgColor === '#121212' ? '#333' : '#ccc'} 1px, transparent 1px)`, 
               backgroundSize: '20px 20px' 
             }"
        ></div>

         <!-- Elements -->
         <RenderElement
           v-for="el in visibleElements"
           :key="el.id"
           :element="el"
           :is-selected="selectedId === el.id"
           @mousedown="(e) => handleElementDown(e, el.id)"
           @touchstart="(e) => handleElementDown(e, el.id)"
           @update="updateElement"
         />

         <!-- Empty State Placeholder -->
         <div v-if="elements.length === 0" class="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
            <div class="w-24 h-24 mb-6 rounded-3xl bg-blue-500/5 border-2 border-dashed border-blue-500/20 flex items-center justify-center animate-pulse">
               <Layers class="text-blue-500/30" :size="48" />
            </div>
            <h2 class="text-2xl font-bold mb-2" style="color: var(--fg-primary);">Your canvas is ready</h2>
            <p class="max-w-[240px] text-sm leading-relaxed" style="color: var(--fg-secondary);">
              Add text, shapes, or images from the left toolbar to start creating your masterpiece.
            </p>
         </div>
     </div>

     <!-- Global Zoom Controls -->
     <div class="absolute bottom-6 right-6 flex items-center gap-1 z-50 p-1 rounded-2xl backdrop-blur-md border shadow-2xl theme-transition" style="background-color: var(--bg-panel); border-color: var(--border-color);">
        <md-icon-button @click.stop="manualScale = Math.max(manualScale - 0.1, 0.5)" title="Zoom Out">
            <ZoomOut :size="18" />
        </md-icon-button>
        <div class="text-[11px] font-mono px-2 min-w-[50px] text-center" style="color: var(--fg-secondary);">{{ Math.round(scale * manualScale * 100) }}%</div>
        <md-icon-button @click.stop="manualScale = Math.min(manualScale + 0.1, 5)" title="Zoom In">
           <ZoomIn :size="18" />
        </md-icon-button>
        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <md-icon-button @click.stop="manualScale = 1; panOffset = {x:0, y:0}" title="Reset View">
            <RotateCcw :size="18" />
        </md-icon-button>
     </div>
  </div>
</template>

<style scoped>
.canvas-area-container {
  background-image: radial-gradient(circle, var(--border-color) 1px, transparent 1px);
  background-size: 24px 24px;
}
</style>
