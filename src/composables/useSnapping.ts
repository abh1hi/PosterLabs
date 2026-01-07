import { ref } from 'vue'
import { type CanvasElement } from './useElements'

export interface Rect {
    x: number
    y: number
    w: number
    h: number
}

interface Guide {
    type: 'vertical' | 'horizontal'
    position: number // The specific X or Y value
    start: number    // Start coordinate on perpendicular axis
    end: number      // End coordinate on perpendicular axis
    label?: string
    labelPosition?: { x: number, y: number }
}

const SNAP_THRESHOLD = 5
const guides = ref<Guide[]>([])

export function useSnapping() {

    const clearGuides = () => {
        guides.value = []
    }

    const getSnappedPosition = (
        proposedRect: Rect,
        allElements: CanvasElement[],
        canvasW: number,
        canvasH: number,
        options: { excludeIds?: string[] } = {}
    ) => {
        const { x, y, w, h } = proposedRect
        const excludeIds = options.excludeIds || []

        const activeRect = {
            x, y, w, h,
            cx: x + w / 2,
            cy: y + h / 2
        }

        // 1. Build Targets
        // We define targets as objects with id, x, y, w, h
        const targets: Array<Rect & { id: string }> = []

        // Canvas Center Target
        targets.push({
            id: 'canvas-center',
            x: 0, y: 0, w: canvasW, h: canvasH
        })

        // Sibling Elements
        allElements.forEach(el => {
            if (excludeIds.includes(el.id) || el.hidden || el.locked) return
            const elW = el.style.width || 0
            const elH = el.style.height || 0
            targets.push({
                id: el.id,
                x: el.x, y: el.y, w: elW, h: elH
            })
        })

        let newX = x
        let newY = y
        const newGuides: Guide[] = []

        // --- X Axis Snapping (Vertical Lines) ---
        // Candidates from Active Object: Left, Center, Right
        const xCandidates = [
            { val: activeRect.x, offset: 0, type: 'start' },
            { val: activeRect.cx, offset: -w / 2, type: 'center' },
            { val: activeRect.x + w, offset: -w, type: 'end' }
        ]

        let bestXSnap = { dist: SNAP_THRESHOLD + 1, val: null as number | null, guide: null as Guide | null }

        for (const cand of xCandidates) {
            for (const target of targets) {
                // Target Candidates: Left, Center, Right
                const tCx = target.x + target.w / 2
                const tCandidates = [
                    { val: target.x, type: 'start' },
                    { val: tCx, type: 'center' },
                    { val: target.x + target.w, type: 'end' }
                ]

                for (const tCand of tCandidates) {
                    const dist = Math.abs(cand.val - tCand.val)

                    // Prioritize closer snaps. If equal, first one keeps (could be refined)
                    if (dist < SNAP_THRESHOLD && dist < bestXSnap.dist) {
                        const snappedVal = tCand.val + cand.offset

                        // Calculate Guide Extents (Y axis range)
                        // It should span from the topmost top to the bottommost bottom of the two aligning objects
                        let startY, endY
                        if (target.id === 'canvas-center') {
                            startY = 0
                            endY = canvasH
                        } else {
                            // Union of Y ranges
                            startY = Math.min(activeRect.y, target.y)
                            endY = Math.max(activeRect.y + h, target.y + target.h)
                        }

                        // Calculate visual start/end with padding, but real math for label
                        const visualStart = startY - 10
                        const visualEnd = endY + 10
                        const length = endY - startY
                        const label = `${Math.round(length)}`

                        bestXSnap = {
                            dist,
                            val: snappedVal,
                            guide: {
                                type: 'vertical',
                                position: tCand.val, // The exact snap line X
                                start: visualStart,
                                end: visualEnd,
                                label: length > 20 ? label : undefined,
                                labelPosition: { x: tCand.val, y: (visualStart + visualEnd) / 2 }
                            }
                        }
                    }
                }
            }
        }

        if (bestXSnap.val !== null && bestXSnap.guide) {
            newX = bestXSnap.val
            newGuides.push(bestXSnap.guide)
        }

        // --- Y Axis Snapping (Horizontal Lines) ---
        // Candidates: Top, Center, Bottom
        const yCandidates = [
            { val: activeRect.y, offset: 0, type: 'start' },
            { val: activeRect.cy, offset: -h / 2, type: 'center' },
            { val: activeRect.y + h, offset: -h, type: 'end' }
        ]

        let bestYSnap = { dist: SNAP_THRESHOLD + 1, val: null as number | null, guide: null as Guide | null }

        for (const cand of yCandidates) {
            for (const target of targets) {
                const tCy = target.y + target.h / 2
                const tCandidates = [
                    { val: target.y, type: 'start' },
                    { val: tCy, type: 'center' },
                    { val: target.y + target.h, type: 'end' }
                ]

                for (const tCand of tCandidates) {
                    const dist = Math.abs(cand.val - tCand.val)

                    if (dist < SNAP_THRESHOLD && dist < bestYSnap.dist) {
                        const snappedVal = tCand.val + cand.offset

                        let startX, endX
                        if (target.id === 'canvas-center') {
                            startX = 0
                            endX = canvasW
                        } else {
                            startX = Math.min(activeRect.x, target.x)
                            endX = Math.max(activeRect.x + w, target.x + target.w)
                        }

                        const visualStart = startX - 10
                        const visualEnd = endX + 10
                        const length = endX - startX
                        const label = `${Math.round(length)}`

                        bestYSnap = {
                            dist,
                            val: snappedVal,
                            guide: {
                                type: 'horizontal',
                                position: tCand.val, // The exact snap line Y
                                start: visualStart,
                                end: visualEnd,
                                label: length > 20 ? label : undefined,
                                labelPosition: { x: (visualStart + visualEnd) / 2, y: tCand.val }
                            }
                        }
                    }
                }
            }
        }

        if (bestYSnap.val !== null && bestYSnap.guide) {
            newY = bestYSnap.val
            newGuides.push(bestYSnap.guide)
        }

        guides.value = newGuides
        return { x: newX, y: newY }
    }

    return {
        guides,
        getSnappedPosition,
        clearGuides
    }
}
