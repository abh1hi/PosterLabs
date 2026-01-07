<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTemplates } from '../../../composables/useTemplates'
import { Search, LayoutTemplate, ChevronDown, ChevronRight } from 'lucide-vue-next'

const { templates, searchQuery, loadTemplate } = useTemplates()

const categories = [
    { id: 'social', label: 'Social Media' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'print', label: 'Print' },
    { id: 'business', label: 'Business' }
]

const expandedCategories = ref(new Set<string>(['social', 'marketing']))

const toggleCategory = (id: string) => {
    if (expandedCategories.value.has(id)) expandedCategories.value.delete(id)
    else expandedCategories.value.add(id)
}

// Group templates by category
const groupedTemplates = computed(() => {
    const groups: Record<string, typeof templates.value> = {}
    
    // Initialize groups
    categories.forEach(c => groups[c.id] = [])
    
    // Sort templates into groups (filtering by search)
    templates.value.forEach(t => {
        if (!searchQuery.value || t.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
            const cat = t.category;
            if (cat && groups[cat]) {
                groups[cat].push(t)
            }
        }
    })
    
    return groups
})

const handleDragStart = (e: DragEvent, template: any) => {
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.dropEffect = 'copy'
        // Pass the template ID or the whole object (serialized)
        e.dataTransfer.setData('application/json', JSON.stringify(template))
        // drag image styling if needed
    }
}

const handleTemplateClick = (template: any) => {
    if (confirm('This will replace your current design. Continue?')) {
        loadTemplate(template)
    }
}
</script>

<template>
    <div class="h-full flex flex-col gap-4">
        <!-- Header -->
        <div class="px-4 pt-4">
            <h2 class="label-large mb-1">Templates</h2>
            <p class="body-small text-on-surface-variant">Drag or click to apply</p>
        </div>

        <!-- Search -->
        <div class="px-4">
             <div class="relative">
                <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Search templates..." 
                    class="w-full pl-9 pr-3 py-2 text-sm bg-surface-high rounded-xl border border-outline/10 focus:border-primary focus:outline-none transition-colors"
                />
            </div>
        </div>

        <!-- Accordion List -->
        <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <div v-for="cat in categories" :key="cat.id" class="border border-outline/5 rounded-xl overflow-hidden bg-surface-high/20">
                <!-- Header -->
                <button 
                    @click="toggleCategory(cat.id)"
                    class="w-full flex items-center justify-between p-3 hover:bg-surface-high/50 transition-colors"
                >
                    <span class="label-medium font-bold">{{ cat.label }}</span>
                    <div class="flex items-center gap-2">
                         <span class="text-[10px] bg-surface-variant text-on-surface-variant px-1.5 rounded-full" v-if="groupedTemplates[cat.id]?.length">
                            {{ groupedTemplates[cat.id]?.length }}
                         </span>
                         <component :is="expandedCategories.has(cat.id) ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant"/>
                    </div>
                </button>

                <!-- Grid Body -->
                <div v-if="expandedCategories.has(cat.id)" class="p-3 pt-0 grid grid-cols-2 gap-3" :class="{'hidden': !groupedTemplates[cat.id]?.length}">
                     <div 
                        v-for="template in groupedTemplates[cat.id]" 
                        :key="template.id"
                        @click="handleTemplateClick(template)"
                        draggable="true"
                        @dragstart="handleDragStart($event, template)"
                        class="group cursor-grab active:cursor-grabbing flex flex-col gap-2"
                    >
                        <!-- Thumbnail Card -->
                        <div class="aspect-[3/4] rounded-xl overflow-hidden relative bg-surface-high border border-outline/10 group-hover:border-primary/50 transition-colors shadow-sm">
                             <img 
                                v-if="template.thumbnail.startsWith('http')" 
                                :src="template.thumbnail" 
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center bg-surface-variant">
                                <LayoutTemplate :size="32" class="opacity-20"/>
                            </div>
                            
                            <!-- Hover Overlay -->
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span class="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">Use</span>
                            </div>
                        </div>
                        
                        <!-- Info -->
                        <div>
                            <h3 class="label-medium truncate">{{ template.name }}</h3>
                            <p class="label-small text-on-surface-variant">{{ template.width }}x{{ template.height }}</p>
                        </div>
                    </div>
                    
                    <!-- Empty State for Category -->
                     <div v-if="!groupedTemplates[cat.id]?.length" class="col-span-2 py-4 text-center text-xs text-on-surface-variant/50 italic">
                        No matches
                    </div>
                </div>
            </div>
            
             <!-- Global Empty State -->
             <div v-if="Object.values(groupedTemplates).every(g => g.length === 0)" class="py-12 text-center text-on-surface-variant">
                <p>No templates found</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.mask-fade-right {
    mask-image: linear-gradient(to right, black 90%, transparent 100%);
}
</style>
