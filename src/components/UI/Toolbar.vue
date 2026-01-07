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
import ToolbarTemplates from './sections/ToolbarTemplates.vue'
import ToolbarThemes from './sections/ToolbarThemes.vue'
import ToolbarThemeDesigner from './sections/ToolbarThemeDesigner.vue'
import ToolbarAssets from './sections/ToolbarAssets.vue'
import ToolbarDraw from './sections/ToolbarDraw.vue'
import ToolbarResize from './sections/ToolbarResize.vue'
import ProfilePanel from './ProfilePanel.vue'

const { isToolbarOpen, activeTab, activeTool } = useCanvas()
const { selectedId, shuffleElements, duplicateElement, deleteElement } = useElements()

import { ref, computed } from 'vue'

const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const TABS = [
    { id: 'projects', label: 'Projects', icon: 'Folder' },
    { id: 'design', label: 'Design', icon: 'LayoutDashboard' },
    { id: 'elements', label: 'Elements', icon: 'Box' },
    { id: 'draw', label: 'Draw', icon: 'PenTool' },
    { id: 'resize', label: 'Resize', icon: 'Move' },
    { id: 'text', label: 'Text', icon: 'Type' },
    { id: 'templates', label: 'Templates', icon: 'LayoutTemplate' },
    { id: 'themes', label: 'Themes', icon: 'Palette' },
    { id: 'assets', label: 'Assets', icon: 'Image' },
    { id: 'layers', label: 'Layers', icon: 'Layers' },
    { id: 'code', label: 'Code', icon: 'Code2' },
    { id: 'profile', label: 'Profile', icon: 'User' },
]

const filteredTabs = computed(() => {
    if (!searchQuery.value) return []
    const q = searchQuery.value.toLowerCase()
    return TABS.filter(t => t.label.toLowerCase().includes(q) || t.id.includes(q))
})

const handleTabSelect = (tabId: string) => {
    activeTab.value = tabId
    searchQuery.value = ''
    // blur the input
    if (searchInputRef.value) searchInputRef.value.blur()
}

</script>

