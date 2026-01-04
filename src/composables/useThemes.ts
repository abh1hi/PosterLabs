

export interface Theme {
    id: string
    name: string
    colors: {
        background: string
        primary: string
        secondary: string
        text: string
    }
    fonts: {
        heading: string
        body: string
    }
}

export const THEMES: Theme[] = [
    {
        id: 'modern-dark',
        name: 'Modern Dark',
        colors: {
            background: '#1a1a1a',
            primary: '#38bdf8', // sky-400
            secondary: '#818cf8', // indigo-400
            text: '#ffffff'
        },
        fonts: {
            heading: 'Roboto, sans-serif',
            body: 'Roboto, sans-serif'
        }
    },
    {
        id: 'warm-sunset',
        name: 'Warm Sunset',
        colors: {
            background: '#fff7ed', // orange-50
            primary: '#f97316', // orange-500
            secondary: '#db2777', // pink-600
            text: '#431407' // orange-950
        },
        fonts: {
            heading: 'Georgia, serif',
            body: 'Arial, sans-serif'
        }
    },
    {
        id: 'forest-calm',
        name: 'Forest Calm',
        colors: {
            background: '#f0fdf4', // green-50
            primary: '#15803d', // green-700
            secondary: '#065f46', // emerald-800
            text: '#064e3b' // emerald-900
        },
        fonts: {
            heading: 'Verdana, sans-serif',
            body: 'Verdana, sans-serif'
        }
    },
    {
        id: 'ocean-breeze',
        name: 'Ocean Breeze',
        colors: {
            background: '#e0f2fe', // sky-100
            primary: '#0284c7', // sky-600
            secondary: '#0ea5e9', // sky-500
            text: '#0c4a6e' // sky-900
        },
        fonts: {
            heading: 'Arial, sans-serif',
            body: 'Arial, sans-serif'
        }
    },
    {
        id: 'minimal-bw',
        name: 'Minimal B&W',
        colors: {
            background: '#ffffff',
            primary: '#000000',
            secondary: '#555555',
            text: '#000000'
        },
        fonts: {
            heading: 'Courier New, monospace',
            body: 'Courier New, monospace'
        }
    }
]

export function useThemes() {
    return {
        THEMES
    }
}
