import { ref, computed, onMounted, watch } from 'vue'



export interface ElementStyle {
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    lineHeight?: number
    letterSpacing?: string
    padding?: number
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
    customCss?: string
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
    backgroundPosition?: string
    imageScale?: number
    imagePanX?: number
    imagePanY?: number
    skewX?: number
    skewY?: number
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset'
    backgroundType?: 'solid' | 'gradient'
    curve?: number
    textGradient?: string
}

export interface CanvasElement {
    id: string
    type: 'text' | 'image' | 'shape' | 'custom' | 'group'
    children?: CanvasElement[]
    content?: string
    src?: string
    customHtml?: string
    x: number
    y: number
    style: ElementStyle
    name?: string
    hidden?: boolean
    locked?: boolean
    order?: number
    pathData?: string
    viewBox?: string
}

const elements = ref<CanvasElement[]>([])
const selectedIds = ref<string[]>([])
const selectedId = computed({
    get: () => selectedIds.value[0] || null,
    set: (val: string | null) => { selectedIds.value = val ? [val] : [] }
})
const LOCAL_ELEMENTS_KEY = 'posterlab_elements'

// Local History (for Undo/Redo)
const history = ref<string[]>([])
const historyPointer = ref(-1)

const isInitialized = ref(false)

export interface UseElementsReturn {
    elements: typeof elements
    selectedId: typeof selectedId
    selectedIds: typeof selectedIds
    toggleSelection: (id: string, multi: boolean) => void
    addElement: (el: Omit<CanvasElement, 'id'>) => void
    updateElement: (id: string, updates: Partial<CanvasElement>, saveToHistory?: boolean) => void
    updateStyle: (id: string, styleUpdates: Partial<ElementStyle>, saveToHistory?: boolean) => void
    deleteElement: (id: string) => void
    duplicateElement: (id: string) => void
    moveElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void
    reorderElement: (id: string, newIndex: number) => void
    shuffleElements: () => void
    commitHistory: () => void
    undo: () => void
    redo: () => void
    canUndo: any
    canRedo: any
    groupSelection: () => void
    ungroupElement: () => void
    alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom', canvasW: number, canvasH: number) => void
    snapshotHistory: () => void
}

