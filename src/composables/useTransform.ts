import { ref } from 'vue'
import { useElements } from './useElements'
import { useCanvas } from './useCanvas'

// Shared State
const isTransforming = ref(false)
const transformType = ref<'move' | 'resize' | 'rotate' | null>(null)
const activeId = ref<string | null>(null)
// Enhanced guide type with label
const alignmentGuides = ref<{ type: 'vertical' | 'horizontal', position: number, label?: string, labelPosition?: { x: number, y: number } }[]>([])
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

// Store Snap Lines with Range info
interface SnapLine {
    position: number
    start: number
    end: number
}
let verticalSnapLines: SnapLine[] = []
let horizontalSnapLines: SnapLine[] = []

let lastSnappedX: number | null = null
let lastSnappedY: number | null = null

// For multi-move
const initialStates = new Map<string, { x: number, y: number }>()
const SNAP_THRESHOLD = 5
let selectionBounds = { x: 0, y: 0, w: 0, h: 0 }

export function useTransform() {
    const { updateElement, updateStyle, elements, selectedIds } = useElements()
    const { scale, manualScale, posterSize } = useCanvas()

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

        // Prepare Snap Lines
        verticalSnapLines = []
        horizontalSnapLines = []

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

            // 2. Collect Snap Lines from Canvas
            const pW = posterSize.value.w
            const pH = posterSize.value.h
            // Canvas boundaries cover full height/width
            verticalSnapLines.push(
                { position: 0, start: 0, end: pH },
                { position: pW / 2, start: 0, end: pH },
                { position: pW, start: 0, end: pH }
            )
            horizontalSnapLines.push(
                { position: 0, start: 0, end: pW },
                { position: pH / 2, start: 0, end: pW },
                { position: pH, start: 0, end: pW }
            )

            // 3. Collect Snap Lines from Unselected Elements
            elements.value.forEach(el => {
                if (!idsToMove.includes(el.id) && !el.hidden) {
                    const w = el.style.width || 0
                    const h = el.style.height || 0
                    // Vertical Lines (Left, Center, Right) - associated with Y range [y, y+h]
                    verticalSnapLines.push(
                        { position: el.x, start: el.y, end: el.y + h },
                        { position: el.x + w / 2, start: el.y, end: el.y + h },
                        { position: el.x + w, start: el.y, end: el.y + h }
                    )
                    // Horizontal Lines (Top, Center, Bottom) - associated with X range [x, x+w]
                    horizontalSnapLines.push(
                        { position: el.y, start: el.x, end: el.x + w },
                        { position: el.y + h / 2, start: el.x, end: el.x + w },
                        { position: el.y + h, start: el.x, end: el.x + w }
                    )
                }
            })
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

        alignmentGuides.value = []

        if (transformType.value === 'move') {
            // Apply Snapping
            let currentX = selectionBounds.x + dx
            let currentY = selectionBounds.y + dy

            // Current element ranges
            const currentW = selectionBounds.w
            const currentH = selectionBounds.h

            if (snappingEnabled.value) {
                // Edges to snap: Left, Center, Right
                const vPoints = [currentX, currentX + currentW / 2, currentX + currentW]
                const hPoints = [currentY, currentY + currentH / 2, currentY + currentH]

                let snappedX = null
                let snappedY = null

                // --- Vertical Snapping ---
                let bestVDist = SNAP_THRESHOLD
                let bestVSnap: { line: SnapLine, offset: number } | null = null

                for (const snapLine of verticalSnapLines) {
                    for (let i = 0; i < vPoints.length; i++) {
                        const dist = Math.abs(vPoints[i]! - snapLine.position)
                        if (dist < bestVDist) {
                            bestVDist = dist
                            bestVSnap = { line: snapLine, offset: snapLine.position - vPoints[i]! }
                        }
                    }
                }

                if (bestVSnap) {
                    dx += bestVSnap.offset
                    currentX += bestVSnap.offset
                    snappedX = bestVSnap.line.position

                    // Calculate Gap
                    // This guide is Vertical. Gap is along the Y axis.
                    // My Y range: [myYStart, myYEnd] (updated with dy? no, dy affects X too but mainly we care about relative position)
                    // Actually, dy for Y is not yet applied/finalized, but we can estimate. 
                    // Y hasn't snapped yet. Use currentY as is.

                    let yGap = 0
                    let label = ''
                    let labelPos = { x: snappedX, y: currentY }

                    const otherStart = bestVSnap.line.start
                    const otherEnd = bestVSnap.line.end

                    // Recalculate myY with currentY which is only affected by dy so far
                    const curYStart = currentY
                    const curYEnd = currentY + currentH

                    if (curYEnd < otherStart) { // I am above
                        yGap = Math.round(otherStart - curYEnd)
                        labelPos = { x: snappedX, y: curYEnd + yGap / 2 }
                    } else if (curYStart > otherEnd) { // I am below
                        yGap = Math.round(curYStart - otherEnd)
                        labelPos = { x: snappedX, y: otherEnd + yGap / 2 }
                    } else {
                        // Overlap or aligned perfectly
                        yGap = 0
                        // We can also check if we are aligned with center/start/end
                    }

                    if (yGap > 0) label = `${yGap}`

                    alignmentGuides.value.push({
                        type: 'vertical',
                        position: snappedX,
                        label,
                        labelPosition: labelPos
                    })

                    // Haptic Feedback
                    if (lastSnappedX !== snappedX) {
                        if (navigator.vibrate) navigator.vibrate(10)
                        lastSnappedX = snappedX
                    }
                } else {
                    lastSnappedX = null
                }

                // --- Horizontal Snapping ---
                let bestHDist = SNAP_THRESHOLD
                let bestHSnap: { line: SnapLine, offset: number } | null = null

                for (const snapLine of horizontalSnapLines) {
                    for (let i = 0; i < hPoints.length; i++) {
                        const dist = Math.abs(hPoints[i]! - snapLine.position)
                        if (dist < bestHDist) {
                            bestHDist = dist
                            bestHSnap = { line: snapLine, offset: snapLine.position - hPoints[i]! }
                        }
                    }
                }

                if (bestHSnap) {
                    dy += bestHSnap.offset
                    currentY += bestHSnap.offset
                    snappedY = bestHSnap.line.position

                    // Calculate Gap
                    // This guide is Horizontal. Gap is along X axis.
                    let xGap = 0
                    let label = ''
                    let labelPos = { x: currentX, y: snappedY }

                    const otherStart = bestHSnap.line.start
                    const otherEnd = bestHSnap.line.end

                    // Update myX ranges with new currentX (which is affected by dy, but we care about X)
                    // X range already includes dx (and potential vertical snap) when we calculate currentX above
                    const curXStart = currentX
                    const curXEnd = currentX + currentW

                    if (curXEnd < otherStart) { // I am to the left
                        xGap = Math.round(otherStart - curXEnd)
                        labelPos = { x: curXEnd + xGap / 2, y: snappedY }
                    } else if (curXStart > otherEnd) { // I am to the right
                        xGap = Math.round(curXStart - otherEnd)
                        labelPos = { x: otherEnd + xGap / 2, y: snappedY }
                    } else {
                        xGap = 0
                    }

                    if (xGap > 0) label = `${xGap}`

                    alignmentGuides.value.push({
                        type: 'horizontal',
                        position: snappedY,
                        label,
                        labelPosition: labelPos
                    })

                    // Haptic Feedback
                    if (lastSnappedY !== snappedY) {
                        if (navigator.vibrate) navigator.vibrate(10)
                        lastSnappedY = snappedY
                    }
                } else {
                    lastSnappedY = null
                }
            }

            // Apply move to all tracked elements
            initialStates.forEach((state, id) => {
                updateElement(id, {
                    x: state.x + dx,
                    y: state.y + dy
                })
            })
        } else if (transformType.value === 'resize') {
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

            updateElement(activeId.value, { x: nx, y: ny })
            updateStyle(activeId.value, { width: nw, height: nh })
        } else if (transformType.value === 'rotate') {
            // Simple rotation logic: vertical movement controls rotation
            const rotationDelta = dx + dy // diagonal sensitivity
            updateStyle(activeId.value, { rotate: initialRotate + rotationDelta })
        }
    }

    const endTransform = () => {
        isTransforming.value = false
        transformType.value = null
        activeId.value = null
        alignmentGuides.value = []

        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', endTransform)
        window.removeEventListener('touchmove', handleMove)
        window.removeEventListener('touchend', endTransform)
    }

    return {
        startTransform,
        isTransforming,
        transformType,
        alignmentGuides,
        snappingEnabled
    }
}
