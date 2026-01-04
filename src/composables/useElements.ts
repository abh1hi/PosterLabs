import { ref, watch, computed } from 'vue'

export interface ElementStyle {
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    lineHeight?: number
    letterSpacing?: string
    backgroundColor?: string
    borderRadius?: number | string
    borderWidth?: number
    borderColor?: string
    width?: number
    height?: number
    rotate?: number
    opacity?: number
    blur?: number
    grayscale?: number
    sepia?: number
    brightness?: number
    contrast?: number
    mixBlendMode?: string
    shadow?: {
        blur: number
        color: string
        offsetX: number
        offsetY: number
    }
    crop?: {
        scale: number
        x: number
        y: number
    }
    flipX?: boolean
    flipY?: boolean
    shapeType?: string
}

export interface CanvasElement {
    id: number
    type: 'text' | 'image' | 'shape'
    content?: string
    src?: string
    x: number
    y: number
    style: ElementStyle
    hidden?: boolean
    locked?: boolean
}

const elements = ref<CanvasElement[]>([])
const selectedId = ref<number | null>(null)

// History System
const history = ref<string[]>([])
const historyPointer = ref(-1)

const saveHistory = () => {
    const state = JSON.stringify(elements.value)
    if (historyPointer.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyPointer.value + 1)
    }
    if (history.value.length > 0 && history.value[history.value.length - 1] === state) return

    history.value.push(state)
    if (history.value.length > 50) history.value.shift()
    historyPointer.value = history.value.length - 1
}

// Initial Load
const saved = localStorage.getItem('posterLab_elements')
if (saved) {
    try {
        elements.value = JSON.parse(saved)
        saveHistory()
    } catch (e) {
        elements.value = []
        saveHistory()
    }
} else {
    elements.value = []
    saveHistory()
}

watch(elements, (newVal) => {
    localStorage.setItem('posterLab_elements', JSON.stringify(newVal))
}, { deep: true })

export function useElements() {
    const addElement = (el: CanvasElement) => {
        elements.value.push(el)
        selectedId.value = el.id
        saveHistory()
    }

    const updateElement = (id: number, updates: Partial<CanvasElement>) => {
        const el = elements.value.find(e => e.id === id)
        if (el) {
            Object.assign(el, updates)
        }
    }

    const commitHistory = () => saveHistory()

    const updateStyle = (id: number, styleUpdates: Partial<ElementStyle>) => {
        const el = elements.value.find(e => e.id === id)
        if (el) {
            if (styleUpdates.shadow && el.style.shadow) {
                styleUpdates.shadow = { ...el.style.shadow, ...styleUpdates.shadow }
            }
            if (styleUpdates.crop && el.style.crop) {
                styleUpdates.crop = { ...el.style.crop, ...styleUpdates.crop }
            }

            el.style = { ...el.style, ...styleUpdates }
            saveHistory()
        }
    }

    const deleteElement = (id: number) => {
        elements.value = elements.value.filter(e => e.id !== id)
        if (selectedId.value === id) selectedId.value = null
        saveHistory()
    }

    const duplicateElement = (id: number) => {
        const el = elements.value.find(e => e.id === id)
        if (el) {
            const newEl = JSON.parse(JSON.stringify(el))
            newEl.id = Date.now()
            newEl.x += 20
            newEl.y += 20
            elements.value.push(newEl)
            selectedId.value = newEl.id
            saveHistory()
        }
    }

    const moveElement = (id: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
        const index = elements.value.findIndex(e => e.id === id)
        if (index === -1) return

        const el = elements.value[index]
        elements.value.splice(index, 1)

        switch (direction) {
            case 'up':
                elements.value.splice(Math.min(index + 1, elements.value.length), 0, el)
                break
            case 'down':
                elements.value.splice(Math.max(index - 1, 0), 0, el)
                break
            case 'top':
                elements.value.push(el)
                break
            case 'bottom':
                elements.value.unshift(el)
                break
        }
        saveHistory()
    }

    const clearElements = () => {
        elements.value = []
        selectedId.value = null
        saveHistory()
    }

    const undo = () => {
        if (historyPointer.value > 0) {
            historyPointer.value--
            elements.value = JSON.parse(history.value[historyPointer.value])
        }
    }

    const redo = () => {
        if (historyPointer.value < history.value.length - 1) {
            historyPointer.value++
            elements.value = JSON.parse(history.value[historyPointer.value])
        }
    }

    return {
        elements,
        selectedId,
        addElement,
        updateElement,
        updateStyle,
        deleteElement,
        duplicateElement,
        moveElement,
        clearElements,
        commitHistory,
        undo,
        redo,
        canUndo: computed(() => historyPointer.value > 0),
        canRedo: computed(() => historyPointer.value < history.value.length - 1)
    }
}
