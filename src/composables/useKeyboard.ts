import { onMounted, onUnmounted } from 'vue'
import { useElements } from './useElements'

export function useKeyboard() {
    const {
        selectedId, elements,
        deleteElement, updateElement, duplicateElement,
        undo, redo
    } = useElements()

    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in input/textarea
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

        const isCtrl = e.ctrlKey || e.metaKey
        const isShift = e.shiftKey
        const step = isShift ? 10 : 1

        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId.value) {
                e.preventDefault()
                deleteElement(selectedId.value)
            }
        }

        // Undo/Redo
        if (isCtrl && e.key.toLowerCase() === 'z') {
            e.preventDefault()
            if (isShift) {
                redo()
            } else {
                undo()
            }
        }
        if (isCtrl && e.key.toLowerCase() === 'y') {
            e.preventDefault()
            redo()
        }

        // Duplicate
        if (isCtrl && e.key.toLowerCase() === 'd') {
            e.preventDefault()
            if (selectedId.value) duplicateElement(selectedId.value)
        }

        // Deselect
        if (e.key === 'Escape') {
            selectedId.value = null
        }

        // Movement (Arrow Keys)
        if (selectedId.value) {
            const el = elements.value.find(e => e.id === selectedId.value)
            if (!el) return

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
                let { x, y } = el

                switch (e.key) {
                    case 'ArrowUp': y -= step; break;
                    case 'ArrowDown': y += step; break;
                    case 'ArrowLeft': x -= step; break;
                    case 'ArrowRight': x += step; break;
                }

                updateElement(selectedId.value, { x, y })
            }
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })
}
