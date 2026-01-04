import { ref, watch } from 'vue'

export interface PosterSize {
    w: number
    h: number
}

const bgColor = ref(localStorage.getItem('posterLab_bgColor') || '#f4f4f0')
const posterSize = ref<PosterSize>(JSON.parse(localStorage.getItem('posterLab_posterSize') || '{"w": 500, "h": 700}'))
const scale = ref(1) // Calculated scale based on screen fit
const manualScale = ref(1) // User zoom override
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const isMobilePropertiesOpen = ref(false)
const isShapesLibraryOpen = ref(false)
const activeTool = ref<'select' | 'hand'>('select')

watch(bgColor, (val) => localStorage.setItem('posterLab_bgColor', val))
watch(posterSize, (val) => localStorage.setItem('posterLab_posterSize', JSON.stringify(val)), { deep: true })

export function useCanvas() {
    return {
        bgColor,
        posterSize,
        scale,
        manualScale,
        panOffset,
        isPanning,
        isMobilePropertiesOpen,
        isShapesLibraryOpen,
        activeTool
    }
}
