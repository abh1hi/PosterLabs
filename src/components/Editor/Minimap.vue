<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  posterSize: { w: number, h: number }
  containerSize: { w: number, h: number }
  scale: number // This should be total scale (auto * manual)
  panOffset: { x: number, y: number }
}>()

// Constants for minimap display
const MAX_WIDTH = 120
const MAX_HEIGHT = 120
const HOVER_SIZE = 240
const PADDING = 10

const isHovered = ref(false)

// 1. Calculate Viewport Rect in Poster Coordinates
const viewportRect = computed(() => {
  if (!props.scale || props.scale === 0) return { x: 0, y: 0, w: 0, h: 0 }
  
  const totalTX = (props.containerSize.w - props.posterSize.w * props.scale) / 2 + props.panOffset.x
  const totalTY = (props.containerSize.h - props.posterSize.h * props.scale) / 2 + props.panOffset.y
  
  const x = -totalTX / props.scale
  const y = -totalTY / props.scale
  const w = props.containerSize.w / props.scale
  const h = props.containerSize.h / props.scale
  
  return { x, y, w, h }
})

// 2. Calculate Transform to fit content into Minimap Container
const viewTransform = computed(() => {
  const containerSize = isHovered.value ? HOVER_SIZE : Math.max(MAX_WIDTH, MAX_HEIGHT) // Use square basis for simplicity logic
  
  // Target Bounds to Show
  let targetX, targetY, targetW, targetH
  
  if (isHovered.value) {
     // Union of Poster(0,0,W,H) and ViewportRect
     const v = viewportRect.value
     const p = { x: 0, y: 0, w: props.posterSize.w, h: props.posterSize.h }
     
     const minX = Math.min(v.x, p.x)
     const minY = Math.min(v.y, p.y)
     const maxX = Math.max(v.x + v.w, p.x + p.w)
     const maxY = Math.max(v.y + v.h, p.y + p.h)
     
     targetX = minX
     targetY = minY
     targetW = maxX - minX
     targetH = maxY - minY
  } else {
      // Just the Poster
     targetX = 0
     targetY = 0
     targetW = props.posterSize.w
     targetH = props.posterSize.h
  }

  // Calculate Scale to fit Target into Container (minus padding)
  const availableSpace = isHovered.value ? HOVER_SIZE : (MAX_WIDTH) // Simplified
  const wRatio = availableSpace / targetW
  const hRatio = availableSpace / targetH
  const scale = Math.min(wRatio, hRatio)
  
  // Calculate Translation to center the Target
  // We want (targetX + targetW/2) to map to (containerSize/2)
  // map(x) = (x - targetX) * scale + offset?
  // Center of target relative to target top-left is w/2, h/2
  // We apply scale.
  // Then we want that point to be at container center.
  
  const targetCenterX = targetX + targetW / 2
  const targetCenterY = targetY + targetH / 2
  
  // We will apply transform to the Content Group:
  // transform-origin: top left (0,0) of poster space? No, usually 0,0 is poster top left.
  // Let's say we apply: scale(S) translate(TX, TY)?
  // Or translate(TX, TY) scale(S)?
  // Let's compute the final offset needed for the css.
  
  // visualX = (realX - targetCenterX) * scale + containerCenter
  const containerCenter = (isHovered.value ? HOVER_SIZE : MAX_WIDTH) / 2 + PADDING
  
  const translateX = containerCenter - targetCenterX * scale
  const translateY = containerCenter - targetCenterY * scale
  
  return { scale, translateX, translateY }
})

