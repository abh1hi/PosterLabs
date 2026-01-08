<script setup lang="ts">
import { ref } from 'vue'
import { useProjects } from '../../../composables/useProjects'
import { useToasts } from '../../../composables/useToasts'
import { Plus, Save, FileJson, Folder, Box, Trash2, ClipboardPaste, X, Check, Edit2 } from 'lucide-vue-next'

const { projects, loadProject, deleteProject, deleteProjects, createNewProject, createProjectFromImport, createProjectFromJsonString, saveProject, renameProject } = useProjects()
const { showToast } = useToasts()
const projectInputRef = ref<HTMLInputElement | null>(null)

// Bulk Selection State
const isSelectionMode = ref(false)
const selectedIds = ref<string[]>([])

const toggleProjectSelection = (id: string) => {
    if (selectedIds.value.includes(id)) {
        selectedIds.value = selectedIds.value.filter(i => i !== id)
    } else {
        selectedIds.value.push(id)
    }
}

const handleBulkDelete = () => {
    deleteProjects(selectedIds.value)
    // After delete, check if we should exit selection mode or just clear list
    selectedIds.value = []
    if (projects.value.length === 0) isSelectionMode.value = false
}

const handleProjectImport = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string)
            createProjectFromImport(json, file.name)
        } catch (err) {
            showToast('Invalid project file', 'error')
        }
        // Reset input
        if (projectInputRef.value) projectInputRef.value.value = ''
    }
    reader.readAsText(file)
}

const isJsonModalOpen = ref(false)
const jsonContent = ref('')

const openJsonModal = () => {
    isJsonModalOpen.value = true
    jsonContent.value = ''
    // Try to auto-paste if permission allows? No, user asked for a button.
}

const pasteFromClipboardToInput = async () => {
    try {
        const text = await navigator.clipboard.readText()
        if (text) {
            jsonContent.value = text
            showToast('Pasted from clipboard', 'success')
        } else {
            showToast('Clipboard is empty', 'error')
        }
    } catch (e) {
        showToast('Failed to read clipboard', 'error')
    }
}

const handleImportFromJsonInput = () => {
    if (!jsonContent.value.trim()) {
        showToast('Please enter JSON content', 'error')
        return
    }
    
    // Attempt to parse first to validate
    try {
        JSON.parse(jsonContent.value)
    } catch (e) {
        showToast('Invalid JSON format', 'error')
        return
    }

    createProjectFromJsonString(jsonContent.value)
    isJsonModalOpen.value = false
}

const handleSaveProject = () => {
    const name = window.prompt('Enter project name:', 'My Awesome Poster');
    if (name) saveProject(name);
}

const handleRenameProject = (project: any) => {
    const newName = window.prompt('Rename project:', project.name)
    if (newName && newName !== project.name) {
        renameProject(project.id, newName)
    }
}
</script>

