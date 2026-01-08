<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas } from '../../composables/useCanvas'
import { useTransform } from '../../composables/useTransform'
import RenderElement from './RenderElement.vue'
import Minimap from './Minimap.vue'
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Hand, Magnet, Map as MapIcon, Plus } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'

const { alignmentGuides, snappingEnabled } = useTransform()
const { elements, selectedId, toggleSelection } = useElements()
const { 
  posterSize, bgColor, scale, panOffset,
  backgroundType, gradientStyle, showGrid,
  manualScale, activeTool, isDrawing, brushSettings, activeTab
} = useCanvas()



// Marquee Selection State
const isDragSelecting = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const selectionBox = ref({ x: 0, y: 0, w: 0, h: 0 })

// Local UI State
const previewMode = ref(false)
const showMinimap = ref(true)

const containerRef = ref<HTMLElement | null>(null)
const containerSize = ref({ w: 0, h: 0 })

const updateAutoScale = () => {
    if (!containerRef.value) return
    const padding = 40 // Reduced fixed padding
    // Update reactive container size
    containerSize.value = {
        w: containerRef.value.clientWidth,
        h: containerRef.value.clientHeight
    }
    const availableW = containerRef.value.clientWidth - padding
    const availableH = containerRef.value.clientHeight - padding
    
    // Calculate ratio to fit entirely within available space
    const scaleW = availableW / posterSize.value.w
    const scaleH = availableH / posterSize.value.h
    
    // Use the smaller scale to ensure it fits, multiply by 0.95 for a nice breathing room
    // Removed Math.min(..., 1) to allow upscaling for small posters on big screens
    scale.value = Math.min(scaleW, scaleH) * 0.95 
}

onMounted(() => {
    updateAutoScale()
    
    if (containerRef.value) {
        const resizeObserver = new ResizeObserver(() => {
            updateAutoScale()
        })
        resizeObserver.observe(containerRef.value)
        
        // Cleanup on unmount (Vue automatically handles this mostly, but good practice if we extracted logic)
    }
})

watch(posterSize, updateAutoScale, { deep: true })

const handleCanvasClick = (e: MouseEvent | TouchEvent) => {
    // Check if clicked strictly on background
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'poster-content') {
        const isMulti = (e as MouseEvent).shiftKey || (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey
        
        if (!isMulti) {
            selectedId.value = null
        }
        
        // Start Marquee Selection if Select Tool is active
        if (activeTool.value === 'select') {
             isDragSelecting.value = true
             
             // Calculate start position relative to poster content
             // We need to account for pan/scale or just use simple offset if the event target is the container
             // Easier: Get client coordinates and convert to poster coordinates
             
             // NOTE: Simple approach - using e.offset if target is poster-content, 
             // but reliable way is ClientRect
             const contentRect = document.getElementById('poster-content')?.getBoundingClientRect()
             if (contentRect) {
                  let clientX, clientY
                  const touchEvent = e as TouchEvent
                  if (touchEvent.touches && touchEvent.touches.length > 0) {
                      clientX = touchEvent.touches[0]!.clientX
                      clientY = touchEvent.touches[0]!.clientY
                  } else {
                      clientX = (e as MouseEvent).clientX
                      clientY = (e as MouseEvent).clientY
                  }
                  
                  const x = (clientX - contentRect.left) / (scale.value * manualScale.value)
                  const y = (clientY - contentRect.top) / (scale.value * manualScale.value)
                  
                  dragStart.value = { x, y }
                  selectionBox.value = { x, y, w: 0, h: 0 }
             }
        }
    }
}

// Global Zoom Controls Actions
const zoomIn = () => manualScale.value = Math.min(manualScale.value + 0.1, 5)
const zoomOut = () => manualScale.value = Math.max(manualScale.value - 0.1, 0.2)
const resetZoom = () => { manualScale.value = 1; panOffset.value = { x: 0, y: 0 } } // Fits to screen
const setActualSize = () => { 
    manualScale.value = 1 / scale.value 
    panOffset.value = { x: 0, y: 0 } 
}

// --- Touch Gestures ---
const lastTouchDistance = ref<number | null>(null)
const lastTouchCenter = ref<{ x: number, y: number } | null>(null)
const lastSingleTouch = ref<{ x: number, y: number } | null>(null)

