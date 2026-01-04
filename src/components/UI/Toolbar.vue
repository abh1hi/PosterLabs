<script setup lang="ts">
import { ref } from 'vue'
import { useElements } from '../../composables/useElements'
import { useCanvas } from '../../composables/useCanvas'
import { useToasts } from '../../composables/useToasts'
import { 
  Type, Image as ImageIcon, SlidersHorizontal, Shapes, MousePointer2, Hand
} from 'lucide-vue-next'
import '@material/web/iconbutton/filled-tonal-icon-button.js'
import '@material/web/icon/icon.js'

const { isMobilePropertiesOpen, isShapesLibraryOpen, activeTool } = useCanvas()
const { showToast } = useToasts()
const { addElement, selectedId } = useElements()
const fileInputRef = ref<HTMLInputElement | null>(null)

const addText = () => {
  addElement({
    id: Date.now(),
    type: 'text',
    content: 'Double click to edit',
    x: 100,
    y: 100,
    style: {
      fontSize: 40,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
      lineHeight: 1.2,
      opacity: 1,
      rotate: 0,
      letterSpacing: '0px'
    }
  })
  showToast('Text element added', 'success')
  activeTool.value = 'select'
}

const toggleShapes = () => {
  isShapesLibraryOpen.value = !isShapesLibraryOpen.value
  if (isShapesLibraryOpen.value) {
    selectedId.value = null
    isMobilePropertiesOpen.value = true
  }
}

const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      if(event.target?.result) {
         const img = new Image()
         img.onload = () => {
            const scaleFactor = Math.min(300 / img.width, 300 / img.height, 1)
            addElement({
                id: Date.now(),
                type: 'image',
                src: event.target!.result as string,
                x: 100,
                y: 100,
                style: {
                    width: img.width * scaleFactor,
                    height: img.height * scaleFactor,
                    borderRadius: 0,
                    opacity: 1,
                    rotate: 0,
                    crop: { scale: 1, x: 50, y: 50 },
                    flipX: false,
                    flipY: false,
                    shadow: { blur: 0, color: '#000000', offsetX: 0, offsetY: 0 },
                    mixBlendMode: 'normal'
                }
            })
            showToast('Image uploaded', 'success')
            activeTool.value = 'select'
         }
         img.src = event.target.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

</script>

<template>
  <aside 
    class="w-full md:w-20 border-r flex flex-row md:flex-col items-center py-6 gap-6 z-20 shrink-0 overflow-x-auto md:overflow-visible hide-scrollbar order-1 theme-transition" 
    style="background-color: var(--bg-panel); border-color: var(--border-color);"
  >
    
    <!-- Tool Group -->
    <div class="flex flex-row md:flex-col items-center gap-4 px-2">
      <div class="flex flex-col items-center gap-1">
        <md-filled-tonal-icon-button @click="activeTool = 'select'" title="Select (V)" :selected="activeTool === 'select'">
          <MousePointer2 :size="22" />
        </md-filled-tonal-icon-button>
        <span class="text-[9px] font-bold uppercase tracking-tighter" style="color: var(--fg-secondary);">Select</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <md-filled-tonal-icon-button @click="activeTool = 'hand'" title="Pan Canvas (H)" :selected="activeTool === 'hand'">
          <Hand :size="22" />
        </md-filled-tonal-icon-button>
        <span class="text-[9px] font-bold uppercase tracking-tighter" style="color: var(--fg-secondary);">Pan</span>
      </div>
    </div>

    <div class="h-px w-8 hidden md:block theme-transition" style="background-color: var(--border-color);"></div>

    <div class="flex flex-col items-center gap-1.5 min-w-[64px] md:w-full">
      <md-filled-tonal-icon-button @click="addText" title="Add Text">
        <Type :size="24" />
      </md-filled-tonal-icon-button>
      <span class="text-[11px] font-semibold" style="color: var(--fg-secondary);">Text</span>
    </div>

    <div class="flex flex-col items-center gap-1.5 min-w-[64px] md:w-full">
      <md-filled-tonal-icon-button @click="fileInputRef?.click()" title="Add Image">
        <ImageIcon :size="24" />
      </md-filled-tonal-icon-button>
      <input type="file" hidden ref="fileInputRef" accept="image/*" @change="handleImageUpload" />
      <span class="text-[11px] font-semibold" style="color: var(--fg-secondary);">Image</span>
    </div>

    <div class="flex flex-col items-center gap-1.5 min-w-[64px] md:w-full">
      <md-filled-tonal-icon-button @click="toggleShapes" title="Shapes Library" :selected="isShapesLibraryOpen">
        <Shapes :size="24" />
      </md-filled-tonal-icon-button>
      <span class="text-[11px] font-semibold" style="color: var(--fg-secondary);">Shapes</span>
    </div>

    <div class="h-px w-8 hidden md:block theme-transition" style="background-color: var(--border-color);"></div>

    <!-- Mobile Only Settings Toggle -->
    <div class="md:hidden flex flex-col items-center gap-1.5 min-w-[64px]">
      <md-filled-tonal-icon-button @click="isMobilePropertiesOpen = !isMobilePropertiesOpen" :selected="isMobilePropertiesOpen">
         <SlidersHorizontal :size="24" />
      </md-filled-tonal-icon-button>
      <span class="text-[11px] font-semibold" style="color: var(--fg-secondary);">Edit</span>
    </div>

  </aside>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
