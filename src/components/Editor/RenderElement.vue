<script setup lang="ts">
import { computed } from 'vue'
import { useElements, type CanvasElement } from '../../composables/useElements'
import { useTransform } from '../../composables/useTransform'
import { useCanvas } from '../../composables/useCanvas'
import { 
  Copy, Trash2, RotateCcw, Lock, Unlock, Settings2,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown 
} from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'

defineOptions({
  name: 'RenderElement'
})

const props = defineProps<{
    element: CanvasElement,
    isChild?: boolean,
    parentId?: string,
    isPreview?: boolean
}>()

const { selectedIds, updateElement, deleteElement, duplicateElement, toggleSelection, moveElement } = useElements()
const { startTransform } = useTransform()
const { activeTab, isToolbarOpen } = useCanvas()

const isSelected = computed(() => selectedIds.value.includes(props.element.id))

const openProperties = () => {
    activeTab.value = 'properties'
    isToolbarOpen.value = true
}


const elementStyle = computed(() => ({
    width: props.element.style.width ? `${props.element.style.width}px` : 'auto',
    height: props.element.style.height ? `${props.element.style.height}px` : 'auto',
    transform: `translate(${props.element.x}px, ${props.element.y}px) rotate(${props.element.style.rotate || 0}deg) skewX(${props.element.style.skewX || 0}deg) skewY(${props.element.style.skewY || 0}deg)`,
    opacity: props.element.style.opacity ?? 1,
    zIndex: props.element.order || 0,
    position: 'absolute' as const,
    display: props.element.hidden ? 'none' : 'block'
}))

const innerStyle = computed(() => {
    const s = props.element.style
    return {
        fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        fontStyle: s.fontStyle,
        color: s.color,
        textAlign: s.textAlign,
        backgroundColor: s.backgroundColor,
        padding: s.padding ? `${s.padding}px` : undefined,
        borderRadius: typeof s.borderRadius === 'number' ? `${s.borderRadius}px` : s.borderRadius,
        borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
        borderStyle: s.borderStyle || 'solid',
        borderColor: s.borderColor,
        mixBlendMode: s.mixBlendMode as any,
        transform: `scaleX(${s.flipX ? -1 : 1}) scaleY(${s.flipY ? -1 : 1})`,
        letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
        lineHeight: s.lineHeight,
        textDecoration: s.textDecoration,
        textTransform: s.textTransform,
        WebkitTextStrokeWidth: s.webkitTextStrokeWidth ? `${s.webkitTextStrokeWidth}px` : undefined,
        WebkitTextStrokeColor: s.webkitTextStrokeColor,
        [props.element.type === 'text' ? 'textShadow' : 'boxShadow']: s.shadow 
            ? `${s.shadow.offsetX}px ${s.shadow.offsetY}px ${s.shadow.blur}px ${s.shadow.color}` 
            : undefined,
        filter: [
            s.blur ? `blur(${s.blur}px)` : '',
            s.brightness ? `brightness(${s.brightness}%)` : '',
            s.contrast ? `contrast(${s.contrast}%)` : '',
            s.grayscale ? `grayscale(${s.grayscale}%)` : '',
            s.sepia ? `sepia(${s.sepia}%)` : '',
            s.saturate ? `saturate(${s.saturate}%)` : '',
            s.hueRotate ? `hue-rotate(${s.hueRotate}deg)` : '',
            s.invert ? `invert(${s.invert}%)` : ''
        ].filter(Boolean).join(' ')
    }
})

const handleSelect = (e: MouseEvent | TouchEvent) => {
    // Deep Select Logic (Figma Style)
    // If Is Child:
    // 1. If Parent is ALREADY selected -> Select Child
    // 2. If Parent is NOT selected -> Select Parent
    
    // Standard Parent/Group Selection Logic
    e.stopPropagation() 
    if (props.element.locked) return

    // Normal Selection
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey
    toggleSelection(props.element.id, isMulti)
    
    if (selectedIds.value.includes(props.element.id)) {
        startTransform(props.element.id, 'move', e)
    }
}

const toggleLock = () => {
    updateElement(props.element.id, { locked: !props.element.locked })
}

