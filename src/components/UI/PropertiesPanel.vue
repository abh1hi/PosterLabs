<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas } from '../../composables/useCanvas'
import { 
  ChevronDown, ChevronRight, Search, Plus, Bold, Italic, 
  AlignLeft, AlignCenter, AlignRight, Crop, FlipHorizontal, FlipVertical,
  Droplet, X, Smartphone, Monitor, Square, Circle, Triangle, Star, Hexagon,
  Layout, Type, Image as ImageIcon, Box, Layers, Eye, EyeOff, Lock, Unlock,
  Palette, Settings, Maximize2
} from 'lucide-vue-next'
import { POSTER_SIZES, COLOR_PALETTES } from '../../constants'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/slider/slider.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-tonal-button.js'

const { elements, selectedId, updateElement, updateStyle, addShape } = useElements()
const { posterSize, bgColor, isMobilePropertiesOpen, isShapesLibraryOpen } = useCanvas() 

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
]

const shapeTypes = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'star', label: 'Star' },
  { id: 'hexagon', label: 'Hexagon' },
]

// Accordion State
const openSections = ref({
  content: false,
  appearance: false,
  typography: false,
  presets: false,
  themes: false,
  layers: false
})

const toggleSection = (section: keyof typeof openSections.value) => {
  openSections.value[section] = !openSections.value[section]
}

watch(selectedId, (val) => {
    if(val) {
        isMobilePropertiesOpen.value = true
        isShapesLibraryOpen.value = false
    }
})

const applyPalette = (p: any) => {
    bgColor.value = p.bg
}

const selectedElement = computed(() => elements.value.find(e => e.id === selectedId.value))
const layers = computed(() => [...elements.value].reverse())

// Font Picker
const isFontPickerOpen = ref(false)
const fontSearch = ref('')
const availableFonts = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Playfair Display', family: '"Playfair Display", serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif' },
  { name: 'Anton', family: '"Anton", sans-serif' },
]

const filteredFonts = computed(() => {
  return availableFonts.filter(f => f.name.toLowerCase().includes(fontSearch.value.toLowerCase()))
})

const handleInput = (id: number, field: string, value: any, isStyle = false) => {
    if (isStyle) {
        updateStyle(id, { [field]: value })
    } else {
        updateElement(id, { [field]: value })
    }
}

const toggleVisibility = (id: number, current: boolean) => {
    updateElement(id, { hidden: !current })
}

const toggleLock = (id: number, current: boolean) => {
    updateElement(id, { locked: !current })
}
</script>

