import { ref } from 'vue'
import { useElements } from './useElements'
import { useCanvas } from './useCanvas'
import { useToasts } from './useToasts'

export interface Theme {
    id: string
    name: string
    isCustom?: boolean
    colors: {
        background: string
        primary: string
        secondary: string
        text: string
        accent: string
    }
    typography: {
        heading: {
            fontFamily: string
            fontWeight: string
            letterSpacing: string
            textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
        }
        subheading: {
            fontFamily: string
            fontWeight: string
            letterSpacing: string
            textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
        }
        body: {
            fontFamily: string
            fontWeight: string
            letterSpacing: string
            lineHeight: number
        }
    }
    // Backward compatibility for old themes during migration
    fonts?: { heading: string, body: string }
    styles: {
        borderRadius: number
        borderWidth?: number
    }
    // Brand Assets
    logos?: string[] // Array of image URLs (base64 or remote)
}

const DEFAULT_THEMES: Theme[] = [
    {
        id: 'modern-dark',
        name: 'Modern Dark',
        colors: {
            background: '#1a1a1a',
            primary: '#3b82f6',
            secondary: '#64748b',
            text: '#ffffff',
            accent: '#f59e0b'
        },
        typography: {
            heading: { fontFamily: 'Inter', fontWeight: '700', letterSpacing: '-1px', textTransform: 'none' },
            subheading: { fontFamily: 'Inter', fontWeight: '600', letterSpacing: '-0.5px', textTransform: 'none' },
            body: { fontFamily: 'Roboto', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.5 }
        },
        styles: { borderRadius: 16 }
    },
    {
        id: 'retro-pop',
        name: 'Retro Pop',
        colors: {
            background: '#fef3c7',
            primary: '#ef4444',
            secondary: '#f59e0b',
            text: '#1e293b',
            accent: '#3b82f6'
        },
        typography: {
            heading: { fontFamily: 'Playfair Display', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' },
            subheading: { fontFamily: 'Playfair Display', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' },
            body: { fontFamily: 'Courier New', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.4 }
        },
        styles: { borderRadius: 0, borderWidth: 2 }
    },
    {
        id: 'forest-calm',
        name: 'Forest Calm',
        colors: {
            background: '#ecfdf5',
            primary: '#059669',
            secondary: '#34d399',
            text: '#064e3b',
            accent: '#d97706'
        },
        typography: {
            heading: { fontFamily: 'Merriweather', fontWeight: '700', letterSpacing: '-0.5px', textTransform: 'capitalize' },
            subheading: { fontFamily: 'Merriweather', fontWeight: '600', letterSpacing: '0px', textTransform: 'capitalize' },
            body: { fontFamily: 'Lato', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.6 }
        },
        styles: { borderRadius: 8 }
    },
    {
        id: 'cyber-neon',
        name: 'Cyber Neon',
        colors: {
            background: '#09090b',
            primary: '#d946ef',
            secondary: '#8b5cf6',
            text: '#e2e8f0',
            accent: '#06b6d4'
        },
        typography: {
            heading: { fontFamily: 'Orbitron', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' },
            subheading: { fontFamily: 'Orbitron', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' },
            body: { fontFamily: 'Rajdhani', fontWeight: '500', letterSpacing: '1px', lineHeight: 1.4 }
        },
        styles: { borderRadius: 4, borderWidth: 1 }
    },
    {
        id: 'ocean-breeze',
        name: 'Ocean Breeze',
        colors: {
            background: '#f0f9ff',
            primary: '#0ea5e9',
            secondary: '#7dd3fc',
            text: '#0c4a6e',
            accent: '#38bdf8'
        },
        typography: {
            heading: { fontFamily: 'Montserrat', fontWeight: '800', letterSpacing: '-0.5px', textTransform: 'uppercase' },
            subheading: { fontFamily: 'Montserrat', fontWeight: '600', letterSpacing: '0px', textTransform: 'uppercase' },
            body: { fontFamily: 'Open Sans', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.5 }
        },
        styles: { borderRadius: 12 }
    },
    {
        id: 'sunset-vibes',
        name: 'Sunset Vibes',
        colors: {
            background: '#fff1f2',
            primary: '#e11d48',
            secondary: '#fda4af',
            text: '#881337',
            accent: '#f43f5e'
        },
        typography: {
            heading: { fontFamily: 'Lobster', fontWeight: '400', letterSpacing: '1px', textTransform: 'none' },
            subheading: { fontFamily: 'Raleway', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'none' },
            body: { fontFamily: 'Raleway', fontWeight: '400', letterSpacing: '0.5px', lineHeight: 1.5 }
        },
        styles: { borderRadius: 24 }
    },
    {
        id: 'minimalist-mono',
        name: 'Minimalist Mono',
        colors: {
            background: '#ffffff',
            primary: '#000000',
            secondary: '#525252',
            text: '#171717',
            accent: '#404040'
        },
        typography: {
            heading: { fontFamily: 'DM Sans', fontWeight: '700', letterSpacing: '-0.5px', textTransform: 'none' },
            subheading: { fontFamily: 'DM Sans', fontWeight: '500', letterSpacing: '-0.2px', textTransform: 'none' },
            body: { fontFamily: 'DM Sans', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.5 }
        },
        styles: { borderRadius: 0, borderWidth: 1 }
    }
]

const customThemes = ref<Theme[]>([])

const LOCAL_THEMES_KEY = 'posterlab_custom_themes'

export function useThemes() {
    const { elements, updateElement } = useElements()
    const { bgColor } = useCanvas()
    const { showToast } = useToasts()

    const loadCustomThemes = () => {
        const saved = localStorage.getItem(LOCAL_THEMES_KEY)
        if (saved) {
            try {
                // Migration logic could go here if schema changes drastically
                customThemes.value = JSON.parse(saved)
            } catch (e) { console.error('Failed to load custom themes', e) }
        }
    }

    if (customThemes.value.length === 0) loadCustomThemes()

    const saveCustomThemesLocal = () => {
        localStorage.setItem(LOCAL_THEMES_KEY, JSON.stringify(customThemes.value))
    }

    const applyTheme = (theme: Theme) => {
        // 1. Set Background
        bgColor.value = theme.colors.background

        // 2. Update Elements
        elements.value.forEach(el => {
            const updates: any = { style: { ...el.style } }

            if (el.type === 'text') {
                // Heuristic: Heading (>40), Subheading (24-40), Body (<24)
                const fontSize = el.style.fontSize || 16
                const isHeading = fontSize > 40
                const isSubheading = fontSize > 24 && fontSize <= 40

                // Fallback for old themes
                const typo = theme.typography || {
                    heading: { fontFamily: theme.fonts?.heading || 'Inter', fontWeight: '700', letterSpacing: '0px', textTransform: 'none' },
                    subheading: { fontFamily: theme.fonts?.heading || 'Inter', fontWeight: '600', letterSpacing: '0px', textTransform: 'none' },
                    body: { fontFamily: theme.fonts?.body || 'Roboto', fontWeight: '400', letterSpacing: '0px', lineHeight: 1.5 }
                }

                let fontSettings
                if (isHeading) fontSettings = typo.heading
                else if (isSubheading) fontSettings = typo.subheading
                else fontSettings = typo.body

                updates.style.fontFamily = fontSettings.fontFamily
                updates.style.fontWeight = fontSettings.fontWeight
                updates.style.letterSpacing = fontSettings.letterSpacing
                updates.style.color = theme.colors.text

                if (isHeading) {
                    updates.style.textTransform = (fontSettings as any).textTransform
                } else {
                    updates.style.lineHeight = (fontSettings as any).lineHeight
                }
            }

            if (el.type === 'shape') {
                updates.style.backgroundColor = theme.colors.primary
                updates.style.borderRadius = theme.styles.borderRadius
                if (theme.styles.borderWidth !== undefined) {
                    updates.style.borderWidth = theme.styles.borderWidth
                    updates.style.borderColor = theme.colors.secondary
                } else {
                    updates.style.borderWidth = 0
                }
            }

            updateElement(el.id, updates)
        })

        showToast(`Theme "${theme.name}" applied`, 'success')
    }

    const exportTheme = (theme: Theme) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(theme, null, 2))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
        showToast('Theme exported', 'success')
    }

    const importTheme = async (file: File) => {
        try {
            const text = await file.text()
            const theme = JSON.parse(text) as Theme

            // Basic validation
            if (!theme.colors || !theme.name) {
                throw new Error('Invalid theme format')
            }

            theme.id = `custom-${Date.now()}`
            theme.isCustom = true
            customThemes.value.push(theme)
            saveCustomThemesLocal()
            showToast('Theme imported successfully', 'success')
            applyTheme(theme)
        } catch (e) {
            console.error(e)
            showToast('Failed to import theme', 'error')
        }
    }

    const deleteCustomTheme = (id: string) => {
        customThemes.value = customThemes.value.filter(t => t.id !== id)
        saveCustomThemesLocal()
        showToast('Custom theme removed', 'info')
    }

    const saveCustomTheme = (theme: Theme) => {
        customThemes.value.push(theme)
        saveCustomThemesLocal()
        showToast('Theme saved to library', 'success')
    }

    return {
        themes: DEFAULT_THEMES,
        customThemes,
        applyTheme,
        exportTheme,
        importTheme,
        deleteCustomTheme,
        saveCustomTheme
    }
}
