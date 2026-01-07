import { useCanvas } from './useCanvas'
import { useElements } from './useElements'

export function useResize() {
    const { posterSize } = useCanvas()
    const { elements, updateElement } = useElements()

    const resizeCanvas = (newWidth: number, newHeight: number, scaleContent = true) => {
        if (scaleContent && elements.value.length > 0) {
            const currentW = posterSize.value.w
            const currentH = posterSize.value.h

            const scaleX = newWidth / currentW
            const scaleY = newHeight / currentH

            elements.value.forEach(el => {
                const updates: any = { style: { ...el.style } }
                const style: any = el.style // Cast to any to avoid strict type checks for dynamic props

                // Position
                updates.style.left = el.x * scaleX // Use el.x not style.left
                updates.style.top = el.y * scaleY // Use el.y

                // We need to update x/y on the element directly too if creating new state
                updates.x = el.x * scaleX
                updates.y = el.y * scaleY

                // Size
                if (style.width) updates.style.width = style.width * scaleX
                if (style.height) updates.style.height = style.height * scaleY

                // Text Font Size
                if (style.fontSize) {
                    updates.style.fontSize = style.fontSize * scaleY
                }

                // Stroke Widths (for Shapes/Drawings)
                if (style.borderWidth) {
                    updates.style.borderWidth = style.borderWidth * Math.min(scaleX, scaleY)
                }

                updateElement(el.id, updates)
            })
        }

        posterSize.value = { w: newWidth, h: newHeight }
    }

    return {
        resizeCanvas
    }
}
