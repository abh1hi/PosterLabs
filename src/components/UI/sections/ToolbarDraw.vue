<script setup lang="ts">
import { ref } from 'vue'
import { useCanvas } from '../../../composables/useCanvas'
import { Brush, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import ColorPicker from '../ColorPicker.vue'

const { isDrawing, brushSettings } = useCanvas()

// Helper to convert to Hex for color picker
const toHex = (color?: string) => {
    if (!color) return '#000000'
    if (color.startsWith('#')) return color
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return '#000000'
    ctx.fillStyle = color
    return ctx.fillStyle 
}

const isSettingsOpen = ref(true)

const toggleDrawing = () => {
    isDrawing.value = !isDrawing.value
}
</script>

<template>
    <div class="p-4 space-y-6">
        <div class="flex items-center justify-between">
            <h3 class="label-large text-on-surface">Drawing Tools</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary" v-if="isDrawing">Active</span>
        </div>

        <!-- Drawing Mode Toggle -->
        <button 
            @click="toggleDrawing"
            class="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all shadow-sm"
            :class="isDrawing ? 'bg-primary text-on-primary shadow-lg scale-[1.02]' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'"
        >
            <Brush :size="20" />
            {{ isDrawing ? 'Stop Drawing' : 'Start Drawing' }}
        </button>

        <!-- Brush Settings Accordion -->
        <div class="border border-outline/10 rounded-xl bg-surface-high">
            <button 
                type="button"
                @click="isSettingsOpen = !isSettingsOpen"
                class="w-full h-fit py-3 px-4 flex items-center justify-between text-sm font-bold text-on-surface hover:bg-surface-variant/10 transition-colors rounded-xl"
            >
                <span>Brush Settings</span>
                <component :is="isSettingsOpen ? ChevronUp : ChevronDown" :size="16" />
            </button>
            
            <div v-if="isSettingsOpen" class="p-4 pt-0 space-y-6">
                <!-- Brush Presets -->
                <div class="grid grid-cols-3 gap-2">
                    <button @click="brushSettings.size = 3; brushSettings.opacity = 1" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors border border-transparent hover:border-primary/20" :class="brushSettings.size <= 5 && brushSettings.opacity === 1 ? 'ring-2 ring-primary bg-primary/5' : ''">
                        <div class="w-1 h-6 bg-current rounded-full"></div>
                        <span class="text-[10px] font-bold text-on-surface-variant">Pen</span>
                    </button>
                    <button @click="brushSettings.size = 12; brushSettings.opacity = 0.8" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors border border-transparent hover:border-primary/20" :class="brushSettings.size > 5 && brushSettings.size < 20 ? 'ring-2 ring-primary bg-primary/5' : ''">
                        <div class="w-3 h-6 bg-current rounded-full opacity-80"></div>
                        <span class="text-[10px] font-bold text-on-surface-variant">Marker</span>
                    </button>
                    <button @click="brushSettings.size = 30; brushSettings.opacity = 0.4" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors border border-transparent hover:border-primary/20" :class="brushSettings.size >= 20 ? 'ring-2 ring-primary bg-primary/5' : ''">
                        <div class="w-6 h-6 bg-current rounded-sm opacity-40"></div>
                        <span class="text-[10px] font-bold text-on-surface-variant">Highlighter</span>
                    </button>
                </div>

                <!-- Brush Size -->
                <div class="space-y-3 pt-2 border-t border-outline/10">
                    <div class="flex justify-between text-xs font-bold text-on-surface-variant">
                        <span>Size</span>
                        <span>{{ brushSettings.size }}px</span>
                    </div>
                     <!-- Visual Indicator -->
                    <div class="h-10 bg-surface-variant/5 rounded-lg flex items-center justify-center border border-outline/10 overflow-hidden relative">
                         <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
                        <div 
                            class="rounded-full bg-on-surface transition-all duration-200 shadow-sm"
                            :style="{ 
                                width: Math.min(brushSettings.size, 32) + 'px', 
                                height: Math.min(brushSettings.size, 32) + 'px',
                                backgroundColor: brushSettings.color,
                                opacity: brushSettings.opacity ?? 1
                            }"
                        ></div>
                    </div>
                    <input 
                        type="range" 
                        v-model.number="brushSettings.size" 
                        min="1" 
                        max="50" 
                        class="w-full accent-primary h-2 bg-outline/10 rounded-full appearance-none cursor-pointer"
                    >
                </div>

                <!-- Opacity -->
                <div class="space-y-2">
                    <div class="flex justify-between text-xs font-bold text-on-surface-variant">
                        <span>Opacity</span>
                        <span>{{ Math.round((brushSettings.opacity ?? 1) * 100) }}%</span>
                    </div>
                    <input 
                        type="range" 
                        :value="brushSettings.opacity ?? 1"
                        @input="(e: any) => brushSettings.opacity = parseFloat(e.target.value)"
                        min="0.1" 
                        max="1" 
                        step="0.05"
                        class="w-full accent-primary h-2 bg-outline/10 rounded-full appearance-none cursor-pointer"
                    >
                </div>

                <!-- Brush Color -->
                <div class="space-y-2">
                    <span class="text-xs font-bold text-on-surface-variant">Color</span>
                    <ColorPicker 
                        :model-value="toHex(brushSettings.color)" 
                        @update:model-value="(v: any) => brushSettings.color = v" 
                    />
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="pt-4 border-t border-outline/10 space-y-2">
             <button class="w-full py-2 rounded-lg bg-error-container/20 text-on-error-container hover:bg-error-container/40 flex items-center justify-center gap-2 text-xs font-bold transition-colors" title="Clear all drawings">
                <Trash2 :size="14" /> Clear Canvas Drawings
             </button>
             <p class="text-[10px] text-center text-on-surface-variant/50">Note: Drawings are added as path elements.</p>
        </div>
    </div>
</template>
