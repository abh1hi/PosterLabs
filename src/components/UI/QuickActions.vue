<script setup lang="ts">
import { useElements } from '../../composables/useElements'
import { useToasts } from '../../composables/useToasts'
import { Trash2, Copy, ArrowUp, ArrowDown, X } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon.js'

const { selectedId, elements, deleteElement, duplicateElement } = useElements()
const { showToast } = useToasts()

const moveUp = () => {
    if (!selectedId.value) return
    const idx = elements.value.findIndex(e => e.id === selectedId.value)
    if (idx < elements.value.length - 1) {
        const el = elements.value.splice(idx, 1)[0]
        elements.value.splice(idx + 1, 0, el)
        showToast('Moved up', 'info')
    }
}

const moveDown = () => {
    if (!selectedId.value) return
    const idx = elements.value.findIndex(e => e.id === selectedId.value)
    if (idx > 0) {
        const el = elements.value.splice(idx, 1)[0]
        elements.value.splice(idx - 1, 0, el)
        showToast('Moved down', 'info')
    }
}

const handleDuplicate = () => {
    if (selectedId.value) {
        duplicateElement(selectedId.value)
        showToast('Element duplicated', 'success')
    }
}

const handleDelete = () => {
    if (selectedId.value) {
        deleteElement(selectedId.value)
        showToast('Element deleted', 'info')
    }
}
</script>

<template>
  <div v-if="selectedId" class="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-auto md:top-20 md:left-1/2 md:-translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
    <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl flex items-center p-1.5 gap-1">
      
      <md-icon-button @click="moveUp" title="Bring to Front">
        <ArrowUp :size="20" />
      </md-icon-button>
      
      <md-icon-button @click="moveDown" title="Send to Back">
        <ArrowDown :size="20" />
      </md-icon-button>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

      <md-icon-button @click="handleDuplicate" title="Duplicate">
        <Copy :size="18" />
      </md-icon-button>

      <md-icon-button @click="handleDelete" title="Delete" class="text-red-500">
        <Trash2 :size="18" />
      </md-icon-button>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

      <md-icon-button @click="selectedId = null" title="Deselect">
        <X :size="20" />
      </md-icon-button>

    </div>
  </div>
</template>
