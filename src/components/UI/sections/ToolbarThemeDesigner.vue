<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useThemes, type Theme } from '../../../composables/useThemes'
import { useCanvas } from '../../../composables/useCanvas'
import { Check, Eye, ChevronLeft, Plus, X } from 'lucide-vue-next'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/textfield/filled-text-field.js'

const { saveCustomTheme, applyTheme } = useThemes()
const { activeTab } = useCanvas()

// Helper state to match new structure
const newTheme = reactive<Omit<Theme, 'id' | 'isCustom'>>({
    name: 'My New Theme',
    logos: [],
    colors: {
        background: '#ffffff',
        primary: '#3b82f6',
        secondary: '#64748b',
        text: '#000000',
        accent: '#f59e0b'
    },
    typography: {
        heading: {
            fontFamily: 'Inter',
            fontWeight: '700',
            letterSpacing: '-1px',
            textTransform: 'none'
        },
        subheading: {
            fontFamily: 'Inter',
            fontWeight: '600',
            letterSpacing: '-0.5px',
            textTransform: 'none'
        },
        body: {
            fontFamily: 'Roboto',
            fontWeight: '400',
            letterSpacing: '0px',
            lineHeight: 1.5
        }
    },
    styles: {
        borderRadius: 8,
        borderWidth: 0
    }
})

const previewNewTheme = () => {
    const preview: Theme = {
        id: 'preview',
        isCustom: true,
        ...newTheme
    }
    applyTheme(preview)
}

const saveTheme = () => {
    saveCustomTheme({
        ...newTheme, 
        id: `custom-${Date.now()}`,
        isCustom: true
    } as Theme)
    activeTab.value = 'themes'
}

const cancel = () => {
    activeTab.value = 'themes'
}

// Logo Logic
const logoInput = ref<HTMLInputElement | null>(null)

const handleLogoUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files?.[0]) {
        const file = target.files[0]
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                if (!newTheme.logos) newTheme.logos = []
                newTheme.logos.push(e.target.result)
            }
        }
        reader.readAsDataURL(file)
        target.value = '' // Reset
    }
}

const removeLogo = (index: number) => {
    if (newTheme.logos) {
        newTheme.logos.splice(index, 1)
    }
}

nextTick(() => {
    previewNewTheme()
})

const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
    'Playfair Display', 'Merriweather', 'Lobster', 'Orbitron', 
    'DM Sans', 'Courier New', 'Raleway', 'Rajdhani'
]
const weights = ['100','200','300','400','500','600','700','800','900']
const transforms = ['none', 'uppercase', 'lowercase', 'capitalize']

</script>

