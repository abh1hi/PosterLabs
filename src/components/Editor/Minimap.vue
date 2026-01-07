<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { useElements } from '../../composables/useElements'

const props = defineProps<{
    containerSize: { w: number, h: number }
}>()

const { posterSize, panOffset, scale, manualScale } = useCanvas()
const { elements } = useElements()

// Constants
const NAV_WIDTH = 140
const NAV_HEIGHT = 140

// State
const isHovered = ref(false)
const isDragging = ref(false)
const minimapRef = ref<HTMLElement | null>(null)

// Computed Scale for Minimap Rendering
const minimapScale = computed(() => {
    const wRatio = NAV_WIDTH / posterSize.value.w
    const hRatio = NAV_HEIGHT / posterSize.value.h
    return Math.min(wRatio, hRatio)
})

// Viewport / Camera Box (The red outline)
// This represents the current visible area of the canvas relative to the poster
const viewportRect = computed(() => {
    const currentScale = scale.value * manualScale.value
    if (!currentScale) return { x: 0, y: 0, w: 0, h: 0 }

    // Calculate the top-left of the viewport in POSTER COORDINATES
    // transformation is: screenX = (posterX * scale) + transX
    // so: posterX = (screenX - transX) / scale
    
    // The "Screen" is the container (0,0 to w,h)
    // The visible poster area starts at screen (0,0)
    
    const vX = -panOffset.value.x / currentScale
    const vY = -panOffset.value.y / currentScale
    const vW = props.containerSize.w / currentScale
    const vH = props.containerSize.h / currentScale
    
    return {
        x: vX,
        y: vY,
        w: vW,
        h: vH
    }
})

// Interaction Types
const handleInteraction = (e: MouseEvent | TouchEvent) => {
    if (!minimapRef.value) return
    // e.preventDefault() // Allow default if just tapping? No, we want to prevent scroll.
    if (e.cancelable) e.preventDefault()
    e.stopPropagation()

    const rect = minimapRef.value.getBoundingClientRect()
    
    let clientX = 0, clientY = 0
    if ('touches' in e && e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
    } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
    }

    // Mouse/Touch relative to minimap container (top-left)
    const mx = clientX - rect.left
    const my = clientY - rect.top
    
    // Center of container
    const cx = rect.width / 2
    const cy = rect.height / 2
    
    // Relative to center
    const dx = mx - cx
    const dy = my - cy
    
    const clickedPosterX = dx / minimapScale.value + posterSize.value.w / 2
    const clickedPosterY = dy / minimapScale.value + posterSize.value.h / 2
    
    updatePanToCenter(clickedPosterX, clickedPosterY)
    isDragging.value = true
    
    window.addEventListener('mousemove', handleGlobalMove)
    window.addEventListener('mouseup', handleGlobalEnd)
    window.addEventListener('touchmove', handleGlobalMove, { passive: false })
    window.addEventListener('touchend', handleGlobalEnd)
}

const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
    if (!minimapRef.value || !isDragging.value) return
    if (e.cancelable) e.preventDefault()
    
    const rect = minimapRef.value.getBoundingClientRect()
    
    let clientX = 0, clientY = 0
    if ('touches' in e && e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
    } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
    }

    const mx = clientX - rect.left
    const my = clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    
    const clickedPosterX = (mx - cx) / minimapScale.value + posterSize.value.w / 2
    const clickedPosterY = (my - cy) / minimapScale.value + posterSize.value.h / 2
    
    updatePanToCenter(clickedPosterX, clickedPosterY)
}

const handleGlobalEnd = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', handleGlobalMove)
    window.removeEventListener('mouseup', handleGlobalEnd)
    window.removeEventListener('touchmove', handleGlobalMove)
    window.removeEventListener('touchend', handleGlobalEnd)
}

const updatePanToCenter = (posterX: number, posterY: number) => {
    const currentScale = scale.value * manualScale.value
    
    // We want posterX, posterY to be at the center of the viewport (containerSize w/2, h/2)
    // screenX = (posterX * scale) + panOffset
    // containerW/2 = (posterX * scale) + panOffset
    // panOffset = containerW/2 - posterX * scale
    
    const newPanX = props.containerSize.w / 2 - posterX * currentScale
    const newPanY = props.containerSize.h / 2 - posterY * currentScale
    
    panOffset.value = { x: newPanX, y: newPanY }
}

onUnmounted(() => {
    window.removeEventListener('mousemove', handleGlobalMove)
    window.removeEventListener('mouseup', handleGlobalEnd)
    window.removeEventListener('touchmove', handleGlobalMove)
    window.removeEventListener('touchend', handleGlobalEnd)
})
</script>

<template>
  <div 
    ref="minimapRef"
    class="bg-surface-high border border-outline/10 shadow-lg backdrop-blur-md rounded-xl relative overflow-hidden transition-all duration-300 ease-out origin-bottom-right group select-none"
    :class="{ 
        'w-[180px] h-[180px] opacity-100': isHovered || isDragging, 
        'w-[120px] h-[120px] opacity-80': !isHovered && !isDragging 
    }"
    @mouseenter="isHovered = true"
    @mouseleave="!isDragging && (isHovered = false)"
    @mousedown="handleInteraction"
    @touchstart="handleInteraction"
  >
    <!-- Centering Wrapper -->
    <div class="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
        
        <!-- Scaled Content Container -->
        <div 
            class="relative shadow-sm bg-white"
            :style="{
                width: `${posterSize.w * minimapScale}px`,
                height: `${posterSize.h * minimapScale}px`
            }"
        >
            <!-- Render Simplified Elements -->
             <div 
                v-for="el in elements" 
                :key="el.id"
                class="absolute"
                :style="{
                    left: `${el.x * minimapScale}px`,
                    top: `${el.y * minimapScale}px`,
                    width: `${(el.style.width || 100) * minimapScale}px`,
                    height: `${(el.style.height || 100) * minimapScale}px`,
                    backgroundColor: el.style.backgroundColor || el.style.color || '#ccc',
                    borderRadius: `${(typeof el.style.borderRadius === 'number' ? el.style.borderRadius : parseInt(el.style.borderRadius || '0')) * minimapScale}px`,
                    opacity: el.style.opacity ?? 1,
                    transform: `rotate(${el.style.rotate || 0}deg)`
                }"
             ></div>
             
             <!-- Viewport Indicator (Camera) -->
             <!-- We need to clamp/clip this if it goes way out, but normally overflow hidden on parent handles it. -->
             <div 
                class="absolute border-2 border-primary shadow-[0_0_0_1000px_rgba(0,0,0,0.3)] pointer-events-none"
                :style="{
                    left: `${viewportRect.x * minimapScale}px`,
                    top: `${viewportRect.y * minimapScale}px`,
                    width: `${viewportRect.w * minimapScale}px`,
                    height: `${viewportRect.h * minimapScale}px`
                }"
             ></div>
        </div>
        
    </div>
    
    <!-- Hover Overlay Label -->
    <div class="absolute bottom-1 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Minimap</span>
    </div>

  </div>
</template>

