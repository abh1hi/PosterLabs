<script setup lang="ts">
import { computed } from 'vue'
import { useElements, type CanvasElement } from '../../composables/useElements'
import { useTransform } from '../../composables/useTransform'
import { useCanvas } from '../../composables/useCanvas'
import { 
  Copy, Trash2, RotateCcw, Move, X, Lock, Unlock, Settings2
} from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'

defineOptions({
  name: 'RenderElement'
})

const props = defineProps<{
    element: CanvasElement,
    isChild?: boolean,
    parentId?: string
}>()

const { selectedIds, updateElement, deleteElement, duplicateElement, toggleSelection } = useElements()
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
    :class="{ 'is-selected': isSelected, 'is-locked': element.locked }"
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
            <div class="whitespace-pre-wrap outline-none">{{ element.content }}</div>
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
                class="w-full h-full object-contain pointer-events-none transition-all" 
                :style="{ borderRadius: innerStyle.borderRadius }"
            />
        </template>
        
        <template v-else-if="element.type === 'shape'">
            <div class="w-full h-full transition-all overflow-hidden" 
                 :style="{ 
                    borderRadius: innerStyle.borderRadius,
                    border: `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor}`,
                    background: element.style.backgroundColor || '#0061a4',
                    clipPath: element.style.shapeType === 'circle' ? 'circle(50% at 50% 50%)' :
                              element.style.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                              element.style.shapeType === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                              element.style.shapeType === 'heart' ? 'path(\'M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z\')' : // Basic Heart attempt via path or SVG? path() in clip-path is experimental but widespread.
                              element.style.shapeType === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                              element.style.shapeType === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                              element.style.shapeType === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' :
                              undefined
                 }"
            >
                <!-- For SVG/Path based clip-paths like Heart, it might be safer to use SVG + mask for cross browser if path() isn't fully supported, but modern Chrome supports path(). Let's stick to polygon for now. Heart is hard with polygon. 
                     Actually, for 'Star' and 'Heart', SVG is still safer IF we want complex curves. 
                     BUT, if we want gradients, 'background' on the DIV is best.
                     Let's use ::before/::after or just the div.
                     
                     Note regarding Border on clipped shapes: 
                     CSS Borders are CLIPPED OUT if we use clip-path!
                     Solution: Nested Divs. Outer div has size. Inner div has background + clip-path.
                     But where does the border go? 
                     Border on shapes like Star is hard with CSS borders. 
                     We might need to render an SVG STROKE for the border if it's a star.
                     
                     Let's revert to SVG for shapes if we want borders? 
                     OR use drop-shadow filter hack for borders?
                     
                     Let's try a hybrid:
                     If specific shape, use SVG.
                     If rectangle/circle, use CSS.
                     
                     Wait, key requirement is GRADIENT support.
                     SVG fills accept IDs -> <linearGradient>.
                     
                     If we want to keep it simple: define standard Defs for gradients?
                     Or use 'mask'.
                     
                     Let's stick to the previous SVG implementation but clean it up for gradients?
                     Actually, user wants "Advance Manipulation" like gradients. 
                     Let's try using a `foreignObject` or simply mapped SVG styles.
                     
                     Let's stick to the requested Clip Path Refactor, but be aware of border limitations.
                     Border on a Star needs to be an SVG stroke.
                -->
                
                <!-- Improved Shape Rendering -->
                <!-- We use mask-image if possible for best support, or SVG -->
                
                 <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient v-if="element.style.backgroundType === 'gradient'" :id="'grad-' + element.id" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" :stop-color="element.style.backgroundColor || '#0061a4'" />
                            <stop offset="100%" stop-color="transparent" />
                        </linearGradient>
                    </defs>
                    
                    <path 
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
    <template v-if="isSelected && !element.locked">
        <!-- Selection Border -->
        <div class="absolute inset-[-4px] border-2 border-primary rounded-lg pointer-events-none shadow-[0_0_15px_rgba(var(--md-sys-color-primary-rgb),0.3)]"></div>
        
        <!-- Action Pill (Floating Top) -->
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface-high border border-outline/10 p-1.5 rounded-full shadow-xl z-[70] animate-in zoom-in-95 duration-200">
            <button class="control-btn" @click.stop="openProperties" title="Edit Properties"><Settings2 :size="16" /></button>
            <div class="w-px h-4 bg-outline/20 mx-1"></div>
            <button class="control-btn" @click.stop="duplicateElement(element.id)" title="Duplicate"><Copy :size="16" /></button>
            <div class="w-px h-4 bg-outline/20 mx-1"></div>
            <button class="control-btn" @click.stop="toggleLock" title="Lock"><Unlock :size="16" /></button>
            <button class="control-btn danger" @click.stop="deleteElement(element.id)" title="Delete"><Trash2 :size="16" /></button>
            <div class="w-px h-4 bg-outline/20 mx-1"></div>
            <button class="control-btn" @click.stop="toggleSelection(element.id, true)" title="Deselect"><X :size="16" /></button>
        </div>

        <!-- Corner Resize Handles (M3 Style) -->
        <div class="handle top-left" @mousedown.stop="startTransform(element.id, 'resize', $event, 'tl')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'tl')"></div>
        <div class="handle top-right" @mousedown.stop="startTransform(element.id, 'resize', $event, 'tr')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'tr')"></div>
        <div class="handle bottom-left" @mousedown.stop="startTransform(element.id, 'resize', $event, 'bl')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'bl')"></div>
        <div class="handle bottom-right" @mousedown.stop="startTransform(element.id, 'resize', $event, 'br')" @touchstart.stop="startTransform(element.id, 'resize', $event, 'br')"></div>

        <!-- Float-Bottom Action Buttons -->
        <div class="absolute -bottom-24 left-1/2 -translate-x-1/2 flex gap-4 z-[70]">
            <div class="action-circle secondary" @mousedown.stop="startTransform(element.id, 'rotate', $event)" @touchstart.stop="startTransform(element.id, 'rotate', $event)" title="Rotate">
                <RotateCcw :size="24" />
            </div>
            <div class="action-circle primary" @mousedown.stop="startTransform(element.id, 'move', $event)" @touchstart.stop="startTransform(element.id, 'move', $event)" title="Drag to Move">
                <Move :size="28" />
            </div>
        </div>
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