<template>
  <aside 
    class="bg-surface border-r border-outline/10 flex flex-col theme-transition shrink-0 overflow-hidden"
    :class="[
      isToolbarOpen ? 'h-[75vh] md:h-full md:w-80' : 'h-0 md:h-full md:w-0 md:border-r-0',
      'fixed bottom-0 inset-x-0 rounded-t-[24px] md:rounded-none md:relative md:inset-auto transition-all duration-300 transform shadow-2xl md:shadow-none z-[60] md:z-20',
      isToolbarOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-x-full md:translate-y-0'
    ]"
  >
    <!-- Mobile Drag Handle -->
    <div class="md:hidden w-full flex justify-center p-3 shrink-0 cursor-grab active:cursor-grabbing" @click="isToolbarOpen = false">
        <div class="w-10 h-1 bg-outline/20 rounded-full"></div>
    </div>

    <!-- Header Area -->
    <div class="h-14 flex items-center justify-between px-4 shrink-0 bg-surface border-b border-outline/10">
        <h2 class="text-sm font-bold text-on-surface capitalize tracking-wide">{{ activeTab }}</h2>
        <button @click="isToolbarOpen = false" class="md:hidden p-2 rounded-full hover:bg-surface-variant/20 text-on-surface-variant transition-colors">
            <X :size="18" />
        </button>
    </div>
    
    <!-- Secondary Search/Header -->
    <div class="p-3 border-b border-outline/5 min-h-[56px] flex items-center shrink-0 bg-surface">
        <!-- Generic Search Bar -->
        <div v-if="!['properties', 'layers', 'profile'].includes(activeTab)" class="relative w-full group">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" />
            <input 
                ref="searchInputRef"
                type="text" 
                v-model="searchQuery"
                placeholder="Search tools or tabs..." 
                class="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-variant/30 border border-transparent focus:bg-surface focus:border-primary/20 text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all"
            >
            <!-- Search Results Dropdown -->
            <div v-if="searchQuery && filteredTabs.length > 0" class="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div class="px-2 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-variant/10">Navigate To</div>
                <button v-for="tab in filteredTabs" :key="tab.id" @click="handleTabSelect(tab.id)" class="w-full text-left px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-variant/30 flex items-center justify-between group transition-colors">
                    <span>{{ tab.label }}</span>
                    <span class="text-[10px] text-on-surface-variant/50 group-hover:text-primary transition-colors">Open</span>
                </button>
            </div>
             <div v-else-if="searchQuery" class="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline/10 rounded-lg shadow-xl z-50 p-3 text-center">
                <p class="text-[10px] text-on-surface-variant">No results found for "{{ searchQuery }}"</p>
            </div>
        </div>

        <!-- Layers Header -->
        <div v-else-if="activeTab === 'layers'" class="flex items-center justify-between w-full px-1">
            <span class="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Map Structure</span>
            <button @click="shuffleElements" class="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" title="Shuffle Layers">
                <Shuffle :size="16" />
            </button>
        </div>

        <!-- Properties Header Actions -->
        <div v-else class="flex items-center justify-between w-full px-1">
            <div v-if="activeTab === 'properties' && selectedId" class="flex items-center gap-1 ml-auto">
                <button @click="duplicateElement(selectedId!)" class="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" title="Duplicate">
                    <Copy :size="16" />
                </button>
                <button @click="deleteElement(selectedId!)" class="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-error transition-colors" title="Delete">
                    <Trash2 :size="16" />
                </button>
            </div>
            <div v-else-if="activeTab === 'properties'" class="w-full text-center text-xs font-medium text-on-surface-variant/50 py-1">
                Global Canvas Settings
            </div>
        </div>
    </div>

    <!-- Tab Contents Container -->
    <div class="flex-1 overflow-y-auto custom-scrollbar touch-pan-y relative bg-surface-lowest/30">
        
        <ToolbarProjects v-if="activeTab === 'projects'" />
        <ToolbarDesign v-if="activeTab === 'design'" />
        <ToolbarElements v-if="activeTab === 'elements'" />
        <ToolbarText v-if="activeTab === 'text'" />
        <ToolbarProperties v-if="activeTab === 'properties'" />
        <ToolbarTemplates v-if="activeTab === 'templates'" />
        <ToolbarThemes v-if="activeTab === 'themes'" />
        <ToolbarThemeDesigner v-if="activeTab === 'theme-designer'" />
        <ToolbarLayers v-if="activeTab === 'layers'" />
        <ToolbarDraw v-if="activeTab === 'draw'" />
        <ToolbarAssets v-if="activeTab === 'assets'" />
        <ToolbarResize v-if="activeTab === 'resize'" />
        <ToolbarCode v-if="activeTab === 'code'" />
        
        <div v-if="activeTab === 'profile'" class="h-full">
            <ProfilePanel />
        </div>

    </div>

    <!-- Quick Tools at bottom of Toolbar (Enhanced for Mobile) -->
    <div class="p-3 bg-surface border-t border-outline/10 flex items-center justify-around shrink-0 md:mb-0 mb-4">
        <button 
            @click="activeTool = 'select'" 
            class="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all"
            :class="activeTool === 'select' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-variant/30'"
        >
            <MousePointer2 :size="18" />
            <span class="text-[10px] font-bold">Select</span>
        </button>
        
        <button 
            @click="activeTool = 'hand'" 
            class="flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all"
            :class="activeTool === 'hand' ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-variant/30'"
        >
            <Hand :size="18" />
            <span class="text-[10px] font-bold">Pan</span>
        </button>

        <button class="flex flex-col items-center gap-0.5 p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/30 transition-all opacity-50 cursor-not-allowed">
            <History :size="18" />
            <span class="text-[10px] font-bold">History</span>
        </button>

        <button @click="isToolbarOpen = false" class="md:hidden flex flex-col items-center gap-0.5 p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/30">
            <ChevronDown :size="18" />
            <span class="text-[10px] font-bold">Close</span>
        </button>
    </div>

  </aside>
</template>

<style scoped>
@reference "../../index.css";

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--md-sys-color-surface-variant); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--md-sys-color-primary); }
</style>
