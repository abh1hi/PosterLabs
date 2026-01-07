import { ref, computed } from 'vue'
import { MOCK_TEMPLATES, type Template } from '../data/templates'
import { useElements } from './useElements'
import { useCanvas } from './useCanvas'
import { nanoid } from 'nanoid'

const searchQuery = ref('')
const activeCategory = ref<'all' | Template['category']>('all')

export function useTemplates() {
    const { elements } = useElements()
    const { posterSize, backgroundType, bgColor, gradientStyle } = useCanvas()

    const templates = ref<Template[]>(MOCK_TEMPLATES)

    const filteredTemplates = computed(() => {
        return templates.value.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
            const matchesCategory = activeCategory.value === 'all' || t.category === activeCategory.value
            return matchesSearch && matchesCategory
        })
    })

    const loadTemplate = (template: Template) => {
        // 1. Resize Canvas
        posterSize.value = { w: template.width, h: template.height }

        // 2. Set Background
        if (template.background) {
            backgroundType.value = template.background.type as any
            if (template.background.type === 'solid') {
                bgColor.value = template.background.value
            } else if (template.background.type === 'gradient') {
                gradientStyle.value = template.background.value
            }
        }

        // 3. Clear and Load Elements
        // We must regenerate IDs to avoid conflicts if multiple of same template (though here we clear first)
        // Actually, for "Replace", we clear.

        elements.value = template.elements.map(el => ({
            ...el,
            id: nanoid() // Fresh ID for the new instance
        }))
    }

    return {
        templates,
        filteredTemplates,
        searchQuery,
        activeCategory,
        loadTemplate
    }
}