// One-Handed Zoom State
const lastTapTime = ref(0)
const isDoubleTapZooming = ref(false)
const oneFingerZoomStartY = ref(0)
const startScale = ref(1)

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
    // 1. Two Finger Gestures (Pinch / Pan)
    if (e.touches.length === 2) {
        lastTouchDistance.value = getDistance(e.touches[0] as Touch, e.touches[1] as Touch)
        lastTouchCenter.value = getCenter(e.touches[0] as Touch, e.touches[1] as Touch)
        return
    } 
    
    // 2. Single Finger Gestures
    if (e.touches.length === 1) {
        const touch = e.touches[0] as Touch
        const now = Date.now()
        const isBackground = e.target === e.currentTarget || (e.target as HTMLElement).id === 'poster-content' || (e.target as HTMLElement).id === 'poster-canvas-container'

        // Double Tap Detection (for One-Handed Zoom)
        if (now - lastTapTime.value < 300 && isBackground) {
            // Double Tap Started -> Wait for drag to zoom
            isDoubleTapZooming.value = true
            oneFingerZoomStartY.value = touch.clientY
            startScale.value = manualScale.value
            e.preventDefault() // Prevent default double-tap zoom of browser
        } else {
             // Single Tap
             lastTapTime.value = now
             
             // If tool is Hand -> Start Pan
             // If tool is Select -> Let it fall through to handleCanvasClick (handles both Selection and Marquee)
             if (activeTool.value === 'hand') {
                 lastSingleTouch.value = { x: touch.clientX, y: touch.clientY }
             } else {
                 handleCanvasClick(e)
             }
        }
    }
}

const handleTouchMove = (e: TouchEvent) => {
    if (isDragSelecting.value) {
         e.preventDefault()
         const contentRect = document.getElementById('poster-content')?.getBoundingClientRect()
         const touch = e.touches[0]
         if (contentRect && touch) {
             const currentX = (touch.clientX - contentRect.left) / (scale.value * manualScale.value)
             const currentY = (touch.clientY - contentRect.top) / (scale.value * manualScale.value)
             
             const x = Math.min(dragStart.value.x, currentX)
             const y = Math.min(dragStart.value.y, currentY)
             const w = Math.abs(currentX - dragStart.value.x)
             const h = Math.abs(currentY - dragStart.value.y)
             
             selectionBox.value = { x, y, w, h }
         }
         return // Stop other gestures
    }

    if (e.touches.length === 2) {
        e.preventDefault() // Prevent page scroll

        // Pinch Zoom
        const dist = getDistance(e.touches[0] as Touch, e.touches[1] as Touch)
        if (lastTouchDistance.value) {
            const zoomDelta = dist / lastTouchDistance.value
            manualScale.value = Math.min(Math.max(manualScale.value * zoomDelta, 0.2), 5)
        }
        lastTouchDistance.value = dist

        // Two-Finger Pan
        const center = getCenter(e.touches[0] as Touch, e.touches[1] as Touch)
        if (lastTouchCenter.value) {
            const dx = center.x - lastTouchCenter.value.x
            const dy = center.y - lastTouchCenter.value.y
            panOffset.value = { x: panOffset.value.x + dx, y: panOffset.value.y + dy }
        }
        lastTouchCenter.value = center
        return
    } 
    
    // One-Handed Zoom (Double Tap + Drag)
    if (isDoubleTapZooming.value && e.touches.length === 1) {
        e.preventDefault()
        const touch = e.touches[0] as Touch
        const dy = touch.clientY - oneFingerZoomStartY.value
        
        // Drag Down = Zoom In, Drag Up = Zoom Out (Standard Map Behavior)
        // Sensitivity factor 0.005
        const zoomFactor = 1 + (dy * 0.005)
        manualScale.value = Math.min(Math.max(startScale.value * zoomFactor, 0.2), 5)
        return
    }

    // Single Finger Pan
    if (activeTool.value === 'hand' && lastSingleTouch.value && e.touches.length === 1) {
        e.preventDefault() // Prevent pull-to-refresh / scrolling
        const touch = e.touches[0] as Touch
        const dx = touch.clientX - lastSingleTouch.value.x
        const dy = touch.clientY - lastSingleTouch.value.y
        panOffset.value = { x: panOffset.value.x + dx, y: panOffset.value.y + dy }
        lastSingleTouch.value = { x: touch.clientX, y: touch.clientY }
    }
}