<template>
    <div class="p-4 space-y-6">
        <!-- Actions -->
        <div class="grid grid-cols-4 gap-3">
            <button @click="createNewProject" class="p-3 bg-primary-container rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all text-on-primary-container">
                <Plus :size="24" />
                <span class="label-medium font-bold">New</span>
            </button>
            <button @click="handleSaveProject" class="p-3 bg-tertiary-container rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all text-on-tertiary-container">
                <Save :size="24" />
                <span class="label-medium font-bold">Save</span>
            </button>
            <button @click="projectInputRef?.click()" class="p-3 bg-surface-high rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all border border-outline/10">
                <FileJson :size="24" class="text-secondary" />
                <span class="label-medium font-bold">Import</span>
            </button>
            <button @click="openJsonModal" class="p-3 bg-secondary-container rounded-xl flex flex-col items-center justify-center gap-2 hover:brightness-105 transition-all text-on-secondary-container">
                <ClipboardPaste :size="24" />
                <span class="label-medium font-bold">Paste JSON</span>
            </button>
            <input type="file" hidden ref="projectInputRef" accept=".json,.posterLabs" @change="handleProjectImport" />
        </div>

        <!-- Projects List -->
        <div class="space-y-3">
            <div class="flex items-center justify-between px-2">
                <h3 class="label-large text-on-surface-variant uppercase tracking-widest">
                    {{ isSelectionMode ? `${selectedIds.length} Selected` : 'Your Projects' }}
                </h3>
                <div class="flex gap-2">
                     <button 
                        v-if="isSelectionMode && selectedIds.length > 0"
                        @click="handleBulkDelete"
                        class="text-error font-bold text-xs hover:bg-error/10 px-2 py-1 rounded"
                    >
                        Delete ({{ selectedIds.length }})
                    </button>
                    <button 
                        @click="isSelectionMode = !isSelectionMode; selectedIds = []" 
                        class="text-primary font-bold text-xs hover:bg-primary/10 px-2 py-1 rounded"
                    >
                        {{ isSelectionMode ? 'Cancel' : 'Select' }}
                    </button>
                </div>
            </div>

            <div v-if="projects.length === 0" class="p-8 text-center text-on-surface-variant opacity-60">
                <Folder :size="48" class="mx-auto mb-2 opacity-50" />
                <p class="body-medium">No saved projects yet</p>
            </div>
            
            <div 
                v-for="project in projects" :key="project.id" 
                class="flex items-center gap-3 p-3 bg-surface-high rounded-xl border border-outline/10 group hover:border-primary transition-all cursor-pointer"
                @click="isSelectionMode ? toggleProjectSelection(project.id) : loadProject(project.id)"
            >
                <!-- Checkbox (Selection Mode) -->
                <div v-if="isSelectionMode" class="shrink-0">
                    <div 
                        class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                        :class="selectedIds.includes(project.id) ? 'bg-primary border-primary' : 'border-outline/50 bg-surface-highest'"
                    >
                        <svg v-if="selectedIds.includes(project.id)" class="text-on-primary w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                </div>

                <!-- Icon -->
                <div v-else class="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                    <Folder :size="20" class="text-primary" />
                </div>

                <div class="flex-1 min-w-0 select-none">
                    <h4 class="label-large truncate" :class="{'text-primary font-bold': isSelectionMode && selectedIds.includes(project.id)}">{{ project.name }}</h4>
                    <p class="label-small text-on-surface-variant">{{ new Date(project.updatedAt).toLocaleDateString() }}</p>
                </div>

                <!-- Individual Actions (Normal Mode) -->
                <div v-if="!isSelectionMode" class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button @click.stop="loadProject(project.id)" class="w-8 h-8 rounded-full hover:bg-primary/10 text-primary flex items-center justify-center" title="Load">
                        <Box :size="16" />
                        </button>
                        <button @click.stop="handleRenameProject(project)" class="w-8 h-8 rounded-full hover:bg-secondary/10 text-secondary flex items-center justify-center" title="Rename">
                            <Edit2 :size="16" />
                        </button>
                        <button @click.stop="deleteProject(project.id)" class="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center" title="Delete">
                        <Trash2 :size="16" />
                        </button>
                </div>
            </div>
        </div>


        <!-- JSON Import Modal -->
        <div v-if="isJsonModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div class="bg-surface w-full max-w-lg rounded-2xl shadow-xl border border-outline/10 flex flex-col max-h-[80vh]">
                <div class="flex items-center justify-between p-4 border-b border-outline/10">
                    <h3 class="title-medium text-on-surface">Import Project JSON</h3>
                    <button @click="isJsonModalOpen = false" class="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
                        <X :size="20" />
                    </button>
                </div>
                
                <div class="p-4 flex-1 overflow-hidden flex flex-col gap-4">
                    <div class="bg-primary-container/20 p-3 rounded-lg flex items-start gap-3">
                         <div class="p-2 bg-primary-container rounded-full text-on-primary-container shrink-0">
                            <ClipboardPaste :size="16" />
                         </div>
                         <div class="text-sm text-on-surface-variant">
                            <p class="font-bold text-on-surface mb-1">Paste your JSON code</p>
                            <p>Copy the project JSON code and paste it below to import a project.</p>
                         </div>
                    </div>

                    <div class="relative flex-1 min-h-[200px]">
                        <textarea 
                            v-model="jsonContent"
                            class="w-full h-full p-4 rounded-xl bg-surface-variant border-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none text-on-surface-variant"
                            placeholder='{"settings": {...}, "elements": [...]}'
                        ></textarea>
                        <button 
                            @click="pasteFromClipboardToInput"
                            class="absolute top-2 right-2 bg-surface shadow-sm border border-outline/10 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-surface-high flex items-center gap-2"
                        >
                            <ClipboardPaste :size="14" />
                            Paste from Clipboard
                        </button>
                    </div>
                </div>

                <div class="p-4 border-t border-outline/10 flex justify-end gap-3">
                    <button @click="isJsonModalOpen = false" class="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-variant">
                        Cancel
                    </button>
                    <button @click="handleImportFromJsonInput" class="px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center gap-2 hover:brightness-110">
                        <Check :size="18" />
                        Import Project
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
