<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useCanvas } from '../composables/useCanvas'
import { useElements } from '../composables/useElements'
import { useToasts } from '../composables/useToasts'
import { useKeyboard } from '../composables/useKeyboard'
import Toolbar from '../components/UI/Toolbar.vue'
import CanvasArea from '../components/Editor/CanvasArea.vue'

import { 
  LayoutDashboard, Box, Type, Share2, Palette, Image, Zap, FileText, Save,
  Menu, Settings, LogOut, LayoutTemplate,
  Undo2, Redo2, Layers, Download, Cloud, CloudOff, Folder, Code2, User, ArrowLeft,
  PenTool, Move, Search, Command
} from 'lucide-vue-next'


import { Haptics, ImpactStyle } from '@capacitor/haptics'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { isToolbarOpen, posterSize, bgColor, activeTab } = useCanvas()
import { useRoute } from 'vue-router'
const route = useRoute()

onMounted(() => {
    if (route.query.tab && typeof route.query.tab === 'string') {
        activeTab.value = route.query.tab
        isToolbarOpen.value = true
    }
})
const { undo, redo, canUndo, canRedo, elements, selectedId } = useElements()
const { showToast } = useToasts()
import { useNetworkStatus } from '../composables/useNetworkStatus'
import { exportProject, importProject, exportProjectAsJson } from '../utils/projectFile'
import { exportCanvas } from '../utils/exportManager'

// Initialize Keyboard Shortcuts
useKeyboard()

// Auto-switch to properties on selection
const previousTab = ref('design')
import { watch } from 'vue'
watch(selectedId, (newId) => {
    if (newId) {
        if (activeTab.value !== 'properties') {
            previousTab.value = activeTab.value
            activeTab.value = 'properties'
            isToolbarOpen.value = true
        }
    } else {
        if (activeTab.value === 'properties') {
             activeTab.value = previousTab.value
        }
    }
})

const isExportMenuOpen = ref(false)

const handleBackToHome = () => {
    router.push('/')
}

const handleExport = () => {
    const success = exportProject(elements.value, { w: posterSize.value.w, h: posterSize.value.h, bg: bgColor.value })
    if (success) showToast('Project saved as .posterLabs', 'success')
    else showToast('Failed to save project', 'error')
}

const handleJsonExport = () => {
    const success = exportProjectAsJson(elements.value, { w: posterSize.value.w, h: posterSize.value.h, bg: bgColor.value })
    if (success) showToast('Project exported as JSON', 'success')
    else showToast('Failed to export JSON', 'error')
}

const handleImageExport = async (format: 'png' | 'jpeg' | 'pdf' | 'webp') => {
  isExportMenuOpen.value = false
  showToast(`Generating ${format.toUpperCase()}...`, 'info')
  try {
    await exportCanvas('poster-content', format, `poster-${Date.now()}`)
    showToast('Export complete', 'success')
  } catch (e) {
    showToast('Export failed', 'error')
    console.error(e)
  }
}

const isUserMenuOpen = ref(false)
const projectInputRef = ref<HTMLInputElement | null>(null)

const handleImportFile = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
        showToast('Loading project...', 'info')
        try {
            const project = await importProject(file)
            elements.value = project.elements
            posterSize.value = { w: project.canvas.width, h: project.canvas.height }
            bgColor.value = project.canvas.background
            showToast('Project loaded successfully', 'success')
            // Reset input
            target.value = ''
        } catch (err: any) {
            showToast(err.message || 'Failed to load project', 'error')
        }
    }
}
// activeTab is now from useCanvas
const { status: networkStatus } = useNetworkStatus()

// PWA Install Logic
const deferredPrompt = ref<any>(null)
const showInstallButton = ref(false)

const isStandalone = window.matchMedia('(display-mode: standalone)').matches
if (isStandalone) {
    showInstallButton.value = false
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  showInstallButton.value = true
})

const installApp = async () => {
  if (!deferredPrompt.value) {
      // Fallback or info
      return
  }
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    deferredPrompt.value = null
    showInstallButton.value = false
  }
}

const handleAppLogout = async () => {
    await logout()
}

const triggerHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (e) {
    // Ignore if not on native
  }
}

const handleTabChange = (tab: string) => {
  if (activeTab.value === tab && isToolbarOpen.value) {
      isToolbarOpen.value = false
  } else {
      activeTab.value = tab
      isToolbarOpen.value = true
  }
  triggerHaptic()
}

const toggleProperties = () => {
    activeTab.value = 'properties'
    isToolbarOpen.value = true
    triggerHaptic()
}

// --- Search / Command Palette Logic ---
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const searchableItems = [
    // Tabs
    { type: 'tab', id: 'design', label: 'Design', icon: LayoutDashboard, keywords: 'layout canvas size' },
    { type: 'tab', id: 'text', label: 'Text', icon: Type, keywords: 'font typography add text' },
    { type: 'tab', id: 'layers', label: 'Layers', icon: Layers, keywords: 'arrange z-index stack' },
    { type: 'tab', id: 'elements', label: 'Elements', icon: Box, keywords: 'shapes rectangle circle' },
    { type: 'tab', id: 'assets', label: 'Assets', icon: Image, keywords: 'photos upload images' },
    { type: 'tab', id: 'draw', label: 'Draw', icon: PenTool, keywords: 'paint sketch pencil' },
    { type: 'tab', id: 'themes', label: 'Themes', icon: Palette, keywords: 'colors styles preset' },
    { type: 'tab', id: 'templates', label: 'Templates', icon: LayoutTemplate, keywords: 'pre-made starter' },
    { type: 'tab', id: 'resize', label: 'Resize', icon: Move, keywords: 'dimension scale' },
    { type: 'tab', id: 'code', label: 'Code', icon: Code2, keywords: 'json developer export' },
    { type: 'tab', id: 'properties', label: 'Properties', icon: Settings, keywords: 'settings config' },
    // Actions
    { type: 'action', id: 'export', label: 'Export Design', icon: Download, keywords: 'save download png jpeg pdf', action: () => isExportMenuOpen.value = true },
    { type: 'action', id: 'undo', label: 'Undo', icon: Undo2, keywords: 'back revert', action: undo },
    { type: 'action', id: 'redo', label: 'Redo', icon: Redo2, keywords: 'forward reapply', action: redo },
    { type: 'action', id: 'home', label: 'Back to Home', icon: ArrowLeft, keywords: 'dashboard main', action: handleBackToHome },
]

import { computed, nextTick } from 'vue'

const filteredSearchResults = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return searchableItems.slice(0, 5) // Show top 5 by default
    return searchableItems.filter(item => 
        item.label.toLowerCase().includes(query) || 
        item.keywords.includes(query)
    )
})

const openSearch = () => {
    isSearchOpen.value = true
    nextTick(() => {
        searchInputRef.value?.focus()
    })
}

const handleSearchResultClick = (item: any) => {
    if (item.type === 'tab') {
        handleTabChange(item.id)
    } else if (item.item?.action) { // Direct action mapping if structure was different, but here:
        // Handled below in template or direct call
    }
    
    if (item.action) {
        item.action()
    }

    isSearchOpen.value = false
    searchQuery.value = ''
    triggerHaptic()
}

// Keyboard Shortcut for Search (Ctrl+K)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
    }
    if (e.key === 'Escape' && isSearchOpen.value) {
        isSearchOpen.value = false
    }
})

onMounted(() => {
    // Sync logic removed
})
</script>

