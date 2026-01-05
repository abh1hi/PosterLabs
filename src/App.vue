<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useCanvas } from './composables/useCanvas'
import { useElements } from './composables/useElements'
import { useToasts } from './composables/useToasts'
import { useKeyboard } from './composables/useKeyboard'
import Toolbar from './components/UI/Toolbar.vue'
import CanvasArea from './components/Editor/CanvasArea.vue'
import ReloadPrompt from './components/ReloadPrompt.vue'


import { 
  LayoutDashboard, Box, Type, Share2, Palette, Image, Zap, FileText, Save, MonitorDown,
  Menu, Settings, LogOut, CheckCircle, Info, AlertCircle,
  Undo2, Redo2, Layers, Download, Cloud, CloudOff, Folder, Code2
} from 'lucide-vue-next'

import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/menu/menu.js'
import '@material/web/menu/menu-item.js'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

const { currentUser, logout } = useAuth()
const { isToolbarOpen, posterSize, bgColor, activeTab } = useCanvas()
const { undo, redo, canUndo, canRedo, elements } = useElements()
// const { syncOfflineUploads, lastSyncTime, isUploading } = useMedia() // Removed sync
const { toasts, removeToast, showToast } = useToasts()
import { useNetworkStatus } from './composables/useNetworkStatus'
import { exportProject, importProject, exportProjectAsJson } from './utils/projectFile'
import { exportCanvas } from './utils/exportManager'

// Initialize Keyboard Shortcuts
useKeyboard()

const isExportMenuOpen = ref(false)

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
    // We assume the canvas area has a specific ID or we need to wrap it.
    // For now let's assume 'poster-canvas' is the ID of the main container in CanvasArea.
    // I need to verify CanvasArea has this ID or add it.
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

onMounted(() => {
    // Sync removed as per "remove auto sync completely" request
})


</script>

