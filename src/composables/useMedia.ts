import { ref } from 'vue'
import { useToasts } from './useToasts'
import { saveOfflineUpload, getOfflineUploads } from '../utils/offlineStorage'

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

    return {
        uploads,
        isUploading,
        uploadImage,
        saveExternalMedia,
        fetchUserMedia
    }
}
