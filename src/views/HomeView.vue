<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus, LayoutTemplate, ShoppingBag, Sparkles, ArrowRight, Paintbrush, Folder } from 'lucide-vue-next'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'

const router = useRouter()

const navigateToEditor = (tab?: string) => {
    if (tab) {
        router.push({ path: '/editor', query: { tab } })
    } else {
        router.push('/editor')
    }
}

// Dummy data for sections
const inspirationItems = [
    { id: 1, title: 'Summer Party', image: 'https://images.unsplash.com/photo-1530103862676-de3c9759a16a?w=400&q=80', color: '#ff9a9e' },
    { id: 2, title: 'Music Festival', image: 'https://images.unsplash.com/photo-1459749411177-2293291f8db1?w=400&q=80', color: '#a18cd1' },
    { id: 3, title: 'Business Conference', image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80', color: '#84fab0' },
    { id: 4, title: 'Sales Event', image: 'https://images.unsplash.com/photo-1472851294608-41510502205d?w=400&q=80', color: '#fccb90' }
]

const marketplaceItems = [
    { id: 1, title: 'Vintage Pack', type: 'Assets', price: 'Free', icon: Sparkles },
    { id: 2, title: 'Neon Dreams', type: 'Theme', price: '$2.99', icon: Paintbrush },
    { id: 3, title: 'Geometric Shapes', type: 'Elements', price: '$1.99', icon: LayoutTemplate }
]

</script>

<template>
  <div class="h-screen bg-background text-on-surface overflow-y-auto">
      
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 bg-surface-low/80 backdrop-blur-md border-b border-outline/10 px-4 md:px-8 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-primary">
                  <Sparkles :size="20" />
              </div>
              <span class="title-medium font-bold">PosterLab</span>
          </div>
          <div class="hidden md:flex items-center gap-6">
              <a href="#" class="label-large text-on-surface hover:text-primary transition">Inspiration</a>
              <a href="#" class="label-large text-on-surface hover:text-primary transition">Features</a>
              <a href="#" class="label-large text-on-surface hover:text-primary transition">Pricing</a>
          </div>
          <md-filled-button @click="() => navigateToEditor()">
             Create Design
          </md-filled-button>
      </nav>

      <!-- Hero Section -->
      <header class="relative overflow-hidden py-16 md:py-24 px-4">
          <div class="absolute inset-0 z-0 bg-surface-container-low">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl"></div>
              <div class="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl"></div>
          </div>

          <div class="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
             <div class="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-secondary rounded-full border border-secondary/10 mb-6 animate-fade-in-up">
                 <Sparkles :size="14" />
                 <span class="label-small font-medium">New AI Features Available</span>
             </div>
             <h1 class="display-small md:display-large font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-fade-in-up delay-100">
                 Design Stunning Posters <br class="hidden md:block" /> in Seconds.
             </h1>
             <p class="body-large text-on-surface-variant max-w-2xl mb-10 animate-fade-in-up delay-200">
                 Unleash your creativity with professional tools, templates, and assets. Build beautiful graphics for social media, marketing, and events directly in your browser.
             </p>
             
             <div class="flex flex-col sm:flex-row gap-4 w-full justify-center animate-fade-in-up delay-300">
                 <button @click="() => navigateToEditor()" class="group relative px-8 py-4 bg-primary text-on-primary rounded-full font-medium title-medium shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 overflow-hidden">
                     <span class="relative z-10 flex items-center gap-2">Start Creating <ArrowRight :size="20" class="group-hover:translate-x-1 transition-transform"/></span>
                     <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 </button>
                 <button class="px-8 py-4 bg-surface-container-highest text-on-surface rounded-full font-medium title-medium hover:bg-surface-container-high transition-colors">
                     Browse Templates
                 </button>
             </div>
          </div>
      </header>

      <!-- Quick Action / Features Grid -->
      <section class="py-16 px-4 max-w-7xl mx-auto">
          <h2 class="headline-medium font-bold mb-8 text-center">Everything you need</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- Feature 1: Poster Creator -->
              <div @click="() => navigateToEditor()" class="group bg-surface-container rounded-3xl p-6 border border-outline/10 cursor-pointer hover:border-primary/30 hover:bg-surface-container-high transition-all">
                  <div class="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus :size="24" class="text-primary" />
                  </div>
                  <h3 class="title-large mb-2 pb-0">Poster Creator</h3>
                  <p class="body-medium text-on-surface-variant">Powerful drag-and-drop editor with layers, effects, and typography tools.</p>
              </div>

              <!-- Feature 2: My Projects -->
              <div @click="navigateToEditor('projects')" class="group bg-surface-container rounded-3xl p-6 border border-outline/10 cursor-pointer hover:border-secondary/30 hover:bg-surface-container-high transition-all">
                  <div class="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Folder :size="24" class="text-secondary" />
                  </div>
                  <h3 class="title-large mb-2 pb-0">My Projects</h3>
                  <p class="body-medium text-on-surface-variant">Access your saved designs and continue working.</p>
              </div>

              <!-- Feature 3: Inspiration -->
              <div class="group bg-surface-container rounded-3xl p-6 border border-outline/10 cursor-pointer hover:border-tertiary/30 hover:bg-surface-container-high transition-all">
                  <div class="w-12 h-12 bg-tertiary-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <LayoutTemplate :size="24" class="text-tertiary" />
                  </div>
                  <h3 class="title-large mb-2 pb-0">Inspiration Gallery</h3>
                  <p class="body-medium text-on-surface-variant">Explore thousands of community-made designs and remix them.</p>
              </div>

               <!-- Feature 4: Marketplace -->
               <div class="group bg-surface-container rounded-3xl p-6 border border-outline/10 cursor-pointer hover:border-error/30 hover:bg-surface-container-high transition-all">
                  <div class="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ShoppingBag :size="24" class="text-error" />
                  </div>
                   <h3 class="title-large mb-2 pb-0">Asset Marketplace</h3>
                   <p class="body-medium text-on-surface-variant">Premium stickers, fonts, and themes to elevate your designs.</p>
               </div>
          </div>
      </section>

      <!-- Inspiration Section -->
      <section class="py-16 px-4 bg-surface-container-low">
           <div class="max-w-7xl mx-auto">
               <div class="flex items-center justify-between mb-8">
                   <h2 class="headline-medium font-bold">Trending Inspiration</h2>
                   <button class="label-large text-primary hover:underline">View All</button>
               </div>
               
               <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                   <div v-for="item in inspirationItems" :key="item.id" class="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all">
                       <img :src="item.image" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <span class="text-white font-medium">{{ item.title }}</span>
                       </div>
                   </div>
               </div>
           </div>
      </section>

      <!-- Marketplace Section -->
      <section class="py-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div class="flex items-center justify-between mb-8">
               <h2 class="headline-medium font-bold">Marketplace</h2>
                <button class="label-large text-primary hover:underline">Browse Shop</button>
           </div>
           
           <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               <div v-for="item in marketplaceItems" :key="item.id" class="flex items-center gap-4 bg-surface-container p-4 rounded-2xl border border-outline/10 hover:border-outline/30 cursor-pointer transition-colors">
                   <div class="w-16 h-16 rounded-xl bg-surface-highest flex items-center justify-center shrink-0">
                       <component :is="item.icon" :size="24" class="text-on-surface-variant" />
                   </div>
                   <div class="flex flex-col flex-1">
                       <span class="title-medium font-bold">{{ item.title }}</span>
                       <span class="label-medium text-on-surface-variant">{{ item.type }}</span>
                   </div>
                   <div class="px-3 py-1 bg-surface-highest rounded-full label-small font-bold">
                       {{ item.price }}
                   </div>
               </div>
           </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 bg-surface text-on-surface-variant border-t border-outline/10">
          <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <div class="flex items-center gap-2 opacity-70">
                   <Sparkles :size="20" /> 
                   <span class="font-bold">PosterLab</span>
              </div>
              <div class="flex gap-6 label-medium">
                  <a href="#" class="hover:text-primary">Privacy</a>
                  <a href="#" class="hover:text-primary">Terms</a>
                  <a href="#" class="hover:text-primary">Contact</a>
              </div>
              <span class="label-small opacity-50">&copy; 2026 PosterLab Inc.</span>
          </div>
      </footer>

  </div>
</template>

<style scoped>
@reference "../index.css";

.bg-background { background-color: var(--md-sys-color-background); }
.bg-surface { background-color: var(--md-sys-color-surface); }
.bg-surface-container { background-color: var(--md-sys-color-surface-container); }
.bg-surface-container-low { background-color: var(--md-sys-color-surface-container-low); }
.bg-surface-container-high { background-color: var(--md-sys-color-surface-container-high); }
.bg-surface-container-highest { background-color: var(--md-sys-color-surface-container-highest); }
.bg-surface-low { background-color: var(--md-sys-color-surface-container-low); }

.bg-primary { background-color: var(--md-sys-color-primary); }
.bg-primary-container { background-color: var(--md-sys-color-primary-container); }
.bg-secondary { background-color: var(--md-sys-color-secondary); }
.bg-secondary-container { background-color: var(--md-sys-color-secondary-container); }
.bg-tertiary { background-color: var(--md-sys-color-tertiary); }
.bg-tertiary-container { background-color: var(--md-sys-color-tertiary-container); }

.text-primary { color: var(--md-sys-color-primary); }
.text-on-primary { color: var(--md-sys-color-on-primary); }
.text-secondary { color: var(--md-sys-color-secondary); }
.text-tertiary { color: var(--md-sys-color-tertiary); }
.text-on-surface { color: var(--md-sys-color-on-surface); }
.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant); }

.animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    opacity: 0;
    transform: translateY(20px);
}

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
