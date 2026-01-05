<script setup lang="ts">
import { useThemes } from '../../../composables/useThemes'
import { useTemplates } from '../../../composables/useTemplates'
import { useCanvas } from '../../../composables/useCanvas'
import { useElements } from '../../../composables/useElements'
import { useToasts } from '../../../composables/useToasts'
import { LayoutTemplate } from 'lucide-vue-next'

const { themes } = useThemes()
const { TEMPLATES } = useTemplates()
const { bgColor, posterSize } = useCanvas()
const { elements } = useElements()
const { showToast } = useToasts()

const applyTemplate = (template: any) => {
    if (window.confirm('Replace current design with template?')) {
        elements.value = JSON.parse(JSON.stringify(template.elements));
        posterSize.value.w = template.settings.w;
        posterSize.value.h = template.settings.h;
        bgColor.value = template.settings.bgColor;
        showToast('Template loaded', 'success');
    }
}
</script>

<template>
    <div class="p-4 space-y-8">
        
        <!-- Themes Section -->
        <div class="space-y-4">
            <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Themes</h3>
            <div class="grid grid-cols-2 gap-3">
                <button v-for="theme in themes" :key="theme.id" 
                    @click="() => {
                        bgColor = theme.colors.background;
                        showToast(`Applied ${theme.name} theme`, 'success');
                    }"
                    class="h-16 rounded-xl border border-outline/10 hover:border-primary transition-all flex overflow-hidden relative group"
                >
                    <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.primary }"></div>
                    <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.secondary }"></div>
                    <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.background }"></div>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white text-xs font-bold">{{ theme.name }}</span>
                    </div>
                </button>
            </div>
        </div>

        <!-- Templates Section -->
        <div class="space-y-4">
            <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Templates</h3>
            <div class="grid grid-cols-2 gap-3">
                <button v-for="template in TEMPLATES" :key="template.id"
                    @click="applyTemplate(template)" 
                    class="aspect-[3/4] bg-surface-high rounded-xl border border-outline/10 hover:border-primary transition-all cursor-pointer overflow-hidden group relative"
                >
                    <!-- Simple Preview (Background Color + Name) -->
                    <div class="w-full h-full flex flex-col items-center justify-center p-2 text-center" :style="{ backgroundColor: template.settings.bgColor }">
                        <span class="font-bold opacity-50">{{ template.name }}</span>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <LayoutTemplate class="text-primary" :size="32" />
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../index.css";
</style>
