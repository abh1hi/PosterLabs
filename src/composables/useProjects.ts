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

// Shared State (Singleton)
const projects = ref<ProjectMeta[]>([])
const isInitialized = ref(false)

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

export function useProjects() {
    const { elements, selectedId } = useElements()
    const { posterSize, bgColor, backgroundType, gradientStyle, showGrid } = useCanvas()
    const { showToast } = useToasts()

    onMounted(() => {
        if (!isInitialized.value) {
            refreshProjects()
            isInitialized.value = true
        }
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

            // Restore State - Explicitly nullify selection first
            selectedId.value = null

            // Wait a tick or just overwrite elements
            elements.value = JSON.parse(JSON.stringify(data.elements))

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
                    // Update shared list order immediately if desired, or just persistence
                    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.value))
                }
            }

            // Force visual refresh by triggering resize/scale update logic if needed
            window.dispatchEvent(new Event('resize'))

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

    const deleteProjects = (ids: string[]) => {
        if (ids.length === 0) return
        if (!confirm(`Are you sure you want to delete these ${ids.length} projects? This cannot be undone.`)) return

        try {
            ids.forEach(id => {
                localStorage.removeItem(PROJECT_PREFIX + id)
            })
            const updatedProjects = projects.value.filter(p => !ids.includes(p.id))
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects))
            projects.value = updatedProjects
            showToast(`${ids.length} projects deleted`, 'success')
        } catch (e) {
            showToast('Failed to delete projects', 'error')
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

    const createProjectFromImport = (data: any, fileName: string) => {
        try {
            // Basic Validation
            if (!data.elements || !Array.isArray(data.elements)) {
                throw new Error('Invalid project file format')
            }

            const newId = Date.now().toString()

            // Cleanup name (remove extension)
            const cleanName = fileName.replace(/\.(json|posterLabs)$/i, '')
            const name = cleanName || 'Imported Project'


            // Robust Dimension Extraction
            // Check settings.w, settings.width, root.w, root.width, root.posterSize.w
            const extractDim = (keys: string[], fallback: number) => {
                for (const key of keys) {
                    // Navigate potential paths like "settings.w"
                    const parts = key.split('.')
                    let val: any = data
                    for (const p of parts) {
                        if (val && typeof val === 'object' && p in val) {
                            val = val[p]
                        } else {
                            val = undefined
                            break
                        }
                    }
                    if (val !== undefined && !isNaN(Number(val))) return Number(val)
                }
                return fallback
            }

            const w = extractDim(['settings.w', 'settings.width', 'w', 'width', 'posterSize.w'], 1080)
            const h = extractDim(['settings.h', 'settings.height', 'h', 'height', 'posterSize.h'], 1080)

            // Background Extraction
            const bgColor = extractDim(['settings.bgColor', 'bgColor', 'backgroundColor'], 0) || data.settings?.bgColor || data.bgColor || '#ffffff'

            const projectData: ProjectData = {
                id: newId,
                name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                thumbnail: data.thumbnail, // Optional
                elements: data.elements,
                settings: {
                    w: w,
                    h: h,
                    bgColor: typeof bgColor === 'string' ? bgColor : '#ffffff',
                    backgroundType: data.settings?.backgroundType || data.backgroundType || 'solid',
                    gradientStyle: data.settings?.gradientStyle || data.gradientStyle || 'linear-gradient(135deg, #ffffff 0%, #000000 100%)',
                    showGrid: data.settings?.showGrid || false
                }
            }

            // Save to Storage
            localStorage.setItem(PROJECT_PREFIX + newId, JSON.stringify(projectData))

            // Update Meta List
            const newMeta: ProjectMeta = {
                id: newId,
                name,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                thumbnail: data.thumbnail
            }
            const updatedProjects = [newMeta, ...projects.value]
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects))
            projects.value = updatedProjects

            // Load the new project
            const success = loadProject(newId)

            if (success) {
                showToast('Project imported successfully', 'success')
                return true
            } else {
                return false
            }
        } catch (e: any) {
            console.error('Import failed', e)
            showToast('Failed to import project: ' + e.message, 'error')
            return false
        }
    }

    return {
        projects,
        saveProject,
        loadProject,
        deleteProject,
        createNewProject,
        createProjectFromImport,
        refreshProjects,
        deleteProjects
    }
}