const handleTouchEnd = (e: TouchEvent) => {
    if (isDragSelecting.value) {
        // Finalize Selection
        const box = selectionBox.value
        // Simple AABB Intersection
        elements.value.forEach(el => {
             // Element Rect (approx)
             const elW = el.style.width || 0
             const elH = el.style.height || 0
             // Check overlapping
             const overlaps = !(
                box.x > el.x + elW ||
                box.x + box.w < el.x ||
                box.y > el.y + elH ||
                box.y + box.h < el.y
             )
             
             if (overlaps && !el.locked && !el.hidden) {
                 toggleSelection(el.id, true) // Add to selection
             }
        })
        
        isDragSelecting.value = false
        selectionBox.value = { x: 0, y: 0, w: 0, h: 0 }
    }

    if (e.touches.length < 2) {
        lastTouchDistance.value = null
        lastTouchCenter.value = null
    }
    
    if (e.touches.length === 0) {
        lastSingleTouch.value = null
        isDoubleTapZooming.value = false
    }
}

// --- Trackpad Gestures ---
const handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey || e.metaKey) {
        // Pinch / Zoom (Trackpads often send Ctrl+Wheel for pinch)
        const zoomDelta = -e.deltaY * 0.005 // Reduced sensitivity for smoother control
        // Limit zoom between 0.2x and 5x
        manualScale.value = Math.min(Math.max(manualScale.value + zoomDelta, 0.2), 5)
    } else {
        // Pan (Standard scrolling)
        // Divide by scale to ensure panning feels 1:1 with finger movement regardless of zoom level
        const currentScale = scale.value * manualScale.value
        panOffset.value = {
            x: panOffset.value.x - e.deltaX / currentScale,
            y: panOffset.value.y - e.deltaY / currentScale
        }
    }
}
// Mouse Move/Up Handlers for Marquee (since we only had TouchMove before for gestures)
// We need to add global mouse listeners or use canvas events if we can capture them reliably
// Ideally, we add window listeners on mousedown

// --- Mouse Pan & Select Logic ---
const isMousePanning = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

const handleMouseDown = (e: MouseEvent) => {
    if (activeTool.value === 'hand') {
        isMousePanning.value = true
        lastMousePos.value = { x: e.clientX, y: e.clientY }
        return
    }
    handleCanvasClick(e)
}

const handleMouseMove = (e: MouseEvent) => {
    if (isDragSelecting.value) {
         e.preventDefault()
         const contentRect = document.getElementById('poster-content')?.getBoundingClientRect()
         if (contentRect) {
             const currentX = (e.clientX - contentRect.left) / (scale.value * manualScale.value)
             const currentY = (e.clientY - contentRect.top) / (scale.value * manualScale.value)
             
             const x = Math.min(dragStart.value.x, currentX)
             const y = Math.min(dragStart.value.y, currentY)
             const w = Math.abs(currentX - dragStart.value.x)
             const h = Math.abs(currentY - dragStart.value.y)
             
             selectionBox.value = { x, y, w, h }
         }
    }
}

const handleMouseUp = (_e: MouseEvent) => {
    if (isDragSelecting.value) {
         const box = selectionBox.value
         elements.value.forEach(el => {
             const elW = el.style.width || 0
             const elH = el.style.height || 0
             const overlaps = !(box.x > el.x + elW || box.x + box.w < el.x || box.y > el.y + elH || box.y + box.h < el.y)
             if (overlaps && !el.locked && !el.hidden) {
                 toggleSelection(el.id, true) 
             }
         })
         isDragSelecting.value = false
         selectionBox.value = { x: 0, y: 0, w: 0, h: 0 }
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
}

const handleGlobalMouseMove = (e: MouseEvent) => {
    if (isMousePanning.value && activeTool.value === 'hand') {
        const dx = e.clientX - lastMousePos.value.x
        const dy = e.clientY - lastMousePos.value.y
        panOffset.value = { x: panOffset.value.x + dx, y: panOffset.value.y + dy }
        lastMousePos.value = { x: e.clientX, y: e.clientY }
        return
    }
    handleMouseMove(e)
}

const handleGlobalMouseUp = (e: MouseEvent) => {
    isMousePanning.value = false
    handleMouseUp(e)
}

// Reset states on tool or tab change
watch([activeTool, activeTab], () => {
    isDrawing.value = false
    isDragSelecting.value = false
    isMousePanning.value = false
    lastSingleTouch.value = null
})

watch(isDragSelecting, (val) => {
    if (val) {
        // We already have mousemove/up on the container, but window listeners are safer for dragging outside
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }
})

// --- Canvas Resizing State ---
const isResizingCanvas = ref(false)
const resizeHandle = ref<string | null>(null) // 'right', 'bottom', 'corner'
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 })

