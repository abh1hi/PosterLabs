<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CanvasElement, useElements } from '../../composables/useElements'
import { Copy, MoreHorizontal, RotateCcw, Move, Trash2, X } from 'lucide-vue-next'

const props = defineProps<{
  element: CanvasElement
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'update', id: number, updates: Partial<CanvasElement>): void
}>()

const { duplicateElement, deleteElement, selectedId } = useElements()

const textRef = ref<HTMLElement | null>(null)
const isMenuOpen = ref(false)

const renderStyle = computed(() => {
  const el = props.element
  const style = el.style
  const base: any = {
    left: `${el.x}px`,
    top: `${el.y}px`,
    position: 'absolute',
    zIndex: props.isSelected ? 100 : 10,
    opacity: style.opacity ?? 1,
    transform: `rotate(${style.rotate ?? 0}deg) scaleX(${style.flipX ? -1 : 1}) scaleY(${style.flipY ? -1 : 1})`,
    cursor: 'move',
    transition: 'outline 0.1s ease',
    transformOrigin: 'center center'
  }

  if (el.type === 'shape' || el.type === 'image') {
    base.width = `${style.width || 100}px`
    base.height = `${style.height || 100}px`
  }

  if (el.type === 'image') {
    const blur = style.blur ?? 0
    const grayscale = (style.grayscale ?? 0) * 100
    const brightness = (style.brightness ?? 1) * 100
    const contrast = (style.contrast ?? 1) * 100
    const sepia = (style.sepia ?? 0) * 100

    base.filter = `blur(${blur}px) grayscale(${grayscale}%) brightness(${brightness}%) contrast(${contrast}%) sepia(${sepia}%)`
    base.borderRadius = typeof style.borderRadius === 'number' ? `${style.borderRadius}px` : style.borderRadius || '0px'
    
    if (style.shadow && style.shadow.blur > 0) {
      base.boxShadow = `${style.shadow.offsetX ?? 0}px ${style.shadow.offsetY ?? 0}px ${style.shadow.blur}px ${style.shadow.color ?? '#000000'}`
    }
    
    base.overflow = 'hidden'
  }

  if (el.type === 'shape') {
    base.backgroundColor = style.backgroundColor || '#3b82f6'

    if (style.shapeType === 'circle') {
      base.borderRadius = '50%'
    } else if (style.shapeType === 'triangle') {
      base.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'
      base.borderRadius = 0
    } else if (style.shapeType === 'star') {
      base.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
      base.borderRadius = 0
    } else if (style.shapeType === 'hexagon') {
      base.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
      base.borderRadius = 0
    } else {
      base.borderRadius = typeof style.borderRadius === 'number' ? `${style.borderRadius}px` : style.borderRadius || '0px'
    }

    if ((!style.shapeType || style.shapeType === 'rectangle' || style.shapeType === 'circle') && style.borderWidth) {
      base.border = `${style.borderWidth}px solid ${style.borderColor ?? '#000000'}`
    }
  }
  
  if(el.type === 'text') {
      base.fontSize = `${style.fontSize || 24}px`
      base.fontFamily = style.fontFamily || 'Inter, sans-serif'
      base.fontWeight = style.fontWeight || 'normal'
      base.color = style.color || '#000000'
      base.textAlign = style.textAlign || 'left'
      base.lineHeight = style.lineHeight || 1.2
      base.letterSpacing = style.letterSpacing || '0px'
      base.fontStyle = style.fontStyle || 'normal'
      base.whiteSpace = 'pre-wrap'
      base.minWidth = '50px'
      base.padding = '8px'
  }

  return base
})

const onTextBlur = () => {
  if (textRef.value) {
    emit('update', props.element.id, { content: textRef.value.innerText })
  }
}

watch(() => props.element.content, (newVal) => {
  if (textRef.value && textRef.value.innerText !== newVal) {
    textRef.value.innerText = newVal || ''
  }
})

const handleDuplicate = (e: Event) => {
    e.stopPropagation()
    duplicateElement(props.element.id)
}

const handleDelete = (e: Event) => {
    e.stopPropagation()
    deleteElement(props.element.id)
    isMenuOpen.value = false
}
</script>

