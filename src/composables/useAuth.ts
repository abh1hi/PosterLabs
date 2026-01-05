import { ref, onMounted } from 'vue';
import {
    auth,
    googleProvider
} from '../firebase';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    signInWithEmailAndPassword,
    type User
} from 'firebase/auth';

const currentUser = ref<User | null>({
    uid: 'default-user',
    displayName: 'Designer',
    email: 'designer@posterlab.com',
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => { },
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => { },
    toJSON: () => ({})
} as unknown as User);
const isGuest = ref(true);
const isLoading = ref(false);

export function useAuth() {

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (e) {
            console.error('Google Login Error:', e);
            throw e;
        }
    };

    const loginWithDemo = async () => {
        // For emulator use
        try {
            const result = await signInWithEmailAndPassword(auth, "demo@posterlab.com", "password123");
            return result.user;
        } catch (e) {
            console.error('Demo Login Error:', e);
            throw e;
        }
    };

    const loginAsGuest = () => {
        console.log('[useAuth] Changing to Guest Mode')
        isGuest.value = true;
        // Mock a user object for minimal compatibility if needed, 
        // or just rely on isGuest flag.
        currentUser.value = {
            uid: 'guest-' + Date.now(),
            displayName: 'Guest Designer',
            email: null,
            photoURL: null,
            emailVerified: false,
            isAnonymous: true,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => { },
            toJSON: () => ({})
        } as unknown as User;
    };

    const logout = async () => {
        if (isGuest.value) {
            isGuest.value = false;
            currentUser.value = null;
        } else {
            await signOut(auth);
        }
    };

    onMounted(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            currentUser.value = user;
            isLoading.value = false;
        });
        return unsubscribe;
    });

    return {
        currentUser,
        isLoading,
        loginWithGoogle,
        loginWithDemo,
        loginAsGuest,
        isGuest,
        logout
    };
}
