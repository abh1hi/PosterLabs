<script setup lang="ts">
import { ref } from 'vue'
import { useMedia } from '../../../composables/useMedia'
import { useElements } from '../../../composables/useElements'
import { useToasts } from '../../../composables/useToasts'
import { useCanvas } from '../../../composables/useCanvas'
import { ImageIcon, Link, Trash2, Plus, MousePointer2, Save, Type, Box, Code2, Download, Upload, FolderPlus, ChevronRight, ChevronDown, MoreVertical } from 'lucide-vue-next'

const { uploads, isUploading, uploadImage, saveExternalMedia, deleteUpload, savedElements, saveElementAsset, deleteElementAsset, exportAssets, importAssets, categories, createCategory, deleteCategory, renameAsset, moveAssetToCategory } = useMedia()
const { addElement, selectedId, elements } = useElements()

// Compute selected element object for preview
import { computed, reactive } from 'vue'
const selectedElement = computed(() => elements.value.find(e => e.id === selectedId.value))

const { showToast } = useToasts()
const { activeTab } = useCanvas()
const fileInputRef = ref<HTMLInputElement | null>(null)
const jsonInputRef = ref<HTMLInputElement | null>(null)

const handleAddElement = (params: any) => {
    addElement(params)
    showToast('Image added to canvas', 'success')
    
    if (window.innerWidth < 768) {
        activeTab.value = 'properties'
    }
}

const handleImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      const mediaDoc = await uploadImage(file)
      handleAddElement({
        type: 'image',
        src: mediaDoc.url,
        x: 100,
        y: 100,
        style: {
            width: 300,
            height: 300,
            opacity: 1,
            rotate: 0,
            borderRadius: 0
        }
      })
      showToast('Image uploaded', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image', 'error')
    }
  }
}
const collapsedCategories = ref<string[]>([])
const isCreatingCategory = ref(false)
const newCategoryName = ref('')
const activeAssetMenu = ref<string | null>(null) // ID of asset with open menu
const editingAssetId = ref<string | null>(null)
const editingAssetName = ref('')

const saveOptions = reactive({
    name: '',
    category: 'General'
})

// Reset save options when selection changes
import { watch } from 'vue'
watch(selectedId, (newId) => {
    if (newId && selectedElement.value) {
        saveOptions.name = selectedElement.value.name || selectedElement.value.type || 'New Asset'
        saveOptions.category = 'General'
    }
})

const onDragStart = (e: DragEvent, asset: any) => {
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
        e.dataTransfer.effectAllowed = 'all'
        // Internal ID for sorting
        e.dataTransfer.setData('text/plain', asset.id)
        // External Data for Canvas Drop
        e.dataTransfer.setData('application/posterlab-asset', JSON.stringify(asset.data))
    }
}

const onDrop = (e: DragEvent, category: string) => {
    const id = e.dataTransfer?.getData('text/plain')
    if (id) {
        moveAssetToCategory(id, category)
    }
}

const toggleCategory = (cat: string) => {
    if (collapsedCategories.value.includes(cat)) {
        collapsedCategories.value = collapsedCategories.value.filter(c => c !== cat)
    } else {
        collapsedCategories.value.push(cat)
    }
}

const handleCreateCategory = () => {
    if (newCategoryName.value.trim()) {
        createCategory(newCategoryName.value.trim())
        newCategoryName.value = ''
        isCreatingCategory.value = false
    }
}

const handleRenameAsset = (id: string) => {
    if (editingAssetName.value.trim()) {
        renameAsset(id, editingAssetName.value.trim())
        editingAssetId.value = null
    }
}

const startEditing = (asset: any) => {
    editingAssetId.value = asset.id
    editingAssetName.value = asset.name
    activeAssetMenu.value = null
}

const handleJsonImport = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
        await importAssets(file)
        target.value = '' // Reset
    }
}

const addMediaByUrl = async () => {
    const url = window.prompt('Enter image URL:')
    if (!url) return

    try {
        new URL(url)
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const fileName = url.split('/').pop() || 'external-image'
            const file = new File([blob], fileName, { type: blob.type })
            const mediaDoc = await uploadImage(file)
            
            handleAddElement({
                type: 'image',
                src: mediaDoc.url,
                x: 100,
                y: 100,
                style: { width: 300, height: 300 }
            })
            showToast('Image added and saved', 'success')
        } catch (corsErr) {
            await saveExternalMedia(url)
            handleAddElement({
                type: 'image',
                src: url,
                x: 100,
                y: 100,
                style: { width: 300, height: 300 }
            })
            showToast('Image added (External URL)', 'success')
        }
    } catch (e: any) {
        showToast('Invalid URL', 'error')
    }
}
const openSections = ref<string[]>(['saved', 'uploads'])

