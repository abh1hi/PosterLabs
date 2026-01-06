<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useElements } from '../../../composables/useElements' // Verified import
import { useCanvas } from '../../../composables/useCanvas'
import { 
    Box, Type, ImageIcon, Lock, Eye, EyeOff, Unlock, 
    ArrowDownToLine, ChevronDown, ChevronUp, ArrowUpToLine, 
    Settings2, Copy, Trash2, Edit3, Target
} from 'lucide-vue-next'

import '@material/web/iconbutton/icon-button.js'

const { elements, selectedId, updateElement, moveElement, duplicateElement, deleteElement } = useElements()
const { activeTab, posterSize } = useCanvas() // posterSize needed

const sortedLayers = computed(() => [...elements.value].reverse())

// ...

const centerElement = (id: string) => {
    const el = elements.value.find(e => e.id === id)
    if (!el) return
    
    // Default width/height if not set? Text width is tricky without DOM.
    // Ideally we rely on last known width/height.
    // If width is auto (Text), centering might be slightly off if we don't know exact width.
    // But RenderElement updates style.width? No, usually Text width is undefined or auto.
    // Let's rely on standard logic: if width/height defined, use it. Else assume 0 offset?
    // Actually, for Text, formatting it to center text align and moving to center X/Y might be best?
    // For now, let's just use the bounding box logic if we had it.
    // Since we don't have a robust "measure" function here without DOM access...
    // We can just set X/Y to center and let the user adjust? 
    // OR we center based on poster center:
    
    const w = el.style.width || 0
    const h = el.style.height || 0
    
    const newX = (posterSize.value.w - w) / 2
    const newY = (posterSize.value.h - h) / 2
    
    updateElement(id, { x: newX, y: newY })
}




// Renaming Logic
const editingId = ref<string | null>(null)
const editName = ref('')

const startRenaming = (id: string, currentName: string) => {
    editingId.value = id
    editName.value = currentName
    nextTick(() => {
        const input = document.getElementById(`rename-input-${id}`) as HTMLInputElement
        if (input) {
            input.focus()
            input.select()
        }
    })
}

const saveName = (id: string) => {
    if (editName.value.trim()) {
        updateElement(id, { name: editName.value.trim() })
    }
    editingId.value = null
}
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
                    <div class="flex-1 min-w-0" @dblclick.stop="startRenaming(layer.id, layer.name || layer.type)">
                        <div class="flex items-center gap-2">
                             <input 
                                v-if="editingId === layer.id"
                                :id="`rename-input-${layer.id}`"
                                v-model="editName"
                                @blur="saveName(layer.id)"
                                @keydown.enter="saveName(layer.id)"
                                @click.stop
                                class="bg-surface-variant text-on-surface px-1 py-0.5 rounded w-full text-xs font-bold outline-none border border-primary"
                            />
                            <span v-else class="label-medium font-bold truncate select-none">{{ layer.name || layer.content || layer.type }}</span>
                            
                            <Lock v-if="layer.locked" :size="12" class="text-error/50" />
                        </div>
                        <span v-if="editingId !== layer.id" class="label-small text-on-surface-variant/60 capitalize">{{ layer.type }}</span>
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
                <div v-if="selectedId === layer.id" class="bg-surface-high/50 border-t border-outline/5 p-2 flex items-center justify-between gap-1 animate-in slide-in-from-top-2 overflow-x-auto scrollbar-hide">
                    <div class="flex items-center gap-1 shrink-0">
                        <md-icon-button @click.stop="centerElement(layer.id)" title="Result in Canvas (Center)"><Target :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'bottom')" title="Send to Back"><ArrowDownToLine :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'down')" title="Move Backward"><ChevronDown :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'up')" title="Move Forward"><ChevronUp :size="14" /></md-icon-button>
                        <md-icon-button @click.stop="moveElement(layer.id, 'top')" title="Bring to Front"><ArrowUpToLine :size="14" /></md-icon-button>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <md-icon-button @click.stop="startRenaming(layer.id, layer.name || layer.type)" title="Rename Layer"><Edit3 :size="14" /></md-icon-button>
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
