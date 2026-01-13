import { ref } from 'vue'
import { useElements } from './useElements'
import { useCanvas } from './useCanvas'
import { useSnapping } from './useSnapping'

// Shared State
const isTransforming = ref(false)
const transformType = ref<'move' | 'resize' | 'rotate' | null>(null)
const activeId = ref<string | null>(null)
const snappingEnabled = ref(true)

// Internal State
let startX = 0
let startY = 0
let initialX = 0
let initialY = 0
let initialWidth = 0
let initialHeight = 0
let initialRotate = 0
let handleType = ''

// For multi-move
const initialStates = new Map<string, { x: number, y: number }>()
let selectionBounds = { x: 0, y: 0, w: 0, h: 0 }

export function useTransform() {
    const { updateElement, updateStyle, elements, selectedIds, snapshotHistory } = useElements()
    const { scale, manualScale, posterSize } = useCanvas()
    const { guides, getSnappedPosition, clearGuides } = useSnapping()

    const getClientXY = (e: MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            const touch = e.touches?.[0] || e.changedTouches?.[0]
            if (touch) {
                return { x: touch.clientX, y: touch.clientY }
            }
        }
        return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
    }

    const startTransform = (id: string, type: 'move' | 'resize' | 'rotate', e: MouseEvent | TouchEvent, handle = '') => {
        isTransforming.value = true
        transformType.value = type
        activeId.value = id
        handleType = handle

        const { x, y } = getClientXY(e)
        startX = x
        startY = y

        const el = elements.value.find(item => item.id === id)
        if (!el) return

        initialX = el.x
        initialY = el.y
        initialWidth = el.style.width || 0
        initialHeight = el.style.height || 0
        initialRotate = el.style.rotate || 0

        // Capture initial states for move
        initialStates.clear()

        if (type === 'move') {
            // 1. Determine Selection Group and Initial Bounds
            const idsToMove = selectedIds.value.includes(id) ? selectedIds.value : [id]

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

            idsToMove.forEach(selId => {
                const item = elements.value.find(e => e.id === selId)
                if (item) {
                    initialStates.set(selId, { x: item.x, y: item.y })
                    const w = item.style.width || 0
                    const h = item.style.height || 0
                    minX = Math.min(minX, item.x)
                    minY = Math.min(minY, item.y)
                    maxX = Math.max(maxX, item.x + w)
                    maxY = Math.max(maxY, item.y + h)
                }
            })
            selectionBounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
        } else {
            initialStates.set(id, { x: el.x, y: el.y })
        }

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', endTransform)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', endTransform)
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isTransforming.value || !activeId.value) return

        const { x: clientX, y: clientY } = getClientXY(e)

        const currentScale = scale.value * manualScale.value
        let dx = (clientX - startX) / currentScale
        let dy = (clientY - startY) / currentScale

        // Use the guides ref from useSnapping
        // (Note: We rely on getSnappedPosition to update the internal state of useSnapping if it was stateful, 
        // OR we return guides from it. 
        // My useSnapping implementation updates a 'guides' ref. 
        // Let's verify if guides is exposed and valid.)
        // Actually, my useSnapping updates a ref 'guides' that I returned.
        // So I don't need to manually populate alignmentGuides.value.

        if (transformType.value === 'move') {
            // Apply Snapping via Composable
            let currentX = selectionBounds.x + dx
            let currentY = selectionBounds.y + dy

            if (snappingEnabled.value) {
                const snapped = getSnappedPosition(
                    { x: currentX, y: currentY, w: selectionBounds.w, h: selectionBounds.h },
                    elements.value,
                    posterSize.value.w,
                    posterSize.value.h,
                    { excludeIds: Array.from(initialStates.keys()) } // Exclude moving items
                )

                // Adjust dx/dy based on snap move
                // We want: newX = start + dx_new
                // snapped.x = start + dx_so_far + snapped_delta
                // So actual pos = snapped.x
                // dx = snapped.x - startX (relative to selection bounds)

                // Wait, selectionBounds.x is the Start X of the group.
                // currentX is the proposed X.
                // snapped.x is the finalized X.
                // We need the DELTA to apply to all elements.

                // Update dx/dy
                dx = snapped.x - selectionBounds.x
                dy = snapped.y - selectionBounds.y
            } else {
                clearGuides()
            }

            // Apply move to all tracked elements
            initialStates.forEach((state, id) => {
                updateElement(id, {
                    x: state.x + dx,
                    y: state.y + dy
                }, false) // Skip history during drag
            })
        } else if (transformType.value === 'resize') {
            clearGuides()
            // Resize logic ... derived from previous code
            let nw = initialWidth
            let nh = initialHeight
            let nx = initialX
            let ny = initialY

            if (handleType.includes('r')) nw = Math.max(20, initialWidth + dx)
            if (handleType.includes('b')) nh = Math.max(20, initialHeight + dy)
            if (handleType.includes('l')) {
                nw = Math.max(20, initialWidth - dx)
                nx = initialX + (initialWidth - nw)
            }
            if (handleType.includes('t')) {
                nh = Math.max(20, initialHeight - dy)
                ny = initialY + (initialHeight - nh)
            }

            updateElement(activeId.value, { x: nx, y: ny }, false)
            updateStyle(activeId.value, { width: nw, height: nh }, false)

        } else if (transformType.value === 'rotate') {
            clearGuides()
            const rotationDelta = dx + dy
            updateStyle(activeId.value, { rotate: initialRotate + rotationDelta }, false)
        }
    }

    const endTransform = () => {
        if (isTransforming.value) { // Only snapshot if we were actually doing something
            snapshotHistory()
        }
        isTransforming.value = false
        transformType.value = null
        activeId.value = null
        clearGuides()

        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', endTransform)
        window.removeEventListener('touchmove', handleMove)
        window.removeEventListener('touchend', endTransform)
    }

    return {
        startTransform,
        isTransforming,
        transformType,
        alignmentGuides: guides, // Expose guides from the composable
        snappingEnabled
    }
}
