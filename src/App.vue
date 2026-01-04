<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'
import { useElements } from './composables/useElements'
import { useCanvas } from './composables/useCanvas'
import { useTheme } from './composables/useTheme'
import { useToasts } from './composables/useToasts'

import Toolbar from './components/UI/Toolbar.vue'
import PropertiesPanel from './components/UI/PropertiesPanel.vue'
import CanvasArea from './components/Editor/CanvasArea.vue'
import ReloadPrompt from './components/ReloadPrompt.vue'

import { 
  Download, Menu, Share2, Sun, Moon, CheckCircle, Info, AlertCircle,
  Undo2, Redo2, FilePlus, FolderOpen, Save as SaveIcon, File as FileIcon
} from 'lucide-vue-next'

import '@material/web/menu/menu.js'
import '@material/web/menu/menu-item.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon.js'

const { 
  elements, selectedId, updateElement, deleteElement, 
  undo, redo, canUndo, canRedo, clearElements 
} = useElements()

const { bgColor, posterSize, manualScale } = useCanvas()
const { theme, toggleTheme } = useTheme()
const { toasts, showToast, removeToast } = useToasts()

const isExportMenuOpen = ref(false)
const isFileMenuOpen = ref(false)
const isExporting = ref(false)

// Keyboard Controls
const handleKeydown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return

    // History shortcuts
    if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'z') {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
            return
        }
        if (e.key === 'y') {
            e.preventDefault()
            redo()
            return
        }
    }

    if (selectedId.value) {
        const step = e.shiftKey ? 10 : 1
        const el = elements.value.find(e => e.id === selectedId.value)
        if (!el || el.locked) return

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault()
                updateElement(selectedId.value, { y: el.y - step })
                break
            case 'ArrowDown':
                e.preventDefault()
                updateElement(selectedId.value, { y: el.y + step })
                break
            case 'ArrowLeft':
                e.preventDefault()
                updateElement(selectedId.value, { x: el.x - step })
                break
            case 'ArrowRight':
                e.preventDefault()
                updateElement(selectedId.value, { x: el.x + step })
                break
            case 'Delete':
            case 'Backspace':
                deleteElement(selectedId.value)
                showToast('Element deleted', 'info')
                break
            case 'Escape':
                selectedId.value = null
                break
        }
    }
    
    // Global Zoom
    if ((e.ctrlKey || e.metaKey)) {
        if (e.key === '=' || e.key === '+') {
            e.preventDefault()
            manualScale.value = Math.min(manualScale.value + 0.1, 5)
        } else if (e.key === '-') {
            e.preventDefault()
            manualScale.value = Math.max(manualScale.value - 0.1, 0.5)
        } else if (e.key === '0') {
            e.preventDefault()
            manualScale.value = 1
        }
    }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

