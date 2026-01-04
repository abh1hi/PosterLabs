<script setup lang="ts">
import { computed } from 'vue'
import { useElements, type CanvasElement } from '../../composables/useElements'
import { useTransform } from '../../composables/useTransform'
import { useCanvas } from '../../composables/useCanvas'
import { 
  Copy, Trash2, RotateCcw, Move, X, Lock, Unlock, Settings2
} from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'

const props = defineProps<{
    element: CanvasElement
}>()

const { selectedId, updateElement, deleteElement, duplicateElement } = useElements()
const { startTransform } = useTransform()
const { activeTab, isToolbarOpen } = useCanvas()

const isSelected = computed(() => selectedId.value === props.element.id)

const openProperties = () => {
    activeTab.value = 'properties'
    isToolbarOpen.value = true
}


const elementStyle = computed(() => ({
    width: props.element.style.width ? `${props.element.style.width}px` : 'auto',
    height: props.element.style.height ? `${props.element.style.height}px` : 'auto',
    transform: `translate(${props.element.x}px, ${props.element.y}px) rotate(${props.element.style.rotate || 0}deg)`,
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
        borderRadius: typeof s.borderRadius === 'number' ? `${s.borderRadius}px` : s.borderRadius,
        borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
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
    if (props.element.locked) return
    selectedId.value = props.element.id
    startTransform(props.element.id, 'move', e)
}

const toggleLock = () => {
    updateElement(props.element.id, { locked: !props.element.locked })
}

</script>

<template>
  <div 
    class="element-container group"
    :class="{ 'is-selected': isSelected, 'is-locked': element.locked }"
    :style="elementStyle"
    @mousedown.stop="handleSelect"
    @touchstart.stop="handleSelect"
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
            <img :src="element.src" class="w-full h-full object-contain pointer-events-none" />
        </template>
        
        <template v-else-if="element.type === 'shape'">
            <div class="w-full h-full transition-all">
                <svg v-if="element.style.shapeType === 'circle'" viewBox="0 0 100 100" class="w-full h-full fill-current">
                    <circle cx="50" cy="50" r="48" />
                </svg>
                <svg v-else-if="element.style.shapeType === 'triangle'" viewBox="0 0 100 100" class="w-full h-full fill-current">
                    <path d="M50 5 L95 95 L5 95 Z" />
                </svg>
                <div v-else class="w-full h-full bg-current"></div>
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
            <button class="control-btn" @click.stop="selectedId = null" title="Deselect"><X :size="16" /></button>
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
  @apply absolute w-4 h-4 bg-white border-2 border-primary rounded-full z-40 cursor-nwse-resize shadow-md hover:scale-125 transition-transform pointer-events-auto;
}
.top-left { top: -8px; left: -8px; cursor: nwse-resize; }
.top-right { top: -8px; right: -8px; cursor: nesw-resize; }
.bottom-left { bottom: -8px; left: -8px; cursor: nesw-resize; }
.bottom-right { bottom: -8px; right: -8px; cursor: nwse-resize; }

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
