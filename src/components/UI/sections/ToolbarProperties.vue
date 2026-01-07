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
  ArrowUp, ArrowDown, Lock, Unlock, Eye, EyeOff, LayoutTemplate,
  RotateCcw, Save
} from 'lucide-vue-next'

import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import ImageEditor from 'tui-image-editor'
import 'tui-image-editor/dist/tui-image-editor.css'

import ColorPicker from '../ColorPicker.vue'
import '@material/web/switch/switch.js'

const { elements, selectedId, selectedIds, updateElement, updateStyle, groupSelection, ungroupElement, alignElements, moveElement } = useElements()
const { posterSize, showGrid, bgColor, backgroundType, gradientStyle } = useCanvas()
const { showToast } = useToasts()
const { uploadImage, saveElementAsset } = useMedia()
const { isGoogleFontsActive, searchQuery, filteredFonts, applyFont, addFontFromUrl } = useFonts()

const fontUrlInput = ref('')

const handleAddFont = async () => {
    if (!fontUrlInput.value) return
    const family = addFontFromUrl(fontUrlInput.value)
    if (family) {
        handleInput(selectedId.value!, 'fontFamily', family, true)
        fontUrlInput.value = ''
    }
}

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
const resetElementStyles = () => {
    if (!selectedId.value || !selectedElement.value) return
    const defaults = {
        opacity: 1,
        rotate: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
        invert: 0,
        mixBlendMode: 'normal',
        shadow: undefined,
        // Reset border but keep width if it was set? No, reset all.
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        borderRadius: '0px',
        curve: 0,
        textGradient: undefined,
        // Typography defaults (optional, maybe too aggressive?)
        // Let's reset styling effects but keep font/size/align as they are structural.
        padding: 0,
    }
    if (selectedId.value) {
        updateStyle(selectedId.value, defaults as any)
        showToast('Styles reset to default', 'success')
    }
}

