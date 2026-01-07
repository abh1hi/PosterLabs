import { type CanvasElement } from '../composables/useElements'

export interface Template {
    id: string
    name: string
    category: 'social' | 'print' | 'business' | 'marketing'
    thumbnail: string
    width: number
    height: number
    elements: CanvasElement[]
    background?: { type: 'solid' | 'gradient' | 'image', value: string }
}

export const MOCK_TEMPLATES: Template[] = [
    {
        id: 'tmpl_winter_001',
        name: 'Winter Collection Sale',
        category: 'marketing',
        thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400&h=500',
        width: 1080,
        height: 1350,
        background: { type: 'gradient', value: 'linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 100%)' },
        elements: [
            // Background Image (Masked/Styled)
            {
                id: 'el_w_img',
                type: 'image',
                x: 0,
                y: 0,
                src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1080&h=1350',
                style: {
                    width: 1080,
                    height: 900,
                    objectFit: 'cover',
                    rotate: 0,
                    opacity: 1
                },
                locked: true,
                hidden: false
            },
            // Overlay Gradient for Text Readability
            {
                id: 'el_w_overlay',
                type: 'shape',
                x: 0,
                y: 700,
                content: 'rectangle',
                style: {
                    width: 1080,
                    height: 650,
                    backgroundColor: 'transparent',
                    backgroundType: 'gradient',
                    // Faking a gradient fade up from white
                    customCss: 'background: linear-gradient(to bottom, transparent 0%, #ffffff 40%, #ffffff 100%);',
                    rotate: 0
                },
                locked: true,
                hidden: false
            },
            // "WINTER" - Elegant Tracking
            {
                id: 'el_w_text1',
                type: 'text',
                x: 50,
                y: 850,
                content: 'WINTER',
                style: {
                    fontSize: 40,
                    fontFamily: 'Playfair Display',
                    fontWeight: '700',
                    color: '#0F172A',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    width: 980,
                    rotate: 0
                },
                locked: false,
                hidden: false
            },
            // "SALE" - Huge Display with Gradient
            {
                id: 'el_w_text2',
                type: 'text',
                x: 50,
                y: 880,
                content: 'SALE',
                style: {
                    fontSize: 220,
                    fontFamily: 'Inter',
                    fontWeight: '900',
                    textAlign: 'center',
                    width: 980,
                    lineHeight: 1,
                    color: '#000000', // Fallback
                    textGradient: 'linear-gradient(45deg, #1E40AF 0%, #3B82F6 100%)',
                    rotate: 0
                },
                locked: false,
                hidden: false
            },
            // Offer Badge
            {
                id: 'el_w_badge_bg',
                type: 'shape',
                x: 750,
                y: 750,
                content: 'circle',
                style: {
                    width: 250,
                    height: 250,
                    backgroundColor: '#EF4444',
                    rotate: -15,
                    shadow: {
                        blur: 20,
                        color: 'rgba(239, 68, 68, 0.4)',
                        offsetX: 0,
                        offsetY: 10
                    }
                },
                locked: false,
                hidden: false
            },
            {
                id: 'el_w_badge_text',
                type: 'text',
                x: 775,
                y: 820,
                content: '50%\nOFF',
                style: {
                    fontSize: 60,
                    fontFamily: 'Inter',
                    fontWeight: '800',
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 0.9,
                    width: 200,
                    rotate: -15
                },
                locked: false,
                hidden: false
            },
            // Subtitle / CTA
            {
                id: 'el_w_cta',
                type: 'text',
                x: 50,
                y: 1150,
                content: 'In-Store & Online • Ends Jan 31',
                style: {
                    fontSize: 24,
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    color: '#64748B',
                    textAlign: 'center',
                    width: 980,
                    rotate: 0
                },
                locked: false,
                hidden: false
            }
        ]
    },
    {
        id: 'tmpl_001',
        name: 'Modern Sale',
        category: 'social',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=300&h=300', // Placeholder
        width: 1080,
        height: 1080,
        background: { type: 'solid', value: '#1a1a1a' },
        elements: [
            {
                id: 'el_t1',
                type: 'text',
                x: 100,
                y: 100,
                content: 'HUGE\nSALE',
                style: {
                    fontSize: 120,
                    fontFamily: 'Inter',
                    fontWeight: '900',
                    color: '#ffffff',
                    width: 800,
                    lineHeight: 0.9,
                    rotate: 0
                },
                locked: false,
                hidden: false
            },
            {
                id: 'el_t2',
                type: 'text',
                x: 100,
                y: 350,
                content: 'UP TO 50% OFF',
                style: {
                    fontSize: 40,
                    fontFamily: 'Inter',
                    fontWeight: '500',
                    color: '#ec4899',
                    width: 800,
                    rotate: 0
                },
                locked: false,
                hidden: false
            },
            {
                id: 'el_s1',
                type: 'shape',
                x: 600,
                y: 600,
                content: 'circle',
                style: {
                    width: 400,
                    height: 400,
                    backgroundColor: '#ec4899',
                    opacity: 0.2,
                    rotate: 0
                },
                locked: false,
                hidden: false
            }
        ]
    },
    {
        id: 'tmpl_002',
        name: 'Event Invite',
        category: 'print',
        thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=300&h=400',
        width: 1200,
        height: 1600,
        background: { type: 'gradient', value: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
        elements: [
            {
                id: 'el_e1',
                type: 'text',
                x: 100,
                y: 150,
                content: 'YOU ARE\nINVITED',
                style: {
                    fontSize: 80,
                    fontFamily: 'Playfair Display',
                    fontWeight: '700',
                    color: '#2d3748',
                    textAlign: 'center',
                    width: 1000,
                    rotate: 0
                },
                locked: false,
                hidden: false
            },
            {
                id: 'el_e2',
                type: 'text',
                x: 100,
                y: 400,
                content: 'Join us for a celebration',
                style: {
                    fontSize: 32,
                    fontFamily: 'Inter',
                    fontWeight: '400',
                    color: '#4a5568',
                    textAlign: 'center',
                    width: 1000,
                    rotate: 0
                },
                locked: false,
                hidden: false
            }
        ]
    }
]
