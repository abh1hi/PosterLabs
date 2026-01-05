import { ref, watch, onMounted } from 'vue'

export interface PosterSize {
    w: number
    h: number
}

const bgColor = ref('#f4f4f0')
const posterSize = ref<PosterSize>({ w: 500, h: 700 })
const scale = ref(1)
const manualScale = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isMobilePropertiesOpen = ref(false)
const isShapesLibraryOpen = ref(false)
const activeTool = ref<'select' | 'hand'>('select')
const isToolbarOpen = ref(true)
const activeTab = ref('design')

// Enhanced Controls
const backgroundType = ref<'solid' | 'gradient'>('solid')
const gradientStyle = ref('linear-gradient(135deg, #ffffff 0%, #000000 100%)')
const showGrid = ref(false)

export const CANVAS_PRESETS = [
    { name: 'Custom', w: 500, h: 700 }, // Fallback/Default
    { name: 'YouTube Thumbnail', w: 1280, h: 720 },
    { name: 'Instagram Post', w: 1080, h: 1080 },
    { name: 'Instagram Story', w: 1080, h: 1920 },
    { name: 'Facebook Post', w: 1200, h: 630 },
    { name: 'Twitter Post', w: 1200, h: 675 },
    { name: 'A4 (Print)', w: 794, h: 1123 }, // 96 DPI
    { name: 'Business Card', w: 336, h: 192 }, // 3.5 x 2 inch @ 96 DPI
    { name: 'PVC Card (CR80)', w: 325, h: 204 } // 85.6mm x 54mm @ ~96 DPI (approx)
]

export function useCanvas() {
    const LOCAL_CANVAS_KEY = 'posterlab_canvas_settings'

    const saveSettings = () => {
        const settings = {
            bgColor: bgColor.value,
            posterSize: posterSize.value,
            backgroundType: backgroundType.value,
            gradientStyle: gradientStyle.value,
            showGrid: showGrid.value
        }
        localStorage.setItem(LOCAL_CANVAS_KEY, JSON.stringify(settings))
    }

    const loadSettings = () => {
        const saved = localStorage.getItem(LOCAL_CANVAS_KEY)
        if (saved) {
            try {
                const data = JSON.parse(saved)
                if (data.bgColor) bgColor.value = data.bgColor
                if (data.posterSize) posterSize.value = data.posterSize
                if (data.backgroundType) backgroundType.value = data.backgroundType
                if (data.gradientStyle) gradientStyle.value = data.gradientStyle
                if (data.showGrid !== undefined) showGrid.value = data.showGrid
            } catch (e) {
                console.error('Failed to load canvas settings', e)
            }
        }
    }

    onMounted(() => {
        loadSettings()
    })

    // Debounced save
    let saveTimeout: any = null
    const debouncedSave = () => {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
            saveSettings()
        }, 1000)
    }

    watch([bgColor, posterSize, backgroundType, gradientStyle, showGrid], () => {
        debouncedSave()
    }, { deep: true })

    return {
        bgColor,
        posterSize,
        scale,
        manualScale,
        panOffset,
        isMobilePropertiesOpen,
        isShapesLibraryOpen,
        activeTool,
        isToolbarOpen,
        activeTab,
        backgroundType,
        gradientStyle,
        showGrid
    }
}
