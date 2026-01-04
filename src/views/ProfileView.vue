<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { 
  User, Mail, LogOut, CheckCircle, Phone, 
  Download, RefreshCw, X
} from 'lucide-vue-next'

import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/iconbutton/icon-button.js'

const emit = defineEmits(['close'])
const { currentUser, logout } = useAuth()

// PWA Update Logic
const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()

const appVersion = '1.0.0' // You might want to pull this from package.json or env

const handleLogout = async () => {
    await logout()
    emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-surface-container-high w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="p-4 border-b border-outline/10 flex items-center justify-between bg-surface">
            <h2 class="title-large px-2">My Profile</h2>
            <md-icon-button @click="$emit('close')">
                <X :size="24" />
            </md-icon-button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            <!-- User Info Card -->
            <div class="flex flex-col items-center gap-4 py-4">
                <div class="relative group">
                    <img 
                        v-if="currentUser?.photoURL" 
                        :src="currentUser.photoURL" 
                        class="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-lg"
                    />
                    <div v-else class="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-2xl font-bold shadow-lg">
                        {{ currentUser?.displayName?.charAt(0) || 'U' }}
                    </div>
                </div>
                
                <div class="text-center">
                    <h3 class="headline-small">{{ currentUser?.displayName || 'Guest User' }}</h3>
                    <div class="flex items-center gap-2 justify-center text-on-surface-variant mt-1">
                        <Mail :size="16" />
                        <span class="body-medium">{{ currentUser?.email || 'No email linked' }}</span>
                    </div>
                </div>
            </div>

            <div class="w-full h-px bg-outline/10"></div>

            <!-- App Status Section -->
            <section class="flex flex-col gap-3">
                <h4 class="label-large text-primary px-1">App Status</h4>
                
                <div class="bg-surface p-4 rounded-xl border border-outline/10 flex items-center justify-between">
                   <div class="flex items-center gap-3">
                       <Phone :size="20" class="text-on-surface-variant" />
                       <div class="flex flex-col">
                           <span class="body-large font-medium">PosterLab App</span>
                           <span class="body-small text-on-surface-variant">Version {{ appVersion }}</span>
                       </div>
                   </div>
                   <div v-if="needRefresh" class="flex flex-col items-end gap-1">
                       <span class="label-small text-primary">Update Available</span>
                       <md-filled-button @click="updateServiceWorker()" class="h-8 text-sm">
                           Update
                       </md-filled-button>
                   </div>
                   <div v-else class="text-green-500 flex items-center gap-1">
                       <CheckCircle :size="16" />
                       <span class="label-small">Up to date</span>
                   </div>
                </div>

                 <!-- Android PWA Install (if not installed) -->
                 <!-- Note: This button logic should ideally check if already installed, simplified here -->
                 <div class="bg-surface p-4 rounded-xl border border-outline/10 flex items-center justify-between">
                     <div class="flex items-center gap-3">
                         <Download :size="20" class="text-on-surface-variant" />
                         <span class="body-large">Install App</span>
                     </div>
                     <md-text-button>Install</md-text-button>
                 </div>
            </section>

            <!-- Settings / Actions -->
             <section class="flex flex-col gap-3">
                 <h4 class="label-large text-primary px-1">Account</h4>
                 <md-outlined-button @click="handleLogout" class="w-full text-error border-error/50 hover:bg-error/10">
                    <LogOut slot="icon" :size="18" />
                    Sign Out
                 </md-outlined-button>
             </section>

        </div>
    </div>
  </div>
</template>
