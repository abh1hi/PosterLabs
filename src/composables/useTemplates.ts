
import type { CanvasElement } from './useElements'

export interface Template {
    id: string
    name: string
    description?: string
    elements: CanvasElement[]
    settings: {
        w: number
        h: number
        bgColor: string
    }
}

export const TEMPLATES: Template[] = [
    {
        id: 'sale-announcement',
        name: 'Sale Announcement',
        settings: { w: 1080, h: 1080, bgColor: '#ffffff' },
        elements: [
            {
                id: 't1', type: 'shape', x: 0, y: 0,
                style: { width: 1080, height: 400, backgroundColor: '#dc2626', opacity: 1, rotate: 0 }
            },
            {
                id: 't2', type: 'text', content: 'HUGE SALE', x: 50, y: 100,
                style: { fontSize: 120, fontFamily: 'Impact, sans-serif', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', opacity: 1, rotate: 0 }
            },
            {
                id: 't3', type: 'text', content: 'UP TO 50% OFF', x: 280, y: 500,
                style: { fontSize: 60, fontFamily: 'Arial, sans-serif', color: '#000000', fontWeight: 'bold', textAlign: 'center', opacity: 1, rotate: 0 }
            }
        ]
    },
    {
        id: 'quote-day',
        name: 'Quote of the Day',
        settings: { w: 1080, h: 1080, bgColor: '#1e293b' }, // slate-800
        elements: [
            {
                id: 'q1', type: 'shape', x: 100, y: 100,
                style: { width: 880, height: 880, backgroundColor: 'transparent', borderColor: '#ffffff', borderWidth: 2, opacity: 1, rotate: 0 }
            },
            {
                id: 'q2', type: 'text', content: '"Creativity is intelligence having fun."', x: 140, y: 400,
                style: { fontSize: 50, fontFamily: 'Georgia, serif', color: '#ffffff', fontStyle: 'italic', textAlign: 'center', opacity: 1, rotate: 0 }
            },
            {
                id: 'q3', type: 'text', content: '- Albert Einstein', x: 600, y: 600,
                style: { fontSize: 30, fontFamily: 'Arial, sans-serif', color: '#94a3b8', textAlign: 'right', opacity: 1, rotate: 0 }
            }
        ]
    },
    {
        id: 'event-flyer',
        name: 'Music Event',
        settings: { w: 800, h: 1200, bgColor: '#000000' },
        elements: [
            {
                id: 'e1', type: 'shape', x: 200, y: 200,
                style: { width: 400, height: 400, backgroundColor: '#7c3aed', opacity: 0.5, blur: 50, rotate: 0, borderRadius: '50%' as any }
            },
            {
                id: 'e2', type: 'text', content: 'LIVE MUSIC', x: 100, y: 150,
                style: { fontSize: 80, fontFamily: 'Verdana, sans-serif', color: '#ffffff', fontWeight: 'bold', letterSpacing: '10px', textAlign: 'center', opacity: 1, rotate: 0 }
            },
            {
                id: 'e3', type: 'text', content: 'SATURDAY NIGHT', x: 250, y: 300,
                style: { fontSize: 40, fontFamily: 'Arial, sans-serif', color: '#e879f9', fontWeight: 'bold', textAlign: 'center', opacity: 1, rotate: 0 }
            }
        ]
    }
]

export function useTemplates() {
    return {
        TEMPLATES
    }
}
