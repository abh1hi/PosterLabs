import { ref } from 'vue'
import { useElements } from './useElements'
import { useCanvas } from './useCanvas'

export function useTransform() {
    const { updateElement, updateStyle, elements } = useElements()
    const { scale, manualScale } = useCanvas()

    const isTransforming = ref(false)
    const transformType = ref<'move' | 'resize' | 'rotate' | null>(null)
    const activeId = ref<string | null>(null)

    let startX = 0
    let startY = 0
    let initialX = 0
    let initialY = 0
    let initialWidth = 0
    let initialHeight = 0
    let initialRotate = 0
    let handleType = ''

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

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', endTransform)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', endTransform)
    }

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isTransforming.value || !activeId.value) return

        const { x: clientX, y: clientY } = getClientXY(e)

        const currentScale = scale.value * manualScale.value
        const dx = (clientX - startX) / currentScale
        const dy = (clientY - startY) / currentScale

        if (transformType.value === 'move') {
            updateElement(activeId.value, {
                x: initialX + dx,
                y: initialY + dy
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

        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', endTransform)
        window.removeEventListener('touchmove', handleMove)
        window.removeEventListener('touchend', endTransform)
    }

    return {
        startTransform,
        isTransforming,
        transformType
    }
}
