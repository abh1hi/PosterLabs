<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Pipette, Check } from 'lucide-vue-next'

const props = defineProps({
    modelValue: { type: String, default: '#000000' },
    label: { type: String, default: 'Color' },
    hasEyedropper: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const hexValue = ref(props.modelValue)
const colorInputRef = ref<HTMLInputElement | null>(null)
const isEyedropperSupported = ref(false)

// Sync prop changes to local state
watch(() => props.modelValue, (newVal) => {
    hexValue.value = newVal
})

onMounted(() => {
    isEyedropperSupported.value = 'EyeDropper' in window
})

// Handle manual hex input
const handleHexInput = (e: Event) => {
    let val = (e.target as HTMLInputElement).value
    if (!val.startsWith('#')) val = '#' + val
    
    // Simple hex validation (3 or 6 chars)
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
        emit('update:modelValue', val)
    }
    hexValue.value = val
}

const handleNativeInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value
    hexValue.value = val
    emit('update:modelValue', val)
}

const triggerNativePicker = () => {
    colorInputRef.value?.click()
}

const openEyedropper = async () => {
    if (!isEyedropperSupported.value) return
    try {
        // @ts-ignore
        const eyeDropper = new EyeDropper()
        const result = await eyeDropper.open()
        hexValue.value = result.sRGBHex
        emit('update:modelValue', result.sRGBHex)
    } catch (e) {
        console.log('Eyedropper cancelled')
    }
}

const PRESETS = [
    '#000000', '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', 
    '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', 
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', 
    '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B'
]
</script>

<template>
    <div class="flex flex-col gap-2.5">
        <div class="flex items-center gap-2 h-10 p-1.5 bg-surface-high/50 rounded-lg border border-transparent focus-within:border-primary/50 focus-within:bg-primary/5 transition-all shadow-sm">
            <!-- Swatch Trigger -->
            <button class="w-7 h-7 rounded-md border border-outline/10 shadow-sm shrink-0 hover:scale-105 active:scale-95 transition-transform relative overflow-hidden group" 
                :style="{ backgroundColor: modelValue }" 
                @click="triggerNativePicker"
                title="Open Color Picker">
                <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <input ref="colorInputRef" type="color" class="opacity-0 w-px h-px absolute pointer-events-none -z-10 bottom-0 right-0" :value="modelValue" @input="handleNativeInput" tabindex="-1" />

            <!-- Divider -->
            <div class="w-px h-4 bg-outline/10"></div>

            <!-- Hex Input -->
            <div class="flex-1 flex items-center relative">
                <span class="text-[10px] text-on-surface-variant/50 font-mono absolute left-0 select-none">#</span>
                <input type="text" 
                    class="w-full h-full bg-transparent border-none outline-none text-xs font-mono font-medium text-on-surface pl-2.5 uppercase tracking-wider placeholder:text-on-surface-variant/20" 
                    :value="hexValue.replace('#', '')" 
                    @change="handleHexInput" 
                    @keydown.enter="(e) => (e.target as HTMLInputElement).blur()">
            </div>

            <!-- Eyedropper -->
            <button v-if="hasEyedropper && isEyedropperSupported" @click="openEyedropper" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-variant text-on-surface-variant/70 hover:text-primary transition-all" title="Pick Color from Screen">
                <Pipette :size="14" />
            </button>
        </div>

        <!-- Mini Presets Grid -->
        <div class="grid grid-cols-10 gap-1.5">
            <button v-for="color in PRESETS" :key="color" 
                class="w-full aspect-square rounded-full border border-white/5 hover:scale-110 active:scale-90 transition-transform relative group shadow-sm overflow-hidden"
                :style="{ backgroundColor: color }"
                @click="emit('update:modelValue', color)">
                <div v-if="color.toLowerCase() === modelValue?.toLowerCase()" class="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                   <Check :size="10" class="text-white drop-shadow-md" stroke-width="3" />
                </div>
            </button>
        </div>
    </div>
</template>
