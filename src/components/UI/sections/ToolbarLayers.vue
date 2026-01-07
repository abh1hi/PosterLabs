<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useElements } from '../../../composables/useElements' 
import { useCanvas } from '../../../composables/useCanvas'
import { 
    Box, Type, ImageIcon, Lock, Eye, EyeOff, Unlock, 
    ChevronDown, ChevronUp, 
    Copy, Trash2, Edit3, Target, ChevronRight
} from 'lucide-vue-next'

import '@material/web/iconbutton/icon-button.js'

const { elements, selectedIds, toggleSelection, updateElement, moveElement, duplicateElement, deleteElement, reorderElement } = useElements()
const { posterSize } = useCanvas()

const sortedLayers = computed(() => [...elements.value].reverse())
const expandedGroups = ref(new Set<string>())

const toggleGroup = (id: string) => {
    if (expandedGroups.value.has(id)) expandedGroups.value.delete(id)
    else expandedGroups.value.add(id)
}

const handleLayerClick = (e: MouseEvent, id: string) => {
    const multi = e.ctrlKey || e.metaKey || e.shiftKey
    toggleSelection(id, multi)
}

// ... existing helpers (centerElement, renaming) ...
const centerElement = (id: string) => {
    const el = elements.value.find(e => e.id === id)
    if (!el) return
    const w = el.style.width || 0
    const h = el.style.height || 0
    const newX = (posterSize.value.w - w) / 2
    const newY = (posterSize.value.h - h) / 2
    updateElement(id, { x: newX, y: newY })
}

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

const handleDragStart = (e: DragEvent, id: string) => {
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.dropEffect = 'move'
        e.dataTransfer.setData('text/plain', id)
    }
}

const handleDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer?.getData('text/plain')
    if (draggedId && draggedId !== targetId) {
        const targetIndex = elements.value.findIndex(el => el.id === targetId)
        if (targetIndex !== -1) {
             reorderElement(draggedId, targetIndex)
        }
    }
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
                class="group relative flex flex-col bg-surface-lowest border border-outline/5 rounded-2xl overflow-hidden transition-all duration-300"
                :class="{'ring-2 ring-primary border-transparent z-10': selectedIds.includes(layer.id), 'hover:border-primary/30': !selectedIds.includes(layer.id)}"
                draggable="true"
                @dragstart="handleDragStart($event, layer.id)"
                @dragover.prevent
                @drop="handleDrop($event, layer.id)"
            >
                <div class="flex items-center gap-2 p-2 cursor-pointer" @click="handleLayerClick($event, layer.id)">
                    
                    <!-- Group Expand Toggle -->
                    <button v-if="layer.type === 'group'" @click.stop="toggleGroup(layer.id)" class="p-1 hover:bg-surface-high rounded">
                         <component :is="expandedGroups.has(layer.id) ? ChevronDown : ChevronRight" :size="14" class="text-on-surface-variant"/>
                    </button>
                    <div v-else class="w-6"></div> <!-- Spacer -->

                    <!-- Thumbnail/Icon -->
                    <div class="w-8 h-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0 border border-outline/5">
                        <Type v-if="layer.type === 'text'" :size="16" class="text-on-surface-variant" />
                        <ImageIcon v-else-if="layer.type === 'image'" :size="16" class="text-on-surface-variant" />
                        <Box v-else :size="16" class="text-on-surface-variant" />
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
                            <span v-else class="label-medium font-bold truncate select-none text-sm">{{ layer.name || layer.content || layer.type }}</span>
                            <Lock v-if="layer.locked" :size="10" class="text-error/50" />
                        </div>
                    </div>

                    <!-- Visibility & Lock -->
                    <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': selectedIds.includes(layer.id)}">
                        <button @click.stop="updateElement(layer.id, { hidden: !layer.hidden })" class="p-1 hover:bg-surface-high rounded" title="Toggle Visibility">
                            <Eye v-if="!layer.hidden" :size="14" /><EyeOff v-else :size="14" />
                        </button>
                        <button @click.stop="updateElement(layer.id, { locked: !layer.locked })" class="p-1 hover:bg-surface-high rounded" title="Toggle Lock">
                            <Unlock v-if="!layer.locked" :size="14" /><Lock v-else :size="14" class="text-error" />
                        </button>
                    </div>
                </div>

                <!-- Children (Tree View) -->
                <div v-if="layer.type === 'group' && expandedGroups.has(layer.id)" class="pl-8 pr-2 pb-2 space-y-1 bg-surface-high/10 border-t border-outline/5">
                     <div v-for="child in layer.children" :key="child.id" class="flex items-center gap-2 p-1.5 rounded-lg opacity-80 hover:bg-surface-high/30">
                          <div class="w-6 h-6 rounded bg-surface-high flex items-center justify-center shrink-0"><Box :size="12"/></div>
                          <span class="text-xs truncate flex-1">{{ child.name || child.type }}</span>
                     </div>
                </div>

                <!-- Actions (Only show for single selection to avoid clutter) -->
                <div v-if="selectedIds.includes(layer.id) && selectedIds.length === 1" class="bg-surface-high/50 border-t border-outline/5 p-1.5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide">
                    <div class="flex items-center gap-1 shrink-0">
                        <button @click.stop="centerElement(layer.id)" class="p-1.5 hover:bg-surface-variant rounded" title="Center"><Target :size="14" /></button>
                        <button @click.stop="moveElement(layer.id, 'up')" class="p-1.5 hover:bg-surface-variant rounded" title="Up"><ChevronUp :size="14" /></button>
                        <button @click.stop="moveElement(layer.id, 'down')" class="p-1.5 hover:bg-surface-variant rounded" title="Down"><ChevronDown :size="14" /></button>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button @click.stop="startRenaming(layer.id, layer.name || layer.type)" class="p-1.5 hover:bg-surface-variant rounded" title="Rename"><Edit3 :size="14" /></button>
                        <button @click.stop="duplicateElement(layer.id)" class="p-1.5 hover:bg-surface-variant rounded" title="Duplicate"><Copy :size="14" /></button>
                        <button @click.stop="deleteElement(layer.id)" class="p-1.5 hover:bg-error/20 text-error rounded" title="Delete"><Trash2 :size="14" /></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../index.css";
</style>
