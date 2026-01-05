<script setup lang="ts">
import { ref } from 'vue'
import { useProjects } from '../../../composables/useProjects'
import { useToasts } from '../../../composables/useToasts'
import { Plus, Save, FileJson, Folder, Box, Trash2 } from 'lucide-vue-next'

const { projects, loadProject, deleteProject, deleteProjects, createNewProject, createProjectFromImport, saveProject } = useProjects()
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

const handleSaveProject = () => {
    const name = window.prompt('Enter project name:', 'My Awesome Poster');
    if (name) saveProject(name);
}
</script>

<template>
    <div class="p-4 space-y-6">
        <!-- Actions -->
        <div class="grid grid-cols-3 gap-3">
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
                        <button @click.stop="deleteProject(project.id)" class="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center" title="Delete">
                        <Trash2 :size="16" />
                        </button>
                </div>
            </div>
        </div>
    </div>
</template>