const handleResizeStart = (type: string, e: MouseEvent | TouchEvent) => {
    e.stopPropagation() // Prevent dragging the canvas/pan behaviour
    e.preventDefault()
    
    isResizingCanvas.value = true
    resizeHandle.value = type
    
    let clientX, clientY
    if ('touches' in e && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0]!.clientX
        clientY = (e as TouchEvent).touches[0]!.clientY
    } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
    }
    
    resizeStart.value = {
        x: clientX,
        y: clientY,
        w: posterSize.value.w,
        h: posterSize.value.h
    }
    
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('touchmove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
    window.addEventListener('touchend', handleResizeEnd)
}

const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizingCanvas.value) return
    
    let clientX, clientY
    if ('touches' in e && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0]!.clientX
        clientY = (e as TouchEvent).touches[0]!.clientY
    } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
    }
    
    const dx = (clientX - resizeStart.value.x) / (scale.value * manualScale.value)
    const dy = (clientY - resizeStart.value.y) / (scale.value * manualScale.value)
    
    if (resizeHandle.value === 'right' || resizeHandle.value === 'corner') {
        posterSize.value.w = Math.max(100, Math.round(resizeStart.value.w + dx))
    }
    
    if (resizeHandle.value === 'bottom' || resizeHandle.value === 'corner') {
        posterSize.value.h = Math.max(100, Math.round(resizeStart.value.h + dy))
    }
}

const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
    }
}

const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    
    // Check for Asset Drop
    const assetData = e.dataTransfer?.getData('application/posterlab-asset')
    if (assetData) {
        try {
            const data = JSON.parse(assetData)
            const contentRect = document.getElementById('poster-content')?.getBoundingClientRect()
            
            if (contentRect) {
                // Determine drop position relative to poster
                const clientX = e.clientX
                const clientY = e.clientY
                
                const x = (clientX - contentRect.left) / (scale.value * manualScale.value)
                const y = (clientY - contentRect.top) / (scale.value * manualScale.value)
                
                // Add the element centered on the cursor if possible, or top-left at cursor
                // If the element has width/height, center it.
                // data.style might have width/height
                let offsetX = 0
                let offsetY = 0
                
                if (data.style?.width) offsetX = typeof data.style.width === 'number' ? data.style.width / 2 : 0
                if (data.style?.height) offsetY = typeof data.style.height === 'number' ? data.style.height / 2 : 0

                // Add Element (New ID generated by addElement)
                const { addElement } = useElements() // Re-using existing composable import
                addElement({
                    ...data,
                    x: x - offsetX,
                    y: y - offsetY,
                    id: undefined
                })
            }
        } catch (err) {
            console.error('Invalid drop data', err)
        }
    }
}

const handleResizeEnd = () => {
    isResizingCanvas.value = false
    resizeHandle.value = null
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('touchmove', handleResizeMove)
    window.removeEventListener('mouseup', handleResizeEnd)
    window.removeEventListener('touchend', handleResizeEnd)
}

// --- Drawing Logic ---
const currentPath = ref<{ points: {x: number, y: number}[], color: string, width: number } | null>(null)

const pointsToPath = (points: {x: number, y: number}[]) => {
    if (points.length < 2 || !points[0]) return ''
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
}

const currentPathD = computed(() => {
    if (!currentPath.value) return ''
    return pointsToPath(currentPath.value.points)
})

const getPosterCoords = (e: MouseEvent | TouchEvent) => {
    const contentRect = document.getElementById('poster-content')?.getBoundingClientRect()
    if (!contentRect) return { x: 0, y: 0 }
    
    let clientX, clientY
    if ('touches' in e && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0]!.clientX
        clientY = (e as TouchEvent).touches[0]!.clientY
    } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
    }
    
    return {
        x: (clientX - contentRect.left) / (scale.value * manualScale.value),
        y: (clientY - contentRect.top) / (scale.value * manualScale.value)
    }
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.value) return
    e.preventDefault()
    
    const { x, y } = getPosterCoords(e)
    
    currentPath.value = {
        points: [{x, y}],
        color: brushSettings.value.color,
        width: brushSettings.value.size,
        opacity: brushSettings.value.opacity ?? 1
    } as any
    
    window.addEventListener('mousemove', drawMove)
    window.addEventListener('touchmove', drawMove, { passive: false })
    window.addEventListener('mouseup', endDrawing)
    window.addEventListener('touchend', endDrawing)
}

