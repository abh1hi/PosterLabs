<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElements } from '../../../composables/useElements'
import { useCanvas, CANVAS_PRESETS } from '../../../composables/useCanvas'
import { useToasts } from '../../../composables/useToasts'
import { useFonts } from '../../../composables/useFonts'
import { useMedia } from '../../../composables/useMedia'
import { 
  AlignLeft, AlignCenter, AlignRight, 
  ArrowUpToLine, ArrowDownToLine, MoveVertical,
  ChevronDown, ChevronRight, Type, Search, Globe, 
  Maximize2, Crop, Wand2, Palette, Smartphone, Group, Ungroup,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Lock, Unlock, Eye, EyeOff, LayoutTemplate
} from 'lucide-vue-next'

import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import ImageEditor from 'tui-image-editor'
import 'tui-image-editor/dist/tui-image-editor.css'

import '@material/web/textfield/filled-text-field.js'
import '@material/web/slider/slider.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@material/web/switch/switch.js'
import '@material/web/iconbutton/icon-button.js'

const { elements, selectedId, selectedIds, updateElement, updateStyle, groupSelection, ungroupElement, alignElements, moveElement } = useElements()
const { posterSize, showGrid, bgColor, backgroundType, gradientStyle } = useCanvas()
const { showToast } = useToasts()
const { uploadImage } = useMedia()
const { isGoogleFontsActive, searchQuery, filteredFonts, applyFont } = useFonts()

const selectedElement = computed(() => elements.value.find(e => e.id === selectedId.value))

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
]

const openSections = ref({
  layout: true,
  typography: true,
  appearance: true,
  effects: false,
  canvas: true
})

const toggleSection = (section: keyof typeof openSections.value) => {
  openSections.value[section] = !openSections.value[section]
}

// Helper to convert RGBA/RGB/Color names to Hex for input[type=color]
const toHex = (color?: string) => {
    if (!color) return '#000000'
    if (color.startsWith('#')) return color
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return '#000000'
    ctx.fillStyle = color
    return ctx.fillStyle 
}

const handleInput = (id: string, key: string, value: any, isStyle: boolean = false) => {
    if (isStyle) {
        updateStyle(id, { [key]: value })
    } else {
        updateElement(id, { [key]: value })
    }
}



// --- TUI & Cropper Logic (Visuals only used when active) ---
const isCropping = ref(false)
const cropperRef = ref<any>(null)
const isTuiActive = ref(false)
const isTuiLoading = ref(false)
const tuiInstance = ref<any>(null)

const initTui = async () => {
    if (!selectedElement.value?.src) return
    isTuiActive.value = true
    isTuiLoading.value = true
    setTimeout(() => {
        const container = document.querySelector('#tui-image-editor-container')
        if (container) {
            tuiInstance.value = new ImageEditor(container, {
                cssMaxWidth: 300, cssMaxHeight: 250,
                selectionStyle: { cornerSize: 20, rotatingPointOffset: 70 }
            })
            tuiInstance.value.loadImageFromURL(selectedElement.value!.src, 'Current Image').then(() => {
                tuiInstance.value.clearUndoStack()
                isTuiLoading.value = false
            }).catch(() => {
                isTuiLoading.value = false
                showToast('Failed to load image editor', 'error')
            })
        }
    }, 100)
}



const cancelTui = () => {
    tuiInstance.value?.destroy(); tuiInstance.value = null; isTuiActive.value = false
}

const saveTuiForReal = async () => {
    if (!tuiInstance.value) return
    try {
        const dataUrl = tuiInstance.value.toDataURL()
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], `tui-edited-${Date.now()}.png`, { type: 'image/png' })
        const mediaDoc = await uploadImage(file)
        if (selectedId.value) {
            updateElement(selectedId.value, { src: mediaDoc.url })
            updateStyle(selectedId.value, { brightness: 100, contrast: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0 })
            showToast('Advanced edits saved', 'success')
        }
        cancelTui()
    } catch (e: any) { showToast('Failed: ' + e.message, 'error') }
}



const saveInlineCrop = async () => {
    if (!cropperRef.value) return
    const { canvas } = cropperRef.value.getResult()
    if (!canvas) return
    canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return
        const file = new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' })
        const mediaDoc = await uploadImage(file)
        if (selectedId.value && mediaDoc.url) {
            updateElement(selectedId.value, { src: mediaDoc.url })
            showToast('Crop applied', 'success')
        }
        isCropping.value = false
    }, 'image/png')
}

