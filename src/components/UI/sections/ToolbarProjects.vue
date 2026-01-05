<script setup lang="ts">
import { ref } from 'vue'
import { useProjects } from '../../../composables/useProjects'
import { useToasts } from '../../../composables/useToasts'
import { Plus, Save, FileJson, Folder, Box, Trash2 } from 'lucide-vue-next'

const { projects, loadProject, deleteProject, createNewProject, createProjectFromImport, saveProject } = useProjects()
const { showToast } = useToasts()
const projectInputRef = ref<HTMLInputElement | null>(null)

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
            <h3 class="label-large text-on-surface-variant uppercase tracking-widest px-2">Your Projects</h3>
            <div v-if="projects.length === 0" class="p-8 text-center text-on-surface-variant opacity-60">
                <Folder :size="48" class="mx-auto mb-2 opacity-50" />
                <p class="body-medium">No saved projects yet</p>
            </div>
            
            <div v-for="project in projects" :key="project.id" class="flex items-center gap-3 p-3 bg-surface-high rounded-xl border border-outline/10 group hover:border-primary transition-all">
                <div class="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
                    <Folder :size="20" class="text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="label-large truncate">{{ project.name }}</h4>
                    <p class="label-small text-on-surface-variant">{{ new Date(project.updatedAt).toLocaleDateString() }}</p>
                </div>
                <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button @click="loadProject(project.id)" class="w-8 h-8 rounded-full hover:bg-primary/10 text-primary flex items-center justify-center" title="Load">
                        <Box :size="16" /> <!-- Using Box as Load icon substitute or folder-open -->
                        </button>
                        <button @click="deleteProject(project.id)" class="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center" title="Delete">
                        <Trash2 :size="16" />
                        </button>
                </div>
            </div>
        </div>
    </div>
</template>
