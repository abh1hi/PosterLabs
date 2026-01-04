<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useToasts } from '../composables/useToasts';
import { LogIn, Globe, Sparkles } from 'lucide-vue-next';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';

import { User } from 'lucide-vue-next'; // Import generic User icon

const { loginWithGoogle, loginWithDemo, loginAsGuest } = useAuth();
const { showToast } = useToasts();
const isLoggingIn = ref(false);

const handleGoogleLogin = async () => {
    isLoggingIn.value = true;
    try {
        await loginWithGoogle();
        showToast('Welcome to PosterLab!', 'success');
    } catch (e: any) {
        showToast(e.message || 'Login failed', 'error');
    } finally {
        isLoggingIn.value = false;
    }
};

const handleDemoLogin = async () => {
    isLoggingIn.value = true;
    try {
        await loginWithDemo();
        showToast('Demo Login Active', 'success');
    } catch (e: any) {
        showToast('Demo login failed. Make sure emulator is running.', 'error');
    } finally {
        isLoggingIn.value = false;
    }
};

const handleGuestLogin = () => {
    loginAsGuest();
    showToast('Welcome Guest! Designs will be saved locally.', 'info');
};
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-surface theme-transition p-4 overflow-y-auto">
    <!-- Main Login Card -->
    <div class="w-full max-w-md bg-surface-mid rounded-[32px] p-8 md:p-12 shadow-sm border border-outline/10 flex flex-col items-center">
      
      <!-- Brand Logo Area -->
      <div class="w-20 h-20 bg-primary-container rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary/10">
         <Sparkles class="text-primary" :size="40" />
      </div>

      <h1 class="display-small text-center mb-2">PosterLab</h1>
      <p class="body-medium text-on-surface-variant text-center mb-10">Professional Design, Simplified.</p>

      <div class="flex flex-col gap-4 w-full mb-10">
         <md-filled-button @click="handleGoogleLogin" class="w-full h-14" :disabled="isLoggingIn">
            <div class="flex items-center gap-3">
               <LogIn :size="20" />
               <span>Continue with Google</span>
            </div>
         </md-filled-button>

         <md-outlined-button @click="handleDemoLogin" class="w-full h-14" :disabled="isLoggingIn">
            <div class="flex items-center gap-3">
               <LogIn :size="20" />
               <span>Demo Login (Emulator)</span>
            </div>
         </md-outlined-button>

         <md-text-button @click="handleGuestLogin" class="w-full h-12" :disabled="isLoggingIn">
            <div class="flex items-center gap-3">
               <User :size="18" />
               <span>Continue as Guest</span>
            </div>
         </md-text-button>
      </div>

      <div class="h-px w-full bg-outline/10 mb-8"></div>

      <div class="flex flex-col gap-4 w-full">
         <div class="flex items-center gap-4 p-4 rounded-2xl bg-surface-high border border-outline/5 transition-colors">
            <Globe class="text-secondary w-6 h-6 shrink-0" />
            <div class="flex flex-col">
               <span class="label-large">Multi-Platform</span>
               <span class="label-small text-on-surface-variant opacity-70">Web, Mobile, Desktop</span>
            </div>
         </div>
         <div class="flex items-center gap-4 p-4 rounded-2xl bg-surface-high border border-outline/5 transition-colors">
            <Sparkles class="text-secondary w-6 h-6 shrink-0" />
            <div class="flex flex-col">
               <span class="label-large">Material 3 Design</span>
               <span class="label-small text-on-surface-variant opacity-70">Modern & Intuitive</span>
            </div>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@reference "../index.css";

.preserve-3d { transform-style: preserve-3d; }

.bg-surface { background-color: var(--md-sys-color-background); }
.bg-surface-mid { background-color: var(--md-sys-color-surface-container); }
.bg-surface-high { background-color: var(--md-sys-color-surface-container-high); }
.text-primary { color: var(--md-sys-color-primary); }
.bg-primary-container { background-color: var(--md-sys-color-primary-container); }
.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant); }
</style>