<template>
  <div
    :class="[
      'absolute transform-gpu select-none',
      isSelected ? 'ring-[3px] ring-[#8b5cf6] shadow-2xl' : 'hover:ring-2 hover:ring-blue-300'
    ]"
    :style="renderStyle"
    data-element-frame="true"
  >
    <!-- Floating Top Bar (Pill) -->
    <div v-if="isSelected" 
         class="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center bg-white border border-gray-100 shadow-2xl rounded-full px-3 py-2.5 gap-3 z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
         :style="{ transform: `translateX(-50%) rotate(${-(element.style.rotate || 0)}deg)` }"
    >
       <button @click="handleDuplicate" class="p-2.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100 shadow-sm bg-white active:scale-90 flex items-center justify-center">
          <Copy :size="24" class="text-gray-800" />
       </button>
       <div class="w-px h-6 bg-gray-200"></div>
       <button @click="isMenuOpen = !isMenuOpen" class="p-2.5 hover:bg-gray-100 rounded-full transition-colors relative active:scale-90 flex items-center justify-center">
          <MoreHorizontal :size="24" class="text-gray-800" />
          
          <!-- Popover Menu -->
          <div v-if="isMenuOpen" class="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 flex flex-col min-w-[140px] z-[120]">
             <button @click="handleDelete" class="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 :size="18" /> Delete
             </button>
             <button @click="selectedId = null; isMenuOpen = false" class="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                <X :size="18" /> Deselect
             </button>
          </div>
       </button>
    </div>

    <!-- Corner Handles (White Circular) -->
    <template v-if="isSelected">
      <div class="absolute -top-4 -left-4 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-2xl z-[110] hover:scale-125 transition-transform cursor-nwse-resize active:scale-95" data-action="resize" data-handle="top-left"></div>
      <div class="absolute -top-4 -right-4 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-2xl z-[110] hover:scale-125 transition-transform cursor-nesw-resize active:scale-95" data-action="resize" data-handle="top-right"></div>
      <div class="absolute -bottom-4 -left-4 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-2xl z-[110] hover:scale-125 transition-transform cursor-nesw-resize active:scale-95" data-action="resize" data-handle="bottom-left"></div>
      <div class="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-2xl z-[110] hover:scale-125 transition-transform cursor-nwse-resize active:scale-95" data-action="resize" data-handle="bottom-right"></div>
    </template>

    <!-- Bottom Action Buttons (Rotate and Move) -->
    <div v-if="isSelected" 
         class="absolute -bottom-24 left-0 right-0 flex justify-around items-center z-[110] pointer-events-auto"
         :style="{ transform: `rotate(${-(element.style.rotate || 0)}deg)` }"
    >
       <button class="w-16 h-16 bg-white rounded-full shadow-2xl border border-gray-100 flex items-center justify-center group active:scale-90 transition-all cursor-pointer hover:shadow-blue-500/10" data-action="rotate">
          <RotateCcw :size="28" class="text-gray-800 pointer-events-none group-hover:rotate-45 transition-transform" />
       </button>
       <button class="w-16 h-16 bg-white rounded-full shadow-2xl border border-gray-100 flex items-center justify-center group active:scale-90 transition-all cursor-move hover:shadow-blue-500/10" data-action="move">
          <Move :size="28" class="text-gray-800 pointer-events-none" />
       </button>
    </div>

    <!-- Text Content -->
    <div
      v-if="element.type === 'text'"
      ref="textRef"
      :contenteditable="isSelected"
      @blur="onTextBlur"
      class="outline-none h-full w-full min-h-[1.2em] relative"
      :class="isSelected ? 'cursor-text' : 'cursor-move'"
    >{{ element.content }}</div>

    <!-- Image Content -->
    <img
      v-if="element.type === 'image'"
      :src="element.src"
      alt="uploaded"
      class="w-full h-full object-cover pointer-events-none"
      :style="{
          objectPosition: `${element.style.crop?.x ?? 50}% ${element.style.crop?.y ?? 50}%`,
          transform: `scale(${element.style.crop?.scale ?? 1})`
      }"
    />

    <!-- Shape Content -->
    <div v-if="element.type === 'shape'" class="w-full h-full pointer-events-none"></div>

  </div>
</template>

<style scoped>
[contenteditable="true"]:empty:before {
  content: attr(placeholder);
  display: block;
  opacity: 0.5;
}
</style>
