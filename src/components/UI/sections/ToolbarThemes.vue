<script setup lang="ts">
import { ref } from 'vue'
import { useThemes } from '../../../composables/useThemes'
import { useCanvas } from '../../../composables/useCanvas'
import { Upload, Download, Trash2, Plus } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-tonal-button.js'

const { themes, customThemes, applyTheme, exportTheme, importTheme, deleteCustomTheme } = useThemes()
const { activeTab } = useCanvas()
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files?.[0]) {
        importTheme(target.files[0])
        target.value = '' // Reset
    }
}

const goToDesigner = () => {
    activeTab.value = 'theme-designer'
}
</script>

<template>
    <div class="p-4 space-y-6 pb-24">
        
        <!-- Header / Actions -->
        <div class="flex items-center justify-between">
            <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Palette</h3>
            <div class="flex gap-2">
                <input type="file" ref="fileInput" hidden accept=".json" @change="handleFileChange" />
                <md-icon-button @click="fileInput?.click()" title="Import Theme (JSON)">
                    <Upload :size="20" />
                </md-icon-button>
                <md-filled-tonal-button class="h-8" @click="goToDesigner">
                    <Plus slot="icon" :size="16" />
                    Create
                </md-filled-tonal-button>
            </div>
        </div>

        <!-- Custom Themes Section -->
        <div v-if="customThemes.length > 0" class="space-y-3">
             <h4 class="label-medium font-bold px-2">Your Themes</h4>
             <div class="grid grid-cols-2 gap-3">
                <div 
                    v-for="theme in customThemes" 
                    :key="theme.id"
                    class="group relative flex flex-col gap-2 p-3 rounded-xl border border-outline/10 bg-surface-high hover:border-primary transition-all text-left overflow-hidden cursor-pointer"
                    @click="applyTheme(theme)"
                >
                    <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button class="bg-surface-highest p-1.5 rounded-full hover:bg-error hover:text-white transition-colors" @click.stop="deleteCustomTheme(theme.id)">
                            <Trash2 :size="14" />
                        </button>
                        <button class="bg-surface-highest p-1.5 rounded-full hover:bg-primary hover:text-white transition-colors" @click.stop="exportTheme(theme)">
                            <Download :size="14" />
                        </button>
                    </div>

                    <!-- Mini Preview -->
                    <div class="w-full aspect-[4/3] rounded-lg shadow-sm flex flex-col p-2 gap-2 relative" :style="{ backgroundColor: theme.colors.background }">
                         <div class="w-1/2 h-2 rounded opacity-80" :style="{ backgroundColor: theme.colors.text }"></div>
                         <div class="flex gap-2 h-full">
                            <div class="flex-1 rounded-md" :style="{ backgroundColor: theme.colors.primary, borderRadius: (theme.styles.borderRadius / 4) + 'px' }"></div>
                            <div class="w-1/3 rounded-md opacity-60" :style="{ backgroundColor: theme.colors.secondary, borderRadius: (theme.styles.borderRadius / 4) + 'px' }"></div>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <span class="label-medium font-bold truncate">{{ theme.name }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Presets Section -->
        <div class="space-y-3">
            <h4 class="label-medium font-bold px-2">Presets</h4>
            <div class="grid grid-cols-2 gap-3">
                <div 
                    v-for="theme in themes" 
                    :key="theme.id"
                    class="group relative flex flex-col gap-2 p-3 rounded-xl border border-outline/10 bg-surface-high hover:border-primary transition-all text-left overflow-hidden cursor-pointer"
                    @click="applyTheme(theme)"
                >
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <button class="bg-surface-highest p-1.5 rounded-full hover:bg-primary hover:text-white transition-colors" @click.stop="exportTheme(theme)" title="Export JSON">
                            <Download :size="14" />
                        </button>
                    </div>

                    <!-- Mini Preview -->
                    <div class="w-full aspect-[4/3] rounded-lg shadow-sm flex flex-col p-2 gap-2" :style="{ backgroundColor: theme.colors.background }">
                        <div class="w-1/2 h-2 rounded opacity-80" :style="{ backgroundColor: theme.colors.text }"></div>
                        <div class="flex gap-2 h-full">
                            <div class="flex-1 rounded-md" :style="{ backgroundColor: theme.colors.primary, borderRadius: (theme.styles.borderRadius / 4) + 'px' }"></div>
                            <div class="w-1/3 rounded-md opacity-60" :style="{ backgroundColor: theme.colors.secondary, borderRadius: (theme.styles.borderRadius / 4) + 'px' }"></div>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <span class="label-medium font-bold">{{ theme.name }}</span>
                        <div class="flex gap-1 mt-1">
                            <div class="w-3 h-3 rounded-full border border-white/10" :style="{ backgroundColor: theme.colors.primary }"></div>
                            <div class="w-3 h-3 rounded-full border border-white/10" :style="{ backgroundColor: theme.colors.secondary }"></div>
                            <div class="w-3 h-3 rounded-full border border-white/10" :style="{ backgroundColor: theme.colors.accent }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
