<script setup lang="ts">
import { ref } from 'vue'
import { useMedia } from '../../../composables/useMedia'
import { useElements } from '../../../composables/useElements'
import { useToasts } from '../../../composables/useToasts'
import { useCanvas } from '../../../composables/useCanvas'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Shapes, ImageIcon, Link, Code2 } from 'lucide-vue-next'

const { uploads, isUploading, uploadImage, saveExternalMedia } = useMedia()
const { addElement } = useElements()
const { showToast } = useToasts()
const { activeTab } = useCanvas()
const fileInputRef = ref<HTMLInputElement | null>(null)

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
</script>

<template>
    <div class="p-4 space-y-8">
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
</template>

<style scoped>
@reference "../../../index.css";
.element-card {
  @apply aspect-square bg-surface-high rounded-xl flex items-center justify-center hover:bg-primary-container transition-colors border border-outline/5;
}
</style>
