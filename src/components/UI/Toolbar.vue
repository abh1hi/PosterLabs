<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas, CANVAS_PRESETS } from '../../composables/useCanvas'
import { useToasts } from '../../composables/useToasts'
import { useMedia } from '../../composables/useMedia'
import { useThemes } from '../../composables/useThemes'
import { useTemplates } from '../../composables/useTemplates'
import ProfilePanel from './ProfilePanel.vue'
import { 
  ImageIcon, Shapes, MousePointer2, Hand,
  Search, LayoutTemplate, History,
  ChevronDown, ChevronRight, ChevronUp, Smartphone,
  Eye, EyeOff, Lock, Unlock, ArrowUpToLine, ArrowDownToLine,
  Palette, Maximize2, Trash2, Copy,
  Type, Box, Crop, Folder, Plus, Save, Wand2, AlignLeft,
  Globe, MonitorDown, Link, X, Settings2, Code2, Info as InfoIcon, Shuffle
} from 'lucide-vue-next'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
// ImageEditorModal removed
import { useProjects } from '../../composables/useProjects'
import { useFonts } from '../../composables/useFonts'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

import '@material/web/textfield/filled-text-field.js'
import '@material/web/slider/slider.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/divider/divider.js'
import '@material/web/switch/switch.js'

const { 
  elements, selectedId, addElement, updateElement, updateStyle, deleteElement, duplicateElement,
  moveElement, shuffleElements 
} = useElements()
const { posterSize, bgColor, activeTool, isToolbarOpen, backgroundType, gradientStyle, showGrid, activeTab } = useCanvas()
const { showToast } = useToasts()
const { uploads, isUploading, uploadImage, saveExternalMedia, fetchUserMedia } = useMedia()
const { THEMES } = useThemes()
const { TEMPLATES } = useTemplates()
const { projects, saveProject, loadProject, deleteProject, createNewProject } = useProjects()
const { isGoogleFontsActive, searchQuery, filteredFonts, queryLocalFonts, applyFont, isLoadingFonts, addFontFromUrl } = useFonts()
const fileInputRef = ref<HTMLInputElement | null>(null)

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'hard-light', 'soft-light', 'difference'
]

const openSections = ref({
  transform: true,
  typography: true,
  content: true,
  image: true,
  appearance: true,
  layers: true,
  canvas: true
})

const toggleSection = (section: keyof typeof openSections.value) => {
  openSections.value[section] = !openSections.value[section]
}

const selectedElement = computed(() => elements.value.find(e => e.id === selectedId.value))
const sortedLayers = computed(() => [...elements.value].reverse())

const addCustomElement = () => {
    handleAddElement({
        type: 'custom',
        customHtml: '<div class="my-custom-box">Hello Custom Code!</div>',
        x: 100,
        y: 100,
        style: {
            width: 200,
            height: 100,
            customCss: 'selector { \n  background: linear-gradient(45deg, #FF512F, #DD2476); \n  color: white; \n  display: flex; \n  align-items: center; \n  justify-content: center; \n  font-weight: bold; \n  border-radius: 12px;\n}'
        }
    })
    activeTab.value = 'code'
}

const handleInput = (id: string, key: string, value: any, isStyle: boolean = false) => {
    if (isStyle) {
        updateStyle(id, { [key]: value })
    } else {
        updateElement(id, { [key]: value })
    }
}

const triggerHaptic = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }) } catch (e) {}
}

const handleAddElement = (params: any) => {
    addElement(params)
    triggerHaptic()
    showToast(`${params.type.charAt(0).toUpperCase() + params.type.slice(1)} added`, 'success')
    
    // On mobile, switch to properties so they can see it's added and edit it
    if (window.innerWidth < 768) {
        activeTab.value = 'properties'
    }
}

const addTextHeader = () => {
  handleAddElement({
    type: 'text',
    content: 'Add a heading',
    x: 100,
    y: 100,
    style: {
      fontSize: 48,
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
      opacity: 1,
      rotate: 0
    }
  })
}

const addTextSubheading = () => {
    handleAddElement({
      type: 'text',
      content: 'Add a subheading',
      x: 100,
      y: 150,
      style: {
        fontSize: 32,
        fontFamily: 'Roboto, sans-serif',
        fontWeight: '600',
        color: '#1d1b20',
        textAlign: 'center',
        opacity: 1,
        rotate: 0
      }
    })
}

const addTextBody = () => {
    handleAddElement({
      type: 'text',
      content: 'Add a little bit of body text',
      x: 100,
      y: 200,
      style: {
        fontSize: 16,
        fontFamily: 'Roboto, sans-serif',
        color: '#49454f',
        textAlign: 'center',
        opacity: 1,
        rotate: 0
      }
    })
}

const addTextCaption = () => {
    handleAddElement({
      type: 'text',
      content: 'ADD A CAPTION',
      x: 100,
      y: 250,
      style: {
        fontSize: 12,
        fontFamily: 'Roboto, sans-serif',
        fontWeight: '500',
        color: '#49454f',
        textAlign: 'center',
        opacity: 1,
        rotate: 0,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
      }
    })
}

const addTextCreative = () => {
    handleAddElement({
      type: 'text',
      content: 'Creative Text',
      x: 100,
      y: 300,
      style: {
        fontSize: 64,
        fontFamily: 'Lobster, cursive',
        color: '#6750a4',
        textAlign: 'center',
        opacity: 1,
        rotate: -5,
        shadow: {
            blur: 10,
            color: 'rgba(0,0,0,0.2)',
            offsetX: 4,
            offsetY: 4
        }
      }
    })
    isGoogleFontsActive.value = true
}

const handleImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      const mediaDoc = await uploadImage(file)
      handleAddElement({
        type: 'image',
        src: mediaDoc.url,
        x: 100,
        y: 100,
        style: {
            width: 300,
            height: 300,
            opacity: 1,
            rotate: 0,
            borderRadius: 0
        }
      })
      showToast('Image uploaded and added', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image', 'error')
    }
  }
}

const addMediaByUrl = async () => {
    const url = window.prompt('Enter image URL:')
    if (!url) return

    try {
        // Validation
        new URL(url)
        
        // Attempt to "upload" it to local storage to make it persistent/offline-friendly
        // This might fail due to CORS, but we can fall back to direct URL
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const fileName = url.split('/').pop() || 'external-image'
            const file = new File([blob], fileName, { type: blob.type })
            const mediaDoc = await uploadImage(file)
            
            handleAddElement({
                type: 'image',
                src: mediaDoc.url,
                x: 100,
                y: 100,
                style: {
                    width: 300,
                    height: 300,
                    opacity: 1,
                    rotate: 0,
                    borderRadius: 0
                }
            })
            showToast('Image added and saved locally', 'success')
        } catch (corsErr) {
            console.warn('CORS restricted image, adding direct URL instead', corsErr)
            await saveExternalMedia(url)
            handleAddElement({
                type: 'image',
                src: url,
                x: 100,
                y: 100,
                style: {
                    width: 300,
                    height: 300,
                    opacity: 1,
                    rotate: 0,
                    borderRadius: 0
                }
            })
            showToast('Image added and URL saved for reuse', 'success')
        }
    } catch (e: any) {
        showToast('Invalid URL or failed to add image', 'error')
    }
}