export function useElements(): UseElementsReturn {
    // --- Local Persistence ---
    const saveElements = () => {
        localStorage.setItem(LOCAL_ELEMENTS_KEY, JSON.stringify(elements.value))
        // History is now managed explicitly via snapshotHistory
    }

    const loadElements = () => {
        const saved = localStorage.getItem(LOCAL_ELEMENTS_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                elements.value = parsed
                // Initialize history with loaded state
                history.value = [JSON.stringify(elements.value)]
                historyPointer.value = 0
            } catch (e) { console.error('Failed to load elements', e) }
        }
    }

    onMounted(() => {
        if (!isInitialized.value) {
            loadElements()
            isInitialized.value = true
        }
    })

    // Auto-save on change (Persistence only)
    watch(elements, () => {
        debouncedSave()
    }, { deep: true })

    let saveTimeout: any = null
    const debouncedSave = () => {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
            saveElements()
        }, 500)
    }

    const snapshotHistory = () => {
        const state = JSON.stringify(elements.value)
        // Avoid duplicate states
        if (historyPointer.value >= 0 && history.value[historyPointer.value] === state) return

        if (historyPointer.value < history.value.length - 1) {
            history.value = history.value.slice(0, historyPointer.value + 1)
        }
        history.value.push(state)
        if (history.value.length > 50) history.value.shift()
        historyPointer.value = history.value.length - 1
    }

    const addElement = (el: Omit<CanvasElement, 'id'>) => {
        const id = Date.now().toString()
        const defaultName = el.name || (el.type === 'text' ? 'Text Layer' : el.type === 'image' ? 'Image Layer' : el.type === 'shape' ? 'Shape Layer' : 'Layer')
        const newEl = { ...el, id, order: elements.value.length, name: defaultName }
        elements.value.push(newEl)
        selectedIds.value = [id]
        snapshotHistory()
    }

    const updateElement = (id: string, updates: Partial<CanvasElement>, saveToHistory = true) => {
        const el = elements.value.find((e: CanvasElement) => e.id === id)
        if (el) {
            Object.assign(el, updates)
            if (saveToHistory) snapshotHistory()
        }
    }

    const commitHistory = () => snapshotHistory()

    const updateStyle = (id: string, styleUpdates: Partial<ElementStyle>, saveToHistory = true) => {
        const el = elements.value.find((e: CanvasElement) => e.id === id)
        if (el) {
            if (styleUpdates.shadow && el.style.shadow) {
                styleUpdates.shadow = { ...el.style.shadow, ...styleUpdates.shadow }
            }
            if (styleUpdates.crop && el.style.crop) {
                styleUpdates.crop = { ...el.style.crop, ...styleUpdates.crop }
            }
            el.style = { ...el.style, ...styleUpdates }
            if (saveToHistory) snapshotHistory()
        }
    }

    const deleteElement = (id: string) => {
        elements.value = elements.value.filter((e: CanvasElement) => e.id !== id)
        selectedIds.value = selectedIds.value.filter(selId => selId !== id)
        snapshotHistory()
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
            selectedIds.value = [newEl.id]
            snapshotHistory()
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
        snapshotHistory()
    }

    const reorderElement = (id: string, newIndex: number) => {
        const currentIndex = elements.value.findIndex(e => e.id === id)
        if (currentIndex === -1) return

        const el = elements.value[currentIndex]
        if (!el) return

        const newElements = [...elements.value]

        // Remove from old position
        newElements.splice(currentIndex, 1)

        // Insert at new position
        // Ensure newIndex is within bounds
        const targetIndex = Math.max(0, Math.min(newIndex, newElements.length))
        newElements.splice(targetIndex, 0, el)

        newElements.forEach((e, i) => e.order = i)
        elements.value = newElements
        snapshotHistory()
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
        snapshotHistory()
    }

    const groupSelection = () => {
        if (selectedIds.value.length < 2) return

        // 1. Identify items to group
        const itemsToGroup = elements.value.filter(el => selectedIds.value.includes(el.id))
        if (itemsToGroup.length < 2) return

        // 2. Calculate Bounding Box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

        itemsToGroup.forEach(el => {
            const elW = el.style.width || 0
            const elH = el.style.height || 0
            if (el.x < minX) minX = el.x
            if (el.y < minY) minY = el.y
            if (el.x + elW > maxX) maxX = el.x + elW
            if (el.y + elH > maxY) maxY = el.y + elH
        })

        const groupX = minX
        const groupY = minY
        const groupW = maxX - minX
        const groupH = maxY - minY

        // 3. Create Group Element
        const groupId = Date.now().toString()
        const groupElement: CanvasElement = {
            id: groupId,
            type: 'group',
            x: groupX,
            y: groupY,
            style: {
                width: groupW,
                height: groupH,
                rotate: 0,
                opacity: 1,
            },
            // 4. Transform children to relative coordinates
            children: itemsToGroup.map(el => {
                // Clone to avoid mutations affecting undo history immediately if we weren't careful
                const child = JSON.parse(JSON.stringify(el))
                child.x = child.x - groupX
                child.y = child.y - groupY
                return child
            }),
            order: elements.value.length, // Put on top
            name: 'Group ' + (elements.value.filter(e => e.type === 'group').length + 1)
        }

        // 5. Update Elements List
        // Remove original items
        elements.value = elements.value.filter(el => !selectedIds.value.includes(el.id))
        // Add group
        elements.value.push(groupElement)

        // 6. Select the new group
        selectedIds.value = [groupId]
        snapshotHistory()
    }

    const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom', canvasW: number, canvasH: number) => {
        if (!selectedIds.value.length) return

        // If single element, align to canvas
        if (selectedIds.value.length === 1) {
            const el = elements.value.find(e => e.id === selectedIds.value[0])
            if (!el) return

            // We need width/height. If it's auto (text), we rely on rendered size which we might not have perfectly here.
            // But we can use style width if set, or approx?
            // For Text, 'width' in style is often undefined (auto). 
            // In a real app we'd need bounding box from DOM. 
            // For now, let's assume if width is missing, we center anchor point (or 0).

            // To do this correctly without DOM access here, we should pass bounding box or updates from component.
            // BUT, for simple Layout tools, we usually update X/Y.

            // Let's rely on simple styles for now.
            const w = el.style.width || 0
            const h = el.style.height || 0

            if (alignment === 'left') el.x = 0
            if (alignment === 'center') el.x = (canvasW - w) / 2
            if (alignment === 'right') el.x = canvasW - w
            if (alignment === 'top') el.y = 0
            if (alignment === 'middle') el.y = (canvasH - h) / 2
            if (alignment === 'bottom') el.y = canvasH - h

            snapshotHistory()
            return
        }

        // Multi-selection: Align to Selection Bounds
        // 1. Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        const selectedEls = elements.value.filter(e => selectedIds.value.includes(e.id))

        selectedEls.forEach(el => {
            const w = el.style.width || 0
            const h = el.style.height || 0
            minX = Math.min(minX, el.x)
            minY = Math.min(minY, el.y)
            maxX = Math.max(maxX, el.x + w)
            maxY = Math.max(maxY, el.y + h)
        })

        const boundsW = maxX - minX
        const boundsH = maxY - minY
        const centerX = minX + boundsW / 2
        const centerY = minY + boundsH / 2

        selectedEls.forEach(el => {
            const w = el.style.width || 0
            const h = el.style.height || 0

            if (alignment === 'left') el.x = minX
            if (alignment === 'center') el.x = centerX - w / 2
            if (alignment === 'right') el.x = maxX - w
            if (alignment === 'top') el.y = minY
            if (alignment === 'middle') el.y = centerY - h / 2
            if (alignment === 'bottom') el.y = maxY - h
        })
        snapshotHistory()
    }

    const ungroupElement = () => {
        const id = selectedIds.value[0]
        if (!id) return

        const index = elements.value.findIndex(e => e.id === id)
        if (index === -1) return

        const groupEl = elements.value[index]
        if (!groupEl || groupEl.type !== 'group' || !groupEl.children) return

        // 1. Restore children to absolute coordinates
        const restoredChildren = groupEl.children.map(child => {
            const restored = { ...child }
            restored.x = (groupEl.x) + child.x
            restored.y = (groupEl.y) + child.y
            // If group had rotation, we'd need complex matrix math here. 
            // For MVP, we assume group roation is 0 or applied to children.
            // Actually, if group has rotation, simply un-grouping by adding X/Y is NOT enough.
            // We would need to rotate the child center around the group center.
            // For now, let's assume valid groups have 0 rotation or we handle basic translation.
            // Todo: Handle Group Rotation if we allow rotating groups.
            return restored
        })

        // 2. Remove group and insert children
        const newElements = [...elements.value]
        newElements.splice(index, 1, ...restoredChildren)

        // Re-index orders? Or just push them to top?
        // Let's just keep them where the group was (inserted in place)

        elements.value = newElements

        // 3. Select all children
        selectedIds.value = restoredChildren.map(c => c.id)
        snapshotHistory()
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
        selectedId, // Backward compatibility
        selectedIds,
        toggleSelection: (id: string, multi: boolean) => {
            if (multi) {
                if (selectedIds.value.includes(id)) {
                    selectedIds.value = selectedIds.value.filter(i => i !== id)
                } else {
                    selectedIds.value.push(id)
                }
            } else {
                selectedIds.value = [id]
            }
        },
        addElement,
        updateElement,
        updateStyle,
        deleteElement,
        duplicateElement,
        moveElement,
        reorderElement,
        shuffleElements,
        commitHistory,
        undo,
        redo,
        groupSelection,
        ungroupElement,
        alignElements,
        snapshotHistory,
        canUndo: computed(() => historyPointer.value > 0),
        canRedo: computed(() => historyPointer.value < history.value.length - 1)
    }
}
