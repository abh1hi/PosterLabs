<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useToasts } from './composables/useToasts'
import ReloadPrompt from './components/ReloadPrompt.vue'
import { CheckCircle, Info, AlertCircle } from 'lucide-vue-next'

const { toasts, removeToast } = useToasts()
</script>

<template>
  <RouterView />
  
  <!-- Global Toast Overlay -->
  <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      <div v-for="t in toasts" :key="t.id" 
          class="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-full shadow-lg bg-surface-highest border border-outline/10 text-on-surface"
      >
        <CheckCircle v-if="t.type === 'success'" class="text-primary" :size="20" />
        <AlertCircle v-else-if="t.type === 'error'" class="text-error" :size="20" />
        <Info v-else class="text-secondary" :size="20" />
        <span class="label-large flex-1">{{ t.message }}</span>
        <button @click="removeToast(t.id)" class="ml-2 opacity-50 hover:opacity-100 transition">✕</button>
     </div>
  </div>

  <ReloadPrompt />
</template>

<style>
@reference "./index.css";

/* Global styles can remain here or in index.css */
/* Minimal re-declarations for toast styles if not covered sufficiently in index.css */
.bg-surface-highest { background-color: var(--md-sys-color-surface-container-highest); }
.text-primary { color: var(--md-sys-color-primary); }
.text-error { color: var(--md-sys-color-error); }
.text-secondary { color: var(--md-sys-color-secondary); }
</style>