const addShape = (shapeType: string) => {
    handleAddElement({
        type: 'shape',
        x: 150,
        y: 150,
        style: {
            width: 150,
            height: 150,
            backgroundColor: '#0061a4',
            shapeType: shapeType,
            opacity: 1,
            rotate: 0
        }
    })
}

const handleAddFontFromUrl = () => {
    // alert('Paste Google Fonts URL') // debug
    const url = window.prompt('Paste Google Fonts URL (e.g. https://fonts.googleapis.com/css2?family=Pacifico&display=swap):')
    if (url) {
        const family = addFontFromUrl(url)
        if (family) {
            isGoogleFontsActive.value = true
            handleInput(selectedId.value!, 'fontFamily', family, true)
        }
    }
}

const handleSaveProject = () => {
    const name = window.prompt('Enter project name:', 'My Awesome Poster');
    if (name) saveProject(name);
}

const applyTemplate = (template: any) => {
    if (window.confirm('Replace current design with template?')) {
        elements.value = JSON.parse(JSON.stringify(template.elements));
        posterSize.value.w = template.settings.w;
        posterSize.value.h = template.settings.h;
        bgColor.value = template.settings.bgColor;
        showToast('Template loaded', 'success');
    }
}

onMounted(() => {
  fetchUserMedia()
})

import ImageEditor from 'tui-image-editor'
import 'tui-image-editor/dist/tui-image-editor.css'

const isCropping = ref(false)
const cropperRef = ref<any>(null)
// TUI State
const isTuiActive = ref(false)
const isTuiLoading = ref(false)
const tuiInstance = ref<any>(null)

const initTui = async () => {
    if (!selectedElement.value?.src) return
    isTuiActive.value = true
    isTuiLoading.value = true
    
    // Wait for DOM
    setTimeout(() => {
        const container = document.querySelector('#tui-image-editor-container')
        if (container) {
            tuiInstance.value = new ImageEditor(container, {
                cssMaxWidth: 300,
                cssMaxHeight: 250,
                selectionStyle: {
                    cornerSize: 20,
                    rotatingPointOffset: 70
                }
            })
            
            // Load Image
            const src = selectedElement.value!.src
            tuiInstance.value.loadImageFromURL(src, 'Current Image').then(() => {
                // Clear filters (TUI should start fresh or we could try to apply them?)
                tuiInstance.value.clearUndoStack()
                isTuiLoading.value = false
                console.log('TUI Image loaded')
            }).catch((e: any) => {
                console.error('Failed to load TUI image', e)
                isTuiLoading.value = false
                showToast('Failed to load image editor', 'error')
            })
        }
    }, 100)
}

const applyTuiFilter = (filterType: string) => {
    if (!tuiInstance.value || isTuiLoading.value) return
    
    // TUI Image Editor Filter Mapping
    // Some filters need parameters to work without erroring
    let filterName = filterType
    let options: any = {}
    
    // ... switch case (unchanged) ...
    switch (filterType) {
        case 'Grayscale':
        case 'Sepia':
        case 'Invert':
        case 'Emboss':
            // These usually take no params or just 'Grayscale' is fine
            break
        case 'Blur':
            options = { blur: 0.1 } // TUI expects a value
            break
        case 'Pixelate':
            options = { blocksize: 10 }
            break
        default:
            break
    }

    // TUI API: applyFilter(type, options, isUndoable)
    tuiInstance.value.applyFilter(filterName, options).then(() => {
        console.log('Filter applied:', filterName)
    }).catch((e: any) => {
        console.warn('Filter failed:', e)
        showToast('Filter failed: ' + e.message, 'error')
    })
}

const cancelTui = () => {
    tuiInstance.value?.destroy()
    tuiInstance.value = null
    isTuiActive.value = false
}

const saveTuiForReal = async () => {
    if (!tuiInstance.value) return
    
    try {
        const dataUrl = tuiInstance.value.toDataURL()
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `tui-edited-${Date.now()}.png`, { type: 'image/png' })
        
        const mediaDoc = await uploadImage(file)
        if (selectedId.value) {
            updateElement(selectedId.value, { 
                src: mediaDoc.url
            })
            updateStyle(selectedId.value, {
                brightness: 100, contrast: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0
            })
            showToast('Advanced edits saved', 'success')
        }
        
        cancelTui()
    } catch (e: any) {
        showToast('Failed to save TUI edit: ' + e.message, 'error')
    }
}