const toggleLock = () => {
    if (selectedId.value) {
        updateElement(selectedId.value, { locked: !selectedElement.value?.locked })
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
            
            <!-- Quick Actions Header (Asset Save & Reset) -->
            <div class="px-4 pt-4 pb-2 grid grid-cols-2 gap-2">
                 <button @click="resetElementStyles" class="w-full py-2 rounded-xl bg-error-container text-on-error-container font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-sm" title="Reset all styles">
                    <RotateCcw :size="16" /> Reset
                 </button>
                 <button @click="saveElementAsset(selectedElement)" class="w-full py-2 rounded-xl bg-surface-high border border-outline/10 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                    <Save :size="16" /> Save Asset
                 </button>
            </div>
            
            <!-- Group Header -->
            <div v-if="selectedElement.type === 'group'" class="p-4 border-b border-outline/10 bg-surface-high/20">
                 <button @click="ungroupElement" class="w-full py-2.5 rounded-xl bg-secondary-container text-on-secondary-container font-bold shadow-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                    <Ungroup :size="16" /> Ungroup
                </button>
            </div>

            <!-- --- SECTION: LAYOUT (Align, Transform, Layers) --- -->
            <div class="section-container">
                <button @click="toggleSection('layout')" class="section-header group">
                    <div class="flex items-center gap-2 text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <LayoutTemplate :size="16" />
                        <span>Layout & Position</span>
                    </div>
                    <component :is="openSections.layout ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant/50" />
                </button>
                <div v-if="openSections.layout" class="px-3 pb-3 space-y-3">
                    
                    <!-- Alignment Buttons (Compact Row) -->
                    <div class="flex items-center justify-between p-1 bg-surface-variant/30 rounded-lg">
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('left', posterSize.w, posterSize.h)" title="Align Left"><AlignLeft :size="16" /></button>
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('center', posterSize.w, posterSize.h)" title="Align Center"><AlignCenter :size="16" /></button>
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('right', posterSize.w, posterSize.h)" title="Align Right"><AlignRight :size="16" /></button>
                        <div class="w-px h-4 bg-outline/10"></div>
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('top', posterSize.w, posterSize.h)" title="Align Top"><ArrowUpToLine :size="16" /></button>
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('middle', posterSize.w, posterSize.h)" title="Align Middle"><MoveVertical :size="16" /></button>
                        <button class="p-1.5 rounded hover:bg-surface-high transition-colors text-on-surface-variant" @click="alignElements('bottom', posterSize.w, posterSize.h)" title="Align Bottom"><ArrowDownToLine :size="16" /></button>
                    </div>

                    <!-- Transform Grid (Custom Inputs) -->
                    <div class="grid grid-cols-2 gap-2">
                        <!-- X Position -->
                        <div class="input-wrapper">
                            <span class="input-label">X</span>
                            <input type="number" class="custom-input" :value="Math.round(selectedElement.x)" @input="(e: any) => handleInput(selectedId!, 'x', parseInt(e.target.value) || 0)">
                        </div>
                        <!-- Y Position -->
                        <div class="input-wrapper">
                            <span class="input-label">Y</span>
                            <input type="number" class="custom-input" :value="Math.round(selectedElement.y)" @input="(e: any) => handleInput(selectedId!, 'y', parseInt(e.target.value) || 0)">
                        </div>
                        <!-- Width -->
                        <div class="input-wrapper">
                            <span class="input-label">W</span>
                            <input type="number" class="custom-input" :value="selectedElement.style.width || ''" @input="(e: any) => handleInput(selectedId!, 'width', parseInt(e.target.value), true)" placeholder="Auto">
                        </div>
                        <!-- Height -->
                        <div class="input-wrapper">
                            <span class="input-label">H</span>
                            <input type="number" class="custom-input" :value="selectedElement.style.height || ''" @input="(e: any) => handleInput(selectedId!, 'height', parseInt(e.target.value), true)" placeholder="Auto">
                        </div>
                        <!-- Rotation -->
                        <div class="input-wrapper col-span-2">
                            <span class="input-label"><RotateCcw :size="12" /></span>
                            <input type="number" class="custom-input" :value="Math.round(selectedElement.style.rotate || 0)" @input="(e: any) => handleInput(selectedId!, 'rotate', parseInt(e.target.value), true)">
                            <span class="absolute right-2 text-xs text-on-surface-variant pointer-events-none">°</span>
                        </div>
                    </div>
                    
                    <!-- Layer & Visibility -->
                    <div class="flex items-center gap-2">
                         <div class="flex-1 input-wrapper flex-row justify-between px-2 cursor-pointer hover:bg-surface-high transition-colors" @click="toggleLock">
                             <span class="text-xs font-medium text-on-surface-variant">Lock Layer</span>
                             <component :is="selectedElement.locked ? Lock : Unlock" :size="14" :class="selectedElement.locked ? 'text-primary' : 'text-on-surface-variant'" />
                         </div>
                         <div class="flex-1 input-wrapper flex-row justify-between px-2 cursor-pointer hover:bg-surface-high transition-colors" @click="handleInput(selectedId!, 'hidden', !selectedElement.hidden)">
                             <span class="text-xs font-medium text-on-surface-variant">Visible</span>
                             <component :is="selectedElement.hidden ? EyeOff : Eye" :size="14" :class="selectedElement.hidden ? 'text-primary' : 'text-on-surface-variant'" />
                         </div>
                    </div>

                    <!-- Layer Order Controls -->
                    <div class="pt-1">
                        <div class="flex items-center justify-between gap-1">
                            <button class="layer-btn" @click="moveElement(selectedId!, 'top')" title="Bring to Front"><ArrowUpToLine :size="14"/> <span class="text-[10px]">Front</span></button>
                            <button class="layer-btn" @click="moveElement(selectedId!, 'up')" title="Bring Forward"><ArrowUp :size="14"/> <span class="text-[10px]">Up</span></button>
                            <button class="layer-btn" @click="moveElement(selectedId!, 'down')" title="Send Backward"><ArrowDown :size="14"/> <span class="text-[10px]">Down</span></button>
                            <button class="layer-btn" @click="moveElement(selectedId!, 'bottom')" title="Send to Back"><ArrowDownToLine :size="14"/> <span class="text-[10px]">Back</span></button>
                        </div>
                    </div>

                </div>
            </div>

            <!-- --- SECTION: TYPOGRAPHY (Text Only) --- -->
            <div v-if="selectedElement.type === 'text'" class="section-container">
                <button @click="toggleSection('typography')" class="section-header group">
                    <div class="flex items-center gap-2 text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <Type :size="16" />
                        <span>Typography</span>
                    </div>
                    <component :is="openSections.typography ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant/50" />
                </button>
                <div v-if="openSections.typography" class="px-3 pb-3 space-y-3">
                    
                    <!-- Content Input -->
                    <div class="input-wrapper !h-auto">
                        <textarea class="custom-input !h-20 py-2 resize-none leading-relaxed" placeholder="Enter text..." :value="selectedElement.content" @input="(e: any) => handleInput(selectedId!, 'content', e.target.value)"></textarea>
                    </div>
                    
                    <!-- Font Family Selector (Compact) -->
                    <div class="space-y-1">
                        <div class="flex gap-2">
                             <div class="input-wrapper flex-1">
                                <span class="input-label border-none"><Search :size="12" /></span>
                                <input type="text" class="custom-input !pl-0" placeholder="Search Fonts..." :value="searchQuery" @input="(e: any) => searchQuery = e.target.value">
                            </div>
                            <button @click="isGoogleFontsActive = !isGoogleFontsActive" class="w-9 h-9 flex items-center justify-center rounded-lg border border-transparent hover:border-outline/10 bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 transition-colors" :class="{'!text-primary !bg-primary/10 !border-primary/20': isGoogleFontsActive}" title="Google Fonts">
                                <Globe :size="16" />
                            </button>
                        </div>
                        
                        <!-- Add Font by URL (Visible when Google Fonts is active) -->
                        <div v-if="isGoogleFontsActive" class="flex gap-2">
                            <div class="input-wrapper flex-1">
                                <input type="text" class="custom-input" placeholder="Google Font URL or Name..." v-model="fontUrlInput" @keyup.enter="handleAddFont">
                            </div>
                            <button @click="handleAddFont" class="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-high/50 hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors" title="Add Font">
                                <span class="text-lg font-bold leading-none">+</span>
                            </button>
                        </div>
                        <!-- Font List -->
                        <div class="h-28 overflow-y-auto bg-surface-high/30 rounded-lg border border-outline/5 p-1 space-y-0.5 scrollbar-thin">
                            <button v-for="font in filteredFonts" :key="font.family" @click="() => { applyFont(font); handleInput(selectedId!, 'fontFamily', font.family, true); }" 
                                class="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-surface-variant/50 flex items-center justify-between text-on-surface"
                                :class="{'bg-primary/10 text-primary font-bold': selectedElement.style.fontFamily === font.family}">
                                <span :style="{ fontFamily: font.family }" class="line-clamp-1">{{ font.family }}</span>
                                <span v-if="selectedElement.style.fontFamily === font.family" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Size & Leading (Grid) -->
                     <div class="grid grid-cols-2 gap-2">
                        <!-- Font Size -->
                        <div class="input-wrapper">
                            <span class="input-label"><Type :size="12" /></span>
                            <input type="number" class="custom-input" :value="selectedElement.style.fontSize" @input="(e: any) => handleInput(selectedId!, 'fontSize', parseInt(e.target.value), true)">
                        </div>
                        <!-- Line Height -->
                        <div class="input-wrapper">
                            <span class="input-label"><MoveVertical :size="12" /></span>
                            <input type="number" step="0.1" class="custom-input" :value="selectedElement.style.lineHeight" @input="(e: any) => handleInput(selectedId!, 'lineHeight', parseFloat(e.target.value), true)">
                        </div>
                         <!-- Letter Spacing -->
                         <div class="input-wrapper">
                            <span class="input-label"><AlignLeft :size="12" class="rotate-90" /></span> <!-- Using icon as proxy for tracking -->
                            <input type="number" step="0.5" class="custom-input" :value="parseFloat(selectedElement.style.letterSpacing || '0')" @input="(e: any) => handleInput(selectedId!, 'letterSpacing', parseFloat(e.target.value), true)">
                        </div>
                        <!-- Padding -->
                         <div class="input-wrapper">
                            <span class="input-label">Pad</span>
                            <input type="number" class="custom-input" :value="selectedElement.style.padding" @input="(e: any) => handleInput(selectedId!, 'padding', parseInt(e.target.value), true)">
                        </div>
                     </div>

                    <!-- Style Toggles (Bold/Italic/Underline/Align) -->
                    <div class="flex items-center justify-between p-1 bg-surface-variant/30 rounded-lg">
                         <div class="flex gap-0.5">
                             <button class="style-toggle-btn font-bold" :class="{'active': selectedElement.style.fontWeight === 'bold'}" @click="handleInput(selectedId!, 'fontWeight', selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold', true)">B</button>
                             <button class="style-toggle-btn italic font-serif" :class="{'active': selectedElement.style.fontStyle === 'italic'}" @click="handleInput(selectedId!, 'fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic', true)">I</button>
                             <button class="style-toggle-btn underline" :class="{'active': selectedElement.style.textDecoration === 'underline'}" @click="handleInput(selectedId!, 'textDecoration', selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline', true)">U</button>
                         </div>
                         <div class="w-px h-4 bg-outline/10"></div>
                         <div class="flex gap-0.5">
                             <button class="style-toggle-btn" :class="{'active': selectedElement.style.textAlign === 'left'}" @click="handleInput(selectedId!, 'textAlign', 'left', true)"><AlignLeft :size="14" /></button>
                             <button class="style-toggle-btn" :class="{'active': selectedElement.style.textAlign === 'center'}" @click="handleInput(selectedId!, 'textAlign', 'center', true)"><AlignCenter :size="14" /></button>
                             <button class="style-toggle-btn" :class="{'active': selectedElement.style.textAlign === 'right'}" @click="handleInput(selectedId!, 'textAlign', 'right', true)"><AlignRight :size="14" /></button>
                         </div>
                    </div>

                     <!-- Colors (Text Only) -->
                     <div class="space-y-3">
                         <div>
                              <span class="text-xs font-bold text-on-surface-variant mb-1 block">Text Color</span>
                              <ColorPicker :model-value="toHex(selectedElement.style.color)" @update:model-value="(v: any) => handleInput(selectedId!, 'color', v, true)" />
                         </div>
                     </div>

                </div>
            </div>

             <!-- --- SECTION: APPEARANCE (All Types) --- -->
            <div class="section-container">
                <button @click="toggleSection('appearance')" class="section-header group">
                    <div class="flex items-center gap-2 text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <Palette :size="16" />
                        <span>Appearance</span>
                    </div>
                    <component :is="openSections.appearance ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant/50" />
                </button>
                 <div v-if="openSections.appearance" class="px-3 pb-3 space-y-3">
                    
                    <!-- Fill Color (Shapes & Text Background) -->
                    <div v-if="['shape', 'text'].includes(selectedElement.type)" class="space-y-1">
                        <span class="text-xs font-bold text-on-surface-variant mb-1 block">Fill Color</span>
                        <ColorPicker :model-value="toHex(selectedElement.style.backgroundColor)" @update:model-value="(v: any) => handleInput(selectedId!, 'backgroundColor', v, true)" />
                    </div>
                    
                    <!-- Opacity & Blend Mode -->
                    <div class="grid grid-cols-2 gap-2">
                         <div class="input-wrapper">
                            <span class="input-label">Opac</span>
                            <input type="number" step="0.1" max="1" min="0" class="custom-input" :value="selectedElement.style.opacity ?? 1" @input="(e: any) => handleInput(selectedId!, 'opacity', parseFloat(e.target.value), true)">
                        </div>
                         <div class="input-wrapper !px-0">
                            <select class="custom-input !px-2 bg-transparent text-xs" :value="selectedElement.style.mixBlendMode || 'normal'" @change="(e: any) => handleInput(selectedId!, 'mixBlendMode', e.target.value, true)">
                                <option v-for="m in BLEND_MODES" :key="m" :value="m" class="capitalize">{{ m }}</option>
                            </select>
                         </div>
                    </div>

                     <!-- Border / Stroke -->
                    <div class="space-y-2">
                         <div class="space-y-1">
                             <span class="text-xs font-bold text-on-surface-variant">Border / Stroke</span>
                             <ColorPicker :model-value="toHex(selectedElement.style.borderColor || selectedElement.style.webkitTextStrokeColor)" 
                                @update:model-value="(v: any) => {
                                    handleInput(selectedId!, 'borderColor', v, true);
                                    if(selectedElement!.type==='text') handleInput(selectedId!, 'webkitTextStrokeColor', v, true);
                                }" />
                         </div>
                         <div class="grid grid-cols-2 gap-2">
                             <div class="input-wrapper">
                                <span class="input-label">Width</span>
                                <input type="number" class="custom-input" :value="parseFloat(String(selectedElement.style.borderWidth || selectedElement.style.webkitTextStrokeWidth || 0))" 
                                    @input="(e: any) => {
                                        handleInput(selectedId!, 'borderWidth', parseFloat(e.target.value), true);
                                        if(selectedElement!.type==='text') handleInput(selectedId!, 'webkitTextStrokeWidth', parseFloat(e.target.value), true);
                                    }">
                            </div>
                            <div class="input-wrapper !px-0" v-if="selectedElement.type !== 'text'">
                                <select class="custom-input !px-2 bg-transparent text-xs" :value="selectedElement.style.borderStyle || 'solid'" @change="(e: any) => handleInput(selectedId!, 'borderStyle', e.target.value, true)">
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                </select>
                            </div>
                         </div>
                    </div>

                    <!-- Radius (If not text) -->
                    <div v-if="selectedElement.type !== 'text'" class="space-y-2 pt-1 border-t border-outline/5">
                        <div class="flex items-center justify-between text-xs font-medium text-on-surface-variant px-1 pt-2">
                             <span>Corner Radius</span>
                             <button @click="isUniformRadius = !isUniformRadius" class="p-1 rounded hover:bg-surface-high transition-colors" title="Toggle Individual Corners">
                                 <Maximize2 v-if="!isUniformRadius" :size="12" />
                                 <Crop v-else :size="12" />
                             </button>
                        </div>
                        <div v-if="isUniformRadius" class="input-wrapper">
                             <span class="input-label">R</span>
                             <input type="number" class="custom-input" :value="parseFloat(String(radiusValues.tl))" @input="(e: any) => updateRadius('all', parseFloat(e.target.value))">
                        </div>
                        <div v-else class="grid grid-cols-2 gap-2">
                             <div class="input-wrapper"><span class="input-label">TL</span><input type="number" class="custom-input" :value="parseFloat(String(radiusValues.tl))" @input="(e: any) => updateRadius('tl', parseFloat(e.target.value))"></div>
                             <div class="input-wrapper"><span class="input-label">TR</span><input type="number" class="custom-input" :value="parseFloat(String(radiusValues.tr))" @input="(e: any) => updateRadius('tr', parseFloat(e.target.value))"></div>
                             <div class="input-wrapper"><span class="input-label">BL</span><input type="number" class="custom-input" :value="parseFloat(String(radiusValues.bl))" @input="(e: any) => updateRadius('bl', parseFloat(e.target.value))"></div>
                             <div class="input-wrapper"><span class="input-label">BR</span><input type="number" class="custom-input" :value="parseFloat(String(radiusValues.br))" @input="(e: any) => updateRadius('br', parseFloat(e.target.value))"></div>
                        </div>
                    </div>

                    <!-- Shadow -->
                    <div class="space-y-2 pt-1 border-t border-outline/5">
                         <div class="flex items-center justify-between text-xs font-medium text-on-surface-variant px-1 pt-2">
                             <span>Drop Shadow</span>
                             <md-switch :selected="!!selectedElement.style.shadow" @change="(e: any) => handleInput(selectedId!, 'shadow', e.target.selected ? { color: '#000000', blur: 10, offsetX: 5, offsetY: 5 } : undefined, true)" class="scale-75 origin-right"></md-switch>
                         </div>
                         <div v-if="selectedElement.style.shadow" class="space-y-2">
                            <div>
                                <span class="text-[10px] font-bold text-on-surface-variant opacity-70 mb-1 block">Shadow Color</span>
                                <ColorPicker :model-value="toHex(selectedElement.style.shadow.color)" @update:model-value="(v: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, color: v }, true)" />
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="input-wrapper"><span class="input-label">X</span><input type="number" class="custom-input" :value="selectedElement.style.shadow.offsetX" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetX: parseFloat(e.target.value) }, true)"></div>
                                <div class="input-wrapper"><span class="input-label">Y</span><input type="number" class="custom-input" :value="selectedElement.style.shadow.offsetY" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, offsetY: parseFloat(e.target.value) }, true)"></div>
                            </div>
                            <div class="input-wrapper"><span class="input-label">Blur</span><input type="number" class="custom-input" :value="selectedElement.style.shadow.blur" @input="(e: any) => handleInput(selectedId!, 'shadow', { ...selectedElement!.style.shadow, blur: parseFloat(e.target.value) }, true)"></div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- --- SECTION: EFFECTS (Images, Text, Shapes) --- -->
            <div v-if="['image', 'text', 'shape'].includes(selectedElement.type)" class="section-container">
                <button @click="toggleSection('effects')" class="section-header group">
                     <div class="flex items-center gap-2 text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <Wand2 :size="16" />
                        <span>Effects & Filters</span>
                     </div>
                     <component :is="openSections.effects ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant/50" />
                </button>
                <div v-if="openSections.effects" class="px-3 pb-3 space-y-3">
                     <!-- Text Effects -->
                     <div v-if="selectedElement.type === 'text'" class="space-y-3">
                         <!-- Curve -->
                         <div class="space-y-1">
                             <div class="flex justify-between items-center text-xs font-medium text-on-surface-variant px-1">
                                 <span>Curved Text</span>
                                 <span class="opacity-70">{{ Math.round(selectedElement.style.curve || 0) }}°</span>
                             </div>
                             <div class="flex items-center gap-2">
                                 <span class="text-[10px] text-on-surface-variant font-medium">U</span>
                                 <input type="range" class="flex-1 accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="-100" max="100" :value="selectedElement.style.curve || 0" @input="(e: any) => handleInput(selectedId!, 'curve', parseFloat(e.target.value), true)">
                                 <span class="text-[10px] text-on-surface-variant font-medium">Arch</span>
                             </div>
                         </div>
                         
                         <!-- Gradient Text -->
                         <div class="space-y-2 pt-2 border-t border-outline/5">
                             <div class="flex justify-between items-center bg-surface-variant/30 p-1.5 rounded-lg">
                                 <span class="text-xs font-medium text-on-surface pl-1">Gradient Fill</span>
                                 <md-switch :selected="!!selectedElement.style.textGradient" @change="(e: any) => handleInput(selectedId!, 'textGradient', e.target.selected ? 'linear-gradient(45deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)' : undefined, true)" class="scale-75 origin-right"></md-switch>
                             </div>
                             <div v-if="selectedElement.style.textGradient" class="space-y-2">
                                 <div class="input-wrapper !h-auto">
                                     <textarea class="custom-input !h-12 py-1 leading-tight text-[10px] font-mono resize-none" :value="selectedElement.style.textGradient" @input="(e: any) => handleInput(selectedId!, 'textGradient', e.target.value, true)"></textarea>
                                 </div>
                                 <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                     <button v-for="grad in ['linear-gradient(120deg, #f093fb 0%, #f5576c 100%)', 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)']" 
                                        :key="grad"
                                        class="w-6 h-6 rounded-full border border-white/20 shrink-0 shadow-sm hover:scale-110 transition-transform"
                                        :style="{ background: grad }"
                                        @click="handleInput(selectedId!, 'textGradient', grad, true)">
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <!-- Image Action (Crop/Edit) -->
                     <div v-if="selectedElement.type === 'image'" class="grid grid-cols-2 gap-2">
                         <button @click="isCropping = true" class="py-2 bg-surface-high border border-outline/10 text-on-surface rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"><Crop :size="14"/> Crop Image</button>
                         <button @click="initTui" class="py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"><Wand2 :size="14"/> Edit Photo</button>
                     </div>
                     
                     <!-- Advanced Filters (Images & Shapes) -->
                     <div v-if="['image', 'shape'].includes(selectedElement.type)" class="space-y-4 pt-2">
                         
                         <!-- Basic Adjustments -->
                         <div class="space-y-3">
                             <div class="text-xs font-bold text-on-surface-variant px-1 opacity-70">Adjustments</div>
                             
                             <!-- Brightness -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Brightness</span> <span>{{ selectedElement.style.brightness ?? 100 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="200" :value="selectedElement.style.brightness ?? 100" @input="(e: any) => handleInput(selectedId!, 'brightness', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Contrast -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Contrast</span> <span>{{ selectedElement.style.contrast ?? 100 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="200" :value="selectedElement.style.contrast ?? 100" @input="(e: any) => handleInput(selectedId!, 'contrast', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Saturation -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Saturation</span> <span>{{ selectedElement.style.saturate ?? 100 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="200" :value="selectedElement.style.saturate ?? 100" @input="(e: any) => handleInput(selectedId!, 'saturate', parseFloat(e.target.value), true)">
                             </div>
                         </div>

                         <!-- Creative Filters -->
                         <div class="space-y-3 pt-2 border-t border-outline/5">
                             <div class="text-xs font-bold text-on-surface-variant px-1 opacity-70">Filters</div>
                             
                             <!-- Blur -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Blur</span> <span>{{ selectedElement.style.blur ?? 0 }}px</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="20" :value="selectedElement.style.blur ?? 0" @input="(e: any) => handleInput(selectedId!, 'blur', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Grayscale -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Grayscale</span> <span>{{ selectedElement.style.grayscale ?? 0 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="100" :value="selectedElement.style.grayscale ?? 0" @input="(e: any) => handleInput(selectedId!, 'grayscale', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Sepia -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Sepia</span> <span>{{ selectedElement.style.sepia ?? 0 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="100" :value="selectedElement.style.sepia ?? 0" @input="(e: any) => handleInput(selectedId!, 'sepia', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Hue Rotate -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Hue Rotate</span> <span>{{ selectedElement.style.hueRotate ?? 0 }}°</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="360" :value="selectedElement.style.hueRotate ?? 0" @input="(e: any) => handleInput(selectedId!, 'hueRotate', parseFloat(e.target.value), true)">
                             </div>
                             <!-- Invert -->
                             <div class="space-y-2">
                                 <div class="flex justify-between text-xs font-medium text-on-surface-variant px-1"><span>Invert</span> <span>{{ selectedElement.style.invert ?? 0 }}%</span></div>
                                 <input type="range" class="w-full accent-primary h-1 bg-outline/10 rounded-full appearance-none" min="0" max="100" :value="selectedElement.style.invert ?? 0" @input="(e: any) => handleInput(selectedId!, 'invert', parseFloat(e.target.value), true)">
                             </div>
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
                <button @click="toggleSection('canvas')" class="section-header group">
                     <div class="flex items-center gap-2 text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                        <Smartphone :size="16" />
                        <span>Canvas Settings</span>
                     </div>
                     <component :is="openSections.canvas ? ChevronDown : ChevronRight" :size="16" class="text-on-surface-variant/50" />
                </button>
                <div v-if="openSections.canvas" class="px-3 pb-3 space-y-3">
                     <!-- Dimensions -->
                     <div class="space-y-2">
                         <div class="input-wrapper !px-0">
                            <select class="custom-input !px-2 bg-transparent text-xs" @change="(e: any) => { const p = CANVAS_PRESETS.find((x: any) => x.name === e.target.value); if (p) { posterSize.w = p.w; posterSize.h = p.h; } }">
                                <option value="" disabled selected>Select Preset Size</option>
                                <option v-for="p in CANVAS_PRESETS" :key="p.name" :value="p.name">{{ p.name }} ({{ p.w }}x{{ p.h }})</option>
                            </select>
                         </div>
                         <div class="grid grid-cols-2 gap-2">
                             <div class="input-wrapper"><span class="input-label">W</span><input type="number" class="custom-input" :value="posterSize.w" @input="(e: any) => posterSize.w = parseInt(e.target.value)"></div>
                             <div class="input-wrapper"><span class="input-label">H</span><input type="number" class="custom-input" :value="posterSize.h" @input="(e: any) => posterSize.h = parseInt(e.target.value)"></div>
                         </div>
                     </div>

                     <!-- Background & Grid -->
                     <div class="space-y-3 pt-2 border-t border-outline/5">
                         <div class="flex items-center justify-between p-1.5 bg-surface-variant/30 rounded-lg">
                             <span class="text-xs font-medium text-on-surface pl-1">Show Grid</span>
                             <md-switch :selected="showGrid" @change="showGrid = !showGrid" class="scale-75 origin-right"></md-switch>
                         </div>

                         <div class="space-y-2">
                             <span class="text-xs font-bold text-on-surface-variant px-1">Background</span>
                             <div class="flex bg-surface-variant/30 p-1 rounded-lg">
                                 <button @click="backgroundType = 'solid'" class="flex-1 py-1 rounded text-xs font-bold transition-all" :class="backgroundType === 'solid' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant hover:text-on-surface'">Solid</button>
                                 <button @click="backgroundType = 'gradient'" class="flex-1 py-1 rounded text-xs font-bold transition-all" :class="backgroundType === 'gradient' ? 'bg-surface shadow text-primary' : 'text-on-surface-variant hover:text-on-surface'">Gradient</button>
                             </div>
                             
                             <div v-if="backgroundType === 'solid'">
                                 <ColorPicker :model-value="String(bgColor)" @update:model-value="(v: any) => bgColor = v" />
                             </div>

                             <div v-else>
                                 <textarea v-model="gradientStyle" placeholder="linear-gradient(...)" class="w-full text-xs p-2 rounded-lg bg-surface-high border border-outline/10 h-16 font-mono resize-none"></textarea>
                             </div>
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
    @apply w-full flex items-center justify-between p-3 hover:bg-surface-variant/20 transition-colors cursor-pointer;
}

/* Custom Dense Inputs */
.input-wrapper {
    @apply relative flex items-center bg-surface-variant/30 rounded-lg border border-transparent focus-within:border-primary/50 focus-within:bg-surface-variant/50 transition-all h-9;
}
.input-label {
    @apply pl-3 pr-2 text-xs font-bold text-on-surface-variant/70 border-r border-outline/5 h-[60%] flex items-center select-none;
}
.custom-input {
    @apply flex-1 bg-transparent border-none text-xs font-medium text-on-surface px-2 h-full w-full focus:outline-none placeholder:text-on-surface-variant/30;
}
.custom-input::-webkit-inner-spin-button, .custom-input::-webkit-outer-spin-button {
    -webkit-appearance: none; margin: 0;
}

.layer-btn {
    @apply flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-surface-high/30 hover:bg-surface-high hover:text-primary transition-colors text-on-surface-variant flex-1 border border-transparent hover:border-outline/10;
}

.style-toggle-btn {
    @apply w-8 h-8 flex items-center justify-center rounded hover:bg-surface-high transition-colors text-on-surface-variant text-sm;
}
.style-toggle-btn.active {
    @apply bg-primary/10 text-primary font-bold;
}
</style>