const toggleSection = (section: string) => {
    if (openSections.value.includes(section)) {
        openSections.value = openSections.value.filter(s => s !== section)
    } else {
        openSections.value.push(section)
    }
}
</script>

<template>
    <div class="p-4 space-y-6">
         <!-- Save Current Selection -->
         <div v-if="selectedId" class="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col gap-3">
             <div class="flex items-center gap-2">
                 <MousePointer2 :size="16" class="text-primary" />
                 <span class="label-large font-bold text-primary">Current Selection</span>
             </div>
             
             <!-- Preview (Mini) -->
             <div class="flex items-center gap-3">
                 <div class="w-12 h-12 rounded-lg bg-surface-high border border-outline/10 flex items-center justify-center shrink-0">
                     <Type v-if="selectedElement?.type === 'text'" :size="20" class="text-on-surface-variant" />
                     <ImageIcon v-else-if="selectedElement?.type === 'image'" :size="20" class="text-on-surface-variant" />
                     <Code2 v-else-if="selectedElement?.type === 'custom'" :size="20" class="text-on-surface-variant" />
                     <Box v-else :size="20" class="text-on-surface-variant" />
                 </div>
                 <div class="flex-1 min-w-0">
                     <div class="label-medium font-bold truncate">{{ selectedElement?.name || selectedElement?.type }}</div>
                     <div class="text-xs text-on-surface-variant opacity-60">ID: {{ selectedId ? selectedId.slice(0, 8) : '' }}...</div>
                 </div>
             </div>
             
             <div class="flex flex-col gap-2">
                 <label class="label-small text-on-surface-variant">Asset Name</label>
                 <input v-model="saveOptions.name" class="w-full bg-surface-high border border-outline/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none" placeholder="Asset Name" />
             </div>
             
             <div class="flex flex-col gap-2">
                 <label class="label-small text-on-surface-variant">Category</label>
                 <select v-model="saveOptions.category" class="w-full bg-surface-high border border-outline/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary outline-none">
                     <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                 </select>
             </div>

             <button @click="saveElementAsset(selectedElement, saveOptions.name, saveOptions.category)" class="w-full h-9 bg-primary text-on-primary rounded-full label-large font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-1">
                 <Save :size="16" />
                 Save to {{ saveOptions.category }}
             </button>
         </div>

        <!-- Header / Upload Actions (Always Visible) -->
        <div class="space-y-3">
             <div class="grid grid-cols-2 gap-3">
                <button @click="fileInputRef?.click()" class="py-4 bg-primary-container/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-primary-container transition-colors cursor-pointer border border-dashed border-primary/30 group">
                    <div v-if="isUploading" class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div v-else class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                        <Plus :size="16" />
                    </div>
                    <span class="label-small font-bold text-primary">Upload</span>
                </button>
                <button @click="addMediaByUrl" class="py-4 bg-surface-high rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-secondary-container transition-colors cursor-pointer border border-dashed border-outline/20 group">
                    <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                        <Link :size="16" />
                    </div>
                    <span class="label-small font-bold text-secondary">From URL</span>
                </button>
             </div>
             <input type="file" hidden ref="fileInputRef" accept="image/*" @change="handleImageUpload" />
        </div>

        <!-- Saved Assets Accordion -->
        <div class="border border-outline/10 rounded-2xl overflow-hidden bg-surface-high/10">
            <button 
                @click="toggleSection('saved')" 
                class="w-full flex items-center justify-between p-3 hover:bg-surface-high/30 transition-colors"
            >
                <div class="flex items-center gap-2">
                    <component :is="openSections.includes('saved') ? ChevronDown : ChevronRight" :size="18" class="text-on-surface-variant" />
                    <span class="label-medium font-bold text-on-surface">Saved Assets</span>
                </div>
                 <div class="flex items-center gap-1" @click.stop>
                     <button @click="isCreatingCategory = !isCreatingCategory" class="p-1.5 hover:bg-surface-high rounded-lg text-primary transition-colors" title="New Column">
                         <FolderPlus :size="14" />
                     </button>
                     <button @click="exportAssets" class="p-1.5 hover:bg-surface-high rounded-lg text-primary transition-colors" title="Export JSON">
                         <Download :size="14" />
                     </button>
                     <button @click="jsonInputRef?.click()" class="p-1.5 hover:bg-surface-high rounded-lg text-primary transition-colors" title="Import JSON">
                         <Upload :size="14" />
                     </button>
                 </div>
            </button>
            
            <div v-if="openSections.includes('saved')" class="p-3 pt-0 border-t border-outline/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <input type="file" hidden ref="jsonInputRef" accept=".json" @change="handleJsonImport" />

                <!-- New Category Input -->
                <div v-if="isCreatingCategory" class="flex gap-2 mb-2">
                    <input v-model="newCategoryName" @keyup.enter="handleCreateCategory" placeholder="Column Name" class="flex-1 bg-surface-high border border-outline/10 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none" autoFocus />
                    <button @click="handleCreateCategory" class="px-3 bg-primary text-on-primary rounded-lg text-xs font-bold">Add</button>
                </div>

                <div v-if="savedElements.length === 0" class="p-4 text-center text-on-surface-variant/50 text-xs italic">
                    No saved assets. Select an element on canvas to save it.
                </div>
                
                <!-- Kanban Columns Container -->
                 <div class="flex flex-nowrap overflow-x-auto gap-3 pb-2 min-h-[250px] items-start snap-x">
                    <div 
                        v-for="cat in categories" 
                        :key="cat" 
                        class="kanban-column shrink-0 snap-start transition-all duration-300 border border-outline/10 rounded-xl bg-surface-high/20 flex flex-col overflow-hidden"
                        :class="collapsedCategories.includes(cat) ? 'w-10' : 'w-48'"
                        @dragover.prevent
                        @drop="onDrop($event, cat)"
                    >
                        <!-- Header -->
                        <div 
                            @click="toggleCategory(cat)" 
                            class="p-2 cursor-pointer hover:bg-surface-high/50 transition-colors border-b border-outline/5 flex items-center"
                            :class="collapsedCategories.includes(cat) ? 'flex-col gap-2 justify-start h-full py-4' : 'justify-between'"
                        >
                            <div class="flex items-center gap-2" :class="{ 'flex-col vertical-text': collapsedCategories.includes(cat) }">
                                <component :is="collapsedCategories.includes(cat) ? ChevronRight : ChevronDown" :size="16" class="text-on-surface-variant shrink-0" />
                                <span class="label-medium font-bold text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">{{ cat }}</span>
                                <span v-if="!collapsedCategories.includes(cat)" class="text-[10px] text-on-surface-variant/50 w-5 h-5 flex items-center justify-center bg-surface-high rounded-full">{{ savedElements.filter(e => e.category === cat).length }}</span>
                            </div>
                            
                            <span v-if="collapsedCategories.includes(cat)" class="text-[10px] text-on-surface font-bold w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full mt-2">{{ savedElements.filter(e => e.category === cat).length }}</span>

                            <button v-if="!collapsedCategories.includes(cat) && cat !== 'General'" @click.stop="deleteCategory(cat)" class="p-1 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 :size="12" />
                            </button>
                        </div>

                        <!-- Column Content (Drop Zone) -->
                        <div v-show="!collapsedCategories.includes(cat)" class="flex-1 p-2 flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                            <div 
                                v-for="asset in savedElements.filter(e => e.category === cat)" 
                                :key="asset.id" 
                                class="group relative bg-surface-high rounded-xl p-3 cursor-grab hover:shadow-md transition-all border border-outline/10 hover:border-primary active:cursor-grabbing"
                                draggable="true"
                                @dragstart="onDragStart($event, asset)"
                                @click="handleAddElement({ ...asset.data, id: undefined })"
                            >
                                <!-- Mini Preview -->
                                <div class="flex items-center gap-2 mb-2 pointer-events-none">
                                    <Type v-if="asset.type === 'text'" :size="16" class="text-on-surface-variant opacity-70" />
                                    <ImageIcon v-else-if="asset.type === 'image'" :size="16" class="text-on-surface-variant opacity-70" />
                                    <Code2 v-else-if="asset.type === 'custom'" :size="16" class="text-on-surface-variant opacity-70" />
                                    <Box v-else :size="16" class="text-on-surface-variant opacity-70" />
                                    <span class="text-[10px] text-on-surface-variant opacity-50 uppercase tracking-wider">{{ asset.type }}</span>
                                </div>

                                <!-- Name or Rename Input -->
                                <div v-if="editingAssetId === asset.id" @click.stop class="w-full">
                                    <input v-model="editingAssetName" @keyup.enter="handleRenameAsset(asset.id)" @blur="handleRenameAsset(asset.id)" class="w-full text-center bg-surface border border-primary rounded px-1 text-xs" autoFocus />
                                </div>
                                <div v-else class="label-small font-bold truncate text-on-surface mb-0.5">{{ asset.name }}</div>
                                
                                <!-- Menu Button -->
                                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button @click.stop="activeAssetMenu = activeAssetMenu === asset.id ? null : asset.id" class="p-1 rounded-full hover:bg-black/10">
                                        <MoreVertical :size="14" />
                                    </button>
                                </div>
                                
                                <!-- Dropdown Menu -->
                                <div v-if="activeAssetMenu === asset.id" class="absolute top-6 right-2 w-28 bg-surface-container-high shadow-lg rounded-lg z-20 flex flex-col overflow-hidden border border-outline/10" @click.stop>
                                    <button @click="startEditing(asset)" class="text-left px-3 py-2 text-xs hover:bg-primary/10 hover:text-primary">Rename</button>
                                    <button @click="deleteElementAsset(asset.id)" class="text-left px-3 py-2 text-xs hover:bg-error/10 hover:text-error">Delete</button>
                                </div>
                            </div>
                            
                             <!-- Empty State -->
                            <div v-if="savedElements.filter(e => e.category === cat).length === 0" class="py-6 text-center text-xs text-on-surface-variant/30 border-2 border-dashed border-outline/10 rounded-xl">
                                Drop Here
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        <!-- Image Library Accordion -->
        <div class="border border-outline/10 rounded-2xl overflow-hidden bg-surface-high/10">
            <button 
                @click="toggleSection('uploads')" 
                class="w-full flex items-center justify-between p-3 hover:bg-surface-high/30 transition-colors"
            >
                <div class="flex items-center gap-2">
                    <component :is="openSections.includes('uploads') ? ChevronDown : ChevronRight" :size="18" class="text-on-surface-variant" />
                    <span class="label-medium font-bold text-on-surface">Image Library</span>
                </div>
                 <span class="text-[10px] text-on-surface-variant/50 bg-surface-high px-2 py-0.5 rounded-full">{{ uploads.length }}</span>
            </button>
            
            <div v-if="openSections.includes('uploads')" class="p-3 pt-0 border-t border-outline/5 animate-in slide-in-from-top-2 duration-200">
                <div v-if="uploads.length > 0" class="grid grid-cols-2 gap-3 mt-3">
                    <div v-for="media in uploads" :key="media.id" class="group relative aspect-square bg-surface-high rounded-2xl overflow-hidden cursor-pointer border border-outline/10 hover:border-primary transition-all">
                        <img 
                            :src="media.url" 
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            @click="handleAddElement({ type: 'image', src: media.url, x: 100, y: 100, style: { width: 300, height: 300 } })"
                        />
                        
                        <!-- Delete Overlay -->
                        <button 
                            @click.stop="deleteUpload(media.id)" 
                            class="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-error rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            title="Delete Asset"
                        >
                            <Trash2 :size="14" />
                        </button>
                        
                        <!-- Add Overlay (Mobile friendly visual cue) -->
                        <div class="absolute inset-0 bg-primary/10 opacity-0 active:opacity-100 pointer-events-none transition-opacity"></div>
                    </div>
                </div>
                <div v-else class="py-8 text-center text-on-surface-variant/40 text-xs italic">
                    No images uploaded yet.
                </div>
            </div>
        </div>
        
        <div v-if="uploads.length === 0 && savedElements.length === 0" class="py-10 flex flex-col items-center justify-center text-on-surface-variant/40 space-y-2">
            <!-- This might be redundant if we show the empty saved elements block, but let's leave it as a general 'empty' state for the whole tab if needed, or remove it. 
                 Since we always show "Saved Elements" block now (to show Import button), this big empty state might push down. 
                 Let's make it show only if uploads are also empty. -->
        </div>
    </div>
</template>

<style scoped>
@reference "../../../index.css";
.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}
</style>
