<script setup lang="ts">
import { computed } from 'vue'
import { useElements } from '../../../composables/useElements'
import { useCanvas } from '../../../composables/useCanvas'
import { Code2, Palette, Info as InfoIcon } from 'lucide-vue-next'
import { useToasts } from '../../../composables/useToasts'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

import '@material/web/button/filled-button.js'

const { elements, selectedId, updateElement, updateStyle, addElement } = useElements()
const { activeTab } = useCanvas()
const { showToast } = useToasts()

const selectedElement = computed(() => elements.value.find(e => e.id === selectedId.value))

const triggerHaptic = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }) } catch (e) {}
}

const addCustomElement = () => {
    addElement({
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
    triggerHaptic()
    showToast('Custom Element added', 'success')
    activeTab.value = 'code'
}

const handleInput = (id: string, key: string, value: any, isStyle: boolean = false) => {
    if (isStyle) {
        updateStyle(id, { [key]: value })
    } else {
        updateElement(id, { [key]: value })
    }
}
</script>

<template>
    <div class="p-4 flex flex-col gap-6">
        <div v-if="!selectedElement" class="p-8 text-center text-on-surface-variant opacity-60">
            <Code2 :size="48" class="mx-auto mb-2 opacity-50" />
            <p class="body-medium">Select an element to edit its code</p>
            <md-filled-button @click="addCustomElement" class="mt-4">Create Custom Element</md-filled-button>
        </div>
        
        <div v-else class="space-y-6">
            <div class="section-container !p-0 overflow-hidden">
                <div class="section-header !bg-primary/5 text-primary">
                    <div class="flex items-center gap-3"><Code2 :size="16" /><span class="label-large">HTML Markup</span></div>
                </div>
                <div class="p-4 space-y-2">
                    <p class="label-small text-on-surface-variant/70">Custom HTML content for this element.</p>
                    <textarea 
                        class="w-full h-40 p-3 rounded-xl bg-surface-high border border-outline/10 focus:border-primary outline-none font-mono text-xs transition-colors"
                        :value="selectedElement!.customHtml"
                        @input="(e: any) => updateElement(selectedId!, { customHtml: e.target.value })"
                        placeholder="<div>...</div>"
                    ></textarea>
                </div>
            </div>

            <div class="section-container !p-0 overflow-hidden">
                <div class="section-header !bg-secondary/5 text-secondary">
                    <div class="flex items-center gap-3"><Palette :size="16" /><span class="label-large">CSS Styles</span></div>
                </div>
                <div class="p-4 space-y-2">
                    <p class="label-small text-on-surface-variant/70">Use <code class="bg-surface-variant px-1 rounded">selector</code> to target this element.</p>
                    <textarea 
                        class="w-full h-40 p-3 rounded-xl bg-surface-high border border-outline/10 focus:border-primary outline-none font-mono text-xs transition-colors"
                        :value="selectedElement!.style.customCss"
                        @input="(e: any) => handleInput(selectedId!, 'customCss', e.target.value, true)"
                        placeholder="selector { ... }"
                    ></textarea>
                </div>
            </div>

            <div class="bg-surface-variant p-4 rounded-2xl flex items-start gap-3">
                <InfoIcon :size="16" class="mt-0.5 text-primary shrink-0" />
                <p class="label-small text-on-surface-variant leading-relaxed">
                    Custom code allows you to create complex elements or add unique animations. Be careful as malformed HTML or CSS could affect your browser's performance.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../../index.css";
.section-container {
    @apply rounded-xl bg-surface-high/50 border border-outline/10 overflow-hidden;
}
.section-header {
  @apply w-full flex items-center justify-between px-4 py-4 hover:bg-surface-high transition-colors text-on-surface;
}
</style>