.control-btn {
  @apply w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-highest transition-colors text-on-surface-variant;
}
.control-btn.danger:hover { @apply text-error bg-error/10; }

.handle {
  /* Increased from w-4 h-4 (16px) to w-6 h-6 (24px) for better touch targets */
  @apply absolute w-6 h-6 bg-white border-2 border-primary rounded-full z-40 cursor-nwse-resize shadow-md active:scale-110 hover:scale-110 transition-transform pointer-events-auto;
  /* Add explicit large touch target via pseudo-element if needed, but 24px visual is good start */
}
.handle::after {
    content: '';
    @apply absolute -top-4 -bottom-4 -left-4 -right-4; /* Expand hit area by 16px on all sides */
}
.top-left { top: -12px; left: -12px; cursor: nwse-resize; }
.top-right { top: -12px; right: -12px; cursor: nesw-resize; }
.bottom-left { bottom: -12px; left: -12px; cursor: nesw-resize; }
.bottom-right { bottom: -12px; right: -12px; cursor: nwse-resize; }

.action-circle {
  @apply w-16 h-16 rounded-full flex items-center justify-center shadow-2xl cursor-grab transition-transform active:scale-95 border-4 border-white dark:border-surface;
}
.action-circle.primary { @apply bg-primary text-on-primary; }
.action-circle.secondary { @apply bg-secondary-container text-on-secondary-container; }

.text-primary { color: var(--md-sys-color-primary); }
.bg-primary { background-color: var(--md-sys-color-primary); }
.border-primary { border-color: var(--md-sys-color-primary); }
.text-error { color: var(--md-sys-color-error); }
.bg-surface-high { background-color: var(--md-sys-color-surface-container-high); }
</style>
