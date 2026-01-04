import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { ref, onMounted } from 'vue';

const isOnline = ref(true);

export function useStorage() {

    // --- Preferences (Settings, Themes, Small Configs) ---
    const setPref = async (key: string, value: string | object | number | boolean) => {
        await Preferences.set({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
        });
    };

    const getPref = async (key: string) => {
        const { value } = await Preferences.get({ key });
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    };

    const removePref = async (key: string) => {
        await Preferences.remove({ key });
    };

    // --- Filesystem (Images, Large Blobs, Exports) ---
    const saveFile = async (fileName: string, data: string) => {
        try {
            await Filesystem.writeFile({
                path: fileName,
                data: data,
                directory: Directory.Data,
                encoding: Encoding.UTF8,
            });
            return true;
        } catch (e) {
            console.error('Filesystem Write Error:', e);
            return false;
        }
    };

    const readFile = async (fileName: string) => {
        try {
            const contents = await Filesystem.readFile({
                path: fileName,
                directory: Directory.Data,
                encoding: Encoding.UTF8,
            });
            return contents.data;
        } catch (e) {
            return null;
        }
    };

    const deleteFile = async (fileName: string) => {
        try {
            await Filesystem.deleteFile({
                path: fileName,
                directory: Directory.Data,
            });
        } catch (e) { }
    };

    // --- Haptics (Native Feedback) ---
    const triggerImpact = async (style = ImpactStyle.Medium) => {
        await Haptics.impact({ style });
    };

    const triggerSuccess = async () => {
        await Haptics.notification({ type: 'success' as any }); // 'any' cast used for compatibility with internal Capacitor type mismatches if they exist
    };

    // --- Network Sync ---
    const updateNetworkStatus = async () => {
        const status = await Network.getStatus();
        isOnline.value = status.connected;
    };

    onMounted(() => {
        updateNetworkStatus();
        Network.addListener('networkStatusChange', status => {
            isOnline.value = status.connected;
        });
    });

    // --- Custom File Format (.posterLabs) ---
    const encodeProject = (data: Record<string, any>) => {
        const json = JSON.stringify(data);
        const encoded = btoa(json);
        return `POSTERLABS_V1:${encoded}`;
    };

    const decodeProject = (content: string): Record<string, any> => {
        if (!content.startsWith('POSTERLABS_V1:')) {
            throw new Error('Invalid file format. Please use a .posterLabs file.');
        }
        const encoded = content.replace('POSTERLABS_V1:', '');
        try {
            const json = atob(encoded);
            return JSON.parse(json);
        } catch (e) {
            throw new Error('Failed to decode .posterLabs file.');
        }
    };

    return {
        setPref,
        getPref,
        removePref,
        saveFile,
        readFile,
        deleteFile,
        triggerImpact,
        triggerSuccess,
        encodeProject,
        decodeProject,
        isOnline
    };
}
