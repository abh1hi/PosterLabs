import { type CanvasElement } from '../composables/useElements'

interface ProjectFile {
    header: 'POSTERLABS_V1'
    createdAt: number
    canvas: {
        width: number
        height: number
        background: string
    }
    elements: CanvasElement[]
}

export const exportProject = (elements: CanvasElement[], canvasConfig: { w: number, h: number, bg: string }) => {
    const projectData: ProjectFile = {
        header: 'POSTERLABS_V1',
        createdAt: Date.now(),
        canvas: {
            width: canvasConfig.w,
            height: canvasConfig.h,
            background: canvasConfig.bg
        },
        elements
    }

    try {
        const jsonString = JSON.stringify(projectData)
        const encodedData = btoa(unescape(encodeURIComponent(jsonString))) // Handle Unicode

        const blob = new Blob([encodedData], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `design-${Date.now()}.posterLabs`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        return true
    } catch (e) {
        console.error('Export failed', e)
        return false
    }
}

export const exportProjectAsJson = (elements: CanvasElement[], canvasConfig: { w: number, h: number, bg: string }) => {
    const projectData: ProjectFile = {
        header: 'POSTERLABS_V1',
        createdAt: Date.now(),
        canvas: {
            width: canvasConfig.w,
            height: canvasConfig.h,
            background: canvasConfig.bg
        },
        elements
    }

    try {
        const jsonString = JSON.stringify(projectData, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `design-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        return true
    } catch (e) {
        console.error('JSON Export failed', e)
        return false
    }
}

export const importProject = async (file: File): Promise<ProjectFile> => {
    try {
        const text = await file.text()
        if (!text) throw new Error('File is empty')

        let projectData: ProjectFile

        // Try parsing as JSON first
        if (text.trim().startsWith('{')) {
            projectData = JSON.parse(text)
        } else {
            // Assume base64 encoded .posterLabs format
            const jsonString = decodeURIComponent(escape(atob(text.trim())))
            projectData = JSON.parse(jsonString)
        }

        if (projectData.header !== 'POSTERLABS_V1') {
            throw new Error('This is not a valid PosterLab project file')
        }

        return projectData
    } catch (err: any) {
        console.error('Import failed:', err)
        if (err.message.includes('atob')) {
            throw new Error('Project file is corrupted or not a valid .posterLabs file')
        }
        throw new Error(err.message || 'Failed to read project file')
    }
}
