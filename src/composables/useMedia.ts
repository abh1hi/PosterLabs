import { ref } from 'vue'
import { useToasts } from './useToasts'
import { saveOfflineUpload, getOfflineUploads, deleteOfflineUpload } from '../utils/offlineStorage'

export interface MediaItem {
    id: string
    url: string
    name: string
    size: number
    type: string
    createdAt: any
}

export function useMedia() {
    const { showToast } = useToasts()
    const uploads = ref<MediaItem[]>([])
    const isUploading = ref(false)

    const uploadImage = async (file: File) => {
        isUploading.value = true
        try {
            // Save to IndexedDB
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`

            await saveOfflineUpload({
                id: fileName,
                file: file,
                createdAt: Date.now(),
                status: 'pending' // Status doesn't matter much now, but keeping for compatibility
            })

            const localUrl = URL.createObjectURL(file)
            showToast('Image saved locally.', 'success')

            // Refresh list
            refreshMedia()

            return {
                id: fileName,
                url: localUrl,
                name: file.name,
                size: file.size,
                type: file.type,
                createdAt: Date.now(),
                path: 'local'
            }
        } catch (e: any) {
            console.error('Upload failed', e)
            showToast('Failed to save image', 'error')
            throw e
        } finally {
            isUploading.value = false
        }
    }

    const refreshMedia = () => {
        getOfflineUploads().then(offline => {
            uploads.value = offline.map(item => ({
                id: item.id,
                url: item.file ? URL.createObjectURL(item.file as Blob) : (item.url || ''),
                name: item.file ? (item.file as File).name : (item.url?.split('/').pop() || 'External Image'),
                size: item.file ? item.file.size : 0,
                type: item.file ? item.file.type : 'image/url',
                createdAt: item.createdAt
            }))
        })
    }

    const saveExternalMedia = async (url: string) => {
        const id = `url-${Date.now()}`
        await saveOfflineUpload({
            id,
            url,
            createdAt: Date.now(),
            status: 'pending'
        })
        refreshMedia()
        return { id, url }
    }

    const fetchUserMedia = () => {
        refreshMedia()
    }

    const deleteUpload = async (id: string) => {
        try {
            await deleteOfflineUpload(id)
            showToast('Image deleted', 'success')
            refreshMedia()
        } catch (e) {
            showToast('Failed to delete image', 'error')
        }
    }

    // --- Saved Elements (Assets) ---
    const savedElements = ref<any[]>([])
    const categories = ref<string[]>([])

    const refreshSavedElements = () => {
        const saved = localStorage.getItem('posterlab_saved_elements')
        const cats = localStorage.getItem('posterlab_asset_categories')

        if (saved) {
            try {
                let parsed = JSON.parse(saved)
                // Migration: Ensure all have a category
                parsed = parsed.map((p: any) => ({ ...p, category: p.category || 'General' }))
                savedElements.value = parsed
            } catch (e) {
                savedElements.value = []
            }
        }

        if (cats) {
            try {
                categories.value = JSON.parse(cats)
            } catch (e) {
                categories.value = ['General']
            }
        } else {
            categories.value = ['General']
        }
    }

    const saveCategories = () => {
        localStorage.setItem('posterlab_asset_categories', JSON.stringify(categories.value))
    }

    const createCategory = (name: string) => {
        if (!name || categories.value.includes(name)) return
        categories.value.push(name)
        saveCategories()
        showToast(`Category '${name}' created`, 'success')
    }

    const deleteCategory = (name: string) => {
        if (name === 'General') return // valid to keep at least one

        // Move items to General
        const newElements = savedElements.value.map(e => e.category === name ? { ...e, category: 'General' } : e)
        savedElements.value = newElements
        localStorage.setItem('posterlab_saved_elements', JSON.stringify(newElements))

        categories.value = categories.value.filter(c => c !== name)
        saveCategories()
        showToast(`Category '${name}' deleted`, 'success')
    }

    const saveElementAsset = (element: any, name?: string, category: string = 'General') => {
        const newAsset = {
            id: `asset-${Date.now()}`,
            name: name || element.name || element.type,
            type: element.type,
            category: category,
            data: element,
            createdAt: Date.now()
        }

        const current = [...savedElements.value, newAsset]
        localStorage.setItem('posterlab_saved_elements', JSON.stringify(current))
        savedElements.value = current
        showToast('Element saved to assets', 'success')

        // Ensure category exists
        if (!categories.value.includes(category)) {
            categories.value.push(category)
            saveCategories()
        }
    }

    const renameAsset = (id: string, newName: string) => {
        const el = savedElements.value.find(e => e.id === id)
        if (el) {
            el.name = newName
            localStorage.setItem('posterlab_saved_elements', JSON.stringify(savedElements.value))
            showToast('Asset renamed', 'success')
        }
    }

    const moveAssetToCategory = (id: string, newCategory: string) => {
        const el = savedElements.value.find(e => e.id === id)
        if (el) {
            el.category = newCategory
            localStorage.setItem('posterlab_saved_elements', JSON.stringify(savedElements.value))
            showToast('Asset moved', 'success')
        }
    }

    const deleteElementAsset = (id: string) => {
        const current = savedElements.value.filter(e => e.id !== id)
        localStorage.setItem('posterlab_saved_elements', JSON.stringify(current))
        savedElements.value = current
        showToast('Asset deleted', 'success')
    }

    const exportAssets = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedElements.value));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "posterlab_assets.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showToast('Assets exported', 'success')
    }

    const importAssets = async (file: File) => {
        try {
            const text = await file.text()
            const imported = JSON.parse(text)
            if (!Array.isArray(imported)) throw new Error('Invalid assets file')

            // Validate basic structure
            const validAssets = imported.filter((item: any) => item.id && item.type && item.data)

            // Merge strategy: Append, regenerating IDs to avoid conflicts? 
            // Actually, keep original IDs if possible or just prepend 'imported-'? 
            // Simplest is to just append and let user manage duplicates if any, but ensure IDs are unique locally?
            // Let's regenerate IDs for safety.

            const newAssets = validAssets.map(asset => ({
                ...asset,
                id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: Date.now()
            }))

            const current = [...savedElements.value, ...newAssets]
            localStorage.setItem('posterlab_saved_elements', JSON.stringify(current))
            savedElements.value = current
            showToast(`Imported ${newAssets.length} assets`, 'success')
        } catch (e) {
            console.error(e)
            showToast('Failed to import assets', 'error')
        }
    }

    // Init
    refreshSavedElements()

    return {
        uploads,
        savedElements,
        isUploading,
        uploadImage,
        saveExternalMedia,
        deleteUpload,
        fetchUserMedia,
        saveElementAsset,
        deleteElementAsset,
        exportAssets,
        importAssets,
        categories,
        createCategory,
        deleteCategory,
        renameAsset,
        moveAssetToCategory
    }
}