// Radius Logic
const isUniformRadius = ref(true)
const radiusValues = computed(() => {
    if (!selectedElement.value) return { tl: 0, tr: 0, br: 0, bl: 0 }
    const val = selectedElement.value.style.borderRadius
    if (typeof val === 'number') return { tl: val, tr: val, br: val, bl: val }
    if (typeof val === 'string') {
        const parts = val.replace(/px/g, '').split(' ').map(n => parseFloat(n) || 0)
        if (parts.length === 1) return { tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] }
        if (parts.length === 2) return { tl: parts[0], tr: parts[1], br: parts[0], bl: parts[1] } // TL/BR, TR/BL
        if (parts.length === 3) return { tl: parts[0], tr: parts[1], br: parts[2], bl: parts[1] }
        if (parts.length === 4) return { tl: parts[0], tr: parts[1], br: parts[2], bl: parts[3] }
    }
    return { tl: 0, tr: 0, br: 0, bl: 0 }
})

const updateRadius = (corner: 'all' | 'tl' | 'tr' | 'br' | 'bl', value: number) => {
    if (!selectedId.value) return
    if (corner === 'all') {
         handleInput(selectedId.value, 'borderRadius', value, true)
    } else {
        const cur = radiusValues.value
        const newVals = { ...cur, [corner]: value }
        if (isUniformRadius.value) isUniformRadius.value = false
        handleInput(selectedId.value, 'borderRadius', `${newVals.tl}px ${newVals.tr}px ${newVals.br}px ${newVals.bl}px`, true)
    }
}
</script>