<template>
    <div class="flex h-screen bg-background theme-transition overflow-hidden">
      
      <!-- [Desktop] Navigation Rail -->
      <nav class="hidden md:flex flex-col w-20 bg-surface-low border-r border-outline/10 z-50 py-4 shrink-0 items-center justify-between h-full">
         <div class="flex flex-col items-center gap-4 w-full flex-1 overflow-hidden">
            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10 overflow-hidden shrink-0 border border-outline/10">
               <img src="/pwa-192x192.png" alt="PosterLab" class="w-full h-full object-cover">
            </div>
            
            <!-- Rail Buttons -->
            <div class="flex flex-col gap-2 w-full px-2 overflow-y-auto no-scrollbar">
               <button @click="handleTabChange('design')" class="rail-item" :class="{ active: activeTab === 'design' }">
                  <LayoutDashboard :size="20" />
                  <span class="rail-label">Design</span>
               </button>
               <button @click="handleTabChange('projects')" class="rail-item" :class="{ active: activeTab === 'projects' }">
                  <Folder :size="20" />
                  <span class="rail-label">Projects</span>
               </button>
               <button @click="handleTabChange('elements')" class="rail-item" :class="{ active: activeTab === 'elements' }">
                  <Box :size="20" />
                  <span class="rail-label">Elements</span>
               </button>
               <button @click="handleTabChange('text')" class="rail-item" :class="{ active: activeTab === 'text' }">
                  <Type :size="20" />
                  <span class="rail-label">Text</span>
               </button>
                <button @click="handleTabChange('layers')" class="rail-item" :class="{ active: activeTab === 'layers' }">
                   <Layers :size="20" />
                   <span class="rail-label">Layers</span>
                </button>
                <button @click="handleTabChange('properties')" class="rail-item" :class="{ active: activeTab === 'properties' }">
                   <Settings :size="20" />
                   <span class="rail-label">Props</span>
                </button>
                <button @click="handleTabChange('code')" class="rail-item" :class="{ active: activeTab === 'code' }">
                   <Code2 :size="20" />
                   <span class="rail-label">Code</span>
                </button>
                <div class="mt-auto w-full pt-4 border-t border-outline/10 shrink-0"></div>
                <button @click="handleTabChange('profile')" class="rail-item shrink-0" :class="{ active: activeTab === 'profile' }">
                   <User :size="20" />
                   <span class="rail-label">Profile</span>
                </button>
            </div>
         </div>

         <div class="flex flex-col items-center gap-4">
            <md-icon-button @click="isToolbarOpen = !isToolbarOpen" class="mb-2" :selected="!isToolbarOpen">
               <Menu :size="20" />
            </md-icon-button>
            <md-icon-button id="user-menu-anchor" @click="isUserMenuOpen = !isUserMenuOpen">
               <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" class="w-8 h-8 rounded-full" />
               <Menu v-else :size="20" />
            </md-icon-button>
            <md-menu anchor="user-menu-anchor" :open="isUserMenuOpen" @closed="isUserMenuOpen = false">
                <md-menu-item @click="handleTabChange('profile')">
                   <User slot="start" :size="18" />
                   <div slot="headline">Profile & Settings</div>
                </md-menu-item>
                <md-menu-item @click="handleAppLogout">
                   <LogOut slot="start" :size="18" />
                   <div slot="headline">Sign Out</div>
                </md-menu-item>
            </md-menu>
         </div>
      </nav>

      <!-- Main Editor Container -->
      <div class="flex flex-col flex-1 relative overflow-hidden">
        
        <!-- Redesigned Top App Bar (Google UI Inspired) -->
        <header class="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 bg-surface-low/95 backdrop-blur-md border-b border-outline/5 z-30 shrink-0 sticky top-0 transition-all duration-300">
           <!-- Left: Brand & Poster Info -->
           <div class="flex items-center gap-1 sm:gap-2 min-w-0">
              <md-icon-button class="md:hidden" @click="toggleProperties">
                 <Menu :size="20" />
              </md-icon-button>
              
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                 <!-- Logo Container -->
                 <div class="w-9 h-9 sm:w-11 sm:h-11 bg-primary-container/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border border-primary/10">
                    <img src="/pwa-192x192.png" alt="PosterLab" class="w-8 h-8 sm:w-9 sm:h-9 object-contain opacity-95">
                 </div>

                 <!-- Poster Title & Status -->
                 <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1 group cursor-pointer">
                       <h1 class="title-small sm:title-medium font-semibold text-on-surface truncate min-w-0" title="My Creative Poster">
                          My Creative Poster
                       </h1>
                       <div class="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                          <Palette :size="14" class="text-on-surface-variant" />
                       </div>
                    </div>

                    <!-- Status indicators (Google Docs Style) -->
                    <div class="flex items-center gap-2 sm:gap-3 px-1">
                       <div v-if="!networkStatus.connected" class="flex items-center gap-1 text-error/80 label-small">
                           <CloudOff :size="12" />
                           <span class="hidden sm:inline">Offline</span>
                       </div>
                       <div v-else class="flex items-center gap-1 text-on-surface-variant/60 label-small">
                           <Cloud :size="12" />
                           <span class="hidden sm:inline">Saved to Local</span>
                       </div>
                       <div class="w-1 h-1 rounded-full bg-outline/20"></div>
                       <span class="label-small text-on-surface-variant/40 italic">Draft</span>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Right: Actions & History -->
           <div class="flex items-center gap-1 sm:gap-3 shrink-0">
              <!-- History Controls Grouped (Hidden on mobile) -->
              <div class="hidden md:flex items-center bg-surface-container-highest/20 rounded-full p-1 border border-outline/5">
                 <md-icon-button @click="undo" :disabled="!canUndo" class="h-9 w-9">
                    <Undo2 :size="18" />
                 </md-icon-button>
                 <div class="w-px h-5 bg-outline/10 mx-0.5"></div>
                 <md-icon-button @click="redo" :disabled="!canRedo" class="h-9 w-9">
                    <Redo2 :size="18" />
                 </md-icon-button>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1 sm:gap-2">
                <input type="file" ref="projectInputRef" hidden accept=".posterLabs,.json" @change="handleImportFile" />
                <md-icon-button @click="projectInputRef?.click()" title="Open Project (.posterLabs, .json)" class="bg-surface-high border border-outline/5 rounded-full">
                    <Folder :size="20" />
                </md-icon-button>

                <md-filled-tonal-button class="h-9 sm:h-10 px-2 sm:px-4 rounded-full transition-all">
                   <Share2 slot="icon" :size="18" />
                   <span class="hidden sm:inline">Share</span>
                </md-filled-tonal-button>

                 <div class="relative">
                    <md-filled-button id="export-menu-anchor" @click="isExportMenuOpen = !isExportMenuOpen" class="h-9 sm:h-10 px-2 sm:px-4 rounded-full shadow-sm">
                       <Download slot="icon" :size="18" />
                       <span class="hidden sm:inline">Export</span>
                       <md-menu anchor="export-menu-anchor" :open="isExportMenuOpen" @closed="isExportMenuOpen = false" positioning="popover" class="mt-2 text-start">
                          <md-menu-item @click="handleExport">
                             <Save slot="start" :size="18" />
                             <div slot="headline">Project (.posterLabs)</div>
                             <div slot="supporting-text">Save for later editing</div>
                          </md-menu-item>
                          <md-menu-item @click="handleJsonExport">
                             <Code2 slot="start" :size="18" />
                             <div slot="headline">JSON Format</div>
                             <div slot="supporting-text">Developer friendly export</div>
                          </md-menu-item>
                          <div class="h-px bg-outline/5 my-1 mx-3"></div>
                          <md-menu-item @click="handleImageExport('png')">
                             <Image slot="start" :size="18" />
                             <div slot="headline">PNG Image</div>
                             <div slot="supporting-text">High quality image</div>
                          </md-menu-item>
                          <md-menu-item @click="handleImageExport('jpeg')">
                             <Image slot="start" :size="18" />
                             <div slot="headline">JPEG Image</div>
                             <div slot="supporting-text">Web optimized</div>
                          </md-menu-item>
                          <md-menu-item @click="handleImageExport('webp')">
                             <Zap slot="start" :size="18" />
                             <div slot="headline">WEBP Image</div>
                             <div slot="supporting-text">Modern format</div>
                          </md-menu-item>
                           <md-menu-item @click="handleImageExport('pdf')">
                             <FileText slot="start" :size="18" />
                             <div slot="headline">PDF Document</div>
                             <div slot="supporting-text">Print ready</div>
                          </md-menu-item>
                       </md-menu>
                    </md-filled-button>
                 </div>

                 <md-icon-button v-if="showInstallButton" @click="installApp" class="bg-secondary-container/30 text-secondary rounded-xl hover:bg-secondary-container/50 hidden sm:flex">
                    <MonitorDown :size="20" />
                 </md-icon-button>
              </div>

              <!-- Profile Avatar (Integrated) -->
              <div class="ml-1 sm:ml-2">
                 <md-icon-button id="header-user-menu-anchor" @click="isUserMenuOpen = !isUserMenuOpen" class="w-8 h-8 sm:w-10 sm:h-10 p-0 overflow-hidden ring-1 ring-outline/10">
                    <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" class="w-full h-full object-cover" />
                    <User v-else :size="20" class="text-on-surface-variant" />
                 </md-icon-button>
                 <md-menu anchor="header-user-menu-anchor" :open="isUserMenuOpen" @closed="isUserMenuOpen = false" positioning="popover">
                    <md-menu-item @click="handleTabChange('profile')">
                       <User slot="start" :size="18" />
                       <div slot="headline">Profile & Settings</div>
                    </md-menu-item>
                    <md-menu-item @click="handleAppLogout">
                       <LogOut slot="start" :size="18" />
                       <div slot="headline">Sign Out</div>
                    </md-menu-item>
                 </md-menu>
              </div>
           </div>
        </header>

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
            <button @click="handleTabChange('elements')" class="flex flex-col items-center gap-1 shrink-0 min-w-[70px] py-2" :class="activeTab === 'elements' ? 'text-primary' : 'text-on-surface-variant'">
               <div :class="activeTab === 'elements' ? 'bg-primary-container w-16 h-8 rounded-full flex items-center justify-center' : ''">
                  <Box :size="20" />
               </div>
               <span class="label-small">Elements</span>
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

    <!-- Toast Overlay -->
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        <div v-for="t in toasts" :key="t.id" 
            class="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-full shadow-lg bg-surface-highest border border-outline/10 text-on-surface"
        >
          <CheckCircle v-if="t.type === 'success'" class="text-primary" :size="20" />
          <AlertCircle v-else-if="t.type === 'error'" class="text-error" :size="20" />
          <Info v-else class="text-secondary" :size="20" />
          <span class="label-large flex-1">{{ t.message }}</span>
          <button @click="removeToast(t.id)" class="ml-2 opacity-50 hover:opacity-100 transition">✕</button>
       </div>
    </div>

    <ReloadPrompt />
</template>

<style>
@reference "./index.css";

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
  @apply text-[10px] font-bold uppercase tracking-wider;
}
</style>