const handleExport = async (format: 'png' | 'jpeg' | 'webp' | 'json') => {
  if (format === 'json') {
    const data = JSON.stringify({
      version: '1.0',
      posterSize: posterSize.value,
      bgColor: bgColor.value,
      elements: elements.value
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `posterlab-project.json`
    link.click()
    showToast('Project saved as JSON', 'success')
    return
  }

  isExporting.value = true
  const prevId = selectedId.value
  selectedId.value = null
  isExportMenuOpen.value = false
  
  showToast(`Preparing ${format.toUpperCase()} export...`, 'info', 2000)

  setTimeout(async () => {
    const canvasEl = document.querySelector('.relative.shadow-2xl') as HTMLElement
    if (canvasEl) {
       try {
         const canvas = await html2canvas(canvasEl, {
             scale: 3,
             backgroundColor: null,
             useCORS: true,
             logging: false
         })
         const link = document.createElement('a')
         link.download = `posterlab-export.${format}`
         link.href = canvas.toDataURL(`image/${format}`, 0.95)
         link.click()
         showToast('Export successful', 'success')
       } catch (err) {
         showToast('Export failed', 'error')
       }
    }
    isExporting.value = false
    selectedId.value = prevId
  }, 500)
}

const handleImport = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if(!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
      try {
          const data = JSON.parse(event.target?.result as string)
          if(data.posterSize) posterSize.value = data.posterSize
          if(data.bgColor) bgColor.value = data.bgColor
          if(data.elements) elements.value = data.elements
          showToast('Project loaded successfully', 'success')
      } catch(err) {
          showToast('Failed to load project', 'error')
      }
  }
  reader.readAsText(file)
}

const handleNewProject = () => {
    if (elements.value.length > 0) {
        if (confirm('Create new project? Current progress will be lost.')) {
            clearElements()
            showToast('New project created', 'success')
        }
    } else {
        clearElements()
        showToast('New project created', 'success')
    }
    isFileMenuOpen.value = false
}
</script>

<template>
  <div class="flex flex-col h-screen font-sans overflow-hidden theme-transition" style="background-color: var(--bg-page); color: var(--fg-primary);">
    <!-- Header -->
    <header class="h-14 border-b flex items-center justify-between px-4 z-50 shrink-0 theme-transition" style="background-color: var(--bg-panel); border-color: var(--border-color);">
      <div class="flex items-center gap-3">
        <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
          <Menu class="text-white" :size="20" />
        </div>
        
        <div class="relative items-center hidden sm:flex">
          <md-text-button id="file-anchor" @click="isFileMenuOpen = !isFileMenuOpen">
            <FileIcon slot="icon" :size="18" />
            File
          </md-text-button>
          <md-menu anchor="file-anchor" :open="isFileMenuOpen" @closed="isFileMenuOpen = false">
             <md-menu-item @click="handleNewProject">
                <FilePlus slot="start" :size="18" />
                <div slot="headline">New Project</div>
             </md-menu-item>
             <md-menu-item @click.stop>
                <FolderOpen slot="start" :size="18" />
                <div slot="headline">
                   <label class="cursor-pointer w-full h-full block">
                        Open Project
                        <input type="file" hidden accept=".json" @change="handleImport" />
                   </label>
                </div>
             </md-menu-item>
             <md-menu-item @click="handleExport('json')">
                <SaveIcon slot="start" :size="18" />
                <div slot="headline">Save Project</div>
             </md-menu-item>
          </md-menu>
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        <!-- History -->
        <div class="flex items-center gap-0.5">
           <md-icon-button @click="undo" :disabled="!canUndo" title="Undo (Ctrl+Z)">
              <Undo2 :size="20" />
           </md-icon-button>
           <md-icon-button @click="redo" :disabled="!canRedo" title="Redo (Ctrl+Shift+Z)">
              <Redo2 :size="20" />
           </md-icon-button>
        </div>
      </div>

      <div class="absolute left-1/2 -translate-x-1/2 hidden md:block">
         <h1 class="font-bold text-lg tracking-tight">Poster<span class="text-blue-500">Lab</span> <span class="text-[10px] font-medium opacity-50">PRO</span></h1>
      </div>

      <div class="flex items-center gap-2">
        <md-icon-button @click="toggleTheme" title="Toggle Theme">
            <Sun v-if="theme === 'light'" :size="20" />
            <Moon v-else :size="20" />
        </md-icon-button>

        <div class="relative flex items-center">
          <md-filled-button id="export-anchor" @click="isExportMenuOpen = !isExportMenuOpen">
             <Download slot="icon" :size="18" />
             <span class="hidden sm:inline">Export</span>
          </md-filled-button>
          
          <md-menu anchor="export-anchor" :open="isExportMenuOpen" @closed="isExportMenuOpen = false" class="z-50">
            <md-menu-item @click="handleExport('png')">
                <div slot="headline">Export as PNG</div>
            </md-menu-item>
            <md-menu-item @click="handleExport('jpeg')">
                <div slot="headline">Export as JPEG</div>
            </md-menu-item>
            <md-menu-item @click="handleExport('webp')">
                <div slot="headline">Export as WEBP</div>
            </md-menu-item>
            <md-menu-item @click="handleExport('json')">
                <div slot="headline">Save Project (JSON)</div>
            </md-menu-item>
            <md-menu-item @click.stop>
                <div slot="headline">
                   <label class="cursor-pointer w-full h-full block">
                        Load Project (JSON)
                        <input type="file" hidden accept=".json" @change="handleImport" />
                   </label>
                </div>
            </md-menu-item>
          </md-menu>
        </div>
        
        <md-icon-button @click="showToast('Link copied to clipboard', 'success')">
           <Share2 :size="20" />
        </md-icon-button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
       <Toolbar />
       <PropertiesPanel />
       <CanvasArea />
    </main>

    <!-- Toast Notifications -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
       <div v-for="t in toasts" :key="t.id" 
            class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300 border backdrop-blur-md"
            :style="{ 
                backgroundColor: 'var(--bg-panel)', 
                borderColor: 'var(--border-color)',
                color: 'var(--fg-primary)'
            }"
        >
          <CheckCircle v-if="t.type === 'success'" class="text-green-500" :size="20" />
          <AlertCircle v-else-if="t.type === 'error'" class="text-red-500" :size="20" />
          <Info v-else class="text-blue-500" :size="20" />
          <span class="text-sm font-semibold flex-1">{{ t.message }}</span>
          <button @click="removeToast(t.id)" class="ml-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition">✕</button>
       </div>
    </div>

    <ReloadPrompt />
  </div>
</template>

<style>
/* Global styling for Material Web components */
md-filled-text-field, md-outlined-select, md-slider, md-icon-button, md-filled-button, md-filled-tonal-button, md-text-button {
    transition: all var(--transition-speed) var(--transition-ease) !important;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--fg-secondary);
}
</style>
