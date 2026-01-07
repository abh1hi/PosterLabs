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
  PenTool, Move
} from 'lucide-vue-next'

import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/menu/menu.js'
import '@material/web/menu/menu-item.js'
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
           <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              <md-icon-button class="md:hidden hover:bg-surface-variant/20 transition-colors" @click="toggleProperties">
                 <Menu :size="20" />
              </md-icon-button>
              
              <div class="flex items-center gap-4 sm:gap-5 min-w-0">
                 <!-- Logo Container / Home Button -->
                 <div @click="handleBackToHome" class="group relative w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-surface-container rounded-2xl flex items-center justify-center shrink-0 border border-outline/10 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 transform active:scale-95" title="Back to Home">
                    <div class="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <ArrowLeft class="text-primary hidden group-hover:block relative z-10" :size="20" />
                    <img src="/pwa-192x192.png" alt="PosterLab" class="w-8 h-8 sm:w-9 sm:h-9 object-contain opacity-95 group-hover:hidden relative z-10">
                 </div>

                 <!-- Poster Title & Status -->
                 <div class="flex flex-col min-w-0">
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

                    <!-- Status indicators (Modern Doc Style) -->
                    <div class="flex items-center gap-2 px-0.5">
                       <div v-if="!networkStatus.connected" class="flex items-center gap-1.5 text-error/90 label-small font-medium bg-error/5 px-2 py-0.5 rounded-full border border-error/10">
                           <CloudOff :size="12" />
                           <span class="hidden sm:inline">Offline Mode</span>
                       </div>
                       <div v-else class="flex items-center gap-1.5 text-primary/70 label-small font-medium bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                           <Cloud :size="12" />
                           <span class="hidden sm:inline">Successively Saved</span>
                       </div>
                       <div class="w-1 h-1 rounded-full bg-outline/20"></div>
                       <span class="label-small text-on-surface-variant/60 font-medium tracking-wide uppercase text-[10px]">Version 1.2</span>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Center: Quick Tools (Enhanced Responsive) -->
           <div class="flex items-center bg-surface-container-high/40 rounded-2xl px-1 sm:px-2 py-1 gap-0.5 sm:gap-1 border border-outline/10 backdrop-blur-md">
              <md-icon-button @click="undo" :disabled="!canUndo" class="h-9 w-9 sm:h-10 sm:w-10 hover:bg-surface-variant/20 transition-colors">
                 <Undo2 :size="18" />
              </md-icon-button>
              <div class="w-px h-6 bg-outline/10 mx-0.5 sm:mx-1"></div>
              <md-icon-button @click="redo" :disabled="!canRedo" class="h-9 w-9 sm:h-10 sm:w-10 hover:bg-surface-variant/20 transition-colors">
                 <Redo2 :size="18" />
              </md-icon-button>
           </div>

           <!-- Right: Actions & History -->
           <div class="flex items-center gap-2 sm:gap-4 shrink-0">
              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <input type="file" ref="projectInputRef" hidden accept=".posterLabs,.json" @change="handleImportFile" />
                
                <md-icon-button @click="projectInputRef?.click()" title="Open Project" class="hidden sm:flex bg-surface-container-high border border-outline/10 rounded-xl hover:bg-surface-container-highest transition-colors">
                    <Folder :size="20" />
                </md-icon-button>

                <div class="h-8 w-px bg-outline/10 mx-1 hidden sm:block"></div>

                <md-filled-tonal-button class="h-10 sm:h-11 px-3 sm:px-5 rounded-xl transition-all hover:shadow-md active:scale-95 font-medium tracking-wide">
                   <Share2 slot="icon" :size="20" />
                   <span class="hidden sm:inline">Collaboration</span>
                </md-filled-tonal-button>

                 <div class="relative group">
                    <md-filled-button id="export-menu-anchor" @click="isExportMenuOpen = !isExportMenuOpen" class="h-10 sm:h-11 px-4 sm:px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold tracking-wide transform active:scale-95">
                       <Download slot="icon" :size="20" />
                       <span class="hidden sm:inline">Export Design</span>
                       
                        <md-menu anchor="export-menu-anchor" :open="isExportMenuOpen" @closed="isExportMenuOpen = false" positioning="popover" class="mt-3 text-start min-w-[240px] rounded-24 overflow-hidden border border-outline/10 shadow-2xl">
                           <div class="px-4 py-3 bg-surface-variant/10 border-b border-outline/5">
                              <span class="label-small text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Project Formats</span>
                           </div>
                           <md-menu-item @click="handleExport" class="hover:bg-primary/5 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                 <Save :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">Source File (.poster)</div>
                              <div slot="supporting-text" class="text-[11px]">Best for future editing</div>
                           </md-menu-item>
                           <md-menu-item @click="handleJsonExport" class="hover:bg-secondary/5 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                 <Code2 :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">JSON Schema</div>
                              <div slot="supporting-text" class="text-[11px]">Raw project data</div>
                           </md-menu-item>
                           
                           <div class="h-px bg-outline/5 my-1 mx-2"></div>
                           
                           <div class="px-4 py-3 bg-surface-variant/10 border-y border-outline/5">
                              <span class="label-small text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Ready to Share</span>
                           </div>
                           <md-menu-item @click="handleImageExport('png')" class="hover:bg-surface-variant/10 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-surface-highest flex items-center justify-center text-on-surface-variant">
                                 <Image :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">High Quality PNG</div>
                              <div slot="supporting-text" class="text-[11px]">Best for web & social</div>
                           </md-menu-item>
                           <md-menu-item @click="handleImageExport('jpeg')" class="hover:bg-surface-variant/10 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-surface-highest flex items-center justify-center text-on-surface-variant">
                                 <Image :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">Optimized JPEG</div>
                              <div slot="supporting-text" class="text-[11px]">Smaller file size</div>
                           </md-menu-item>
                           <md-menu-item @click="handleImageExport('webp')" class="hover:bg-surface-variant/10 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                                 <Zap :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">Modern WebP</div>
                              <div slot="supporting-text" class="text-[11px]">Fastest loading format</div>
                           </md-menu-item>
                           <div class="h-px bg-outline/5 my-1 mx-2"></div>
                           <md-menu-item @click="handleImageExport('pdf')" class="hover:bg-error/5 transition-colors">
                              <div slot="start" class="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center text-error">
                                 <FileText :size="18" />
                              </div>
                              <div slot="headline" class="font-bold text-on-surface">PDF Document</div>
                              <div slot="supporting-text" class="text-[11px]">Professional printing</div>
                           </md-menu-item>
                        </md-menu>
                    </md-filled-button>
                 </div>
              </div>

              <!-- Profile Avatar (Integrated) -->
              <div class="pl-1 sm:pl-2 border-l border-outline/10 ml-1">
                 <button id="header-user-menu-anchor" @click="isUserMenuOpen = !isUserMenuOpen" class="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 overflow-hidden ring-2 ring-outline/10 hover:ring-primary/40 transition-all duration-300 transform active:scale-95 shadow-sm">
                    <div class="w-full h-full rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                        <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" class="w-full h-full object-cover" />
                        <User v-else :size="22" class="text-on-surface-variant" />
                    </div>
                 </button>
                 <md-menu anchor="header-user-menu-anchor" :open="isUserMenuOpen" @closed="isUserMenuOpen = false" positioning="popover" class="mt-3 rounded-2xl shadow-2xl border border-outline/10 min-w-[200px]">
                    <md-menu-item @click="handleTabChange('profile')" class="py-2">
                       <User slot="start" :size="18" />
                       <div slot="headline" class="font-bold">Account Settings</div>
                    </md-menu-item>
                    <md-menu-item @click="handleAppLogout" class="py-2 text-error">
                       <LogOut slot="start" :size="18" />
                       <div slot="headline" class="font-bold">Logout Session</div>
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