<template>
    <div class="flex h-screen bg-background theme-transition overflow-hidden">
      
      <!-- [Desktop] Navigation Rail -->
      <nav class="hidden md:flex flex-col w-[72px] bg-surface border-r border-outline/10 z-50 py-3 shrink-0 items-center h-full">
         <div class="flex flex-col items-center gap-3 w-full flex-1 overflow-hidden">
            <!-- Home/Logo Link -->
            <button @click="handleBackToHome" class="w-10 h-10 bg-surface rounded-xl flex items-center justify-center mb-2 shadow-sm border border-outline/10 group cursor-pointer hover:border-primary/20 transition-all hover:scale-105 active:scale-95 shrink-0" title="Back to Home">
               <img src="/pwa-192x192.png" alt="PosterLab" class="w-8 h-8 object-cover rounded-lg">
            </button>
            
            <!-- Rail Buttons -->
            <div class="flex flex-col gap-1 w-full px-1.5 overflow-y-auto no-scrollbar items-center">
               <button @click="handleTabChange('design')" class="rail-btn" :class="{ active: activeTab === 'design' }">
                  <LayoutDashboard :size="20" stroke-width="1.5" />
                  <span class="rail-label">Design</span>
               </button>
               <button @click="handleTabChange('projects')" class="rail-btn" :class="{ active: activeTab === 'projects' }">
                  <Folder :size="20" stroke-width="1.5" />
                  <span class="rail-label">Projects</span>
               </button>
               <button @click="handleTabChange('templates')" class="rail-btn" :class="{ active: activeTab === 'templates' }">
                  <LayoutTemplate :size="20" stroke-width="1.5" />
                  <span class="rail-label">Templates</span>
               </button>
               <button @click="handleTabChange('themes')" class="rail-btn" :class="{ active: activeTab === 'themes' }">
                  <Palette :size="20" stroke-width="1.5" />
                  <span class="rail-label">Themes</span>
               </button>
               <button @click="handleTabChange('assets')" class="rail-btn" :class="{ active: activeTab === 'assets' }">
                  <Image :size="20" stroke-width="1.5" />
                  <span class="rail-label">Assets</span>
               </button>
               <button @click="handleTabChange('elements')" class="rail-btn" :class="{ active: activeTab === 'elements' }">
                  <Box :size="20" stroke-width="1.5" />
                  <span class="rail-label">Elements</span>
               </button>
               <button @click="handleTabChange('draw')" class="rail-btn" :class="{ active: activeTab === 'draw' }">
                  <PenTool :size="20" stroke-width="1.5" />
                  <span class="rail-label">Draw</span>
               </button>
               <button @click="handleTabChange('resize')" class="rail-btn" :class="{ active: activeTab === 'resize' }">
                  <Move :size="20" stroke-width="1.5" />
                  <span class="rail-label">Resize</span>
               </button>
               <button @click="handleTabChange('text')" class="rail-btn" :class="{ active: activeTab === 'text' }">
                  <Type :size="20" stroke-width="1.5" />
                  <span class="rail-label">Text</span>
               </button>
                <button @click="handleTabChange('layers')" class="rail-btn" :class="{ active: activeTab === 'layers' }">
                   <Layers :size="20" stroke-width="1.5" />
                   <span class="rail-label">Layers</span>
                </button>
                <button @click="handleTabChange('properties')" class="rail-btn" :class="{ active: activeTab === 'properties' }">
                   <Settings :size="20" stroke-width="1.5" />
                   <span class="rail-label">Props</span>
                </button>
                <button @click="handleTabChange('code')" class="rail-btn" :class="{ active: activeTab === 'code' }">
                   <Code2 :size="20" stroke-width="1.5" />
                   <span class="rail-label">Code</span>
                </button>
            </div>
         </div>

         <!-- Bottom Actions -->
         <div class="flex flex-col items-center gap-2 mt-2 w-full px-1.5 pt-3 border-t border-outline/10 bg-surface">
            <button @click="handleTabChange('profile')" id="user-menu-rail" class="w-10 h-10 rounded-full overflow-hidden border border-transparent hover:border-outline/20 transition-all active:scale-95" :class="activeTab === 'profile' ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''">
               <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" class="w-full h-full object-cover" />
               <div v-else class="w-full h-full bg-surface-high flex items-center justify-center text-on-surface-variant"><User :size="20" /></div>
            </button>
         </div>

      </nav>

      <!-- Main Editor Container -->
      <div class="flex flex-col flex-1 relative overflow-hidden">
        
        <!-- Premium Top App Bar (Google UI + Canvas Inspired) -->
        <header class="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface/60 backdrop-blur-xl border-b border-outline/10 z-30 shrink-0 sticky top-0 transition-all duration-500 shadow-sm shadow-black/5">
           <!-- Left: Brand & Poster Info -->
           <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
              <button class="md:hidden p-2 rounded-full hover:bg-surface-variant/20 transition-colors text-on-surface-variant flex-shrink-0" @click="toggleProperties">
                 <Menu :size="20" />
              </button>
              
              <div class="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                 <!-- Logo Container / Home Button -->
                 <div @click="handleBackToHome" class="hidden sm:flex group relative w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-surface-container rounded-2xl items-center justify-center shrink-0 border border-outline/10 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 transform active:scale-95" title="Back to Home">
                    <div class="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <ArrowLeft class="text-primary hidden group-hover:block relative z-10" :size="20" />
                    <img src="/pwa-192x192.png" alt="PosterLab" class="w-8 h-8 sm:w-9 sm:h-9 object-contain opacity-95 group-hover:hidden relative z-10">
                 </div>

                 <!-- Poster Title & Status -->
                 <div class="flex flex-col min-w-0 flex-1">
                    <div class="flex items-center gap-2 group cursor-pointer max-w-full">
                       <h1 class="title-medium sm:headline-small font-bold text-on-surface truncate min-w-0 tracking-tight" title="My Creative Poster">
                          My Creative Poster
                       </h1>
                       <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 hidden sm:block">
                          <button class="p-1.5 hover:bg-surface-variant/30 rounded-lg text-on-surface-variant/60 hover:text-primary transition-colors">
                             <PenTool :size="14" />
                          </button>
                       </div>
                    </div>

                    <!-- Status indicators (Modern Doc Style) - Minimal Mobile -->
                    <div class="flex items-center gap-2 px-0.5">
                       <div v-if="!networkStatus.connected" class="flex items-center gap-1.5 text-error/90 label-small font-medium bg-error/5 px-2 py-0.5 rounded-full border border-error/10">
                           <CloudOff :size="12" />
                           <span class="hidden sm:inline">Offline Mode</span>
                       </div>
                       <div v-else class="flex items-center gap-1.5 text-primary/70 label-small font-medium bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                           <Cloud :size="12" />
                           <span class="hidden sm:inline">Successively Saved</span>
                       </div>
                       <div class="hidden sm:block w-1 h-1 rounded-full bg-outline/20"></div>
                       <span class="hidden sm:inline label-small text-on-surface-variant/60 font-medium tracking-wide uppercase text-[10px]">Version 1.2</span>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Center: Quick Tools (Hidden on Mobile, replaced by Action Hub) -->
           <div class="hidden sm:flex items-center bg-surface-container-high/40 rounded-2xl px-1 sm:px-2 py-1 gap-0.5 sm:gap-1 border border-outline/10 backdrop-blur-md">
              <button @click="undo" :disabled="!canUndo" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-surface-variant/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-on-surface">
                 <Undo2 :size="18" />
              </button>
              <div class="w-px h-6 bg-outline/10 mx-0.5 sm:mx-1"></div>
              <button @click="redo" :disabled="!canRedo" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-surface-variant/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-on-surface">
                 <Redo2 :size="18" />
              </button>
           </div>

           <!-- Right: Actions & History & Search -->
           <div class="flex items-center gap-1 sm:gap-4 shrink-0">
              <!-- Search Button (Mobile & Desktop) -->
                <button @click="openSearch" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 text-on-surface-variant transition-colors">
                    <Search :size="20" />
                </button>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <input type="file" ref="projectInputRef" hidden accept=".posterLabs,.json" @change="handleImportFile" />
                
                <button @click="projectInputRef?.click()" title="Open Project" class="hidden sm:flex w-10 h-10 items-center justify-center bg-surface-container-high border border-outline/10 rounded-xl hover:bg-surface-container-highest transition-colors text-on-surface-variant">
                    <Folder :size="20" />
                </button>

                <div class="h-8 w-px bg-outline/10 mx-1 hidden sm:block"></div>
                
                <!-- Undo/Redo Mobile (Compact) -->
                <button @click="undo" :disabled="!canUndo" class="sm:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors disabled:opacity-30 text-on-surface-variant">
                    <Undo2 :size="18" />
                </button>
                <button @click="redo" :disabled="!canRedo" class="sm:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors disabled:opacity-30 text-on-surface-variant">
                    <Redo2 :size="18" />
                </button>

                <button class="hidden lg:flex h-10 sm:h-11 px-3 sm:px-5 items-center gap-2 rounded-xl bg-secondary-container text-on-secondary-container transition-all hover:shadow-md active:scale-95 font-medium tracking-wide border border-transparent hover:brightness-105">
                   <Share2 :size="18" />
                   <span class="hidden sm:inline">Collaboration</span>
                </button>

                 <div class="relative group">
                    <button 
                        @click="isExportMenuOpen = !isExportMenuOpen" 
                        class="h-9 sm:h-11 px-3 sm:px-6 flex items-center gap-2 rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold tracking-wide transform active:scale-95 hover:-translate-y-0.5"
                    >
                       <Download :size="18" />
                       <span class="hidden sm:inline">Export</span>
                    </button>
                    
                    <!-- Custom Dropdown Menu -->
                    <div v-if="isExportMenuOpen" class="absolute right-0 top-full mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-outline/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                       <div class="px-4 py-3 bg-surface-variant/10 border-b border-outline/5 flex items-center justify-between">
                            <span class="label-small text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Project Formats</span>
                            <button @click="isExportMenuOpen = false" class="text-on-surface-variant hover:text-error"><Settings :size="14" /></button>
                       </div>
                       
                       <button @click="handleExport" class="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                             <Save :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">Source File (.poster)</div>
                              <div class="text-[11px] text-on-surface-variant">Best for future editing</div>
                          </div>
                       </button>

                       <button @click="handleJsonExport" class="w-full text-left px-4 py-3 hover:bg-secondary/5 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                             <Code2 :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">JSON Schema</div>
                              <div class="text-[11px] text-on-surface-variant">Raw project data</div>
                          </div>
                       </button>
                       
                       <div class="h-px bg-outline/10 my-1 mx-2"></div>
                       
                       <div class="px-4 py-2 bg-surface-variant/10 border-y border-outline/5">
                          <span class="label-small text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Ready to Share</span>
                       </div>
                       
                       <button @click="handleImageExport('png')" class="w-full text-left px-4 py-3 hover:bg-surface-variant/10 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-surface-highest flex items-center justify-center text-on-surface-variant group-hover:scale-110 transition-transform">
                             <Image :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">High Quality PNG</div>
                              <div class="text-[11px] text-on-surface-variant">Best for web & social</div>
                          </div>
                       </button>
                       
                       <button @click="handleImageExport('jpeg')" class="w-full text-left px-4 py-3 hover:bg-surface-variant/10 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-surface-highest flex items-center justify-center text-on-surface-variant group-hover:scale-110 transition-transform">
                             <Image :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">Optimized JPEG</div>
                              <div class="text-[11px] text-on-surface-variant">Smaller file size</div>
                          </div>
                       </button>
                       
                       <button @click="handleImageExport('webp')" class="w-full text-left px-4 py-3 hover:bg-surface-variant/10 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                             <Zap :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">Modern WebP</div>
                              <div class="text-[11px] text-on-surface-variant">Fastest loading format</div>
                          </div>
                       </button>
                       
                       <div class="h-px bg-outline/10 my-1 mx-2"></div>
                       
                       <button @click="handleImageExport('pdf')" class="w-full text-left px-4 py-3 hover:bg-error/5 transition-colors flex items-center gap-3 group">
                          <div class="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                             <FileText :size="18" />
                          </div>
                          <div>
                              <div class="font-bold text-on-surface label-large">PDF Document</div>
                              <div class="text-[11px] text-on-surface-variant">Professional printing</div>
                          </div>
                       </button>
                    </div>
                    
                    <!-- Backdrop for menu -->
                    <div v-if="isExportMenuOpen" @click="isExportMenuOpen = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
                 </div>
              </div>

              <!-- Profile Avatar (Integrated) -->
              <div class="pl-1 sm:pl-2 border-l border-outline/10 ml-1 relative hidden sm:block">
                 <button id="header-user-menu-anchor" @click="isUserMenuOpen = !isUserMenuOpen" class="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 overflow-hidden ring-2 ring-outline/10 hover:ring-primary/40 transition-all duration-300 transform active:scale-95 shadow-sm">
                    <div class="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                        <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" class="w-full h-full object-cover" />
                        <User v-else :size="22" class="text-on-surface-variant" />
                    </div>
                 </button>
                 
                 <!-- User Menu -->
                 <div v-if="isUserMenuOpen" class="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-outline/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div class="p-2">
                        <button @click="handleTabChange('profile'); isUserMenuOpen = false" class="w-full text-left px-3 py-2 rounded-xl hover:bg-surface-variant/20 transition-colors flex items-center gap-3">
                           <User :size="18" class="text-on-surface-variant" />
                           <span class="font-medium text-on-surface">Account Settings</span>
                        </button>
                        <button @click="handleAppLogout" class="w-full text-left px-3 py-2 rounded-xl hover:bg-error/10 transition-colors flex items-center gap-3 text-error">
                           <LogOut :size="18" />
                           <span class="font-medium">Logout Session</span>
                        </button>
                        <button v-if="showInstallButton" @click="installApp" class="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors flex items-center gap-3 text-primary mt-2 border-t border-outline/10 pt-2">
                           <Download :size="18" />
                           <span class="font-medium">Install App</span>
                        </button>
                    </div>
                 </div>
                 
                 <div v-if="isUserMenuOpen" @click="isUserMenuOpen = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
              </div>
           </div>
        </header>

        <!-- Search / Command Palette Modal -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div v-if="isSearchOpen" class="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="isSearchOpen = false"></div>

                <!-- Command Palette -->
                <div class="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden border border-outline/10 flex flex-col max-h-[60vh]">
                    <!-- Search Input -->
                    <div class="flex items-center gap-3 px-4 py-3 border-b border-outline/5">
                        <Search :size="20" class="text-on-surface-variant" />
                        <input 
                            ref="searchInputRef"
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="Type a command or search..." 
                            class="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/50 h-6 text-lg"
                        />
                        <button class="text-xs bg-surface-variant/20 text-on-surface-variant px-1.5 py-0.5 rounded border border-outline/10">ESC</button>
                    </div>

                    <!-- Results -->
                    <div class="overflow-y-auto p-2 flex flex-col gap-1">
                        <template v-if="filteredSearchResults.length > 0">
                            <button 
                                v-for="item in filteredSearchResults" 
                                :key="item.id"
                                @click="handleSearchResultClick(item)"
                                class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors group text-left"
                            >
                                <div class="w-8 h-8 rounded-lg bg-surface-variant/10 text-on-surface-variant flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <component :is="item.icon" :size="18" />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-on-surface group-hover:text-primary">{{ item.label }}</span>
                                    <span class="text-[10px] text-on-surface-variant uppercase tracking-wider opacity-60">{{ item.type }}</span>
                                </div>
                                <div v-if="item.keywords.includes('Ctrl+')" class="ml-auto text-xs text-on-surface-variant/50">{{ item.keywords.match(/Ctrl\+\w/) }}</div>
                            </button>
                        </template>
                        <div v-else class="py-8 text-center text-on-surface-variant/50">
                            <div class="flex justify-center mb-2"><Command :size="32" class="opacity-20" /></div>
                            <p class="text-sm">No results found for "{{ searchQuery }}"</p>
                            <p class="text-xs mt-1">Try 'design', 'export', or 'layers'</p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="px-4 py-2 bg-surface-container-low border-t border-outline/5 text-[10px] text-on-surface-variant/50 flex justify-between">
                         <span>Navigate with <strong class="font-medium">Up/Down</strong></span>
                         <span>Select with <strong class="font-medium">Enter</strong></span>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Editor Body -->
        <div class="flex-1 flex overflow-hidden relative">
            <!-- Mobile Backdrop -->
            <div 
              v-if="isToolbarOpen" 
              class="md:hidden fixed inset-0 bg-black/40 z-[55] backdrop-blur-sm transition-opacity"
              @click="isToolbarOpen = false"
            ></div>

            <!-- Side Toolbar (Full Drawer) -->
            <Toolbar />
            
            <!-- Canvas Area -->
            <CanvasArea />
        </div>

        <!-- [Mobile] Bottom Navigation -->
        <!-- [Mobile] Bottom Navigation -->
        <nav class="md:hidden h-20 bg-surface-container flex items-center overflow-x-auto no-scrollbar gap-2 px-4 shrink-0 z-50">
            <button @click="handleTabChange('design')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'design' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'design' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <LayoutDashboard :size="20" />
               </div>
               <span class="label-small">Design</span>
            </button>
            <button @click="handleTabChange('projects')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'projects' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'projects' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Folder :size="20" />
               </div>
               <span class="label-small">Projects</span>
            </button>
            <button @click="handleTabChange('templates')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'templates' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'templates' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <LayoutTemplate :size="20" />
               </div>
               <span class="label-small">Templates</span>
            </button>
            <button @click="handleTabChange('themes')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'themes' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'themes' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Palette :size="20" />
               </div>
               <span class="label-small">Themes</span>
            </button>
            <button @click="handleTabChange('assets')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'assets' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'assets' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Image :size="20" />
               </div>
               <span class="label-small">Assets</span>
            </button>
            <button @click="handleTabChange('elements')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'elements' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'elements' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Box :size="20" />
               </div>
               <span class="label-small">Elements</span>
            </button>
            <button @click="handleTabChange('draw')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'draw' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'draw' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <PenTool :size="20" />
               </div>
               <span class="label-small">Draw</span>
            </button>
             <button @click="handleTabChange('resize')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'resize' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'resize' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Move :size="20" />
               </div>
               <span class="label-small">Resize</span>
            </button>
            <button @click="handleTabChange('text')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'text' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'text' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Type :size="20" />
               </div>
               <span class="label-small">Text</span>
            </button>
             <button @click="handleTabChange('layers')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'layers' ? 'text-primary' : 'text-on-surface-variant'">
                <div :class="activeTab === 'layers' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                   <Layers :size="20" />
                </div>
                <span class="label-small">Layers</span>
             </button>
             <button @click="handleTabChange('properties')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'properties' ? 'text-primary' : 'text-on-surface-variant'">
                <div :class="activeTab === 'properties' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                   <Settings :size="20" />
                </div>
                <span class="label-small">Props</span>
             </button>
             <button @click="handleTabChange('code')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'code' ? 'text-primary' : 'text-on-surface-variant'">
                <div :class="activeTab === 'code' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                   <Code2 :size="20" />
                </div>
                <span class="label-small">Code</span>
             </button>
            <button @click="handleTabChange('profile')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'profile' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'profile' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <User :size="20" />
               </div>
               <span class="label-small">Profile</span>
            </button>
        </nav>


      </div>

    </div>
