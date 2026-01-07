<script setup lang="ts">
import { ref } from 'vue'
import { CANVAS_PRESETS, useCanvas } from '../../../composables/useCanvas'
import { useResize } from '../../../composables/useResize'
import { Move, Smartphone, Instagram, Linkedin, Facebook, Youtube, FileText, Check } from 'lucide-vue-next'
import '@material/web/button/filled-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/checkbox/checkbox.js'

const { posterSize } = useCanvas()
const { resizeCanvas } = useResize()

const selectedPreset = ref<string | null>(null)
const customW = ref(posterSize.value.w)
const customH = ref(posterSize.value.h)
const scaleContent = ref(true)

const applyPreset = (preset: { name: string, w: number, h: number }) => {
    selectedPreset.value = preset.name
    customW.value = preset.w
    customH.value = preset.h
}

const handleResize = () => {
    resizeCanvas(customW.value, customH.value, scaleContent.value)
}

const getIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('instagram')) return Instagram
    if (n.includes('linkedin')) return Linkedin
    if (n.includes('facebook')) return Facebook
    if (n.includes('youtube')) return Youtube
    if (n.includes('phone') || n.includes('story')) return Smartphone
    if (n.includes('a4') || n.includes('card')) return FileText
    return Move
}
</script>

<template>
    <div class="p-4 space-y-6 pb-24">
        
        <!-- Header -->
        <div class="space-y-1">
            <h3 class="label-large text-on-surface uppercase tracking-widest px-1">Magic Switch</h3>
            <p class="text-xs text-on-surface-variant px-1">Instantly resize your design for any platform.</p>
        </div>

        <!-- Custom Dimensions -->
        <div class="space-y-3">
             <h4 class="label-medium font-bold px-1">Custom Size</h4>
             <div class="flex gap-3">
                <div class="flex-1 space-y-1">
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Width</label>
                    <div class="relative">
                        <input 
                            type="number" 
                            v-model.number="customW" 
                            class="w-full p-3 rounded-lg bg-surface-variant/20 border-none text-on-surface font-mono text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                         <span class="absolute right-3 top-3 text-xs text-on-surface-variant/50">px</span>
                    </div>
                </div>
                <div class="flex-1 space-y-1">
                    <label class="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Height</label>
                    <div class="relative">
                        <input 
                            type="number" 
                            v-model.number="customH" 
                            class="w-full p-3 rounded-lg bg-surface-variant/20 border-none text-on-surface font-mono text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                        <span class="absolute right-3 top-3 text-xs text-on-surface-variant/50">px</span>
                    </div>
                </div>
            </div>
            
            <label class="flex items-center gap-3 p-3 rounded-lg bg-surface-high border border-outline/10 cursor-pointer hover:bg-surface-variant/10 transition-colors">
                <md-checkbox :checked="scaleContent" @change="(e: any) => scaleContent = e.target.checked" touch-target="wrapper"></md-checkbox>
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-on-surface">Smart Scale Content</span>
                    <span class="text-[10px] text-on-surface-variant">Adjust elements to fit new size</span>
                </div>
            </label>
            
            <md-filled-tonal-button class="w-full" @click="handleResize">
                <Check slot="icon" :size="18" />
                Resize Design
            </md-filled-tonal-button>
        </div>

        <!-- Presets Grid -->
        <div class="space-y-3">
            <h4 class="label-medium font-bold px-1">Platform Presets</h4>
            <div class="grid grid-cols-2 gap-2">
                <button 
                    v-for="preset in CANVAS_PRESETS" 
                    :key="preset.name"
                    class="relative p-3 rounded-lg border text-left transition-all group flex flex-col gap-2"
                    :class="[
                        selectedPreset === preset.name 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-surface-high border-outline/10 text-on-surface hover:border-outline/30 hover:bg-surface-variant/10'
                    ]"
                    @click="applyPreset(preset)"
                >
                    <div class="flex items-start justify-between">
                         <component :is="getIcon(preset.name)" :size="20" class="opacity-70" />
                        <span v-if="selectedPreset === preset.name" class="w-2 h-2 rounded-full bg-primary mb-auto"></span>
                    </div>
                    <div>
                        <div class="text-xs font-bold leading-tight">{{ preset.name }}</div>
                        <div class="text-[10px] opacity-60 font-mono mt-0.5">{{ preset.w }} x {{ preset.h }}</div>
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>
