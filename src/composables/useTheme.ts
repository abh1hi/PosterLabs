import { ref, watch, onMounted } from 'vue'

const theme = ref<'light' | 'dark'>('dark')

export function useTheme() {
    const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    watch(theme, (newTheme) => {
        localStorage.setItem('posterLab_theme', newTheme)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, { immediate: true })

    onMounted(() => {
        const saved = localStorage.getItem('posterLab_theme') as 'light' | 'dark' | null
        if (saved) {
            theme.value = saved
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            theme.value = 'light' // Default to dark if not set, or system preference? The app was dark by default.
        }
    })

    return {
        theme,
        toggleTheme
    }
}