<template>
    <div class="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollbar-thin">
        
        <!-- --- MULTI SELECTION HEADER --- -->
        <div v-if="selectedIds.length > 1" class="p-4 border-b border-outline/10 bg-surface-high/50 sticky top-0 z-10 backdrop-blur-md">
            <div class="flex items-center justify-between mb-2">
                <span class="label-large font-bold">{{ selectedIds.length }} items selected</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
                 <button @click="groupSelection" class="py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                    <Group :size="16" /> Group
                </button>
                 <button @click="() => alignElements('center', posterSize.w, posterSize.h)" class="py-2.5 rounded-xl bg-surface-variant text-on-surface-variant font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-surface-variant/80 active:scale-95 transition-all">
                    <AlignCenter :size="16" /> Align Center
                </button>
            </div>
        </div>

        <!-- --- SINGLE SELECTION --- -->
        <div v-if="selectedElement" class="flex flex-col pb-20">
            
            <!-- Group Header -->
            <div v-if="selectedElement.type === 'group'" class="p-4 border-b border-outline/10 bg-surface-high/20">
                 <button @click="ungroupElement" class="w-full py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-bold shadow-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                    <Ungroup :size="16" /> Ungroup
                </button>
            </div>

            <!-- --- SECTION: LAYOUT (Align, Transform, Layers) --- -->
            <div class="section-container">
                <button @click="toggleSection('layout')" class="section-header">
                    <div class="flex items-center gap-2"><LayoutTemplate :size="16" /><span class="label-large">Layout & Position</span></div>
                    <component :is="openSections.layout ? ChevronDown : ChevronRight" :size="16" />
                </button>
                <div v-if="openSections.layout" class="px-4 pb-4 space-y-4">
                    <!-- Alignment -->
                    <div class="bg-surface-high/50 rounded-xl p-1 flex justify-between">
                        <md-icon-button @click="alignElements('left', posterSize.w, posterSize.h)" title="Align Left"><AlignLeft :size="18" /></md-icon-button>
                        <md-icon-button @click="alignElements('center', posterSize.w, posterSize.h)" title="Align Center"><AlignCenter :size="18" /></md-icon-button>
                        <md-icon-button @click="alignElements('right', posterSize.w, posterSize.h)" title="Align Right"><AlignRight :size="18" /></md-icon-button>
                        <div class="w-px bg-outline/10 my-1"></div>
                        <md-icon-button @click="alignElements('top', posterSize.w, posterSize.h)" title="Align Top"><ArrowUpToLine :size="18" /></md-icon-button>
                        <md-icon-button @click="alignElements('middle', posterSize.w, posterSize.h)" title="Align Middle"><MoveVertical :size="18" /></md-icon-button>
                        <md-icon-button @click="alignElements('bottom', posterSize.w, posterSize.h)" title="Align Bottom"><ArrowDownToLine :size="18" /></md-icon-button>
                    </div>

                    <!-- Transform Coordinates -->
                     <div class="grid grid-cols-2 gap-3">
                        <md-filled-text-field label="X" type="number" :value="String(Math.round(selectedElement.x))" @input="(e: any) => handleInput(selectedId!, 'x', parseInt(e.target.value) || 0)"></md-filled-text-field>
                        <md-filled-text-field label="Y" type="number" :value="String(Math.round(selectedElement.y))" @input="(e: any) => handleInput(selectedId!, 'y', parseInt(e.target.value) || 0)"></md-filled-text-field>
                        <md-filled-text-field label="W" type="number" :value="String(selectedElement.style.width || 'auto')" @input="(e: any) => handleInput(selectedId!, 'width', parseInt(e.target.value), true)"></md-filled-text-field>
                        <md-filled-text-field label="H" type="number" :value="String(selectedElement.style.height || 'auto')" @input="(e: any) => handleInput(selectedId!, 'height', parseInt(e.target.value), true)"></md-filled-text-field>
                        <md-filled-text-field label="Rotation" type="number" suffix-text="°" :value="String(Math.round(selectedElement.style.rotate || 0))" @input="(e: any) => handleInput(selectedId!, 'rotate', parseInt(e.target.value), true)"></md-filled-text-field>
                        <div class="flex items-center justify-center">
                            <md-icon-button @click="handleInput(selectedId!, 'locked', !selectedElement!.locked)">
                                <Lock v-if="selectedElement.locked" :size="20" class="text-primary" />
                                <Unlock v-else :size="20" class="text-on-surface-variant" />
                            </md-icon-button>
                             <md-icon-button @click="handleInput(selectedId!, 'hidden', !selectedElement!.hidden)">
                                <EyeOff v-if="selectedElement.hidden" :size="20" class="text-primary" />
                                <Eye v-else :size="20" class="text-on-surface-variant" />
                            </md-icon-button>
                        </div>
                    </div>
                    
                    <!-- Layer Order -->
                    <div class="space-y-1">
                        <span class="label-small text-on-surface-variant uppercase font-bold tracking-wider">Layer Order</span>
                        <div class="grid grid-cols-4 gap-1">
                            <button @click="moveElement(selectedId!, 'top')" class="p-2 bg-surface-high hover:bg-surface-variant rounded-lg flex justify-center" title="Bring to Front"><ChevronsUp :size="16" /></button>
                            <button @click="moveElement(selectedId!, 'up')" class="p-2 bg-surface-high hover:bg-surface-variant rounded-lg flex justify-center" title="Bring Forward"><ArrowUp :size="16" /></button>
                            <button @click="moveElement(selectedId!, 'down')" class="p-2 bg-surface-high hover:bg-surface-variant rounded-lg flex justify-center" title="Send Backward"><ArrowDown :size="16" /></button>
                            <button @click="moveElement(selectedId!, 'bottom')" class="p-2 bg-surface-high hover:bg-surface-variant rounded-lg flex justify-center" title="Send to Back"><ChevronsDown :size="16" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- --- SECTION: TYPOGRAPHY (Text Only) --- -->
            <div v-if="selectedElement.type === 'text'" class="section-container">
                <button @click="toggleSection('typography')" class="section-header">
                    <div class="flex items-center gap-2"><Type :size="16" /><span class="label-large">Typography</span></div>
                    <component :is="openSections.typography ? ChevronDown : ChevronRight" :size="16" />
                </button>
                <div v-if="openSections.typography" class="px-4 pb-4 space-y-4">
                    <textarea class="w-full p-2 bg-surface-high rounded-lg border border-outline/10 text-sm resize-none" rows="3" :value="selectedElement.content" @input="(e: any) => handleInput(selectedId!, 'content', e.target.value)"></textarea>
                    
                    <!-- Font Search -->
                    <div class="flex gap-2">
                        <md-filled-text-field class="flex-1" label="Font Family" :value="searchQuery" @input="(e: any) => searchQuery = e.target.value">
                            <Search slot="leading-icon" :size="16" />
                        </md-filled-text-field>
                        <button @click="isGoogleFontsActive = !isGoogleFontsActive" class="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-high border border-outline/10 text-primary hover:bg-primary-container" :class="{'bg-primary-container': isGoogleFontsActive}">
                            <Globe :size="20" />
                        </button>
                    </div>

                    <!-- Font List -->
                    <div class="h-32 overflow-y-auto bg-surface-high rounded-xl border border-outline/10 p-1 space-y-1">
                        <button v-for="font in filteredFonts" :key="font.family" @click="() => { applyFont(font); handleInput(selectedId!, 'fontFamily', font.family, true); }" 
                            class="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-primary/10 flex items-center justify-between"
                            :class="{'bg-primary-container text-primary font-bold': selectedElement.style.fontFamily === font.family}">
                            <span :style="{ fontFamily: font.family }">{{ font.family }}</span>
                        </button>
                    </div>

                    <!-- Size, Weight, etc. -->
                     <div class="grid grid-cols-2 gap-3">
                        <md-filled-text-field label="Size" type="number" :value="String(selectedElement.style.fontSize ?? '')" @input="(e: any) => handleInput(selectedId!, 'fontSize', parseInt(e.target.value), true)"></md-filled-text-field>
                        <md-filled-text-field label="Line Height" type="number" step="0.1" :value="String(selectedElement.style.lineHeight ?? '')" @input="(e: any) => handleInput(selectedId!, 'lineHeight', parseFloat(e.target.value), true)"></md-filled-text-field>
                         <md-filled-text-field label="Letter Spacing" type="number" step="0.5" :value="String(parseFloat(selectedElement.style.letterSpacing || '0'))" @input="(e: any) => handleInput(selectedId!, 'letterSpacing', parseFloat(e.target.value), true)"></md-filled-text-field>
                         <md-filled-text-field label="Padding" type="number" :value="String(selectedElement.style.padding ?? 0)" @input="(e: any) => handleInput(selectedId!, 'padding', parseInt(e.target.value), true)"></md-filled-text-field>
                     </div>

                    <!-- Toggles -->
                    <div class="flex justify-between bg-surface-high rounded-xl p-1">
                         <md-icon-button toggle :selected="selectedElement.style.fontWeight === 'bold'" @click="handleInput(selectedId!, 'fontWeight', selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold', true)"> <span class="font-bold">B</span> </md-icon-button>
                         <md-icon-button toggle :selected="selectedElement.style.fontStyle === 'italic'" @click="handleInput(selectedId!, 'fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic', true)"> <span class="italic font-serif">I</span> </md-icon-button>
                         <md-icon-button toggle :selected="selectedElement.style.textDecoration === 'underline'" @click="handleInput(selectedId!, 'textDecoration', selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline', true)"> <span class="underline">U</span> </md-icon-button>
                         <div class="w-px bg-outline/10 m-1"></div>
                         <md-icon-button :selected="selectedElement.style.textAlign === 'left'" @click="handleInput(selectedId!, 'textAlign', 'left', true)"><AlignLeft :size="18" /></md-icon-button>
                         <md-icon-button :selected="selectedElement.style.textAlign === 'center'" @click="handleInput(selectedId!, 'textAlign', 'center', true)"><AlignCenter :size="18" /></md-icon-button>
                         <md-icon-button :selected="selectedElement.style.textAlign === 'right'" @click="handleInput(selectedId!, 'textAlign', 'right', true)"><AlignRight :size="18" /></md-icon-button>
                    </div>

                    <!-- Text Colors -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                             <span class="label-medium">Text Color</span>
                             <div class="flex items-center gap-2">
                                 <span class="text-xs font-mono opacity-50">{{ toHex(selectedElement.style.color) }}</span>
                                 <input type="color" :value="toHex(selectedElement.style.color)" @input="(e: any) => handleInput(selectedId!, 'color', e.target.value, true)" class="w-6 h-6 rounded-full border border-outline/20 p-0 overflow-hidden cursor-pointer" />
                             </div>
                        </div>
                        <div class="flex items-center justify-between">
                             <span class="label-medium">Background</span>
                             <div class="flex items-center gap-2">
                                 <span class="text-xs font-mono opacity-50">{{ toHex(selectedElement.style.backgroundColor) }}</span>
                                 <input type="color" :value="toHex(selectedElement.style.backgroundColor)" @input="(e: any) => handleInput(selectedId!, 'backgroundColor', e.target.value, true)" class="w-6 h-6 rounded-full border border-outline/20 p-0 overflow-hidden cursor-pointer" />
                             </div>
                        </div>
                    </div>
                </div>
            </div>

             <!-- --- SECTION: APPEARANCE (All Types) --- -->
            <div class="section-container">
                <button @click="toggleSection('appearance')" class="section-header">
                    <div class="flex items-center gap-2"><Palette :size="16" /><span class="label-large">Appearance</span></div>
                    <component :is="openSections.appearance ? ChevronDown : ChevronRight" :size="16" />
                </button>
                 <div v-if="openSections.appearance" class="px-4 pb-4 space-y-4">
                    
                    <!-- Opacity & Blend -->
                    <div class="grid grid-cols-2 gap-3">
                         <md-filled-text-field label="Opacity" type="number" step="0.1" max="1" min="0" :value="String(selectedElement.style.opacity ?? 1)" @input="(e: any) => handleInput(selectedId!, 'opacity', parseFloat(e.target.value), true)"></md-filled-text-field>
                         <md-outlined-select label="Blend Mode" :value="selectedElement.style.mixBlendMode || 'normal'" @change="(e: any) => handleInput(selectedId!, 'mixBlendMode', e.target.value, true)">
                            <md-select-option v-for="m in BLEND_MODES" :key="m" :value="m"><div slot="headline" class="capitalize">{{ m }}</div></md-select-option>
                         </md-outlined-select>
                    </div>

                     <!-- Border / Stroke -->
                    <div class="bg-surface-high/20 p-3 rounded-xl space-y-3">
                         <div class="flex items-center justify-between">
                             <span class="label-medium font-bold">Border / Stroke</span>
                             <input type="color" :value="toHex(selectedElement.style.borderColor || selectedElement.style.webkitTextStrokeColor)" 
                                    @input="(e: any) => {
                                        handleInput(selectedId!, 'borderColor', e.target.value, true);
                                        if(selectedElement!.type==='text') handleInput(selectedId!, 'webkitTextStrokeColor', e.target.value, true);
                                    }" 
                                    class="w-5 h-5 rounded-full border border-outline/20 p-0 cursor-pointer" />
                         </div>
                         <div class="flex gap-2">
                             <md-filled-text-field class="flex-1" label="Width" type="number" :value="String(selectedElement.style.borderWidth || selectedElement.style.webkitTextStrokeWidth || 0)" 
                                @input="(e: any) => {
                                    handleInput(selectedId!, 'borderWidth', parseFloat(e.target.value), true);
                                    if(selectedElement!.type==='text') handleInput(selectedId!, 'webkitTextStrokeWidth', parseFloat(e.target.value), true);
                                }"></md-filled-text-field>
                             <div class="flex-1" v-if="selectedElement.type !== 'text'">
                                  <md-outlined-select label="Style" :value="selectedElement.style.borderStyle || 'solid'" @change="(e: any) => handleInput(selectedId!, 'borderStyle', e.target.value, true)">
                                    <md-select-option value="solid"><div slot="headline">Solid</div></md-select-option>
                                    <md-select-option value="dashed"><div slot="headline">Dashed</div></md-select-option>
                                    <md-select-option value="dotted"><div slot="headline">Dotted</div></md-select-option>
                                  </md-outlined-select>
                             </div>
                         </div>
                    </div>

                    <!-- Radius (If not text) -->
                    <div v-if="selectedElement.type !== 'text'" class="bg-surface-high/20 p-3 rounded-xl space-y-3">
                        <div class="flex items-center justify-between">
                             <span class="label-medium font-bold">Corner Radius</span>
                             <md-icon-button @click="isUniformRadius = !isUniformRadius" :selected="isUniformRadius" title="Toggle Individual Corners">
                                 <Maximize2 v-if="!isUniformRadius" :size="16" />
                                 <Crop v-else :size="16" /> <!-- Icon pivot -->
                             </md-icon-button>
                        </div>
                        <div v-if="isUniformRadius">
                             <md-slider min="0" max="200" :value="radiusValues.tl" @input="(e: any) => updateRadius('all', parseFloat(e.target.value))"></md-slider>
                        </div>
                        <div v-else class="grid grid-cols-2 gap-2">
                             <md-filled-text-field label="TL" type="number" :value="String(radiusValues.tl)" @input="(e: any) => updateRadius('tl', parseFloat(e.target.value))"></md-filled-text-field>
                             <md-filled-text-field label="TR" type="number" :value="String(radiusValues.tr)" @input="(e: any) => updateRadius('tr', parseFloat(e.target.value))"></md-filled-text-field>
                             <md-filled-text-field label="BL" type="number" :value="String(radiusValues.bl)" @input="(e: any) => updateRadius('bl', parseFloat(e.target.value))"></md-filled-text-field>
                             <md-filled-text-field label="BR" type="number" :value="String(radiusValues.br)" @input="(e: any) => updateRadius('br', parseFloat(e.target.value))"></md-filled-text-field>
                        </div>
                    </div>

                    <!-- Shadow -->
                    <div class="bg-surface-high/20 p-3 rounded-xl space-y-3">
                         <div class="flex items-center justify-between">
                             <span class="label-medium font-bold">Drop Shadow</span>
                             <md-switch :selected="!!selectedElement.style.shadow" @change="(e: any) => handleInput(selectedId!, 'shadow', e.target.selected ? { color: '#000000', blur: 10, offsetX: 5, offsetY: 5 } : undefined, true)"></md-switch>
                         </div>
                         <div v-if="selectedElement.style.shadow" class="space-y-3 pt-2">
                            <div class="flex justify-between items-center">
                                <span class="text-xs">Color</span>
                                <input type="color" :value="selectedElement.style.shadow.color" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, color: e.target.value }, true)" class="w-5 h-5 rounded hover:scale-110 transition-transform cursor-pointer" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <md-filled-text-field label="X" type="number" :value="String(selectedElement.style.shadow.offsetX)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetX: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                                <md-filled-text-field label="Y" type="number" :value="String(selectedElement.style.shadow.offsetY)" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetY: parseFloat(e.target.value) }, true)"></md-filled-text-field>
                            </div>
                            <div class="space-y-1">
                                <span class="text-xs opacity-70">Blur</span>
                                <md-slider min="0" max="50" :value="selectedElement.style.shadow.blur" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, blur: parseFloat(e.target.value) }, true)"></md-slider>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- --- SECTION: EFFECTS (Images) --- -->
            <div v-if="selectedElement.type === 'image'" class="section-container">
                <button @click="toggleSection('effects')" class="section-header">
                     <div class="flex items-center gap-2"><Wand2 :size="16" /><span class="label-large">Effects & Filters</span></div>
                     <component :is="openSections.effects ? ChevronDown : ChevronRight" :size="16" />
                </button>
                <div v-if="openSections.effects" class="px-4 pb-4 space-y-4">
                     <div class="grid grid-cols-2 gap-2">
                         <button @click="isCropping = true" class="py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110"><Crop :size="16"/> Crop</button>
                         <button @click="initTui" class="py-2 bg-tertiary-container text-on-tertiary-container rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110"><Wand2 :size="16"/> Edit</button>
                     </div>
                     <div class="space-y-4 bg-surface-high/20 p-3 rounded-xl">
                         <div class="space-y-1">
                             <div class="flex justify-between"><span class="text-xs font-bold">Brightness</span> <span class="text-xs">{{ selectedElement.style.brightness ?? 100 }}%</span></div>
                             <md-slider min="0" max="200" :value="selectedElement.style.brightness ?? 100" @input="(e: any) => handleInput(selectedId!, 'brightness', parseFloat(e.target.value), true)"></md-slider>
                         </div>
                         <div class="space-y-1">
                             <div class="flex justify-between"><span class="text-xs font-bold">Contrast</span> <span class="text-xs">{{ selectedElement.style.contrast ?? 100 }}%</span></div>
                             <md-slider min="0" max="200" :value="selectedElement.style.contrast ?? 100" @input="(e: any) => handleInput(selectedId!, 'contrast', parseFloat(e.target.value), true)"></md-slider>
                         </div>
                         <div class="space-y-1">
                             <div class="flex justify-between"><span class="text-xs font-bold">Blur</span> <span class="text-xs">{{ selectedElement.style.blur ?? 0 }}px</span></div>
                             <md-slider min="0" max="20" :value="selectedElement.style.blur ?? 0" @input="(e: any) => handleInput(selectedId!, 'blur', parseFloat(e.target.value), true)"></md-slider>
                         </div>
                     </div>
                </div>
            </div>

             <!-- Editor Overlays (Cropper/TUI) -->
             <div v-if="isCropping && selectedElement.src" class="fixed inset-0 z-50 bg-black/80 flex flex-col p-8">
                 <div class="flex-1 relative bg-black/50 rounded-xl overflow-hidden mb-4">
                      <Cropper ref="cropperRef" :src="selectedElement.src" class="h-full" :stencil-props="{ aspectRatio: 0 }" />
                 </div>
                 <div class="flex justify-end gap-4">
                     <button @click="isCropping = false" class="px-6 py-3 rounded-xl bg-surface text-on-surface font-bold">Cancel</button>
                     <button @click="saveInlineCrop" class="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold">Apply Crop</button>
                 </div>
             </div>

             <div v-if="isTuiActive" class="fixed inset-0 z-50 bg-surface flex flex-col">
                  <div class="p-4 border-b flex justify-between items-center bg-surface-high">
                      <h3 class="label-large">Advanced Image Editor</h3>
                      <button @click="cancelTui" class="p-2 hover:bg-surface-variant rounded-full"><Lock :size="20"/></button>
                  </div>
                  <div class="flex-1 relative bg-surface-variant flex items-center justify-center p-8">
                      <div id="tui-image-editor-container" class="w-full h-full"></div>
                      <div v-if="isTuiLoading" class="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-10">
                          <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                  </div>
                  <div class="p-4 border-t bg-surface-high flex justify-end gap-3">
                      <button @click="cancelTui" class="px-4 py-2 rounded-lg border border-outline/20 font-bold">Cancel</button>
                      <button @click="saveTuiForReal" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold" :disabled="isTuiLoading">Save Changes</button>
                  </div>
             </div>

        </div>

        <!-- --- CANVAS SETTINGS (Default) --- -->
        <div v-else class="flex flex-col pb-20">
             <div class="section-container">
                <button @click="toggleSection('canvas')" class="section-header text-primary">
                    <div class="flex items-center gap-2"><Smartphone :size="16" /><span class="label-large">Canvas Settings</span></div>
                    <component :is="openSections.canvas ? ChevronDown : ChevronRight" :size="16" />
                </button>
                <div v-if="openSections.canvas" class="px-4 pb-4 space-y-4">
                     <md-outlined-select label="Preset Size" class="w-full" @change="(e: any) => { const p = CANVAS_PRESETS.find((x: any) => x.name === e.target.value); if (p) { posterSize.w = p.w; posterSize.h = p.h; } }">
                         <md-select-option v-for="p in CANVAS_PRESETS" :key="p.name" :value="p.name"><div slot="headline">{{ p.name }}</div></md-select-option>
                     </md-outlined-select>
                     <div class="grid grid-cols-2 gap-2">
                        <md-filled-text-field label="W" type="number" :value="String(posterSize.w)" @input="(e: any) => posterSize.w = parseInt(e.target.value)"></md-filled-text-field>
                        <md-filled-text-field label="H" type="number" :value="String(posterSize.h)" @input="(e: any) => posterSize.h = parseInt(e.target.value)"></md-filled-text-field>
                    </div>
                     <div class="flex items-center justify-between p-2 bg-surface-high rounded-xl">
                        <span class="label-medium">Show Grid</span>
                        <md-switch :selected="showGrid" @change="showGrid = !showGrid"></md-switch>
                    </div>
                    <div>
                         <span class="label-medium mb-2 block">Background</span>
                         <div class="flex bg-surface-high rounded-lg p-1 mb-2">
                             <button @click="backgroundType = 'solid'" class="flex-1 py-1 rounded text-xs font-bold transition-colors" :class="backgroundType === 'solid' ? 'bg-primary text-white' : 'text-on-surface-variant'">Solid</button>
                             <button @click="backgroundType = 'gradient'" class="flex-1 py-1 rounded text-xs font-bold transition-colors" :class="backgroundType === 'gradient' ? 'bg-primary text-white' : 'text-on-surface-variant'">Gradient</button>
                         </div>
                         <div v-if="backgroundType === 'solid'" class="flex items-center gap-2">
                             <input type="color" v-model="bgColor" class="w-full h-10 rounded-lg cursor-pointer" />
                         </div>
                         <div v-else>
                             <input type="text" v-model="gradientStyle" placeholder="linear-gradient(...)" class="w-full p-2 bg-surface-high rounded-lg text-xs border border-outline/10 h-20" />
                         </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
@reference "../../../index.css";

.section-container {
    @apply border-b border-outline/10;
}
.section-header {
    @apply w-full flex items-center justify-between p-4 hover:bg-surface-high/50 transition-colors;
}
</style>