const drawMove = (e: MouseEvent | TouchEvent) => {
    if (!currentPath.value) return
    e.preventDefault()
    const { x, y } = getPosterCoords(e)
    currentPath.value.points.push({x, y})
}

const endDrawing = () => {
    if (!currentPath.value) return
    
    const d = pointsToPath(currentPath.value.points)
    
    if (d && currentPath.value.points.length > 1) {
        const xs = currentPath.value.points.map(p => p.x)
        const ys = currentPath.value.points.map(p => p.y)
        const minX = Math.min(...xs)
        const minY = Math.min(...ys)
        const maxX = Math.max(...xs)
        const maxY = Math.max(...ys)
        const width = maxX - minX
        const height = maxY - minY
        
        // Normalize
        const normalizedPoints = currentPath.value.points.map(p => ({ x: p.x - minX, y: p.y - minY }))
        const normalizedD = pointsToPath(normalizedPoints)

        // Using special 'path' type or adapting shape
        const { addElement } = useElements() 
        addElement({
            type: 'shape', // Using shape but with pathData
            x: minX,
            y: minY,
            style: {
                width: Math.max(width, 1), 
                height: Math.max(height, 1),
                backgroundColor: 'transparent',
                borderColor: currentPath.value.color,
                borderWidth: currentPath.value.width,
                opacity: (currentPath.value as any).opacity ?? 1,
                borderStyle: 'solid',
                shapeType: 'custom',
            },
            pathData: normalizedD,
            viewBox: `0 0 ${width} ${height}`
        })
    }
    
    currentPath.value = null
    window.removeEventListener('mousemove', drawMove)
    window.removeEventListener('touchmove', drawMove)
    window.removeEventListener('mouseup', endDrawing)
    window.removeEventListener('touchend', endDrawing)
}


</script>