// Distance Info (Simplified for visual only, reused logic/concepts if needed but transforms handle position)
const distanceInfo = computed(() => {
    if (!isHovered.value) {
        // Only show if NOT hovered (standard minimap mode)
        // Re-implement basic check logic or just hide it? 
        // User asked "when hovered... enlarge ... show pawned rect".
        // The expanded view naturally shows the rect.
        // The dotted line is useful in the collapsed view.
        
        // Let's use logic similar to before but adapted.
        const v = viewportRect.value
        const p = { x: 0, y: 0, w: props.posterSize.w, h: props.posterSize.h }
        const intersects = !(v.x > p.w || v.x + v.w < 0 || v.y > p.h || v.y + v.h < 0)
        
        if (intersects) return { show: false }
        
        // Calculate centers in Poster Space
        const pcx = props.posterSize.w / 2
        const pcy = props.posterSize.h / 2
        const vcx = v.x + v.w / 2
        const vcy = v.y + v.h / 2
        
        return { 
            show: true,
            x1: pcx, y1: pcy,
            x2: vcx, y2: vcy,
            dist: Math.sqrt((vcx-pcx)**2 + (vcy-pcy)**2)
        }
    }
    return { show: false }
})

</script>

<template>
  <div 
    class="bg-surface-high border border-outline/10 shadow-lg backdrop-blur-md rounded-lg p-2 relative overflow-hidden transition-all duration-300 ease-out origin-bottom-right cursor-crosshair"
    :class="{ 'opacity-100': isHovered, 'opacity-90': !isHovered }"
    :style="{ 
        width: isHovered ? `${HOVER_SIZE + PADDING*2}px` : `${MAX_WIDTH + PADDING*2}px`, 
        height: isHovered ? `${HOVER_SIZE + PADDING*2}px` : `${MAX_HEIGHT + PADDING*2}px` 
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @touchstart.passive="isHovered = true"
    @touchend="isHovered = false"
  >
    <!-- Content Container with Transform -->
    <div 
        class="relative w-full h-full transition-transform duration-300 ease-out"
        :style="{
            transform: `translate(${viewTransform.translateX}px, ${viewTransform.translateY}px) scale(${viewTransform.scale})`,
            transformOrigin: '0 0'
        }"
    >
    
        <!-- SVG Layer (In Poster Coordinates Space) -->
        <svg class="absolute top-0 left-0 overflow-visible" 
             style="width: 1px; height: 1px;"> <!-- Size doesn't matter as overlap is visible -->
             
             <!-- Dashed Line (Only when collapsed and distant) -->
            <template v-if="distanceInfo.show">
                <line 
                    :x1="distanceInfo.x1" :y1="distanceInfo.y1" 
                    :x2="distanceInfo.x2" :y2="distanceInfo.y2" 
                    stroke="var(--md-sys-color-primary)" 
                    stroke-width="20" 
                    vector-effect="non-scaling-stroke"
                    stroke-dasharray="4 2"
                    opacity="0.6"
                />
            </template>
            
             <!-- Distance Label (Only when collapsed) -->
             <!-- HARD to scale text cleanly with massive transforms. 
                  Implementation Detail: Better to overlay text in screen space if possible.
                  For now, skipping text in Collapsed mode to avoid complex inverse scaling or huge text. 
                  The visual line is strong enough. -->
        </svg>

        <!-- Poster Representation (0,0 to w,h) -->
        <div 
            class="bg-surface-variant/50 border border-outline/20 absolute top-0 left-0"
            :style="{
                width: `${posterSize.w}px`,
                height: `${posterSize.h}px`
            }"
        >
            <!-- Center Dot -->
            <div class="absolute top-1/2 left-1/2 w-4 h-4 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
        </div>
        
        <!-- Viewport Rect (The 'Camera') -->
        <div 
            class="absolute border-[40px] border-primary bg-primary/10 transition-all duration-75 ease-out rounded-sm z-20"
             :style="{
                left: `${viewportRect.x}px`,
                top: `${viewportRect.y}px`,
                width: `${viewportRect.w}px`,
                height: `${viewportRect.h}px`,
                borderWidth: `${2 / viewTransform.scale}px` // Counter-scale border width so it looks consistent
            }"
        ></div>
        
    </div>
  </div>
</template>
