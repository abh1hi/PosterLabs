<script setup lang="ts">
import { useCanvas } from '../../composables/useCanvas'
import { useElements } from '../../composables/useElements'
import { 
  X, Search, Shuffle, Copy, Trash2, MousePointer2, Hand, History, ChevronDown
} from 'lucide-vue-next'

// Sub-components
import ToolbarProjects from './sections/ToolbarProjects.vue'
import ToolbarDesign from './sections/ToolbarDesign.vue'
import ToolbarElements from './sections/ToolbarElements.vue'
import ToolbarText from './sections/ToolbarText.vue'
import ToolbarProperties from './sections/ToolbarProperties.vue'
import ToolbarCode from './sections/ToolbarCode.vue'
import ToolbarLayers from './sections/ToolbarLayers.vue'
import ProfilePanel from './ProfilePanel.vue'

import '@material/web/textfield/filled-text-field.js'
import '@material/web/iconbutton/icon-button.js'

const { isToolbarOpen, activeTab, activeTool } = useCanvas()
const { selectedId, shuffleElements, duplicateElement, deleteElement } = useElements()

</script>

<template>
  <aside 
    class="bg-surface-low border-r border-outline/10 flex flex-col theme-transition shrink-0 overflow-hidden"
    :class="[
      isToolbarOpen ? 'h-[75vh] md:h-full md:w-80' : 'h-0 md:h-full md:w-0 md:border-r-0',
      'fixed bottom-0 inset-x-0 rounded-t-[32px] md:rounded-none md:relative md:inset-auto transition-all duration-300 transform shadow-2xl md:shadow-none z-[60] md:z-20',
      isToolbarOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-full md:translate-y-0'
    ]"
  >
    <!-- Mobile Drag Handle -->
    <div class="md:hidden w-full flex justify-center p-2 shrink-0" @click="isToolbarOpen = false">
        <div class="w-12 h-1.5 bg-outline/20 rounded-full"></div>
    </div>

    <!-- Header Area -->
    <div class="h-16 flex items-center justify-between px-4 shrink-0 border-b border-outline/5 bg-surface-low">
        <h2 class="title-medium text-on-surface font-semibold capitalize">{{ activeTab }}</h2>
        <md-icon-button @click="isToolbarOpen = false" class="md:hidden">
            <X :size="20" />
        </md-icon-button>
    </div>
    
    <!-- Secondary Search/Header -->
    <div class="p-4 border-b border-outline/10 h-16 flex items-center shrink-0">
        <md-filled-text-field v-if="!['properties', 'layers', 'profile'].includes(activeTab)" class="w-full h-10 rounded-full" placeholder="Search..." type="search">
            <Search slot="leading-icon" :size="18" />
        </md-filled-text-field>
        <div v-else-if="activeTab === 'layers'" class="flex items-center justify-between w-full">
            <h2 class="title-small uppercase tracking-widest text-primary">Map Layers</h2>
            <div class="flex items-center gap-1">
                <md-icon-button @click="shuffleElements" title="Shuffle Layers"><Shuffle :size="16" /></md-icon-button>
            </div>
        </div>
        <div v-else class="flex items-center justify-between w-full">
            <div v-if="activeTab === 'properties' && selectedId" class="flex items-center gap-1 ml-auto">
                <md-icon-button @click="duplicateElement(selectedId!)"><Copy :size="16" /></md-icon-button>
                <md-icon-button @click="deleteElement(selectedId!)"><Trash2 :size="16" /></md-icon-button>
            </div>
            <div v-else-if="activeTab === 'properties'" class="w-full text-center opacity-50 text-xs">
                Canvas Settings
            </div>
        </div>
    </div>

    <!-- Tab Contents Container -->
    <div class="flex-1 overflow-y-auto custom-scrollbar touch-pan-y relative bg-surface-lowest">
        
        <ToolbarProjects v-if="activeTab === 'projects'" />
        <ToolbarDesign v-if="activeTab === 'design'" />
        <ToolbarElements v-if="activeTab === 'elements'" />
        <ToolbarText v-if="activeTab === 'text'" />
        <ToolbarProperties v-if="activeTab === 'properties'" />
        <ToolbarLayers v-if="activeTab === 'layers'" />
        <ToolbarCode v-if="activeTab === 'code'" />
        
        <div v-if="activeTab === 'profile'" class="h-full">
            <ProfilePanel />
        </div>

    </div>

    <!-- Quick Tools at bottom of Toolbar (Enhanced for Mobile) -->
    <div class="p-4 bg-surface-high flex items-center justify-around shrink-0 border-t border-outline/10 md:pb-4 pb-10">
        <md-icon-button @click="activeTool = 'select'" :selected="activeTool === 'select'"><MousePointer2 :size="20" /></md-icon-button>
        <md-icon-button @click="activeTool = 'hand'" :selected="activeTool === 'hand'"><Hand :size="20" /></md-icon-button>
        <md-icon-button><History :size="20" /></md-icon-button>
        <md-icon-button @click="isToolbarOpen = false" class="md:hidden"><ChevronDown :size="20" /></md-icon-button>
    </div>

  </aside>
</template>

<style scoped>
@reference "../../index.css";

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--md-sys-color-surface-variant); border-radius: 10px; }
</style>
