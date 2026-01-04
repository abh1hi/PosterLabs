<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { X, Check } from 'lucide-vue-next'

const props = defineProps<{
    isOpen: boolean
    imageUrl: string
}>()

const emit = defineEmits(['close', 'save'])

const cropperRef = ref<any>(null)

const handleSave = () => {
    if (cropperRef.value) {
        const { canvas } = cropperRef.value.getResult()
        if (canvas) {
            canvas.toBlob((blob: Blob | null) => {
                if (blob) {
                    emit('save', blob)
                }
            }, 'image/png')
        }
    }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div class="bg-surface-low w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <div class="p-4 border-b border-outline/10 flex items-center justify-between shrink-0">
              <h3 class="title-medium">Crop Image</h3>
              <button @click="$emit('close')" class="w-10 h-10 rounded-full hover:bg-surface-high flex items-center justify-center transition-colors">
                  <X :size="24" />
              </button>
          </div>

          <!-- Cropper Area -->
          <div class="flex-1 bg-surface-lowest relative overflow-hidden">
               <cropper
                  ref="cropperRef"
                  class="h-full w-full"
                  :src="imageUrl"
                  :stencil-props="{
                      aspectRatio: 0, // Free aspect ratio by default
                      movable: true,
                      resizable: true
                  }"
                  image-restriction="stencil"
               />
          </div>

          <!-- Footer controls -->
          <div class="p-4 border-t border-outline/10 flex justify-end gap-3 shrink-0 bg-surface-low">
              <button @click="$emit('close')" class="px-6 py-2.5 rounded-full font-bold hover:bg-surface-high transition-colors">Cancel</button>
              <button @click="handleSave" class="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold hover:brightness-110 transition-all flex items-center gap-2">
                  <Check :size="20" />
                  <span>Apply Crop</span>
              </button>
          </div>

      </div>
  </div>
</template>

<style scoped>
@reference "../../index.css";
</style>