<template>
    <div class="p-4 space-y-6 pb-24">
        
        <!-- Header -->
        <div class="flex items-center gap-2 border-b border-outline/10 pb-4">
             <md-icon-button @click="cancel">
                <ChevronLeft :size="20" />
            </md-icon-button>
            <h3 class="title-medium font-bold">New Theme</h3>
             <md-icon-button @click="previewNewTheme" title="Refresh Preview" class="ml-auto">
                <Eye :size="20" />
            </md-icon-button>
        </div>

        <!-- Designer UI -->
        <div class="space-y-6">
            <md-filled-text-field 
                label="Theme Name" 
                :value="newTheme.name" 
                @input="(e: Event) => newTheme.name = (e.target as HTMLInputElement).value"
                class="w-full" 
            />
            
            <!-- Colors -->
            <div class="space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Palette</div>
                <div class="space-y-3">
                    <div v-for="(val, key) in newTheme.colors" :key="key" class="flex items-center justify-between p-2 rounded-lg bg-surface-high border border-outline/10">
                        <span class="text-sm capitalize">{{ key }}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-xs opacity-50">{{ val }}</span>
                            <input type="color" v-model="newTheme.colors[key]" class="w-8 h-8 rounded-full border border-outline/20 p-0 cursor-pointer overflow-hidden" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Brand Logos -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Brand Logos</div>
                     <md-icon-button @click="logoInput?.click()" title="Upload Logo">
                        <Plus :size="18" />
                    </md-icon-button>
                    <input type="file" ref="logoInput" hidden accept="image/*" @change="handleLogoUpload" />
                </div>
                
                <div v-if="newTheme.logos && newTheme.logos.length > 0" class="grid grid-cols-3 gap-2">
                    <div v-for="(logo, index) in newTheme.logos" :key="index" class="group relative aspect-square bg-white rounded-lg border border-outline/10 flex items-center justify-center p-2">
                        <img :src="logo" class="max-w-full max-h-full object-contain" />
                        <button class="absolute -top-1 -right-1 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" @click="removeLogo(index)">
                            <X :size="10" />
                        </button>
                    </div>
                </div>
                <div v-else class="text-xs text-on-surface-variant/50 italic text-center py-4 border border-dashed border-outline/20 rounded-lg">
                    No logos added
                </div>
            </div>

            <!-- Typography -->
             <div class="space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Typography</div>
                
                <!-- Headings -->
                <div class="bg-surface-high p-3 rounded-xl border border-outline/10 space-y-3">
                    <label class="text-xs font-bold text-primary block">Headings</label>
                    <div class="grid grid-cols-2 gap-2">
                        <select v-model="newTheme.typography.heading.fontFamily" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                            <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
                        </select>
                        <select v-model="newTheme.typography.heading.fontWeight" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                            <option v-for="w in weights" :key="w" :value="w">W-{{ w }}</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <select v-model="newTheme.typography.heading.textTransform" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                             <option v-for="t in transforms" :key="t" :value="t">{{ t }}</option>
                        </select>
                         <input type="text" v-model="newTheme.typography.heading.letterSpacing" placeholder="Spacing (e.g. 1px)" class="w-full text-sm p-2 rounded bg-surface border border-outline/20" />
                    </div>
                </div>

                <!-- Subheadings -->
                <div class="bg-surface-high p-3 rounded-xl border border-outline/10 space-y-3">
                    <label class="text-xs font-bold text-primary block">Subheadings</label>
                    <div class="grid grid-cols-2 gap-2">
                        <select v-model="newTheme.typography.subheading.fontFamily" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                            <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
                        </select>
                        <select v-model="newTheme.typography.subheading.fontWeight" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                            <option v-for="w in weights" :key="w" :value="w">W-{{ w }}</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <select v-model="newTheme.typography.subheading.textTransform" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                             <option v-for="t in transforms" :key="t" :value="t">{{ t }}</option>
                        </select>
                         <input type="text" v-model="newTheme.typography.subheading.letterSpacing" placeholder="Spacing (e.g. 1px)" class="w-full text-sm p-2 rounded bg-surface border border-outline/20" />
                    </div>
                </div>

                <!-- Body -->
                 <div class="bg-surface-high p-3 rounded-xl border border-outline/10 space-y-3">
                    <label class="text-xs font-bold text-primary block">Body Text</label>
                     <div class="grid grid-cols-2 gap-2">
                        <select v-model="newTheme.typography.body.fontFamily" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                             <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
                        </select>
                         <select v-model="newTheme.typography.body.fontWeight" class="w-full text-sm p-2 rounded bg-surface border border-outline/20">
                            <option v-for="w in weights" :key="w" :value="w">W-{{ w }}</option>
                        </select>
                    </div>
                     <div class="flex gap-2">
                        <div class="flex-1 flex flex-col">
                            <span class="text-[10px] opacity-70">Line Height</span>
                            <input type="number" step="0.1" v-model.number="newTheme.typography.body.lineHeight" class="w-full text-sm p-2 rounded bg-surface border border-outline/20" />
                        </div>
                        <div class="flex-1 flex flex-col">
                             <span class="text-[10px] opacity-70">Spacing</span>
                             <input type="text" v-model="newTheme.typography.body.letterSpacing" class="w-full text-sm p-2 rounded bg-surface border border-outline/20" />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Styles -->
             <div class="space-y-3">
                <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">Shape Styles</div>
                 <div class="bg-surface-high p-4 rounded-xl border border-outline/10 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="text-sm w-20">Roundness</span>
                        <input type="range" v-model.number="newTheme.styles.borderRadius" min="0" max="32" class="flex-1 accent-primary h-1 bg-outline/20 rounded-full appearance-none" />
                        <span class="text-xs font-mono w-6 text-right">{{ newTheme.styles.borderRadius }}</span>
                    </div>
                     <div class="flex items-center gap-3">
                        <span class="text-sm w-20">Border</span>
                        <input type="range" v-model.number="newTheme.styles.borderWidth" min="0" max="10" class="flex-1 accent-primary h-1 bg-outline/20 rounded-full appearance-none" />
                        <span class="text-xs font-mono w-6 text-right">{{ newTheme.styles.borderWidth }}</span>
                    </div>
                </div>
            </div>

            <div class="pt-4">
                <md-filled-button class="w-full h-12 text-lg" @click="saveTheme">
                    <Check slot="icon" :size="18" />
                    Save to Library
                </md-filled-button>
            </div>
        </div>
    </div>
</template>