<template>
  <div 
    ref="containerRef"
    id="poster-canvas-container"
    class="flex-1 bg-surface-lowest relative overflow-hidden flex items-center justify-center theme-transition"
    :class="{
        'cursor-crosshair': activeTool === 'select',
        'cursor-grab': activeTool === 'hand' && !lastSingleTouch,
        'cursor-grabbing': activeTool === 'hand' && lastSingleTouch
    }"
    @mousedown="handleMouseDown"
    @mousemove="handleGlobalMouseMove"
    @mouseup="handleGlobalMouseUp"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @wheel="handleWheel"
  >
  
    <!-- Background Grid / Texture -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>

    <!-- Zoomable/Pannable Viewport -->
    <div 
       class="relative transition-transform duration-200 ease-out preserve-3d shrink-0"
       :style="{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale * manualScale})`,
          width: `${posterSize.w}px`,
          height: `${posterSize.h}px`
       }"
    >
       <!-- The Poster Surface -->
       <div 
          id="poster-content"
          class="w-full h-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-outline/5 relative theme-transition"
          :style="{ 
            backgroundColor: backgroundType === 'solid' ? bgColor : undefined,
            backgroundImage: backgroundType === 'gradient' ? gradientStyle : undefined,
          }"
          @dragover="handleDragOver"
          @drop="handleDrop"
       >
          <!-- Grid Overlay -->
          <div v-if="showGrid && !previewMode" class="absolute inset-0 pointer-events-none z-[1]" 
               style="background-image: linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px); background-size: 50px 50px;">
          </div>
          <RenderElement 
            v-for="element in elements" 
            :key="element.id" 
            :element="element" 
            :is-preview="previewMode"
          />

           <!-- Drawing Viewport Overlay (Live Stroke) -->
            <svg v-if="isDrawing" class="absolute inset-0 pointer-events-none z-[60] overflow-visible" :width="posterSize.w" :height="posterSize.h">
                 <path v-if="currentPath" 
                    :d="currentPathD" 
                    fill="none" 
                    :stroke="currentPath.color" 
                    :stroke-width="currentPath.width" 
                    :opacity="(currentPath as any).opacity ?? 1"
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                 />
            </svg>

             <!-- Drawing Interaction Layer -->
             <div v-if="isDrawing" 
                class="absolute inset-0 z-[70] cursor-crosshair touch-none"
                @mousedown="startDrawing"
                @touchstart="startDrawing"
             ></div>
       </div>

       <!-- Resize Handles (Only visible when no element selected or explicitly wanted) -->
       <!-- Right Handle -->
       <div v-if="!previewMode" @mousedown="handleResizeStart('right', $event)" @touchstart="handleResizeStart('right', $event)"
            class="absolute top-1/2 -right-4 w-6 h-12 -translate-y-1/2 cursor-ew-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-50 group">
            <div class="w-1.5 h-8 bg-surface-high border border-outline/20 rounded-full shadow-sm"></div>
       </div>

       <!-- Bottom Handle -->
       <div v-if="!previewMode" @mousedown="handleResizeStart('bottom', $event)" @touchstart="handleResizeStart('bottom', $event)"
            class="absolute -bottom-4 left-1/2 h-6 w-12 -translate-x-1/2 cursor-ns-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-50 group">
            <div class="h-1.5 w-8 bg-surface-high border border-outline/20 rounded-full shadow-sm"></div>
       </div>

       <!-- Corner Handle -->
       <div v-if="!previewMode" @mousedown="handleResizeStart('corner', $event)" @touchstart="handleResizeStart('corner', $event)"
            class="absolute -bottom-4 -right-4 w-8 h-8 cursor-nwse-resize flex items-center justify-center z-50 group">
            <div class="w-3 h-3 bg-white border-2 border-primary rounded-full shadow-md group-hover:scale-125 transition-transform"></div>
       </div>

       
       <!-- Alignment Guides -->
       <template v-if="!previewMode">
        <template v-for="(guide, i) in alignmentGuides" :key="i">
            <!-- Vertical Line -->
            <div v-if="guide.type === 'vertical'"
                 class="absolute w-0 z-50 pointer-events-none shadow-[0_0_2px_rgba(0,0,0,0.3)]"
                 :style="{ 
                    left: `${guide.position}px`,
                    top: `${guide.start}px`,
                    height: `${guide.end - guide.start}px`,
                    borderLeftWidth: '5px',
                    borderColor: '#ec4899', // pink-500
                    borderStyle: 'dashed'
                 }">
            </div>
            <!-- Horizontal Line -->
            <div v-if="guide.type === 'horizontal'"
                 class="absolute h-0 z-50 pointer-events-none shadow-[0_0_2px_rgba(0,0,0,0.3)]"
                 :style="{ 
                    top: `${guide.position}px`,
                    left: `${guide.start}px`,
                    width: `${guide.end - guide.start}px`,
                    borderTopWidth: '5px',
                    borderColor: '#ec4899',
                    borderStyle: 'dashed'
                 }">
            </div>
            
            <!-- Distance Label (Smart Guide) -->
            <div v-if="guide.label && guide.labelPosition"
                 class="absolute z-50 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center whitespace-nowrap"
                 :style="{ 
                    left: `${guide.labelPosition.x}px`, 
                    top: `${guide.labelPosition.y}px` 
                 }">
                 {{ guide.label }}
            </div>
       </template>
       </template>

       <!-- Marquee Selection Box -->
       <div v-if="isDragSelecting"
            class="absolute border border-primary bg-primary/10 pointer-events-none z-[60]"
            :style="{
                left: `${selectionBox.x}px`,
                top: `${selectionBox.y}px`,
                width: `${selectionBox.w}px`,
                height: `${selectionBox.h}px`
            }">
       </div>

    </div>

    <!-- Resize Dimensions Overlay -->
    <div v-if="isResizingCanvas" 
         class="absolute top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-3 py-1.5 rounded-full shadow-lg z-[100] font-mono text-sm pointer-events-none backdrop-blur-md animate-in fade-in zoom-in duration-200">
        {{ Math.round(posterSize.w) }} &times; {{ Math.round(posterSize.h) }} px
    </div>

    <!-- Floating UI Wrapper (Manages Layout of Minimap, Slider, and Tools) -->
    <div class="absolute bottom-6 right-6 flex items-end gap-4 z-40 pointer-events-none">
        
        <!-- Left Column: Contextual Area (Minimap & Slider) -->
        <div class="flex flex-col items-end gap-3 pointer-events-auto">
             <!-- Minimap -->
            <transition name="fade">
                <div v-if="showMinimap && containerSize.w > 0 && !previewMode">
                    <Minimap 
                        :container-size="containerSize"
                    />
                </div>
            </transition>

            <!-- Zoom Slider (Hand Tool) -->
            <transition name="fade">
                <div v-if="activeTool === 'hand' && !previewMode" class="bg-surface rounded-xl p-3 flex items-center gap-2 shadow-xl border border-outline/10 backdrop-blur-md">
                    <ZoomOut :size="14" class="text-on-surface-variant shrink-0" />
                    <input 
                        type="range" 
                        v-model.number="manualScale" 
                        min="0.2" 
                        max="5.0" 
                        step="0.1"
                        class="accent-primary w-24 h-1 bg-outline/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <ZoomIn :size="14" class="text-on-surface-variant shrink-0" />
                    <span class="text-[10px] font-mono text-on-surface-variant min-w-[3ch] text-right">{{ Math.round(manualScale * 100) }}%</span>
                </div>
            </transition>
        </div>

        <!-- Right Column: Interactive Tools (FAB & Menu) -->
        <div class="flex flex-col items-end gap-3 pointer-events-auto">
            <!-- Visibility / Preview Mode Toggle (Google FAB Style) -->
            <button class="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 group z-50"
                :class="!previewMode ? 'bg-surface text-on-surface-variant hover:bg-surface-high border border-outline/10' : 'bg-primary-container text-on-primary-container hover:shadow-2xl hover:scale-105 border border-primary/20'"
                @click="previewMode = !previewMode"
                :title="previewMode ? 'Show Tools' : 'Hide Tools'">
                
                <!-- Plus Icon with Rotation -->
                <Plus :size="24" 
                    class="transition-transform duration-300 ease-spring"
                    :class="{ 'rotate-45': !previewMode }" />
                
                <!-- Tooltip -->
                <span class="absolute right-full mr-3 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {{ previewMode ? 'Show Tools' : 'Hide Tools' }}
                </span>
            </button>

            <transition name="fade-up">
                <div v-if="!previewMode" class="flex flex-col gap-3">
                    
                    <!-- Zoom Controls -->
                    <div class="bg-surface rounded-2xl p-1.5 flex flex-col gap-1 shadow-xl border border-outline/10 backdrop-blur-md w-10">
                        <button @click="zoomIn" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" title="Zoom In">
                            <ZoomIn :size="18" />
                        </button>
                        <div class="h-px bg-outline/10 w-full"></div>
                        <button @click="zoomOut" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" title="Zoom Out">
                            <ZoomOut :size="18" />
                        </button>
                        <div class="h-px bg-outline/10 w-full"></div>
                        <button @click="resetZoom" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" title="Fit to Screen">
                            <Maximize :size="16" />
                        </button>
                    </div>

                    <!-- Tools & Toggles -->
                    <div class="bg-surface rounded-2xl p-1.5 flex flex-col gap-1 shadow-xl border border-outline/10 backdrop-blur-md w-10">
                        <button @click="activeTool = 'select'" 
                            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            :class="activeTool === 'select' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'"
                            title="Select Tool">
                            <MousePointer2 :size="18" />
                        </button>
                        <button @click="activeTool = 'hand'" 
                            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            :class="activeTool === 'hand' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'"
                            title="Pan Tool">
                            <Hand :size="18" />
                        </button>
                        
                        <div class="h-px bg-outline/10 w-full my-0.5"></div>
                        
                        <button @click="snappingEnabled = !snappingEnabled" 
                            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            :class="snappingEnabled ? 'text-primary' : 'text-on-surface-variant/50 hover:text-on-surface'"
                            title="Toggle Snapping">
                            <Magnet :size="18" />
                        </button>
                        <div class="h-px bg-outline/10 w-full my-0.5"></div>
                        <button @click="showMinimap = !showMinimap" 
                            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                            :class="showMinimap ? 'text-primary' : 'text-on-surface-variant/50 hover:text-on-surface'"
                            title="Toggle Minimap">
                            <MapIcon :size="18" />
                        </button>
                    </div>
                </div>
            </transition>
        </div>
    </div>

    <!-- Scale Indicator -->
    <div @click="setActualSize" class="absolute bottom-8 left-8 bg-surface-high px-4 py-2 rounded-full border border-outline/10 shadow-sm backdrop-blur-md z-40 cursor-pointer hover:bg-surface-highest theme-transition" title="Click to view Actual Size (100%)">
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
</style>
