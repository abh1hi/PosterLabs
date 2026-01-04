import { ref, computed, watch } from 'vue'
import { useToasts } from './useToasts'

export interface Font {
    family: string
    category: 'system' | 'google' | 'local'
    variants?: string[]
}

// Top Google Fonts (Hardcoded for reliability without API Key initially)
const GOOGLE_FONTS_LIST: string[] = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
    'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather', 'Noto Sans', 'Nunito',
    'Concert One', 'Prompt', 'Work Sans', 'Poppins', 'Playfair Display', 'Ubuntu',
    'Rubik', 'Mukta', 'Lora', 'Inter', 'Nunito Sans', 'Fira Sans', 'Pacifico',
    'Quicksand', 'Karla', 'Inconsolata', 'Dancing Script', 'Barlow', 'Cairo',
    'Heebo', 'DM Sans', 'Oxygen', 'Arvo', 'Dosis', 'Bitter', 'Crimson Text',
    'Anton', 'Libre Baskerville', 'Hind', 'Josefin Sans', 'Cabin', 'Abril Fatface',
    'Lobster', 'Shadows Into Light', 'Bebas Neue', 'Playball', 'Amatic SC',
    'Fredoka One', 'Righteous', 'Comfortaa', 'Permanent Marker', 'Alfa Slab One',
    'Cookie', 'Chewy', 'Bangers', 'Sacramento', 'Satisfy', 'Great Vibes',
    'Rokkitt', 'Cinzel', 'Pathway Gothic One', 'News Cycle', 'Yanone Kaffeesatz'
]

const SYSTEM_FONTS_LIST: string[] = [
    'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
    'Georgia', 'Garamond', 'Courier New', 'Brush Script MT', 'Segoe UI',
    'Impact', 'Gill Sans', 'Palatino Linotype', 'Lucida Sans Unicode'
]

const installedFonts = ref<Font[]>(SYSTEM_FONTS_LIST.map(f => ({ family: f, category: 'system' })))
const googleFonts = ref<Font[]>(GOOGLE_FONTS_LIST.map(f => ({ family: f, category: 'google' })))
const loadedGoogleFonts = ref<Set<string>>(new Set())

export function useFonts() {
    const { showToast } = useToasts()
    const isGoogleFontsActive = ref(false)
    const searchQuery = ref('')
    const isLoadingFonts = ref(false)

    // Ensure we start with hardcoded list as fallback
    if (googleFonts.value.length === 0) {
        googleFonts.value = GOOGLE_FONTS_LIST.map(f => ({ family: f, category: 'google' }))
    }

    const fetchGoogleFonts = async () => {
        const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY
        if (!apiKey) return // Keep using fallback/hardcoded list

        // If we only have the fallback list (len <= 60), try fetching more
        // Or just always fetch to get the latest popularity sort
        isLoadingFonts.value = true
        try {
            const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity&limit=200`)
            if (!res.ok) throw new Error('API request failed')

            const data = await res.json()
            const apiFonts = data.items.slice(0, 300).map((f: any) => ({
                family: f.family,
                category: 'google',
                variants: f.variants
            }))

            // Merge with any manually added fonts (from URL)
            const manualFonts = googleFonts.value.filter(f => !GOOGLE_FONTS_LIST.includes(f.family) && !apiFonts.find((af: any) => af.family === f.family))

            googleFonts.value = [...manualFonts, ...apiFonts]
            showToast('Loaded Google Fonts from API', 'success')
        } catch (e) {
            console.error('Failed to fetch Google Fonts', e)
            // Fallback list is already there
        } finally {
            isLoadingFonts.value = false
        }
    }

    watch(isGoogleFontsActive, (active) => {
        if (active) fetchGoogleFonts()
    })

    // Attempt to access local fonts API
    const queryLocalFonts = async () => {
        try {
            // @ts-ignore - Experimental API
            if (window.queryLocalFonts) {
                // @ts-ignore
                const localFonts = await window.queryLocalFonts()
                const uniqueFamilies = new Set<string>()
                localFonts.forEach((f: any) => uniqueFamilies.add(f.family))

                installedFonts.value = Array.from(uniqueFamilies).map(f => ({
                    family: f,
                    category: 'local'
                }))
                showToast(`Loaded ${uniqueFamilies.size} local fonts`, 'success')
            } else {
                showToast('Local Font Access not supported in this browser', 'info')
            }
        } catch (e: any) {
            console.error('Local font access denied or failed', e)
            showToast('Could not access local fonts', 'error')
        }
    }

    const filteredFonts = computed(() => {
        const query = searchQuery.value.toLowerCase()
        let results = [...installedFonts.value]

        if (isGoogleFontsActive.value) {
            results = [...results, ...googleFonts.value]
        }

        if (!query) return results.sort((a, b) => a.family.localeCompare(b.family))

        return results.filter(f => f.family.toLowerCase().includes(query))
            .sort((a, b) => a.family.localeCompare(b.family))
    })

    const loadGoogleFont = (fontFamily: string) => {
        if (loadedGoogleFonts.value.has(fontFamily)) return true

        const link = document.createElement('link')
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`
        link.rel = 'stylesheet'
        document.head.appendChild(link)

        loadedGoogleFonts.value.add(fontFamily)
        return true
    }

    const applyFont = (font: Font) => {
        if (font.category === 'google') {
            loadGoogleFont(font.family)
        }
        return font.family
    }



    // Parse Google Font URL and add it
    const addFontFromUrl = (input: string) => {
        try {
            let rawFamily = ''

            // Case 1: URL containing 'family=Name' (API or Share URLs)
            const familyMatch = input.match(/family=([^:&?#]+)/)

            // Case 2: Specimen URL '.../specimen/Name'
            const specimenMatch = input.match(/\/specimen\/([^/?#]+)/)

            if (familyMatch && familyMatch[1]) {
                rawFamily = familyMatch[1]
            } else if (specimenMatch && specimenMatch[1]) {
                rawFamily = specimenMatch[1]
            } else {
                // Fallback: If it's just a name, use it
                if (!input.includes('/') && !input.includes('.')) {
                    rawFamily = input
                } else {
                    throw new Error('Could not parse font family')
                }
            }

            const familyName = decodeURIComponent(rawFamily).replace(/\+/g, ' ')

            // Construct the standardized CSS API URL
            const cssUrl = `https://fonts.googleapis.com/css2?family=${rawFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`

            // Avoid duplicates
            if (googleFonts.value.find(f => f.family === familyName)) {
                return familyName
            }

            const link = document.createElement('link')
            link.href = cssUrl
            link.rel = 'stylesheet'
            document.head.appendChild(link)

            googleFonts.value.unshift({
                family: familyName,
                category: 'google'
            })

            loadedGoogleFonts.value.add(familyName)
            showToast(`Added font: ${familyName}`, 'success')
            return familyName
        } catch (e: any) {
            console.error('Font URL Parsing Error:', e)
            showToast('Invalid Font URL or Name', 'error')
            return null
        }
    }

    return {
        installedFonts,
        googleFonts,
        isGoogleFontsActive,
        searchQuery,
        filteredFonts,
        queryLocalFonts,
        loadGoogleFont,
        applyFont,
        isLoadingFonts,
        addFontFromUrl
    }
}