const saveInlineCrop = async () => {
    if (!cropperRef.value) return
    // (Rest of crop logic stays same)
    try {
        const { canvas } = cropperRef.value.getResult()
        if (!canvas) {
            showToast('Could not create crop canvas. Try again.', 'error')
            return
        }

        canvas.toBlob(async (blob: Blob | null) => {
            if (!blob) {
                showToast('Failed to generate image data', 'error')
                return
            }
            
            try {
                // Determine mime type from extension or default to png
                const mimeType = 'image/png'
                const file = new File([blob], `cropped-${Date.now()}.png`, { type: mimeType })
                
                const mediaDoc = await uploadImage(file)
                
                if (selectedId.value && mediaDoc.url) {
                    updateElement(selectedId.value, { src: mediaDoc.url })
                    showToast('Crop update applied', 'success')
                } else {
                    showToast('No element selected to update', 'error')
                }
                
                isCropping.value = false
            } catch (innerErr: any) {
                showToast('Failed to save crop: ' + innerErr.message, 'error')
            }
        }, 'image/png')

    } catch (e: any) {
         showToast('Cropper error: ' + e.message, 'error')
    }
}


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
        <md-filled-text-field v-if="!['properties', 'layers', 'profile'].includes(activeTab)" class="w-full h-10 rounded-full" placeholder="Search templates..." type="search">
            <Search slot="leading-icon" :size="18" />
        </md-filled-text-field>
        <div v-else-if="activeTab === 'layers'" class="flex items-center justify-between w-full">
            <h2 class="title-small uppercase tracking-widest text-primary">Layers</h2>
            <div class="flex items-center gap-1">
                <md-icon-button @click="shuffleElements" title="Shuffle Layers"><Shuffle :size="16" /></md-icon-button>
            </div>
        </div>
        <div v-else class="flex items-center justify-between w-full">
            <div v-if="activeTab === 'properties' && selectedId" class="flex items-center gap-1">
                <md-icon-button @click="duplicateElement(selectedId!)"><Copy :size="16" /></md-icon-button>
                <md-icon-button @click="deleteElement(selectedId!)"><Trash2 :size="16" /></md-icon-button>
            </div>
        </div>
    </div>

    <!-- Tab Contents Container -->
    <div class="flex-1 overflow-y-auto custom-scrollbar touch-pan-y">

        <!-- Tab: Profile -->
        <div v-if="activeTab === 'profile'" class="h-full">
            <ProfilePanel />
        </div>
        
        <!-- Tab: Projects -->
        <div v-if="activeTab === 'projects'" class="p-4 space-y-6">
            <!-- Actions -->
            <div class="grid grid-cols-2 gap-3">
                <button @click="createNewProject" class="p-3 bg-primary-container rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all text-on-primary-container">
                    <Plus :size="24" />
                    <span class="label-medium font-bold">New Project</span>
                </button>
                <button @click="handleSaveProject" class="p-3 bg-tertiary-container rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all text-on-tertiary-container">
                    <Save :size="24" />
                    <span class="label-medium font-bold">Save Project</span>
                </button>
            </div>

            <!-- Projects List -->
            <div class="space-y-3">
                <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Your Projects</h3>
                <div v-if="projects.length === 0" class="p-8 text-center text-on-surface-variant opacity-60">
                    <Folder :size="48" class="mx-auto mb-2 opacity-50" />
                    <p class="body-medium">No saved projects yet</p>
                </div>
                
                <div v-for="project in projects" :key="project.id" class="flex items-center gap-3 p-3 bg-surface-high rounded-xl border border-outline/10 group hover:border-primary transition-all">
                    <div class="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                        <Folder :size="20" class="text-primary" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="label-large truncate">{{ project.name }}</h4>
                        <p class="label-small text-on-surface-variant">{{ new Date(project.updatedAt).toLocaleDateString() }}</p>
                    </div>
                    <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button @click="loadProject(project.id)" class="w-8 h-8 rounded-full hover:bg-primary/10 text-primary flex items-center justify-center" title="Load">
                            <Box :size="16" /> <!-- Using Box as Load icon substitute or folder-open -->
                         </button>
                         <button @click="deleteProject(project.id)" class="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center" title="Delete">
                            <Trash2 :size="16" />
                         </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Design -->
        <div v-if="activeTab === 'design'" class="p-4 space-y-8">
            
            <!-- Themes Section -->
            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Themes</h3>
               <div class="grid grid-cols-2 gap-3">
                   <button v-for="theme in THEMES" :key="theme.id" 
                       @click="() => {
                           bgColor = theme.colors.background;
                           // Future: apply fonts/colors to existing elements
                           showToast(`Applied ${theme.name} theme`, 'success');
                       }"
                       class="h-16 rounded-xl border border-outline/10 hover:border-primary transition-all flex overflow-hidden relative group"
                   >
                       <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.primary }"></div>
                       <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.secondary }"></div>
                       <div class="w-1/3 h-full" :style="{ backgroundColor: theme.colors.background }"></div>
                       <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span class="text-white text-xs font-bold">{{ theme.name }}</span>
                       </div>
                   </button>
               </div>
            </div>

            <!-- Templates Section -->
            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Templates</h3>
               <div class="grid grid-cols-2 gap-3">
                  <button v-for="template in TEMPLATES" :key="template.id"
                       @click="applyTemplate(template)" 
                      class="aspect-[3/4] bg-surface-high rounded-xl border border-outline/10 hover:border-primary transition-all cursor-pointer overflow-hidden group relative"
                  >
                      <!-- Simple Preview (Background Color + Name) -->
                      <div class="w-full h-full flex flex-col items-center justify-center p-2 text-center" :style="{ backgroundColor: template.settings.bgColor }">
                         <span class="font-bold opacity-50">{{ template.name }}</span>
                      </div>
                      <div class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <LayoutTemplate class="text-primary" :size="32" />
                      </div>
                  </button>
               </div>
            </div>
        </div>

        <!-- Tab: Elements -->
        <div v-if="activeTab === 'elements'" class="p-4 space-y-8">
            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Shapes</h3>
               <div class="grid grid-cols-3 gap-2">
                  <button @click="addShape('rectangle')" class="element-card"><div class="w-8 h-8 bg-primary rounded-sm"></div></button>
                  <button @click="addShape('circle')" class="element-card"><div class="w-8 h-8 bg-primary rounded-full"></div></button>
                  <button @click="addShape('triangle')" class="element-card"><Shapes :size="32" class="text-primary" /></button>
               </div>
            </div>

            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">My Media</h3>
                <div class="grid grid-cols-2 gap-3">
                   <button @click="fileInputRef?.click()" class="aspect-square bg-surface-high rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-primary-container transition-colors cursor-pointer border border-dashed border-outline/20">
                      <div v-if="isUploading" class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <ImageIcon v-else :size="32" class="text-primary" />
                      <span class="label-small">{{ isUploading ? 'Uploading...' : 'Upload Image' }}</span>
                   </button>
                   <button @click="addMediaByUrl" class="aspect-square bg-surface-high rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-secondary-container transition-colors cursor-pointer border border-dashed border-outline/20">
                      <Link :size="32" class="text-secondary" />
                      <span class="label-small">Add URL</span>
                   </button>
                  <input type="file" hidden ref="fileInputRef" accept="image/*" @change="handleImageUpload" />

                   <button v-for="media in uploads" :key="media.id" @click="handleAddElement({ type: 'image', src: media.url, x: 100, y: 100, style: { width: 300, height: 300, opacity: 1, rotate: 0 } })" class="aspect-square bg-surface-high rounded-2xl overflow-hidden cursor-pointer border border-outline/10 hover:border-primary transition-all group p-0">
                      <img :src="media.url" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                   </button>
               </div>
            </div>

            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Advanced</h3>
                <div class="grid grid-cols-1 gap-3">
                   <button @click="addCustomElement" class="p-4 bg-surface-high rounded-2xl flex items-center gap-4 hover:bg-primary-container transition-colors cursor-pointer border border-outline/10">
                      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                         <Code2 :size="24" />
                      </div>
                      <div class="text-left">
                         <div class="label-large font-bold">Custom Element</div>
                         <div class="label-small opacity-60">Add raw HTML & CSS</div>
                      </div>
                   </button>
               </div>
            </div>
        </div>

        <!-- Tab: Text -->
        <div v-if="activeTab === 'text'" class="p-4 space-y-6">
            <div class="space-y-4">
               <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Text Styles</h3>
                <button @click="addTextHeader" class="w-full p-4 rounded-2xl bg-surface-high hover:bg-primary-container text-left transition-colors border border-outline/5">
                   <span class="headline-small block text-on-surface">Add a heading</span>
                </button>
                <button @click="addTextSubheading" class="w-full p-4 rounded-2xl bg-surface-high hover:bg-primary-container text-left transition-colors border border-outline/5">
                   <span class="title-large block text-on-surface">Add a subheading</span>
                </button>
                <button @click="addTextBody" class="w-full p-4 rounded-2xl bg-surface-high hover:bg-primary-container text-left transition-colors border border-outline/5">
                   <span class="body-large block text-on-surface-variant">Add a body text</span>
                </button>
                <button @click="addTextCaption" class="w-full p-4 rounded-2xl bg-surface-high hover:bg-primary-container text-left transition-colors border border-outline/5">
                   <span class="label-large block text-on-surface-variant uppercase tracking-widest">Add a caption</span>
                </button>
                <div class="h-px bg-outline/10 my-2"></div>
                <button @click="addTextCreative" class="w-full p-6 rounded-2xl bg-primary-container/20 hover:bg-primary-container/40 text-center transition-all border border-primary/20 group overflow-hidden relative">
                   <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <span class="headline-medium block text-primary italic font-serif relative z-10">Creative Text</span>
                </button>
            </div>
        </div>

        <!-- Tab: Properties -->
        <div v-if="activeTab === 'properties'" class="flex flex-col">
            <div v-if="selectedElement" class="flex flex-col">
                <!-- Content (Text Only) -->
                <div v-if="selectedElement.type === 'text'" class="section-container">
                    <button @click="toggleSection('content')" class="section-header">
                        <div class="flex items-center gap-3"><AlignLeft :size="16" /><span class="label-large">Content</span></div>
                        <ChevronDown v-if="openSections.content" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.content" class="px-4 pb-4">
                        <textarea 
                            class="w-full h-24 p-3 rounded-xl bg-surface-high border border-outline/10 focus:border-primary outline-none resize-none text-sm transition-colors"
                            :value="selectedElement!.content"
                            @input="(e: any) => handleInput(selectedId!, 'content', e.target.value)"
                            placeholder="Type your text here..."
                        ></textarea>
                    </div>
                </div>

                <!-- Typography (Text Only) -->
                <div v-if="selectedElement.type === 'text'" class="section-container">
                    <button @click="toggleSection('typography')" class="section-header">
                        <div class="flex items-center gap-3"><Type :size="16" /><span class="label-large">Typography</span></div>
                        <ChevronDown v-if="openSections.typography" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.typography" class="space-y-4 px-4 pb-4">
                        <!-- Font Selection & Search -->
                        <div class="space-y-2"> 
                            <div class="flex items-center gap-2">
                                <md-filled-text-field 
                                    class="flex-1" 
                                    label="Search Fonts" 
                                    :value="searchQuery" 
                                    @input="(e: any) => searchQuery = e.target.value"
                                >
                                    <Search slot="leading-icon" :size="16" />
                                </md-filled-text-field>
                                <button 
                                    @click="isGoogleFontsActive = !isGoogleFontsActive" 
                                    class="w-12 h-12 flex items-center justify-center rounded-xl border transition-all relative"
                                    :class="isGoogleFontsActive ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-surface-high border-outline/10 text-on-surface-variant hover:border-primary/50'"
                                    title="Toggle Google Fonts"
                                >
                                    <div v-if="isLoadingFonts" class="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-xl">
                                         <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <Globe v-else :size="20" />
                                </button>
                                <button 
                                    @click="handleAddFontFromUrl" 
                                    class="w-12 h-12 flex items-center justify-center rounded-xl border border-outline/10 bg-surface-high text-on-surface-variant hover:border-primary/50 transition-all"
                                    title="Add Font from URL"
                                >
                                    <Link :size="20" />
                                </button>
                            </div>

                            <!-- Font List -->
                            <div class="h-40 overflow-y-auto rounded-xl border border-outline/10 bg-surface-high p-1 space-y-1">
                                <div v-if="filteredFonts.length === 0" class="p-4 text-center text-xs text-on-surface-variant">
                                    {{ isLoadingFonts ? 'Loading fonts...' : 'No fonts found' }}
                                </div>
                                <button 
                                    v-for="font in filteredFonts" 
                                    :key="font.family"
                                    @click="() => {
                                        applyFont(font);
                                        handleInput(selectedId!, 'fontFamily', font.family, true);
                                    }"
                                    class="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-variant flex items-center justify-between group"
                                    :class="{'bg-primary-container text-on-primary-container': selectedElement!.style.fontFamily === font.family}"
                                >
                                    <span :style="{ fontFamily: font.family }">{{ font.family }}</span>
                                    <span v-if="font.category === 'google'" class="text-[10px] uppercase font-bold opacity-50"><Globe :size="10" /></span>
                                </button>
                            </div>
                            
                             <!-- System Fonts Access -->
                             <button v-if="!isGoogleFontsActive" @click="queryLocalFonts" class="w-full py-2 text-xs text-primary font-bold hover:underline flex items-center justify-center gap-1">
                                <MonitorDown :size="12" />
                                Load System Fonts (Experimental)
                             </button>
                        </div>

                        <!-- Size & Line Height -->
                        <div class="grid grid-cols-2 gap-2">
                            <md-filled-text-field label="Size" type="number" :value="String(selectedElement!.style.fontSize || 16)" @input="(e: any) => handleInput(selectedId!, 'fontSize', parseInt(e.target.value), true)"></md-filled-text-field>
                            <md-filled-text-field label="Line Height" type="number" step="0.1" :value="String(selectedElement!.style.lineHeight || 1.2)" @input="(e: any) => handleInput(selectedId!, 'lineHeight', parseFloat(e.target.value), true)"></md-filled-text-field>
                        </div>

                        <!-- Alignment -->
                        <div class="flex bg-surface-high rounded-lg p-1">
                            <button v-for="align in ['left', 'center', 'right']" :key="align" @click="handleInput(selectedId!, 'textAlign', align, true)" 
                                class="flex-1 py-2 rounded-md hover:bg-surface-variant transition-colors" :class="{'bg-primary-container text-on-primary-container': selectedElement!.style.textAlign === align}">
                                <div class="capitalize text-xs">{{ align }}</div>
                            </button>
                        </div>

                        <!-- Style Toggles (Bold, Italic, Upper, Lower, Underline) -->
                        <div class="flex flex-wrap gap-2">
                             <button @click="handleInput(selectedId!, 'fontWeight', selectedElement!.style.fontWeight === 'bold' ? 'normal' : 'bold', true)" class="w-10 h-10 rounded-lg border border-outline/10 flex items-center justify-center hover:bg-surface-variant" :class="{'bg-primary-container': selectedElement!.style.fontWeight === 'bold'}">B</button>
                             <button @click="handleInput(selectedId!, 'fontStyle', selectedElement!.style.fontStyle === 'italic' ? 'normal' : 'italic', true)" class="w-10 h-10 rounded-lg border border-outline/10 flex items-center justify-center hover:bg-surface-variant italic" :class="{'bg-primary-container': selectedElement!.style.fontStyle === 'italic'}">I</button>
                             <button @click="handleInput(selectedId!, 'textDecoration', selectedElement!.style.textDecoration === 'underline' ? 'none' : 'underline', true)" class="w-10 h-10 rounded-lg border border-outline/10 flex items-center justify-center hover:bg-surface-variant underline" :class="{'bg-primary-container': selectedElement!.style.textDecoration === 'underline'}">U</button>
                             <button @click="handleInput(selectedId!, 'textTransform', selectedElement!.style.textTransform === 'uppercase' ? 'none' : 'uppercase', true)" class="w-10 h-10 rounded-lg border border-outline/10 flex items-center justify-center hover:bg-surface-variant" :class="{'bg-primary-container': selectedElement!.style.textTransform === 'uppercase'}">TT</button>
                        </div>

                        <!-- Color -->
                        <div class="flex items-center justify-between p-2 bg-surface-high rounded-xl">
                            <span class="label-medium">Color</span>
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-xs uppercase">{{ selectedElement!.style.color }}</span>
                                <input type="color" :value="selectedElement!.style.color || '#000000'" @input="(e: any) => handleInput(selectedId!, 'color', e.target.value, true)" class="w-8 h-8 rounded-full border-none p-0 cursor-pointer" />
                            </div>
                        </div>

                        <!-- Letter Spacing -->
                          <div class="space-y-1">
                             <div class="flex justify-between"><span class="label-small">Letter Spacing</span><span class="label-small">{{ selectedElement!.style.letterSpacing || 0 }}px</span></div>
                             <md-slider min="-5" max="20" with-tick-marks :value="parseInt(String(selectedElement!.style.letterSpacing || '0'))" @input="(e: any) => handleInput(selectedId!, 'letterSpacing', parseFloat(e.target.value), true)"></md-slider>
                          </div>

                         <!-- Stroke (Outline) -->
                         <div class="space-y-2 pt-2 border-t border-outline/10">
                            <div class="flex items-center justify-between">
                                <span class="label-medium">Stroke</span>
                                 <div class="flex items-center gap-2">
                                    <input type="color" :value="selectedElement!.style.webkitTextStrokeColor || '#000000'" @input="(e: any) => handleInput(selectedId!, 'webkitTextStrokeColor', e.target.value, true)" class="w-6 h-6 rounded bg-transparent" />
                                    <input type="number" class="w-12 h-8 rounded bg-surface-variant px-1 text-center text-sm" :value="selectedElement!.style.webkitTextStrokeWidth || 0" @input="(e: any) => handleInput(selectedId!, 'webkitTextStrokeWidth', parseFloat(e.target.value), true)" />
                                    <span class="text-xs">px</span>
                                </div>
                            </div>
                         </div>
                        
                         <!-- Shadow -->
                         <div class="space-y-2 pt-2 border-t border-outline/10">
                            <div class="flex items-center justify-between">
                                <span class="label-medium">Shadow</span>
                                 <div class="flex items-center gap-2">
                                      <md-switch :selected="!!selectedElement!.style.shadow" @change="(e: any) => {
                                          if (e.target.selected) handleInput(selectedId!, 'shadow', { color: '#000000', blur: 4, offsetX: 2, offsetY: 2 }, true);
                                          else handleInput(selectedId!, 'shadow', undefined, true);
                                      }"></md-switch>
                                 </div>
                            </div>
                            <div v-if="selectedElement!.style.shadow" class="grid grid-cols-2 gap-2">
                                <div class="col-span-2 flex items-center justify-between bg-surface-high p-2 rounded-lg">
                                    <span class="text-xs">Color</span>
                                    <input type="color" :value="selectedElement!.style.shadow.color" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, color: e.target.value }, true)" class="w-6 h-6 rounded bg-transparent" />
                                </div>
                                <md-filled-text-field label="X" type="number" :value="String(selectedElement!.style.shadow.offsetX)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetX: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                                <md-filled-text-field label="Y" type="number" :value="String(selectedElement!.style.shadow.offsetY)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetY: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                                <md-filled-text-field label="Blur" type="number" class="col-span-2" :value="String(selectedElement!.style.shadow.blur)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, blur: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                            </div>
                         </div>

                    </div>
                </div>

                <!-- Transform -->
                <div class="section-container">
                    <button @click="toggleSection('transform')" class="section-header">
                        <div class="flex items-center gap-3"><Maximize2 :size="16" /><span class="label-large">Transform</span></div>
                        <ChevronDown v-if="openSections.transform" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.transform" class="grid grid-cols-2 gap-2 px-4 pb-4">
                        <md-filled-text-field label="X" type="number" :value="String(Math.round(selectedElement!.x))" @input="(e: any) => handleInput(selectedId!, 'x', parseInt(e.target.value) || 0)"></md-filled-text-field>
                        <md-filled-text-field label="Y" type="number" :value="String(Math.round(selectedElement!.y))" @input="(e: any) => handleInput(selectedId!, 'y', parseInt(e.target.value) || 0)"></md-filled-text-field>
                        <md-filled-text-field label="Rotate" type="number" :value="String(Math.round(selectedElement!.style.rotate || 0))" @input="(e: any) => handleInput(selectedId!, 'rotate', parseInt(e.target.value) || 0, true)"></md-filled-text-field>
                        <md-filled-text-field label="Opacity" type="number" step="0.1" :value="String(selectedElement!.style.opacity ?? 1)" @input="(e: any) => handleInput(selectedId!, 'opacity', parseFloat(e.target.value) || 1, true)"></md-filled-text-field>
                    </div>
                </div>

                <!-- Image Adjustments (Image Only) -->
                <div v-if="selectedElement.type === 'image'" class="section-container">
                    <button @click="toggleSection('image')" class="section-header">
                        <div class="flex items-center gap-3"><ImageIcon :size="16" /><span class="label-large">Image Adjustments</span></div>
                        <ChevronDown v-if="openSections.image" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.image" class="space-y-4 px-4 pb-4">
                        <!-- Inline Cropper Mode -->
                        <div v-if="isCropping" class="flex flex-col gap-3">
                             <div class="h-64 bg-black/50 rounded-lg overflow-hidden relative">
                                <Cropper
                                    v-if="selectedElement!.src"
                                    ref="cropperRef"
                                    class="cropper"
                                    :src="selectedElement!.src"
                                    :stencil-props="{ aspectRatio: 0 }" 
                                />
                             </div>
                             <div class="grid grid-cols-2 gap-2">
                                <button @click="isCropping = false" class="py-2 rounded-lg border border-outline/20 hover:bg-surface-variant font-bold text-sm">Cancel</button>
                                <button @click="saveInlineCrop" class="py-2 rounded-lg bg-primary text-on-primary font-bold text-sm">Apply Crop</button>
                             </div>
                        </div>

                        <!-- TUI Editor Inline Mode -->
                        <div v-if="isTuiActive" class="flex flex-col gap-3">
                            <div id="tui-image-editor-container" class="h-64 bg-surface-high rounded-xl overflow-hidden relative border border-outline/10">
                                <div v-if="isTuiLoading" class="absolute inset-0 z-10 bg-surface/50 flex items-center justify-center backdrop-blur-sm">
                                    <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2" :class="{ 'opacity-50 pointer-events-none': isTuiLoading }">
                                <button @click="applyTuiFilter('Grayscale')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Grayscale</button>
                                <button @click="applyTuiFilter('Sepia')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Sepia</button>
                                <button @click="applyTuiFilter('Invert')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Invert</button>
                                <button @click="applyTuiFilter('Blur')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Blur</button>
                                <button @click="applyTuiFilter('Pixelate')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Pixelate</button>
                                <button @click="applyTuiFilter('Emboss')" class="py-2 rounded-lg bg-surface-variant text-xs hover:bg-primary/10">Emboss</button>
                            </div>

                            <div class="flex gap-2 pt-2 border-t border-outline/10">
                                <button @click="cancelTui" class="flex-1 py-2 rounded-lg border border-outline/20 font-bold text-sm">Cancel</button>
                                <button @click="saveTuiForReal" class="flex-1 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm" :disabled="isTuiLoading">Save</button>
                            </div>
                        </div>

                        <!-- Standard Image Controls -->
                        <div v-else class="space-y-4">
                            <div class="grid grid-cols-2 gap-2">
                                <button @click="isCropping = true" class="p-3 rounded-xl bg-secondary-container text-on-secondary-container font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                    <Crop :size="20" />
                                    <span>Crop</span>
                                </button>
                                <button @click="initTui" class="p-3 rounded-xl bg-tertiary-container text-on-tertiary-container font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                    <Wand2 :size="20" />
                                    <span>Advanced</span>
                                </button>
                            </div>

                            <!-- Filters -->
                             <div class="space-y-3">
                                <h4 class="label-small uppercase text-on-surface-variant font-bold">Adjustments</h4>
                                 
                                 <div class="space-y-1">
                                    <div class="flex justify-between"><span class="label-small">Brightness</span><span class="label-small">{{ selectedElement!.style.brightness || 100 }}%</span></div>
                                    <md-slider min="0" max="200" with-tick-marks :value="selectedElement!.style.brightness || 100" @input="(e: any) => handleInput(selectedId!, 'brightness', e.target.value, true)"></md-slider>
                                 </div>
                                 <div class="space-y-1">
                                    <div class="flex justify-between"><span class="label-small">Contrast</span><span class="label-small">{{ selectedElement!.style.contrast || 100 }}%</span></div>
                                    <md-slider min="0" max="200" with-tick-marks :value="selectedElement!.style.contrast || 100" @input="(e: any) => handleInput(selectedId!, 'contrast', e.target.value, true)"></md-slider>
                                 </div>
                                 <div class="space-y-1">
                                    <div class="flex justify-between"><span class="label-small">Saturation</span><span class="label-small">{{ selectedElement!.style.saturate || 100 }}%</span></div>
                                    <md-slider min="0" max="200" with-tick-marks :value="selectedElement!.style.saturate || 100" @input="(e: any) => handleInput(selectedId!, 'saturate', e.target.value, true)"></md-slider>
                                 </div>
                                 
                                 <div class="grid grid-cols-2 gap-3 pt-2">
                                     <div class="space-y-1">
                                        <div class="flex justify-between"><span class="label-small">Blur</span><span class="label-small">{{ selectedElement!.style.blur || 0 }}px</span></div>
                                        <md-slider min="0" max="20" :value="selectedElement!.style.blur || 0" @input="(e: any) => handleInput(selectedId!, 'blur', e.target.value, true)"></md-slider>
                                     </div>
                                     <div class="space-y-1">
                                        <div class="flex justify-between"><span class="label-small">Sepia</span><span class="label-small">{{ selectedElement!.style.sepia || 0 }}%</span></div>
                                        <md-slider min="0" max="100" :value="selectedElement!.style.sepia || 0" @input="(e: any) => handleInput(selectedId!, 'sepia', e.target.value, true)"></md-slider>
                                     </div>
                                     <div class="space-y-1">
                                        <div class="flex justify-between"><span class="label-small">Grayscale</span><span class="label-small">{{ selectedElement!.style.grayscale || 0 }}%</span></div>
                                        <md-slider min="0" max="100" :value="selectedElement!.style.grayscale || 0" @input="(e: any) => handleInput(selectedId!, 'grayscale', e.target.value, true)"></md-slider>
                                     </div>
                                     <div class="space-y-1">
                                        <div class="flex justify-between"><span class="label-small">Invert</span><span class="label-small">{{ selectedElement!.style.invert || 0 }}%</span></div>
                                        <md-slider min="0" max="100" :value="selectedElement!.style.invert || 0" @input="(e: any) => handleInput(selectedId!, 'invert', e.target.value, true)"></md-slider>
                                     </div>
                                 </div>

                                 <div class="space-y-1 pt-2">
                                    <div class="flex justify-between"><span class="label-small">Hue Rotate</span><span class="label-small">{{ selectedElement!.style.hueRotate || 0 }}deg</span></div>
                                    <md-slider min="0" max="360" :value="selectedElement!.style.hueRotate || 0" @input="(e: any) => handleInput(selectedId!, 'hueRotate', e.target.value, true)"></md-slider>
                                 </div>
                             </div>
                        
                             <!-- Quick Transform -->
                            <div class="space-y-2 pt-2 border-t border-outline/10">
                                <span class="label-medium">Transform</span>
                                <div class="flex gap-2">
                                    <button @click="handleInput(selectedId!, 'flipX', !selectedElement!.style.flipX, true)" class="flex-1 py-2 rounded-lg border border-outline/20 hover:bg-primary-container hover:border-primary transition-colors" :class="{'bg-primary-container border-primary': selectedElement!.style.flipX}">Flip H</button>
                                    <button @click="handleInput(selectedId!, 'flipY', !selectedElement!.style.flipY, true)" class="flex-1 py-2 rounded-lg border border-outline/20 hover:bg-primary-container hover:border-primary transition-colors" :class="{'bg-primary-container border-primary': selectedElement!.style.flipY}">Flip V</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Shape Adjustments (Shape Only) -->
                <div v-if="selectedElement.type === 'shape'" class="section-container">
                    <button @click="toggleSection('appearance')" class="section-header">
                        <div class="flex items-center gap-3"><Shapes :size="16" /><span class="label-large">Shape Properties</span></div>
                        <ChevronDown v-if="openSections.appearance" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.appearance" class="space-y-4 px-4 pb-4">
                        <div class="space-y-2">
                             <h4 class="label-small uppercase text-on-surface-variant font-bold">Shape Type</h4>
                             <div class="grid grid-cols-3 gap-2">
                                 <button v-for="type in ['rectangle', 'circle', 'triangle']" :key="type" 
                                     @click="handleInput(selectedId!, 'shapeType', type, true)"
                                     class="py-2 rounded-lg border transition-all text-sm capitalize"
                                     :class="selectedElement!.style.shapeType === type ? 'bg-primary-container border-primary text-on-primary-container font-bold' : 'bg-surface-high border-outline/10'"
                                 >
                                     {{ type }}
                                 </button>
                             </div>
                        </div>

                        <div class="space-y-2 pt-2 border-t border-outline/10">
                            <h4 class="label-small uppercase text-on-surface-variant font-bold">Background</h4>
                            <div class="flex items-center gap-3 p-3 bg-surface-high rounded-xl border border-outline/10">
                                <input type="color" :value="selectedElement!.style.backgroundColor || '#0061a4'" @input="(e: any) => handleInput(selectedId!, 'backgroundColor', e.target.value, true)" class="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0" />
                                <span class="label-medium font-mono uppercase">{{ selectedElement!.style.backgroundColor || '#0061a4' }}</span>
                            </div>
                        </div>

                         <div class="space-y-2 pt-2 border-t border-outline/10" v-if="selectedElement!.style.shapeType !== 'circle'">
                            <div class="flex justify-between items-center">
                                <h4 class="label-small uppercase text-on-surface-variant font-bold">Corner Radius</h4>
                                <span class="label-small">{{ parseInt(String(selectedElement!.style.borderRadius || 0)) }}px</span>
                            </div>
                            <md-slider min="0" max="200" :value="parseInt(String(selectedElement!.style.borderRadius || 0))" @input="(e: any) => handleInput(selectedId!, 'borderRadius', e.target.value, true)"></md-slider>
                         </div>
                    </div>
                </div>

                <!-- Appearance -->
                <div v-if="selectedElement.type !== 'text'" class="section-container">
                    <button @click="toggleSection('appearance')" class="section-header">
                        <div class="flex items-center gap-3"><Palette :size="16" /><span class="label-large">Appearance</span></div>
                        <ChevronDown v-if="openSections.appearance" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.appearance" class="space-y-4 px-4 pb-4">
                        <!-- Shape Background -->
                        <div v-if="selectedElement.type === 'shape'" class="flex items-center gap-2 p-2 bg-surface-high rounded-xl">
                            <input type="color" :value="selectedElement!.style.backgroundColor" @input="(e: any) => handleInput(selectedId!, 'backgroundColor', e.target.value, true)" class="w-8 h-8 rounded-md bg-transparent" />
                            <span class="label-small uppercase font-mono">{{ selectedElement!.style.backgroundColor }}</span>
                        </div>
                        
                        <!-- Blend Mode -->
                        <md-outlined-select label="Blend" class="w-full" :value="selectedElement!.style.mixBlendMode || 'normal'" @change="(e: any) => handleInput(selectedId!, 'mixBlendMode', e.target.value, true)">
                            <md-select-option v-for="m in BLEND_MODES" :key="m" :value="m"><div slot="headline">{{ m }}</div></md-select-option>
                        </md-outlined-select>

                        <!-- Border Radius (Images/Shapes) -->
                         <div class="space-y-1">
                            <div class="flex justify-between"><span class="label-small">Corner Radius</span><span class="label-small">{{ parseInt(String(selectedElement!.style.borderRadius || 0)) }}px</span></div>
                            <md-slider min="0" max="200" :value="parseInt(String(selectedElement!.style.borderRadius || 0))" @input="(e: any) => handleInput(selectedId!, 'borderRadius', e.target.value, true)"></md-slider>
                         </div>

                         <!-- Border (Stroke) -->
                         <div class="space-y-2 pt-2 border-t border-outline/10">
                            <div class="flex items-center justify-between">
                                <span class="label-medium">Border</span>
                                <div class="flex items-center gap-2">
                                    <input type="color" :value="selectedElement!.style.borderColor || '#000000'" @input="(e: any) => handleInput(selectedId!, 'borderColor', e.target.value, true)" class="w-6 h-6 rounded bg-transparent" />
                                    <input type="number" class="w-12 h-8 rounded bg-surface-variant px-1 text-center text-sm" :value="selectedElement!.style.borderWidth || 0" @input="(e: any) => handleInput(selectedId!, 'borderWidth', parseFloat(e.target.value), true)" />
                                    <span class="text-xs">px</span>
                                </div>
                            </div>
                         </div>

                         <!-- Shadow -->
                         <div class="space-y-2 pt-2 border-t border-outline/10">
                            <div class="flex items-center justify-between">
                                <span class="label-medium">Shadow</span>
                                <div class="flex items-center gap-2">
                                     <md-switch :selected="!!selectedElement!.style.shadow" @change="(e: any) => {
                                         if (e.target.selected) handleInput(selectedId!, 'shadow', { color: '#000000', blur: 10, offsetX: 5, offsetY: 5 }, true);
                                         else handleInput(selectedId!, 'shadow', undefined, true);
                                     }"></md-switch>
                                </div>
                            </div>
                            <div v-if="selectedElement!.style.shadow" class="grid grid-cols-2 gap-2">
                                <div class="col-span-2 flex items-center justify-between bg-surface-high p-2 rounded-lg">
                                    <span class="text-xs">Color</span>
                                    <input type="color" :value="selectedElement!.style.shadow.color" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, color: e.target.value }, true)" class="w-6 h-6 rounded bg-transparent" />
                                </div>
                                <md-filled-text-field label="X" type="number" :value="String(selectedElement!.style.shadow.offsetX)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetX: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                                <md-filled-text-field label="Y" type="number" :value="String(selectedElement!.style.shadow.offsetY)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetY: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                                <md-filled-text-field label="Blur" type="number" class="col-span-2" :value="String(selectedElement!.style.shadow.blur)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, blur: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Canvas Defaults -->
            <div v-else class="flex flex-col">
                <div class="section-container">
                    <button @click="toggleSection('canvas')" class="section-header text-primary">
                        <div class="flex items-center gap-3"><Smartphone :size="16" /><span class="label-large">Canvas</span></div>
                        <ChevronDown v-if="openSections.canvas" :size="16" /><ChevronRight v-else :size="16" />
                    </button>
                    <div v-if="openSections.canvas" class="space-y-4 px-4 pb-4">
                         <md-outlined-select label="Preset Size" class="w-full" @change="(e: any) => {
                             const p = CANVAS_PRESETS.find((x: any) => x.name === e.target.value);
                             if (p) { posterSize.w = p.w; posterSize.h = p.h; }
                         }">
                             <md-select-option v-for="p in CANVAS_PRESETS" :key="p.name" :value="p.name" :selected="posterSize.w === p.w && posterSize.h === p.h">
                                <div slot="headline">{{ p.name }}</div>
                             </md-select-option>
                         </md-outlined-select>

                        <div class="grid grid-cols-2 gap-2">
                            <md-filled-text-field label="W" type="number" :value="String(posterSize.w)" @input="(e: any) => posterSize.w = parseInt(e.target.value) || 500"></md-filled-text-field>
                            <md-filled-text-field label="H" type="number" :value="String(posterSize.h)" @input="(e: any) => posterSize.h = parseInt(e.target.value) || 700"></md-filled-text-field>
                        </div>
                        <div class="flex items-center justify-between p-2">
                           <span class="label-large">Show Grid</span>
                           <md-switch :selected="showGrid" @change="showGrid = !showGrid"></md-switch>
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <span class="label-large">Background</span>
                            <div class="flex bg-surface-high rounded-full p-1 gap-1">
                                <button @click="backgroundType = 'solid'" class="flex-1 py-1 rounded-full text-xs font-bold transition-colors" :class="backgroundType === 'solid' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'">Solid</button>
                                <button @click="backgroundType = 'gradient'" class="flex-1 py-1 rounded-full text-xs font-bold transition-colors" :class="backgroundType === 'gradient' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'">Gradient</button>
                            </div>

                            <div v-if="backgroundType === 'solid'" class="flex items-center gap-3 p-3 bg-primary-container rounded-2xl transition-all">
                                <input type="color" :value="bgColor" @input="(e: any) => bgColor = e.target.value" class="w-10 h-10 rounded-xl bg-white p-0.5" />
                                <span class="title-small text-on-primary-container font-mono">{{ bgColor }}</span>
                            </div>

                            <div v-else class="flex flex-col gap-2 transition-all">
                                <div class="h-12 w-full rounded-xl border border-outline/20" :style="{ background: gradientStyle }"></div>
                                <md-filled-text-field label="Gradient CSS" :value="gradientStyle" @input="(e: any) => gradientStyle = e.target.value" class="w-full"></md-filled-text-field>
                                <div class="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                                    <button v-for="g in ['linear-gradient(to right, #ff7e5f, #feb47b)', 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)']" :key="g" 
                                        @click="gradientStyle = g"
                                        class="w-8 h-8 rounded-full border border-outline/10 shrink-0" 
                                        :style="{ background: g }">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Code -->
        <div v-if="activeTab === 'code'" class="p-4 flex flex-col gap-6">
            <div v-if="!selectedElement" class="p-8 text-center text-on-surface-variant opacity-60">
                <Code2 :size="48" class="mx-auto mb-2 opacity-50" />
                <p class="body-medium">Select an element to edit its code</p>
                <md-filled-button @click="addCustomElement" class="mt-4">Create Custom Element</md-filled-button>
            </div>
            
            <div v-else class="space-y-6">
                <div class="section-container !p-0 overflow-hidden">
                    <div class="section-header !bg-primary/5 text-primary">
                        <div class="flex items-center gap-3"><Code2 :size="16" /><span class="label-large">HTML Markup</span></div>
                    </div>
                    <div class="p-4 space-y-2">
                        <p class="label-small text-on-surface-variant/70">Custom HTML content for this element.</p>
                        <textarea 
                            class="w-full h-40 p-3 rounded-xl bg-surface-high border border-outline/10 focus:border-primary outline-none font-mono text-xs transition-colors"
                            :value="selectedElement!.customHtml"
                            @input="(e: any) => updateElement(selectedId!, { customHtml: e.target.value })"
                            placeholder="<div>...</div>"
                        ></textarea>
                    </div>
                </div>

                <div class="section-container !p-0 overflow-hidden">
                    <div class="section-header !bg-secondary/5 text-secondary">
                        <div class="flex items-center gap-3"><Palette :size="16" /><span class="label-large">CSS Styles</span></div>
                    </div>
                    <div class="p-4 space-y-2">
                        <p class="label-small text-on-surface-variant/70">Use <code class="bg-surface-variant px-1 rounded">selector</code> to target this element.</p>
                        <textarea 
                            class="w-full h-40 p-3 rounded-xl bg-surface-high border border-outline/10 focus:border-primary outline-none font-mono text-xs transition-colors"
                            :value="selectedElement!.style.customCss"
                            @input="(e: any) => handleInput(selectedId!, 'customCss', e.target.value, true)"
                            placeholder="selector { ... }"
                        ></textarea>
                    </div>
                </div>

                <div class="bg-surface-variant p-4 rounded-2xl flex items-start gap-3">
                    <InfoIcon :size="16" class="mt-0.5 text-primary shrink-0" />
                    <p class="label-small text-on-surface-variant leading-relaxed">
                        Custom code allows you to create complex elements or add unique animations. Be careful as malformed HTML or CSS could affect your browser's performance.
                    </p>
                </div>
            </div>
        </div>

        <!-- Tab: Layers -->
        <div v-if="activeTab === 'layers'" class="p-2 flex flex-col gap-2">
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

.element-card {
  @apply aspect-square bg-surface-high rounded-xl flex items-center justify-center hover:bg-primary-container transition-colors border border-outline/5;
}
.section-header {
  @apply w-full flex items-center justify-between px-4 py-4 hover:bg-surface-high transition-colors text-on-surface;
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--md-sys-color-surface-variant); border-radius: 10px; }
</style>
