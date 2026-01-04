import { ref, computed, onMounted } from 'vue'



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
    saturate?: number
    hueRotate?: number
    invert?: number
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
    textDecoration?: 'none' | 'underline' | 'line-through'
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    webkitTextStrokeWidth?: number
    webkitTextStrokeColor?: string
}

export interface CanvasElement {
    id: string
    type: 'text' | 'image' | 'shape'
    content?: string
    src?: string
    x: number
    y: number
    style: ElementStyle
    hidden?: boolean
    locked?: boolean
    order?: number
}

const elements = ref<CanvasElement[]>([])
const selectedId = ref<string | null>(null)
const LOCAL_ELEMENTS_KEY = 'posterlab_elements'

// Local History (for Undo/Redo)
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

export function useElements() {
    // --- Local Persistence ---
    const saveElements = () => {
        localStorage.setItem(LOCAL_ELEMENTS_KEY, JSON.stringify(elements.value))
        saveHistory()
    }

    const loadElements = () => {
        const saved = localStorage.getItem(LOCAL_ELEMENTS_KEY)
        if (saved) {
            try {
                elements.value = JSON.parse(saved)
            } catch (e) { console.error('Failed to load elements', e) }
        }
    }

    onMounted(() => {
        loadElements()
    })

    const addElement = (el: Omit<CanvasElement, 'id'>) => {
        const id = Date.now().toString()
        const newEl = { ...el, id, order: elements.value.length }
        elements.value.push(newEl)
        selectedId.value = id
        saveElements()
    }

    const updateElement = (id: string, updates: Partial<CanvasElement>) => {
        const el = elements.value.find((e: CanvasElement) => e.id === id)
        if (el) {
            Object.assign(el, updates)
            saveElements()
        }
    }

    const commitHistory = () => saveHistory()

    const updateStyle = (id: string, styleUpdates: Partial<ElementStyle>) => {
        const el = elements.value.find((e: CanvasElement) => e.id === id)
        if (el) {
            if (styleUpdates.shadow && el.style.shadow) {
                styleUpdates.shadow = { ...el.style.shadow, ...styleUpdates.shadow }
            }
            if (styleUpdates.crop && el.style.crop) {
                styleUpdates.crop = { ...el.style.crop, ...styleUpdates.crop }
            }
            el.style = { ...el.style, ...styleUpdates }
            saveElements()
        }
    }

    const deleteElement = (id: string) => {
        elements.value = elements.value.filter((e: CanvasElement) => e.id !== id)
        if (selectedId.value === id) selectedId.value = null
        saveElements()
    }

    const duplicateElement = (id: string) => {
        const el = elements.value.find((e: CanvasElement) => e.id === id)
        if (el) {
            const newEl = JSON.parse(JSON.stringify(el))
            newEl.id = Date.now().toString()
            newEl.x += 20
            newEl.y += 20
            newEl.order = elements.value.length
            elements.value.push(newEl)
            selectedId.value = newEl.id
            saveElements()
        }
    }

    const moveElement = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
        const index = elements.value.findIndex((e: CanvasElement) => e.id === id)
        if (index === -1) return

        const el = elements.value[index]
        const newElements = [...elements.value]
        newElements.splice(index, 1)

        if (!el) return

        switch (direction) {
            case 'up':
                newElements.splice(Math.min(index + 1, newElements.length), 0, el)
                break
            case 'down':
                newElements.splice(Math.max(index - 1, 0), 0, el)
                break
            case 'top':
                newElements.push(el)
                break
            case 'bottom':
                newElements.unshift(el)
                break
        }

        // Update order fields for all changed elements
        newElements.forEach((e: CanvasElement, i: number) => e.order = i)
        elements.value = newElements
        saveElements()
    }

    const shuffleElements = () => {
        if (elements.value.length < 2) return
        const newElements = [...elements.value]
        // Fisher-Yates shuffle
        for (let i = newElements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = newElements[i]
            if (temp && newElements[j]) {
                newElements[i] = newElements[j]!
                newElements[j] = temp
            }
        }
        // Re-assign order based on new array order
        newElements.forEach((e, i) => e.order = i)
        elements.value = newElements
        saveElements()
    }

    const undo = () => {
        if (historyPointer.value > 0) {
            historyPointer.value--
            const state = history.value[historyPointer.value]
            if (state) {
                elements.value = JSON.parse(state)
                // We typically don't save to LS on Undo traverse to avoid overwriting "future" history if they redo,
                // but for simple persistence we can, or just save on next edit. 
                // Let's save to be safe so reload keeps undo state.
                localStorage.setItem(LOCAL_ELEMENTS_KEY, JSON.stringify(elements.value))
            }
        }
    }

    const redo = () => {
        if (historyPointer.value < history.value.length - 1) {
            historyPointer.value++
            const state = history.value[historyPointer.value]
            if (state) {
                elements.value = JSON.parse(state)
                localStorage.setItem(LOCAL_ELEMENTS_KEY, JSON.stringify(elements.value))
            }
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
        shuffleElements,
        commitHistory,
        undo,
        redo,
        canUndo: computed(() => historyPointer.value > 0),
        canRedo: computed(() => historyPointer.value < history.value.length - 1)
    }
}
