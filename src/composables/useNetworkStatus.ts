import { ref, onMounted, onUnmounted } from 'vue'
import { Network, type ConnectionStatus } from '@capacitor/network'

export function useNetworkStatus() {
    const status = ref<ConnectionStatus>({
        connected: true,
        connectionType: 'wifi'
    })

    let listenerHandle: any = null

    const updateStatus = async () => {
        try {
            const currentStatus = await Network.getStatus()
            status.value = currentStatus
        } catch (e) {
            console.warn('Failed to get network status', e)
        }
    }

    onMounted(async () => {
        await updateStatus()
        listenerHandle = await Network.addListener('networkStatusChange', (newStatus) => {
            status.value = newStatus
        })
    })

    onUnmounted(() => {
        if (listenerHandle) {
            listenerHandle.remove()
        }
    })

    return { status }
}
