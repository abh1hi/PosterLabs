<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'

const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
  },
  onRegisterError(error) {
    console.log('SW registration error', error)
  },
})

const close = async () => {
  offlineReady.value = false
  needRefresh.value = false
}
</script>

<template>
  <div v-if="offlineReady || needRefresh" class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
    <div class="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl text-white flex flex-col gap-4 max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <div class="text-sm font-medium text-gray-200">
        {{ offlineReady ? 'App ready to work offline' : 'New version available.' }}
      </div>
      <div class="flex gap-2 justify-end">
        <md-text-button @click="close">Close</md-text-button>
        <md-filled-button 
          v-if="needRefresh"
          @click="updateServiceWorker()"
        >
          Reload
        </md-filled-button>
      </div>
    </div>
  </div>
</template>