const getShapePath = (type?: string) => {
    switch(type) {
        case 'circle': return 'M 50, 50 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0'
        case 'triangle': return 'M 50 0 L 100 100 L 0 100 Z'
        case 'star': return 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z'
        case 'heart': return 'M 50 30 A 20 20 0 0 1 90 30 C 90 60 50 90 50 90 C 50 90 10 60 10 30 A 20 20 0 0 1 50 30 Z'
        case 'pentagon': return 'M 50 0 L 100 38 L 82 100 L 18 100 L 0 38 Z'
        case 'hexagon': return 'M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z'
        default: return 'M 0 0 L 100 0 L 100 100 L 0 100 Z'
    }
}

const getStrokeDash = (style?: string) => {
    switch(style) {
        case 'dashed': return '5,5'
        case 'dotted': return '2,2'
        default: return 'none'
    }
}




</script>

<template>
  <div 
    class="element-container group"
    :class="{ 'is-selected': isSelected, 'is-locked': element.locked, 'preview-active': isPreview }"
    :style="elementStyle"
    @mousedown="handleSelect"
    @touchstart="handleSelect"
    :data-element-id="element.id"
  >
    <!-- The Element Content -->
    <div 
        class="w-full h-full pointer-events-none select-none overflow-visible"
        :style="innerStyle"
    >
        <template v-if="element.type === 'text'">
            <!-- Curved Text (SVG) -->
            <div v-if="element.style.curve && element.style.curve !== 0" class="w-full h-full overflow-visible">
                 <svg viewBox="0 0 200 100" overflow="visible" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                    <defs>
                         <!-- Dynamic Path based on Curve Value (-100 to 100) -->
                         <!-- Curve > 0: Arch Up (Sad mouth), Curve < 0: Arch Down (Smile) 
                              Standard SVG coords: Y goes down.
                              So Cy < y means Control point above. 
                         -->
                         <path :id="'curve-' + element.id" 
                            :d="`M 0 50 Q 100 ${50 + (element.style.curve * 1.5)} 200 50`" 
                            fill="transparent" />
                    </defs>
                    <text 
                        fill="currentColor"
                        :style="{ fill: element.style.color || '#000000', fontSize: '20px', fontFamily: element.style.fontFamily, fontWeight: element.style.fontWeight, fontStyle: element.style.fontStyle }"
                        text-anchor="middle"
                    >
                        <textPath :href="'#curve-' + element.id" startOffset="50%">
                            {{ element.content }}
                        </textPath>
                    </text>
                 </svg>
            </div>

            <!-- Standard Text (Div) -->
            <div v-else 
                class="whitespace-pre-wrap outline-none"
                :class="{ 'gradient-text': !!element.style.textGradient }"
                :style="{
                    ...innerStyle,
                    backgroundImage: element.style.textGradient ? element.style.textGradient : undefined,
                    color: element.style.textGradient ? 'transparent' : innerStyle.color,
                    backgroundClip: element.style.textGradient ? 'text' : undefined,
                    WebkitBackgroundClip: element.style.textGradient ? 'text' : undefined
                }"
            >{{ element.content }}</div>
        </template>
        
        <template v-else-if="element.type === 'image'">
            <div 
                v-if="element.style.objectFit === 'cover'"
                class="w-full h-full bg-no-repeat bg-center bg-cover pointer-events-none transition-all"
                :style="{ 
                    backgroundImage: `url(${element.src})`, 
                    borderRadius: innerStyle.borderRadius,
                    transform: `scale(${Number.isFinite(element.style.imageScale) ? element.style.imageScale : 1}) translate(${Number.isFinite(element.style.imagePanX) ? element.style.imagePanX : 0}%, ${Number.isFinite(element.style.imagePanY) ? element.style.imagePanY : 0}%)`,
                    transformOrigin: 'center center'
                }"
            ></div>
            <img 
                v-else 
                :src="element.src" 
                crossorigin="anonymous"
                class="w-full h-full object-contain pointer-events-none transition-all" 
                :style="{ borderRadius: innerStyle.borderRadius }"
            />
        </template>
        
        <template v-else-if="element.type === 'shape'">
            <div class="w-full h-full transition-all overflow-hidden" 
                 :style="{ 
                    borderRadius: innerStyle.borderRadius,
                    border: element.pathData ? 'none' : `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor}`,
                    background: element.pathData ? 'transparent' : (element.style.backgroundColor || '#0061a4'),
                    clipPath: !element.pathData && element.style.shapeType ? (
                              element.style.shapeType === 'circle' ? 'circle(50% at 50% 50%)' :
                              element.style.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                              element.style.shapeType === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                              element.style.shapeType === 'heart' ? 'path(\'M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z\')' :
                              element.style.shapeType === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                              element.style.shapeType === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                              element.style.shapeType === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' :
                              undefined) : undefined
                 }"
            >
                
                 <!-- SVG Renderer for Shapes & Paths -->
                  <svg :viewBox="element.viewBox || (element.pathData ? `0 0 ${element.style.width} ${element.style.height}` : '0 0 100 100')" class="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient v-if="element.style.backgroundType === 'gradient'" :id="'grad-' + element.id" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" :stop-color="element.style.backgroundColor || '#0061a4'" />
                            <stop offset="100%" stop-color="transparent" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Freehand Path -->
                    <path v-if="element.pathData"
                        :d="element.pathData"
                        fill="none"
                        :stroke="element.style.borderColor || '#000'"
                        :stroke-width="element.style.borderWidth || 2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <!-- Standard Shape (Fallback or Specific) -->
                    <path v-else-if="element.style.shapeType"
                        :d="getShapePath(element.style.shapeType)" 
                        :fill="element.style.backgroundType === 'gradient' ? `url(#grad-${element.id})` : (element.style.backgroundColor || '#0061a4')"
                        :stroke="element.style.borderColor || 'transparent'"
                        :stroke-width="element.style.borderWidth || 0"
                        :stroke-dasharray="getStrokeDash(element.style.borderStyle)"
                        vector-effect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </template>

        <template v-else-if="element.type === 'custom'">
            <div class="w-full h-full transition-all">
                <component is="style" v-if="element.style.customCss">
                    {{ element.style.customCss.replace(/selector/g, `[data-element-id="${element.id}"] .custom-content`) }}
                </component>
                <div class="custom-content w-full h-full" v-html="element.customHtml || '<div style=\'padding:20px;background:#eee\'>Custom HTML</div>'"></div>
            </div>
        </template>

        <template v-else-if="element.type === 'group' && element.children">
            <div class="w-full h-full pointer-events-none">
                <!-- Recursive Render -->
                 <RenderElement 
                    v-for="child in element.children" 
                    :key="child.id" 
                    :element="child"
                    :is-child="true" 
                    :parent-id="element.id"
                    class="pointer-events-auto"
                />
            </div>
        </template>
    </div>

    <!-- M3 Selection UI & Controls -->
    <template v-if="isSelected && !element.locked && !isPreview">
        <!-- Selection Border -->
        <div class="absolute inset-[-2px] border-2 border-primary pointer-events-none z-[60]"></div>
        
        <!-- Action Bar (Floating Top - Expanded & High Visibility) -->
        <div class="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[70]" @mousedown.stop @touchstart.stop @click.stop>
            
            <!-- Main Toolbar -->
            <div class="flex items-center gap-1 bg-surface-dummy text-on-surface p-1.5 rounded-full shadow-2xl border border-outline/10 backdrop-blur-md bg-white/90 dark:bg-zinc-800/90 ring-1 ring-black/5">
                
                <!-- Primary Actions -->
                <button class="control-btn" @click.stop="openProperties" title="Properties">
                    <Settings2 :size="18" />
                </button>
                <button class="control-btn" @click.stop="duplicateElement(element.id)" title="Duplicate">
                    <Copy :size="18" />
                </button>
                
                <div class="w-px h-5 bg-outline/20 mx-1"></div>

                <!-- Layer Controls -->
                <button class="control-btn" @click.stop="moveElement(element.id, 'top')" title="Bring to Front">
                    <ArrowUpToLine :size="18" />
                </button>
                <button class="control-btn" @click.stop="moveElement(element.id, 'up')" title="Bring Forward">
                    <ArrowUp :size="18" />
                </button>
                <button class="control-btn" @click.stop="moveElement(element.id, 'down')" title="Send Backward">
                    <ArrowDown :size="18" />
                </button>
                <button class="control-btn" @click.stop="moveElement(element.id, 'bottom')" title="Send to Back">
                    <ArrowDownToLine :size="18" />
                </button>

                <div class="w-px h-5 bg-outline/20 mx-1"></div>

                <!-- State Actions -->
                 <button class="control-btn" @click.stop="toggleLock" :title="element.locked ? 'Unlock' : 'Lock'">
                    <component :is="element.locked ? Lock : Unlock" :size="18" />
                </button>
                <button class="control-btn danger" @click.stop="deleteElement(element.id)" title="Delete">
                    <Trash2 :size="18" class="text-error" />
                </button>
            </div>
        </div>

        <!-- Rotation Handle (Lollipop) -->
        <div class="absolute left-1/2 bottom-[-24px] -translate-x-1/2 flex flex-col items-center group/rotate z-[60] cursor-grab active:cursor-grabbing"
             @mousedown.stop="startTransform(element.id, 'rotate', $event)" 
             @touchstart.stop="startTransform(element.id, 'rotate', $event)">
             <div class="w-px h-4 bg-primary"></div>
             <div class="w-5 h-5 bg-white border-2 border-primary rounded-full shadow-sm hover:scale-110 transition-transform flex items-center justify-center">
                 <RotateCcw :size="10" class="text-primary opacity-0 group-hover/rotate:opacity-100 transition-opacity duration-200"/>
             </div>
        </div>

        <!-- Corner Resize Handles -->
        <div class="handle top-left" @mousedown.stop="startTransform(element.id, 'resize', $event, 'tl')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'tl')"></div>
        <div class="handle top-right" @mousedown.stop="startTransform(element.id, 'resize', $event, 'tr')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'tr')"></div>
        <div class="handle bottom-left" @mousedown.stop="startTransform(element.id, 'resize', $event, 'bl')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'bl')"></div>
        <div class="handle bottom-right" @mousedown.stop="startTransform(element.id, 'resize', $event, 'br')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'br')"></div>

        <!-- Side Resize Handles (Pill Shaped) -->
        <div class="handle-side top-mid" @mousedown.stop="startTransform(element.id, 'resize', $event, 't')" @touchstart.stop="startTransform(element.id, 'resize', $event, 't')"></div>
        <div class="handle-side bottom-mid" @mousedown.stop="startTransform(element.id, 'resize', $event, 'b')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'b')"></div>
        <div class="handle-side left-mid" @mousedown.stop="startTransform(element.id, 'resize', $event, 'l')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'l')"></div>
        <div class="handle-side right-mid" @mousedown.stop="startTransform(element.id, 'resize', $event, 'r')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'r')"></div>
    </template>

    <!-- Locked Indicator -->
    <div v-if="element.locked && isSelected" class="absolute inset-0 border-2 border-outline/20 rounded-lg flex items-center justify-center bg-black/5 pointer-events-none">
        <Lock class="text-on-surface-variant/50" :size="32" />
    </div>

  </div>