</template>

<style scoped>
@reference "../index.css";

.bg-background { background-color: var(--md-sys-color-background); }
.bg-surface { background-color: var(--md-sys-color-surface); }
.bg-surface-container { background-color: var(--md-sys-color-surface-container); }
.bg-surface-low { background-color: var(--md-sys-color-surface-container-low); }
.bg-surface-high { background-color: var(--md-sys-color-surface-container-high); }
.bg-surface-highest { background-color: var(--md-sys-color-surface-container-highest); }
.text-primary { color: var(--md-sys-color-primary); }
.text-on-primary { color: var(--md-sys-color-on-primary); }
.bg-primary { background-color: var(--md-sys-color-primary); }
.bg-primary-container { background-color: var(--md-sys-color-primary-container); }
.text-error { color: var(--md-sys-color-error); }

/* Navigation Rail Styles */
.rail-btn {
    @apply w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-xl text-on-surface-variant/70 hover:bg-surface-variant/30 hover:text-on-surface transition-all active:scale-95 border border-transparent;
}
.rail-btn.active {
    @apply bg-primary/10 text-primary font-bold shadow-sm;
}
.rail-item {
  @apply flex flex-col items-center gap-1 w-full py-4 transition-all duration-200 text-on-surface-variant hover:text-primary relative;
}
.rail-item.active {
  @apply text-primary;
}
.rail-item.active::after {
  content: '';
  @apply absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full;
}
.rail-label {
    @apply text-[9px] font-medium tracking-wide leading-none;
}
</style>
```
