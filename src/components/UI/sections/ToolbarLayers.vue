<script setup lang="ts">
import { computed } from 'vue'
import { useElements } from '../../../composables/useElements' // Verified import
import { useCanvas } from '../../../composables/useCanvas'
import { 
    Box, Type, ImageIcon, Lock, Eye, EyeOff, Unlock, 
    ArrowDownToLine, ChevronDown, ChevronUp, ArrowUpToLine, 
    Settings2, Copy, Trash2 
} from 'lucide-vue-next'

import '@material/web/iconbutton/icon-button.js'

const { elements, selectedId, updateElement, moveElement, duplicateElement, deleteElement } = useElements()
const { activeTab } = useCanvas()

const sortedLayers = computed(() => [...elements.value].reverse())
</script>

<template>
    <div class="p-2 flex flex-col gap-2">
        <div v-if="elements.length === 0" class="p-8 text-center text-on-surface-variant opacity-60">
            <Box :size="48" class="mx-auto mb-2 opacity-50" />
            <p class="body-medium">No layers yet</p>
        </div>
        
        <div v-else class="space-y-1">
            <div v-for="layer in sortedLayers" :key="layer.id" 
                class="group relative flex flex-col bg-surface-lowest border border-outline/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30"
                :class="{'ring-2 ring-primary border-transparent z-10': selectedId === layer.id}"
            >
                <div class="flex items-center gap-3 p-3 cursor-pointer" @click="selectedId = layer.id">
                    <!-- Thumbnail/Type Icon -->
                    <div class="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center shrink-0 border border-outline/5">
                        <Type v-if="layer.type === 'text'" :size="18" class="text-on-surface-variant" />
                        <ImageIcon v-else-if="layer.type === 'image'" :size="18" class="text-on-surface-variant" />
                        <Box v-else :size="18" class="text-on-surface-variant" />
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="label-medium font-bold truncate">{{ layer.content || layer.type }}</span>
                            <Lock v-if="layer.locked" :size="12" class="text-error/50" />
                        </div>
                        <span class="label-small text-on-surface-variant/60 capitalize">{{ layer.type }}</span>
                    </div>

                    <!-- Visibility & Quick Lock -->
                    <div class="flex items-center">
                        <md-icon-button @click.stop="updateElement(layer.id, { hidden: !layer.hidden })" class="w-8 h-8">
                            <Eye v-if="!layer.hidden" :size="16" /><EyeOff v-else :size="16" />
                        </md-icon-button>
                        <md-icon-button @click.stop="updateElement(layer.id, { locked: !layer.locked })" class="w-8 h-8">
                            <Lock v-if="layer.locked" :size="16" class="text-error" /><Unlock v-else :size="16" />
                        </md-icon-button>
                    </div>
                </div>

                <!-- Expansion Area for Selected Layer -->
                <div v-if="selectedId === layer.id" class="bg-surface-high/50 border-t border-outline/5 p-2 flex items-center justify-between gap-1 animate-in slide-in-from-top-2">
                    <div class="flex items-center gap-1">
                        <md-icon-button @click.stop="moveElement(layer.id, 'bottom')" title="Send to Back"><ArrowDownToLine :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'down')" title="Move Backward"><ChevronDown :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'up')" title="Move Forward"><ChevronUp :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'top')" title="Bring to Front"><ArrowUpToLine :size="14" /></md-icon-button>
                    </div>
                    <div class="flex items-center gap-1">
                        <md-icon-button @click.stop="activeTab = 'properties'" title="Edit Properties"><Settings2 :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="duplicateElement(layer.id)" title="Duplicate"><Copy :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="deleteElement(layer.id)" class="text-error" title="Delete"><Trash2 :size="14" /></md-icon-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../index.css";
</style>