</template>

<style scoped>
@reference "../../index.css";

.element-container { cursor: pointer; transition: opacity 0.2s; }
.element-container.is-selected { cursor: move; }
.element-container.is-locked { cursor: not-allowed; }
/* Hover Effect for non-selected items */
.element-container:not(.is-selected):not(.preview-active):hover {
    outline: 1px solid var(--md-sys-color-primary); 
}

.control-btn {
  @apply w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-200;
}
.control-btn.danger:hover { @apply text-red-500 bg-red-50 dark:bg-red-900/20; }

/* Corner Handles */
.handle {
  @apply absolute w-3 h-3 bg-white border border-primary rounded-full z-[65] shadow-sm pointer-events-auto transition-transform hover:scale-125;
}
.handle::after { content: ''; @apply absolute -inset-2; } /* Touch target */

.top-left { top: -6px; left: -6px; cursor: nwse-resize; }
.top-right { top: -6px; right: -6px; cursor: nesw-resize; }
.bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
.bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }

/* Side Handles (Pills) */
.handle-side {
    @apply absolute bg-white border border-primary rounded-full z-[64] shadow-sm pointer-events-auto hover:scale-110 transition-transform;
}
.handle-side::after { content: ''; @apply absolute -inset-2; }

.top-mid { top: -4px; left: 50%; translate: -50% 0; width: 12px; height: 4px; cursor: ns-resize; }
.bottom-mid { bottom: -4px; left: 50%; translate: -50% 0; width: 12px; height: 4px; cursor: ns-resize; }
.left-mid { top: 50%; left: -4px; translate: 0 -50%; width: 4px; height: 12px; cursor: ew-resize; }
.right-mid { top: 50%; right: -4px; translate: 0 -50%; width: 4px; height: 12px; cursor: ew-resize; }

.text-primary { color: var(--md-sys-color-primary); }
.bg-primary { background-color: var(--md-sys-color-primary); }
.border-primary { border-color: var(--md-sys-color-primary); }
.bg-surface-high { background-color: var(--md-sys-color-surface-container-high); }
</style>
