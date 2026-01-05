<script setup lang="ts">
import { useElements } from '../../../composables/useElements'
import { useToasts } from '../../../composables/useToasts'
import { useCanvas } from '../../../composables/useCanvas'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useFonts } from '../../../composables/useFonts'

const { addElement } = useElements()
const { showToast } = useToasts()
const { activeTab } = useCanvas()
const { isGoogleFontsActive } = useFonts()

const triggerHaptic = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }) } catch (e) {}
}

const handleAddElement = (params: any) => {
    addElement(params)
    triggerHaptic()
    showToast(`${params.type.charAt(0).toUpperCase() + params.type.slice(1)} added`, 'success')
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
</script>

<template>
    <div class="p-4 space-y-6">
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
</template>
