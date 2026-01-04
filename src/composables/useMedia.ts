import { ref } from 'vue'
import { useAuth } from './useAuth'
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
    const { currentUser } = useAuth()
    const { showToast } = useToasts()
    const uploads = ref<MediaItem[]>([])
    const isUploading = ref(false)

    const uploadImage = async (file: File) => {
        if (!currentUser.value) throw new Error('Authentication required')

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
                url: URL.createObjectURL(item.file),
                name: (item.file as File).name,
                size: item.file.size,
                type: item.file.type,
                createdAt: item.createdAt
            }))
        })
    }

    const fetchUserMedia = () => {
        if (!currentUser.value) return
        refreshMedia()
    }

    return {
        uploads,
        isUploading,
        uploadImage,
        fetchUserMedia
    }
}
