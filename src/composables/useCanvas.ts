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
const activeTab = ref(new URLSearchParams(window.location.search).get('tab') || 'design')

// Enhanced Controls
const backgroundType = ref<'solid' | 'gradient'>('solid')
const gradientStyle = ref('linear-gradient(135deg, #ffffff 0%, #000000 100%)')
const showGrid = ref(false)

// Drawing State
const isDrawing = ref(false)
const brushSettings = ref({
    size: 5,
    color: '#000000',
    opacity: 1
})

export const CANVAS_PRESETS = [
    { name: 'Custom', w: 1080, h: 1080 },
    { name: 'Instagram Post', w: 1080, h: 1080 },
    { name: 'Instagram Story', w: 1080, h: 1920 },
    { name: 'Instagram Portrait', w: 1080, h: 1350 },
    { name: 'LinkedIn Post', w: 1200, h: 627 },
    { name: 'LinkedIn Banner', w: 1584, h: 396 },
    { name: 'Twitter Post', w: 1600, h: 900 },
    { name: 'Twitter Header', w: 1500, h: 500 },
    { name: 'Facebook Post', w: 1200, h: 630 },
    { name: 'Facebook Cover', w: 820, h: 312 },
    { name: 'YouTube Thumbnail', w: 1280, h: 720 },
    { name: 'YouTube Channel Art', w: 2560, h: 1440 },
    { name: 'A4 (Print 300 DPI)', w: 2480, h: 3508 },
    { name: 'A4 (Standard/Digital)', w: 794, h: 1123 }, // 96 DPI
    { name: 'A4 (Web 72 DPI)', w: 595, h: 842 },
    { name: 'Business Card (3.5x2")', w: 1050, h: 600 } // 300 DPI
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
        showGrid,
        isDrawing,
        brushSettings
    }
}