<template>
  <div v-if="isMobilePropertiesOpen" 
    class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] md:hidden"
    @click="isMobilePropertiesOpen = false"
  ></div>

  <aside 
    class="fixed inset-x-0 bottom-0 z-[101] md:sticky md:top-0 md:inset-auto md:z-20 w-full md:w-80 h-[85vh] md:h-screen border-t md:border-t-0 md:border-r flex flex-col transition-all duration-300 ease-in-out theme-transition shadow-2xl md:shadow-none bg-panel overflow-hidden"
    :class="[isMobilePropertiesOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0']"
  >
     <!-- Header -->
     <div class="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-panel z-10">
        <h2 class="font-bold text-xs uppercase tracking-widest text-blue-500">{{ isShapesLibraryOpen ? 'Shapes' : (selectedId ? 'Properties' : 'Canvas') }}</h2>
        <div class="flex items-center gap-1">
            <md-icon-button @click="isMobilePropertiesOpen = false" class="md:hidden"><X :size="20" /></md-icon-button>
            <md-icon-button v-if="selectedId" @click="selectedId = null" title="Back to Canvas Settings"><Settings :size="18" /></md-icon-button>
        </div>
     </div>

     <div class="flex-1 overflow-y-auto custom-scrollbar">
        <!-- Shapes Library -->
        <div v-if="isShapesLibraryOpen" class="p-6 grid grid-cols-2 gap-4">
            <button v-for="s in shapeTypes" :key="s.id" @click="addElement({ id: Date.now(), type: 'shape', x: 100, y: 100, style: { width: 150, height: 150, backgroundColor: '#3b82f6', borderRadius: 0, shapeType: s.id, opacity: 1, rotate: 0 } })" class="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-500/5 hover:bg-blue-500/5 transition-all">
                <Box class="text-blue-500 group-hover:scale-110 transition-transform" :size="32" />
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">{{ s.label }}</span>
            </button>
        </div>

        <!-- Properties / Canvas Settings -->
        <div v-else class="flex flex-col">
            
            <!-- ELEMENT PROPERTIES -->
            <template v-if="selectedId && selectedElement">
                <!-- CONTENT SECTION -->
                <div class="border-b">
                   <button @click="toggleSection('content')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-500/5 transition-colors">
                      <div class="flex items-center gap-3">
                         <Type :size="16" class="text-blue-500" />
                         <span class="text-xs font-bold uppercase tracking-widest">Content</span>
                      </div>
                      <ChevronDown v-if="openSections.content" :size="16" />
                      <ChevronRight v-else :size="16" />
                   </button>
                   <div v-if="openSections.content" class="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <md-filled-text-field v-if="selectedElement.type === 'text'" label="Text" type="textarea" class="w-full" :value="selectedElement.content" @input="(e: any) => handleInput(selectedElement!.id, 'content', e.target.value)"></md-filled-text-field>
                      <div v-if="selectedElement.type === 'shape'" class="space-y-4">
                         <md-outlined-select label="Shape" class="w-full" :value="selectedElement.style.shapeType || 'rectangle'" @change="(e: any) => updateStyle(selectedElement!.id, { shapeType: e.target.value })">
                            <md-select-option v-for="s in shapeTypes" :key="s.id" :value="s.id"><div slot="headline">{{ s.label }}</div></md-select-option>
                         </md-outlined-select>
                      </div>
                   </div>
                </div>

                <!-- TYPOGRAPHY SECTION (Text Only) -->
                <div v-if="selectedElement.type === 'text'" class="border-b">
                   <button @click="toggleSection('typography')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-500/5 transition-colors">
                      <div class="flex items-center gap-3">
                         <Type :size="16" class="text-blue-500" />
                         <span class="text-xs font-bold uppercase tracking-widest">Typography</span>
                      </div>
                      <ChevronDown v-if="openSections.typography" :size="16" />
                      <ChevronRight v-else :size="16" />
                   </button>
                   <div v-if="openSections.typography" class="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                       <div class="relative">
                           <div @click="isFontPickerOpen = !isFontPickerOpen" class="cursor-pointer">
                              <md-filled-text-field label="Font" readonly :value="availableFonts.find(f => f.family === selectedElement!.style.fontFamily)?.name || 'Select Font'" class="w-full pointer-events-none">
                                 <ChevronDown slot="trailing-icon" :size="18" />
                              </md-filled-text-field>
                           </div>
                           <div v-if="isFontPickerOpen" class="absolute top-full left-0 w-full mt-1 border rounded-xl shadow-2xl z-50 bg-panel max-h-48 overflow-y-auto custom-scrollbar p-1">
                               <button v-for="f in availableFonts" :key="f.name" @click="updateStyle(selectedId!, { fontFamily: f.family }); isFontPickerOpen = false" class="w-full text-left px-4 py-2 hover:bg-blue-500/10 rounded-lg text-xs font-semibold" :style="{fontFamily: f.family}">{{ f.name }}</button>
                           </div>
                       </div>
                       <div class="grid grid-cols-2 gap-3">
                          <md-filled-text-field label="Size" type="number" class="w-full" :value="String(selectedElement.style.fontSize)" @input="(e: any) => handleInput(selectedElement!.id, 'fontSize', parseInt(e.target.value) || 24, true)"></md-filled-text-field>
                          <div class="flex gap-1 justify-end">
                             <md-icon-button toggle :selected="selectedElement.style.fontWeight === 'bold'" @click="updateStyle(selectedId!, { fontWeight: selectedElement!.style.fontWeight === 'bold' ? 'normal' : 'bold' })"><Bold :size="16" /></md-icon-button>
                             <md-icon-button toggle :selected="selectedElement.style.fontStyle === 'italic'" @click="updateStyle(selectedId!, { fontStyle: selectedElement!.style.fontStyle === 'italic' ? 'normal' : 'italic' })"><Italic :size="16" /></md-icon-button>
                          </div>
                       </div>
                       <div class="flex justify-between items-center gap-2">
                           <div class="flex items-center gap-3 flex-1 p-2 bg-gray-500/5 rounded-xl">
                              <input type="color" :value="selectedElement.style.color" @input="(e: any) => updateStyle(selectedId!, { color: e.target.value })" class="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" />
                              <span class="text-[10px] font-mono uppercase opacity-50">{{ selectedElement.style.color }}</span>
                           </div>
                           <div class="flex gap-0.5">
                              <md-icon-button @click="updateStyle(selectedId!, { textAlign: 'left' })"><AlignLeft :size="16" /></md-icon-button>
                              <md-icon-button @click="updateStyle(selectedId!, { textAlign: 'center' })"><AlignCenter :size="16" /></md-icon-button>
                              <md-icon-button @click="updateStyle(selectedId!, { textAlign: 'right' })"><AlignRight :size="16" /></md-icon-button>
                           </div>
                       </div>
                   </div>
                </div>

                <!-- APPEARANCE SECTION -->
                <div class="border-b">
                   <button @click="toggleSection('appearance')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-500/5 transition-colors">
                      <div class="flex items-center gap-3">
                         <Droplet :size="16" class="text-blue-500" />
                         <span class="text-xs font-bold uppercase tracking-widest">Appearance</span>
                      </div>
                      <ChevronDown v-if="openSections.appearance" :size="16" />
                      <ChevronRight v-else :size="16" />
                   </button>
                   <div v-if="openSections.appearance" class="px-6 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-200">
                      <div v-if="selectedElement.type === 'shape'" class="flex items-center gap-3 p-3 bg-gray-500/5 rounded-xl">
                         <input type="color" :value="selectedElement.style.backgroundColor" @input="(e: any) => updateStyle(selectedId!, { backgroundColor: e.target.value })" class="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                         <div class="flex flex-col">
                            <span class="text-[9px] font-bold uppercase text-gray-400">Fill Color</span>
                            <span class="text-xs font-mono uppercase">{{ selectedElement.style.backgroundColor }}</span>
                         </div>
                      </div>

                      <div class="space-y-1">
                         <label class="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Opacity</label>
                         <md-slider min="0" max="1" step="0.1" labeled :value="selectedElement.style.opacity ?? 1" @input="(e: any) => updateStyle(selectedId!, { opacity: parseFloat(e.target.value) })"></md-slider>
                      </div>

                      <md-outlined-select label="Blend Mode" class="w-full" :value="selectedElement.style.mixBlendMode || 'normal'" @change="(e: any) => updateStyle(selectedId!, { mixBlendMode: e.target.value })">
                         <md-select-option v-for="m in BLEND_MODES" :key="m" :value="m"><div slot="headline">{{ m }}</div></md-select-option>
                      </md-outlined-select>

                      <div v-if="selectedElement.type === 'image'" class="grid grid-cols-2 gap-3">
                         <md-filled-tonal-button @click="updateStyle(selectedId!, { flipX: !selectedElement!.style.flipX })"><FlipHorizontal slot="icon" :size="14" /> Flip X</md-filled-tonal-button>
                         <md-filled-tonal-button @click="updateStyle(selectedId!, { flipY: !selectedElement!.style.flipY })"><FlipVertical slot="icon" :size="14" /> Flip Y</md-filled-tonal-button>
                      </div>
                   </div>
                </div>
            </template>

            <!-- CANVAS SETTINGS -->
            <template v-else>
               <!-- PRESETS SECTION -->
               <div class="border-b">
                  <button @click="toggleSection('presets')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-500/5 transition-colors">
                     <div class="flex items-center gap-3">
                        <Maximize2 :size="16" class="text-blue-500" />
                        <span class="text-xs font-bold uppercase tracking-widest">Canvas Size</span>
                     </div>
                     <ChevronDown v-if="openSections.presets" :size="16" />
                     <ChevronRight v-else :size="16" />
                  </button>
                  <div v-if="openSections.presets" class="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                     <div class="grid grid-cols-2 gap-2">
                        <button v-for="s in POSTER_SIZES.slice(0, 4)" :key="s.name" @click="posterSize = { w: s.w, h: s.h }" class="flex items-center gap-2 p-2.5 rounded-xl border border-transparent bg-gray-500/5 hover:bg-blue-500/5 transition-all text-left" :class="{'border-blue-500/40 bg-blue-500/5': posterSize.w === s.w && posterSize.h === s.h}">
                            <div class="w-6 h-6 border-2 border-blue-500/30 rounded-sm" :style="{ aspectRatio: s.w/s.h }"></div>
                            <span class="text-[9px] font-bold uppercase truncate">{{ s.name }}</span>
                        </button>
                     </div>
                     <div class="grid grid-cols-2 gap-3">
                        <md-filled-text-field label="Width" type="number" :value="String(Math.round(posterSize.w))" @input="(e: any) => posterSize.w = parseInt(e.target.value) || 0"></md-filled-text-field>
                        <md-filled-text-field label="Height" type="number" :value="String(Math.round(posterSize.h))" @input="(e: any) => posterSize.h = parseInt(e.target.value) || 0"></md-filled-text-field>
                     </div>
                     <div class="flex gap-2">
                        <md-filled-tonal-button class="flex-1" :selected="posterSize.h >= posterSize.w" @click="posterSize = { w: Math.min(posterSize.w, posterSize.h), h: Math.max(posterSize.w, posterSize.h) }"><Smartphone slot="icon" :size="14" /> Port</md-filled-tonal-button>
                        <md-filled-tonal-button class="flex-1" :selected="posterSize.w > posterSize.h" @click="posterSize = { w: Math.max(posterSize.w, posterSize.h), h: Math.min(posterSize.w, posterSize.h) }"><Monitor slot="icon" :size="14" /> Land</md-filled-tonal-button>
                     </div>
                  </div>
               </div>

               <!-- THEMES SECTION -->
               <div class="border-b">
                  <button @click="toggleSection('themes')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-500/5 transition-colors">
                     <div class="flex items-center gap-3">
                        <Palette :size="16" class="text-blue-500" />
                        <span class="text-xs font-bold uppercase tracking-widest">Color Themes</span>
                     </div>
                     <ChevronDown v-if="openSections.themes" :size="16" />
                     <ChevronRight v-else :size="16" />
                  </button>
                  <div v-if="openSections.themes" class="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                     <div class="grid grid-cols-2 gap-3">
                        <button v-for="p in COLOR_PALETTES.slice(0, 6)" :key="p.name" @click="applyPalette(p)" class="p-2 rounded-xl border border-transparent bg-gray-500/5 hover:border-blue-500/40 transition-all" :class="{'border-blue-500/60 bg-blue-500/5': bgColor === p.bg}">
                           <div class="w-full h-8 rounded-lg flex overflow-hidden border border-black/5">
                              <div class="h-full w-2/3" :style="{ backgroundColor: p.bg }"></div>
                              <div class="h-full w-1/3" :style="{ backgroundColor: p.accent }"></div>
                           </div>
                           <span class="text-[9px] font-bold uppercase mt-1.5 block truncate">{{ p.name }}</span>
                        </button>
                     </div>
                     <div class="flex items-center gap-3 p-3 bg-gray-500/5 rounded-xl">
                         <input type="color" :value="bgColor" @input="(e: any) => bgColor = e.target.value" class="w-full h-8 rounded-lg cursor-pointer bg-transparent" />
                     </div>
                  </div>
               </div>
            </template>

            <!-- LAYERS LIST (Shared) -->
            <div class="bg-gray-500/5 mt-4 min-h-[300px]">
               <button @click="toggleSection('layers')" class="w-full flex items-center justify-between px-6 py-4 border-t border-b hover:bg-gray-500/5 transition-colors">
                  <div class="flex items-center gap-3">
                     <Layers :size="16" class="text-blue-500" />
                     <span class="text-xs font-bold uppercase tracking-widest">Elements</span>
                  </div>
                  <div class="flex items-center gap-2">
                     <span class="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded-full">{{ elements.length }}</span>
                     <ChevronDown v-if="openSections.layers" :size="16" />
                     <ChevronRight v-else :size="16" />
                  </div>
               </button>
               <div v-if="openSections.layers" class="p-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <div v-for="layer in layers" :key="layer.id" @click="selectedId = layer.id" class="group flex items-center gap-3 p-2.5 rounded-xl border border-transparent transition-all cursor-pointer" :class="[selectedId === layer.id ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-gray-500/10']">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="selectedId === layer.id ? 'bg-white/20' : 'bg-gray-500/10'">
                          <Type v-if="layer.type === 'text'" :size="14" />
                          <ImageIcon v-else-if="layer.type === 'image'" :size="14" />
                          <Box v-else :size="14" />
                      </div>
                      <span class="text-xs font-bold truncate flex-1 tracking-tight">{{ layer.content || (layer.type.charAt(0).toUpperCase() + layer.type.slice(1)) }}</span>
                      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': layer.hidden || layer.locked}">
                          <button @click.stop="toggleVisibility(layer.id, !!layer.hidden)" class="p-1 hover:bg-white/20 rounded-md">
                              <Eye v-if="!layer.hidden" :size="12" /><EyeOff v-else :size="12" />
                          </button>
                          <button @click.stop="toggleLock(layer.id, !!layer.locked)" class="p-1 hover:bg-white/20 rounded-md">
                              <Unlock v-if="!layer.locked" :size="12" /><Lock v-else :size="12" />
                          </button>
                      </div>
                  </div>
                  <div v-if="elements.length === 0" class="py-12 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">No elements found</div>
               </div>
            </div>

        </div>
     </div>
  </aside>
</template>

<style scoped>
.bg-panel { background-color: var(--bg-panel); }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(155, 155, 155, 0.2); border-radius: 10px; }
</style>
