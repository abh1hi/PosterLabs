import { ref, onMounted } from 'vue'
import { useElements, type CanvasElement } from './useElements'
import { useCanvas } from './useCanvas'
import { useToasts } from './useToasts'

export interface ProjectData {
    id: string
    name: string
    createdAt: number
    updatedAt: number
    thumbnail?: string // Data URL for preview (optional)
    elements: CanvasElement[]
    settings: {
        w: number
        h: number
        bgColor: string
        backgroundType: 'solid' | 'gradient'
        gradientStyle: string
        showGrid: boolean
    }
}

export interface ProjectMeta {
    id: string
    name: string
    createdAt: number
    updatedAt: number
    thumbnail?: string
}

const PROJECTS_KEY = 'posterlab_projects_meta'
const PROJECT_PREFIX = 'posterlab_project_'

export function useProjects() {
    const { elements, selectedId } = useElements()
    const { posterSize, bgColor, backgroundType, gradientStyle, showGrid } = useCanvas()
    const { showToast } = useToasts()

    const projects = ref<ProjectMeta[]>([])

    const refreshProjects = () => {
        try {
            const saved = localStorage.getItem(PROJECTS_KEY)
            projects.value = saved ? JSON.parse(saved) : []
            // Sort by UpdatedDesc
            projects.value.sort((a, b) => b.updatedAt - a.updatedAt)
        } catch (e) {
            console.error('Failed to load projects list', e)
        }
    }

    onMounted(() => {
        refreshProjects()
    })

    const saveProject = async (name: string, thumbnail?: string) => {
        if (!name.trim()) return

        const newId = Date.now().toString()
        const projectData: ProjectData = {
            id: newId,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            thumbnail,
            elements: JSON.parse(JSON.stringify(elements.value)),
            settings: {
                w: posterSize.value.w,
                h: posterSize.value.h,
                bgColor: bgColor.value,
                backgroundType: backgroundType.value,
                gradientStyle: gradientStyle.value,
                showGrid: showGrid.value
            }
        }

        try {
            // Save detailed data
            localStorage.setItem(PROJECT_PREFIX + newId, JSON.stringify(projectData))

            // Update meta list
            const newMeta: ProjectMeta = {
                id: newId,
                name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                thumbnail
            }
            const updatedProjects = [newMeta, ...projects.value]
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects))

            projects.value = updatedProjects
            showToast('Project saved successfully', 'success')
        } catch (e) {
            console.error('Save failed', e)
            showToast('Failed to save project (Storage full?)', 'error')
        }
    }

    const loadProject = (id: string) => {
        try {
            const dataStr = localStorage.getItem(PROJECT_PREFIX + id)
            if (!dataStr) throw new Error('Project not found')

            const data: ProjectData = JSON.parse(dataStr)

            // Restore State
            elements.value = data.elements
            selectedId.value = null

            if (data.settings) {
                posterSize.value.w = data.settings.w
                posterSize.value.h = data.settings.h
                bgColor.value = data.settings.bgColor

                // Handle legacy saves that might miss new fields
                backgroundType.value = data.settings.backgroundType || 'solid'
                gradientStyle.value = data.settings.gradientStyle || ''
                showGrid.value = data.settings.showGrid ?? false
            }

            // Update "updatedAt"
            const projectIndex = projects.value.findIndex(p => p.id === id)
            if (projectIndex !== -1) {
                const project = projects.value[projectIndex]
                if (project) {
                    project.updatedAt = Date.now()
                    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.value))
                }
            }

            showToast(`Loaded "${data.name}"`, 'success')
            return true
        } catch (e) {
            console.error('Load failed', e)
            showToast('Failed to load project', 'error')
            return false
        }
    }

    const deleteProject = (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return

        try {
            localStorage.removeItem(PROJECT_PREFIX + id)
            const updatedProjects = projects.value.filter(p => p.id !== id)
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects))
            projects.value = updatedProjects
            showToast('Project deleted', 'success')
        } catch (e) {
            showToast('Failed to delete project', 'error')
        }
    }

    const createNewProject = () => {
        if (!confirm('Start a new project? Unsaved changes will be lost.')) return

        elements.value = []
        selectedId.value = null
        bgColor.value = '#ffffff'
        backgroundType.value = 'solid'
        gradientStyle.value = ''
        // Reset to default size or keep current? Let's reset to default.
        posterSize.value.w = 1080
        posterSize.value.h = 1080

        showToast('New project started', 'success')
    }

    return {
        projects,
        saveProject,
        loadProject,
        deleteProject,
        createNewProject,
        refreshProjects
    }
}
