import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

import {
  Type, Move, Sun, Droplet, Layers, HelpCircle,
  Trash2, Download, Image as ImageIcon, Sparkles,
  Palette, Grid, Layout, Minus, Plus, ChevronDown,
  Share2, Save, Printer, Search, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, X, Menu,
  Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw,
  Crop, FlipHorizontal, FlipVertical, Box, Square, Frame,
  Circle, Triangle, Hexagon, Star, FileImage, FileText, FileJson, Upload
} from 'lucide-react';

const DEFAULT_FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Playfair', family: '"Playfair Display", serif' },
  { name: 'Oswald', family: 'Oswald, sans-serif' },
  { name: 'Anton', family: 'Anton, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Lato', family: 'Lato, sans-serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Raleway', family: 'Raleway, sans-serif' },
  { name: 'Merriweather', family: 'Merriweather, serif' },
  { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
  { name: 'Lobster', family: 'Lobster, display' },
  { name: 'Abril Fatface', family: '"Abril Fatface", display' },
  { name: 'Pacifico', family: 'Pacifico, handwriting' },
  { name: 'Righteous', family: 'Righteous, display' },
  { name: 'Courier', family: '"Courier New", monospace' },
];

const colorPalettes = [
  { name: 'Swiss', bg: '#f4f4f0', text: '#1a1a1a', accent: '#e63946' },
  { name: 'Neon', bg: '#121212', text: '#ffffff', accent: '#00ff9d' },
  { name: 'Ocean', bg: '#f0f8ff', text: '#1e3a8a', accent: '#3b82f6' },
  { name: 'Vintage', bg: '#faebd7', text: '#5d4037', accent: '#d84315' },
  { name: 'Mono', bg: '#ffffff', text: '#000000', accent: '#666666' },
  { name: 'Midnight', bg: '#0f172a', text: '#e2e8f0', accent: '#38bdf8' },
  { name: 'Forest', bg: '#ecfdf5', text: '#064e3b', accent: '#059669' },
  { name: 'Berry', bg: '#fdf2f8', text: '#831843', accent: '#db2777' },
  { name: 'Cyber', bg: '#09090b', text: '#e4e4e7', accent: '#facc15' },
  { name: 'Luxury', bg: '#1c1917', text: '#feaaaa', accent: '#d6d3d1' },
  { name: 'Sunset', bg: '#fff7ed', text: '#7c2d12', accent: '#ea580c' },
  { name: 'Lilac', bg: '#f5f3ff', text: '#4c1d95', accent: '#8b5cf6' },
];

const posterSizes = [
  { name: 'Classic Poster (5:7)', w: 500, h: 700 },
  { name: 'A4 Document', w: 595, h: 842 },
  { name: 'Letter (8.5x11)', w: 612, h: 792 },
  { name: 'Legal (8.5x14)', w: 612, h: 1008 },
  { name: 'Tabloid (11x17)', w: 792, h: 1224 },
  { name: 'Instagram Square (1:1)', w: 600, h: 600 },
  { name: 'Instagram Portrait (4:5)', w: 540, h: 675 },
  { name: 'Instagram Story (9:16)', w: 450, h: 800 },
  { name: 'Twitter Post (16:9)', w: 800, h: 450 },
  { name: 'Twitter Header', w: 900, h: 300 },
  { name: 'Facebook Cover', w: 820, h: 312 },
  { name: 'YouTube Thumbnail', w: 640, h: 360 },
  { name: 'Pinterest Pin (2:3)', w: 600, h: 900 },
  { name: 'LinkedIn Banner', w: 800, h: 200 },
  { name: 'Business Card', w: 600, h: 350 },
  { name: 'PVC ID Card', w: 600, h: 380 },
];

const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'exclusion'];

const shapeTypes = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'star', label: 'Star' },
  { id: 'hexagon', label: 'Hexagon' },
];

export default function PosterLab() {
  // State
  const [elements, setElements] = useState([
    { id: 1, type: 'text', content: 'POSTER\nLAB', x: 50, y: 50, style: { fontSize: 80, fontFamily: 'Anton, sans-serif', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', lineHeight: 0.9 } },
    { id: 2, type: 'text', content: 'DESIGN SYSTEM v1.0', x: 50, y: 150, style: { fontSize: 16, fontFamily: 'Inter, sans-serif', color: '#e63946', letterSpacing: '2px' } },
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [bgColor, setBgColor] = useState('#f4f4f0');
  const [posterSize, setPosterSize] = useState({ w: 500, h: 700 }); // Roughly 5:7 ratio
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [manualScale, setManualScale] = useState(1);
  const [pinchDistance, setPinchDistance] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Theme State
  const [customPalettes, setCustomPalettes] = useState([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [tempPalette, setTempPalette] = useState({ name: 'My Theme', bg: '#ffffff', text: '#000000', accent: '#3b82f6' });

  // Font State
  const [availableFonts, setAvailableFonts] = useState(DEFAULT_FONTS);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [newFontName, setNewFontName] = useState('');
  const [dynamicFonts, setDynamicFonts] = useState([]); // Array of font names to load via style tag

  const canvasRef = useRef(null);
  const exportMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Effects ---

  // Load html2canvas
  useEffect(() => {
    if (!document.getElementById('html2canvas-script')) {
      const script = document.createElement('script');
      script.id = 'html2canvas-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Click outside to close export menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Actions ---

  const handleProjectImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          // Basic validation
          if (data.elements && Array.isArray(data.elements)) {
            setElements(data.elements);
            if (data.posterSize) setPosterSize(data.posterSize);
            if (data.bgColor) setBgColor(data.bgColor);
            if (data.customPalettes) setCustomPalettes(data.customPalettes);
            setSelectedId(null); // Deselect on load
          } else {
            alert('Invalid project file structure.');
          }
        } catch (err) {
          console.error(err);
          alert('Failed to parse project file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = null;
  };

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);

    // PDF via Print
    if (format === 'pdf') {
      window.print();
      return;
    }

    // JSON Project File
    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ elements, posterSize, bgColor, customPalettes }));
      const link = document.createElement('a');
      link.href = dataStr;
      link.download = `poster-project-${Date.now()}.json`;
      link.click();
      return;
    }

    // Image Export (PNG, JPEG, WEBP)
    if (!window.html2canvas) {
      alert('Export library is still loading. Please try again in a few seconds.');
      return;
    }

    setIsExporting(true);

    // Slight delay to allow UI to update (spinner etc if we had one)
    setTimeout(async () => {
      try {
        // Temporarily deselect everything to remove selection rings/handles
        const previousSelection = selectedId;
        setSelectedId(null);

        const canvas = await window.html2canvas(canvasRef.current, {
          useCORS: true, // Important for external images if any
          scale: 2, // Retina quality
          backgroundColor: null, // Transparent if needed
          logging: false,
        });

        const link = document.createElement('a');
        link.download = `poster-lab-export.${format}`;

        if (format === 'png') {
          link.href = canvas.toDataURL('image/png');
        } else if (format === 'jpeg') {
          link.href = canvas.toDataURL('image/jpeg', 0.9);
        } else if (format === 'webp') {
          link.href = canvas.toDataURL('image/webp', 0.9);
        }

        link.click();

        // Restore selection
        setSelectedId(previousSelection);
      } catch (error) {
        console.error("Export failed:", error);
        alert("Sorry, there was an error generating the image.");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const setOrientation = (orientation) => {
    const isCurrentLandscape = posterSize.w > posterSize.h;
    if (orientation === 'landscape' && !isCurrentLandscape) {
      setPosterSize({ w: posterSize.h, h: posterSize.w });
    } else if (orientation === 'portrait' && isCurrentLandscape) {
      setPosterSize({ w: posterSize.h, h: posterSize.w });
    }
  };

  const applyPalette = (palette) => {
    setBgColor(palette.bg);
    setElements(elements.map(el => {
      if (el.type === 'text') {
        return { ...el, style: { ...el.style, color: palette.text } };
      }
      if (el.type === 'shape') {
        return { ...el, style: { ...el.style, backgroundColor: palette.accent } };
      }
      return el;
    }));
  };

  const saveCustomTheme = () => {
    if (!tempPalette.name) return;
    const newTheme = { ...tempPalette };
    setCustomPalettes([...customPalettes, newTheme]);
    applyPalette(newTheme);
    setIsCreatorOpen(false);
  };

  const deleteCustomTheme = (e, index) => {
    e.stopPropagation();
    const newList = [...customPalettes];
    newList.splice(index, 1);
    setCustomPalettes(newList);
  };

  const addNewFont = () => {
    if (!newFontName.trim()) return;

    const fontName = newFontName.trim();
    if (availableFonts.some(f => f.name.toLowerCase() === fontName.toLowerCase())) {
      setNewFontName('');
      return;
    }

    setDynamicFonts([...dynamicFonts, fontName]);

    const newFontObj = {
      name: fontName,
      family: `"${fontName}", sans-serif`
    };

    setAvailableFonts([...availableFonts, newFontObj]);
    setNewFontName('');
  };

  const addText = (type = 'heading') => {
    const newEl = {
      id: Date.now(),
      type: 'text',
      content: type === 'heading' ? 'HEADING' : 'New Text Block',
      x: 50,
      y: 50 + elements.length * 20,
      style: {
        fontSize: type === 'heading' ? 64 : 18,
        fontFamily: 'Inter, sans-serif',
        color: '#000000',
        fontWeight: type === 'heading' ? 'bold' : 'normal',
        textAlign: 'left',
      }
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addShape = (shapeType = 'rectangle') => {
    const newEl = {
      id: Date.now(),
      type: 'shape',
      x: 100,
      y: 100,
      style: {
        width: 100,
        height: 100,
        backgroundColor: '#e63946',
        borderRadius: 0,
        opacity: 1,
        rotate: 0,
        shapeType: shapeType,
        borderWidth: 0,
        borderColor: '#000000',
      }
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl = {
          id: Date.now(),
          type: 'image',
          src: event.target.result,
          x: 50,
          y: 50,
          style: {
            width: 200,
            height: 'auto',
            opacity: 1,
            mixBlendMode: 'normal',
            borderRadius: 0,
            rotate: 0,
            blur: 0,
            grayscale: 0,
            brightness: 100,
            contrast: 100,
            sepia: 0,
            borderWidth: 0,
            borderColor: '#000000',
            crop: { x: 50, y: 50, scale: 1 }, // Default crop values
            flipX: false, // Default flip values
            flipY: false, // Default flip values
            shadow: { blur: 0, color: '#000000', offsetX: 0, offsetY: 0 }, // Default shadow values
          }
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const updateStyle = (id, styleUpdates) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
    ));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  // --- Drag Logic ---

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    const el = elements.find(item => item.id === id);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && selectedId && dragStart) {
      const deltaX = (e.clientX - dragStart.mouseX) / scale;
      const deltaY = (e.clientY - dragStart.mouseY) / scale;
      updateElement(selectedId, { x: dragStart.elX + deltaX, y: dragStart.elY + deltaY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Touch Handlers
  const handleTouchStart = (e, id) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setSelectedId(id);
    setIsDragging(true);
    const el = elements.find(item => item.id === id);
    setDragStart({
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      elX: el.x,
      elY: el.y
    });
  };

  const handleTouchMove = (e) => {
    if (isDragging && selectedId && dragStart) {
      // Prevent scrolling while dragging an element
      if (e.cancelable) e.preventDefault();

      const touch = e.touches[0];
      const deltaX = (touch.clientX - dragStart.mouseX) / scale;
      const deltaY = (touch.clientY - dragStart.mouseY) / scale;
      updateElement(selectedId, { x: dragStart.elX + deltaX, y: dragStart.elY + deltaY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  });

  const selectedElement = elements.find(el => el.id === selectedId);
  const filteredFonts = availableFonts.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()));

  // --- Helper to Compute Styles for Render ---
  const getRenderStyle = (el) => {
    const base = {
      left: el.x,
      top: el.y,
      position: 'absolute',
      zIndex: selectedId === el.id ? 50 : 10,
      opacity: el.style.opacity ?? 1,
      transform: `rotate(${el.style.rotate ?? 0}deg)`,
    };

    if (el.type === 'shape' || el.type === 'image') {
      base.width = el.style.width;
      base.height = el.style.height;
    }

    if (el.type === 'image') {
      const blur = el.style.blur ?? 0;
      const grayscale = el.style.grayscale ?? 0;
      const brightness = el.style.brightness ?? 100;
      const contrast = el.style.contrast ?? 100;
      const sepia = el.style.sepia ?? 0;

      base.filter = `blur(${blur}px) grayscale(${grayscale}%) brightness(${brightness}%) contrast(${contrast}%) sepia(${sepia}%)`;

      if (el.style.borderWidth) {
        base.border = `${el.style.borderWidth}px solid ${el.style.borderColor ?? '#000000'}`;
      }
      base.borderRadius = el.style.borderRadius;

      // Box Shadow
      if (el.style.shadow && el.style.shadow.blur > 0) {
        base.boxShadow = `${el.style.shadow.offsetX ?? 0}px ${el.style.shadow.offsetY ?? 0}px ${el.style.shadow.blur}px ${el.style.shadow.color ?? '#000000'}`;
      }

      // Ensure cropping works by clipping overflow
      base.overflow = 'hidden';
    }

    if (el.type === 'shape') {
      base.backgroundColor = el.style.backgroundColor;

      if (el.style.shapeType === 'circle') {
        base.borderRadius = '50%';
      } else if (el.style.shapeType === 'triangle') {
        base.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        base.borderRadius = 0;
      } else if (el.style.shapeType === 'star') {
        base.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        base.borderRadius = 0;
      } else if (el.style.shapeType === 'hexagon') {
        base.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        base.borderRadius = 0;
      } else {
        // Rectangle default
        base.borderRadius = el.style.borderRadius;
      }

      // Borders only really work well for Rect/Circle in this simple impl without svg
      if ((!el.style.shapeType || el.style.shapeType === 'rectangle' || el.style.shapeType === 'circle') && el.style.borderWidth) {
        base.border = `${el.style.borderWidth}px solid ${el.style.borderColor ?? '#000000'}`;
      }
    }

    return base;
  };

  // --- Rendering ---

  // Responsive Scale State
  const [scale, setScale] = useState(1);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);


  useEffect(() => {
    const handleResize = () => {
      // Calculate max width available for canvas (approximate)
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w < 768;

      // Target area for canvas
      const availableW = isMobile ? w - 32 : w - 460; // 32px padding mobile, 460px UI desktop (80 sidebar + 320 properties + margins)
      const availableH = isMobile ? h - 200 : h - 100; // Header + Toolbar height approx

      const scaleW = availableW / posterSize.w;
      const scaleH = availableH / posterSize.h;

      // Use the smaller scale to fit entirely, maxing out at 1 (or 0.85 for desktop aesthetic)
      const fittingScale = Math.min(scaleW, scaleH, isMobile ? 0.9 : 0.85);

      // Apply Manual Scale Multiplier
      const finalScale = fittingScale * manualScale;

      setScale(Math.max(finalScale, 0.1)); // Minimum scale absolute floor
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [posterSize, manualScale]);

  // --- Canvas Interaction (Pinch Zoom & Pan) ---

  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.group')) return; // Don't pan if clicking an element
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setIsMobilePropertiesOpen(false);
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      e.preventDefault();
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Touch Logic
  const handlePinchStart = (e) => {
    // If hitting an element, don't pan/zoom here (handled by element's onTouchStart)
    if (e.target.closest('.group')) return;

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchDistance(dist);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
      setIsMobilePropertiesOpen(false);
    }
  };

  const handlePinchMove = (e) => {
    if (e.touches.length === 2 && pinchDistance) {
      // Pinch Zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - pinchDistance;
      setManualScale(prev => Math.min(Math.max(prev + (delta * 0.005), 0.5), 5));
      setPinchDistance(dist);
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      if (e.cancelable) e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  };

  const handlePinchEnd = () => {
    setPinchDistance(null);
    setIsPanning(false);
  };

  // Open properties automatically on selection for mobile
  useEffect(() => {
    if (selectedId) {
      setIsMobilePropertiesOpen(true);
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Google Fonts Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Bebas+Neue&family=Inter:wght@400;700&family=Lato:wght@400;700&family=Lobster&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Righteous&family=Roboto:wght@400;700&display=swap');
        ${dynamicFonts.length > 0 ? `@import url('https://fonts.googleapis.com/css2?${dynamicFonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;700`).join('&')}&display=swap');` : ''}
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-gray-800 border-b border-gray-700 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-400 rounded-lg flex items-center justify-center font-bold text-white">P</div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">PosterLab</h1>
        </div>
        <div className="flex items-center gap-3 relative" ref={exportMenuRef}>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
            title="Toggle Fullscreen"
          >
            {document.fullscreenElement ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Hidden Input for Project Import */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleProjectImport}
          />

          <button
            onClick={() => setIsMobilePropertiesOpen(!isMobilePropertiesOpen)}
            className={`md:hidden p-2 rounded-full ${isMobilePropertiesOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            <Layers size={18} />
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-700 text-white rounded-full text-xs md:text-sm font-semibold hover:bg-gray-600 transition"
          >
            <Upload size={16} /> <span className="hidden md:inline">Open</span>
          </button>

          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white text-black rounded-full text-xs md:text-sm font-semibold hover:bg-gray-200 transition"
            disabled={isExporting}
          >
            {isExporting ? (
              <>Saving...</>
            ) : (
              <><Download size={16} /> <span className="hidden md:inline">Export</span> <ChevronDown size={14} /></>
            )}
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-1">
                <button onClick={() => handleExport('png')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg text-left">
                  <FileImage size={16} className="text-blue-400" /> Save as PNG
                </button>
                <button onClick={() => handleExport('jpeg')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg text-left">
                  <FileImage size={16} className="text-yellow-400" /> Save as JPEG
                </button>
                <button onClick={() => handleExport('webp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg text-left">
                  <FileImage size={16} className="text-green-400" /> Save as WEBP
                </button>
                <div className="h-px bg-gray-700 my-1"></div>
                <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg text-left">
                  <Printer size={16} className="text-red-400" /> Print / PDF
                </button>
                <div className="h-px bg-gray-700 my-1"></div>
                <button onClick={() => handleExport('json')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg text-left">
                  <FileJson size={16} className="text-purple-400" /> Save Project
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">

        {/* Toolbar (Bottom on Mobile, Left on Desktop) */}
        <div className="order-last md:order-first w-full md:w-20 bg-gray-800 border-t md:border-t-0 md:border-r border-gray-700 flex flex-row md:flex-col items-center justify-around md:justify-center py-2 md:py-6 gap-2 md:gap-6 z-20 overflow-x-auto md:overflow-y-auto hide-scrollbar shrink-0">
          <ToolButton icon={<TypeIcon />} label="Text" onClick={() => addText('paragraph')} />
          <ToolButton icon={<Bold />} label="Header" onClick={() => addText('heading')} />
          <label className="flex flex-col items-center gap-1 cursor-pointer group min-w-[60px] md:w-full">
            <div className="p-3 bg-gray-700 rounded-xl group-hover:bg-gray-600 transition shadow-sm">
              <ImageIcon size={24} className="text-gray-300" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>

          <div className="hidden md:block w-full h-px bg-gray-700 my-2"></div>

          <ToolButton icon={<Square />} label="Square" onClick={() => addShape('rectangle')} />
          <ToolButton icon={<Circle />} label="Circle" onClick={() => addShape('circle')} />
          <ToolButton icon={<Triangle />} label="Tri" onClick={() => addShape('triangle')} />
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 bg-gray-900/50 flex items-center justify-center p-4 md:p-8 overflow-hidden relative order-1 touch-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handlePinchStart}
          onTouchMove={handlePinchMove}
          onTouchEnd={handlePinchEnd}
        >
          {/* Zoom Controls Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-50 bg-gray-800/80 p-2 rounded-xl backdrop-blur-sm border border-gray-700 shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); setManualScale(s => Math.min(s + 0.1, 5)); }}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setManualScale(s => Math.max(s - 0.1, 0.5)); }}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setManualScale(1); setPanOffset({ x: 0, y: 0 }); }}
              className="p-2 text-white hover:bg-gray-700 rounded-lg transition"
              title="Reset Zoom & Pan"
            >
              <RotateCcw size={18} />
            </button>
            <div className="text-[10px] text-center text-gray-400 font-mono mt-1">
              {Math.round(scale * 100)}%
            </div>
          </div>
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl transition-transform duration-75 ease-out"
            style={{
              width: posterSize.w,
              height: posterSize.h,
              backgroundColor: bgColor,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedId(null);
                setIsFontPickerOpen(false);
                // If dragging starts, keep properties open but maybe minimize? 
                // Actually close if clicking bg
              }
            }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: `linear-gradient(${bgColor === '#121212' ? '#333' : '#ccc'} 1px, transparent 1px), linear-gradient(90deg, ${bgColor === '#121212' ? '#333' : '#ccc'} 1px, transparent 1px)`, backgroundSize: '50px 50px' }}>
            </div>

            {elements.map(el => (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onTouchStart={(e) => handleTouchStart(e, el.id)}
                className={`absolute group cursor-move ${selectedId === el.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300 z-10'}`}
                style={getRenderStyle(el)}
              >
                {/* Visual Drag Handle when selected */}
                {selectedId === el.id && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                {/* Content Rendering */}
                {el.type === 'text' && (
                  <div
                    style={{ ...el.style, whiteSpace: 'pre-wrap', minWidth: '50px' }}
                    contentEditable={selectedId === el.id}
                    suppressContentEditableWarning
                    onBlur={(e) => updateElement(el.id, { content: e.target.innerText })}
                    className="outline-none"
                  >
                    {el.content}
                  </div>
                )}

                {el.type === 'image' && (
                  <img
                    src={el.src}
                    alt="uploaded"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      borderRadius: el.style.borderRadius, // Applied to container, but consistent here for safety if no clip
                      mixBlendMode: el.style.mixBlendMode,
                      objectPosition: `${el.style.crop?.x ?? 50}% ${el.style.crop?.y ?? 50}%`,
                      transform: `scale(${el.style.crop?.scale ?? 1}) scaleX(${el.style.flipX ? -1 : 1}) scaleY(${el.style.flipY ? -1 : 1})`,
                    }}
                  />
                )}

                {el.type === 'shape' && (
                  <div className="w-full h-full pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Properties Panel (Bottom Sheet on Mobile) */}
        <div className={`fixed inset-x-0 bottom-0 max-h-[50vh] md:max-h-full md:static md:w-80 bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 overflow-y-auto z-40 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none font-medium ${isMobilePropertiesOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>

          {/* Mobile Handle / Close */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-850">
            <span className="text-xs font-bold text-gray-400 uppercase">
              {selectedElement ? 'Edit Element' : 'Canvas Properties'}
            </span>
            <button onClick={() => setIsMobilePropertiesOpen(false)} className="p-1 text-gray-400">
              <ChevronDown size={20} />
            </button>
          </div>

          {selectedElement ? (
            <div className="p-6 space-y-6 pb-20 md:pb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider hidden md:block">Properties</h2>
                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition ml-auto"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Text specific controls */}
              {selectedElement.type === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase">Content</label>
                    <textarea
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                      rows={3}
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-xs text-gray-500 font-semibold uppercase">Typography</label>

                    {/* Custom Font Picker */}
                    <div className="relative mb-2">
                      <button
                        onClick={() => setIsFontPickerOpen(!isFontPickerOpen)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm flex items-center justify-between hover:border-gray-500 transition"
                      >
                        <span className="truncate">{availableFonts.find(f => f.family === selectedElement.style.fontFamily)?.name || 'Select Font'}</span>
                        <ChevronDown size={14} className="text-gray-500" />
                      </button>

                      {isFontPickerOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-64">
                          <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                            <div className="relative">
                              <Search size={14} className="absolute left-2 top-2.5 text-gray-500" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search fonts..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-md py-1.5 pl-8 pr-2 text-xs outline-none focus:border-blue-500"
                                value={fontSearch}
                                onChange={(e) => setFontSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto flex-1">
                            {filteredFonts.map(f => (
                              <button
                                key={f.name}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${selectedElement.style.fontFamily === f.family ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'}`}
                                onClick={() => {
                                  updateStyle(selectedElement.id, { fontFamily: f.family });
                                  setIsFontPickerOpen(false);
                                }}
                                style={{ fontFamily: f.family }}
                              >
                                {f.name}
                              </button>
                            ))}
                            {filteredFonts.length === 0 && <div className="p-3 text-center text-xs text-gray-500">No fonts found</div>}
                          </div>
                          <div className="p-2 border-t border-gray-700 bg-gray-800/95 backdrop-blur-sm">
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="Add Google Font"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                                value={newFontName}
                                onChange={(e) => setNewFontName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNewFont()}
                              />
                              <button
                                onClick={addNewFont}
                                className="bg-blue-600 text-white rounded-md px-2 py-1 hover:bg-blue-500"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center bg-gray-900 border border-gray-700 rounded-md px-2">
                        <Type size={14} className="text-gray-500 mr-2" />
                        <input
                          type="number"
                          value={selectedElement.style.fontSize}
                          onChange={(e) => updateStyle(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="bg-transparent w-full text-sm outline-none py-2"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button className={`flex-1 p-2 border border-gray-700 rounded hover:bg-gray-700 ${selectedElement.style.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-gray-900'}`} onClick={() => updateStyle(selectedElement.id, { fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold size={16} /></button>
                        <button className={`flex-1 p-2 border border-gray-700 rounded hover:bg-gray-700 ${selectedElement.style.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-900'}`} onClick={() => updateStyle(selectedElement.id, { fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={16} /></button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded hover:bg-gray-700" onClick={() => updateStyle(selectedElement.id, { textAlign: 'left' })}><AlignLeft size={16} /></button>
                      <button className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded hover:bg-gray-700" onClick={() => updateStyle(selectedElement.id, { textAlign: 'center' })}><AlignCenter size={16} /></button>
                      <button className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded hover:bg-gray-700" onClick={() => updateStyle(selectedElement.id, { textAlign: 'right' })}><AlignRight size={16} /></button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.style.color}
                        onChange={(e) => updateStyle(selectedElement.id, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="text"
                        value={selectedElement.style.color}
                        onChange={(e) => updateStyle(selectedElement.id, { color: e.target.value })}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-2 text-xs uppercase"
                      />
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase flex justify-between">Opacity <span>{Math.round((selectedElement.style.opacity ?? 1) * 100)}%</span></label>
                      <input
                        type="range" min="0" max="1" step="0.1"
                        value={selectedElement.style.opacity ?? 1}
                        onChange={(e) => updateStyle(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-[10px] text-gray-500 font-semibold uppercase flex justify-between">Rotate <span>{selectedElement.style.rotate ?? 0}°</span></label>
                      <input
                        type="range" min="0" max="360" step="5"
                        value={selectedElement.style.rotate ?? 0}
                        onChange={(e) => updateStyle(selectedElement.id, { rotate: parseInt(e.target.value) })}
                        className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image specific controls */}
              {selectedElement.type === 'image' && (
                <div className="space-y-6">
                  {/* Basic Transform */}
                  <div className="space-y-3">
                    <label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
                      <Move size={12} /> Transform
                    </label>
                    <div className="space-y-3 pl-2 border-l-2 border-gray-700">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">Width <span>{parseInt(selectedElement.style.width)}px</span></label>
                        <input
                          type="range" min="50" max="800"
                          value={parseInt(selectedElement.style.width)}
                          onChange={(e) => updateStyle(selectedElement.id, { width: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">Rotate <span>{selectedElement.style.rotate ?? 0}°</span></label>
                        <input
                          type="range" min="0" max="360"
                          value={selectedElement.style.rotate ?? 0}
                          onChange={(e) => updateStyle(selectedElement.id, { rotate: parseInt(e.target.value) })}
                          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">Opacity <span>{Math.round((selectedElement.style.opacity ?? 1) * 100)}%</span></label>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedElement.style.opacity ?? 1}
                          onChange={(e) => updateStyle(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Crop & Flip */}
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
                  <Crop size={12} /> Crop & Flip
                </label>
                <div className="space-y-3 pl-2 border-l-2 border-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStyle(selectedElement.id, { flipX: !selectedElement.style.flipX })}
                      className={`flex items-center justify-center gap-2 p-2 rounded text-xs border ${selectedElement.style.flipX ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'}`}
                    >
                      <FlipHorizontal size={14} /> Flip H
                    </button>
                    <button
                      onClick={() => updateStyle(selectedElement.id, { flipY: !selectedElement.style.flipY })}
                      className={`flex items-center justify-center gap-2 p-2 rounded text-xs border ${selectedElement.style.flipY ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'}`}
                    >
                      <FlipVertical size={14} /> Flip V
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 flex justify-between">Zoom (Crop) <span>{Math.round((selectedElement.style.crop?.scale ?? 1) * 100)}%</span></label>
                    <input
                      type="range" min="1" max="3" step="0.1"
                      value={selectedElement.style.crop?.scale ?? 1}
                      onChange={(e) => updateStyle(selectedElement.id, { crop: { ...selectedElement.style.crop, scale: parseFloat(e.target.value) } })}
                      className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {(selectedElement.style.crop?.scale > 1) && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">Pan X <span>{selectedElement.style.crop?.x ?? 50}%</span></label>
                        <input
                          type="range" min="0" max="100"
                          value={selectedElement.style.crop?.x ?? 50}
                          onChange={(e) => updateStyle(selectedElement.id, { crop: { ...selectedElement.style.crop, x: parseInt(e.target.value) } })}
                          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">Pan Y <span>{selectedElement.style.crop?.y ?? 50}%</span></label>
                        <input
                          type="range" min="0" max="100"
                          value={selectedElement.style.crop?.y ?? 50}
                          onChange={(e) => updateStyle(selectedElement.id, { crop: { ...selectedElement.style.crop, y: parseInt(e.target.value) } })}
                          className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
                  <Sun size={12} /> Filters
                </label>
                <div className="space-y-3 pl-2 border-l-2 border-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Grayscale</label>
                      <input type="range" min="0" max="100" value={selectedElement.style.grayscale ?? 0} onChange={(e) => updateStyle(selectedElement.id, { grayscale: parseInt(e.target.value) })} className="w-full accent-gray-500 h-1 bg-gray-700 rounded cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Sepia</label>
                      <input type="range" min="0" max="100" value={selectedElement.style.sepia ?? 0} onChange={(e) => updateStyle(selectedElement.id, { sepia: parseInt(e.target.value) })} className="w-full accent-amber-600 h-1 bg-gray-700 rounded cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Brightness</label>
                      <input type="range" min="0" max="200" value={selectedElement.style.brightness ?? 100} onChange={(e) => updateStyle(selectedElement.id, { brightness: parseInt(e.target.value) })} className="w-full accent-yellow-500 h-1 bg-gray-700 rounded cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Contrast</label>
                      <input type="range" min="0" max="200" value={selectedElement.style.contrast ?? 100} onChange={(e) => updateStyle(selectedElement.id, { contrast: parseInt(e.target.value) })} className="w-full accent-gray-300 h-1 bg-gray-700 rounded cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 flex justify-between">Blur <span>{selectedElement.style.blur ?? 0}px</span></label>
                    <input type="range" min="0" max="20" value={selectedElement.style.blur ?? 0} onChange={(e) => updateStyle(selectedElement.id, { blur: parseInt(e.target.value) })} className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Effects & Border */}
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2">
                  <Droplet size={12} /> Effects
                </label>
                <div className="space-y-3 pl-2 border-l-2 border-gray-700">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Mix Blend Mode</label>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded-md p-1.5 text-xs text-gray-300 outline-none focus:border-blue-500"
                      value={selectedElement.style.mixBlendMode}
                      onChange={(e) => updateStyle(selectedElement.id, { mixBlendMode: e.target.value })}
                    >
                      {blendModes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Radius</label>
                      <input
                        type="number"
                        value={parseInt(selectedElement.style.borderRadius) || 0}
                        onChange={(e) => updateStyle(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Border Width</label>
                      <input
                        type="number"
                        value={parseInt(selectedElement.style.borderWidth) || 0}
                        onChange={(e) => updateStyle(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400">Border Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={selectedElement.style.borderColor || '#000000'} onChange={(e) => updateStyle(selectedElement.id, { borderColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer" />
                      <input type="text" value={selectedElement.style.borderColor || '#000000'} onChange={(e) => updateStyle(selectedElement.id, { borderColor: e.target.value })} className="flex-1 bg-gray-900 border border-gray-700 rounded p-1 text-xs uppercase" />
                    </div>
                  </div>

                  {/* Shadow Control */}
                  <div className="space-y-1 pt-2 border-t border-gray-700">
                    <label className="text-[10px] text-gray-400">Shadow</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Blur"
                        value={selectedElement.style.shadow?.blur ?? 0}
                        onChange={(e) => updateStyle(selectedElement.id, { shadow: { ...selectedElement.style.shadow, blur: parseInt(e.target.value) || 0 } })}
                        className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-gray-300"
                      />
                      <input type="color" value={selectedElement.style.shadow?.color ?? '#000000'} onChange={(e) => updateStyle(selectedElement.id, { shadow: { ...selectedElement.style.shadow, color: e.target.value } })} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        placeholder="X Offset"
                        value={selectedElement.style.shadow?.offsetX ?? 0}
                        onChange={(e) => updateStyle(selectedElement.id, { shadow: { ...selectedElement.style.shadow, offsetX: parseInt(e.target.value) || 0 } })}
                        className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-gray-300"
                      />
                      <input
                        type="number"
                        placeholder="Y Offset"
                        value={selectedElement.style.shadow?.offsetY ?? 0}
                        onChange={(e) => updateStyle(selectedElement.id, { shadow: { ...selectedElement.style.shadow, offsetY: parseInt(e.target.value) || 0 } })}
                        className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shape specific controls */}
          {selectedElement.type === 'shape' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-semibold uppercase">Dimensions</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">Type</span>
                    <select
                      className="flex-1 bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-gray-300 outline-none"
                      value={selectedElement.style.shapeType || 'rectangle'}
                      onChange={(e) => updateStyle(selectedElement.id, { shapeType: e.target.value })}
                    >
                      {shapeTypes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">W</span>
                    <input type="range" min="10" max="500" value={parseInt(selectedElement.style.width)} onChange={(e) => updateStyle(selectedElement.id, { width: parseInt(e.target.value) })} className="flex-1 accent-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">H</span>
                    <input type="range" min="10" max="500" value={parseInt(selectedElement.style.height)} onChange={(e) => updateStyle(selectedElement.id, { height: parseInt(e.target.value) })} className="flex-1 accent-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">Rot</span>
                    <input type="range" min="0" max="360" value={parseInt(selectedElement.style.rotate || 0)} onChange={(e) => updateStyle(selectedElement.id, { rotate: parseInt(e.target.value) })} className="flex-1 accent-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8">Op</span>
                    <input type="range" min="0" max="1" step="0.1" value={selectedElement.style.opacity || 1} onChange={(e) => updateStyle(selectedElement.id, { opacity: parseFloat(e.target.value) })} className="flex-1 accent-blue-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-semibold uppercase">Appearance</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Fill Color</span>
                    <input type="color" value={selectedElement.style.backgroundColor} onChange={(e) => updateStyle(selectedElement.id, { backgroundColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer" />
                  </div>

                  {/* Show Border controls only for Rect/Circle */}
                  {(selectedElement.style.shapeType === 'rectangle' || selectedElement.style.shapeType === 'circle' || !selectedElement.style.shapeType) && (
                    <div className="space-y-2 pt-2 border-t border-gray-700">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400">Border Width</label>
                        <input
                          type="number"
                          value={parseInt(selectedElement.style.borderWidth) || 0}
                          onChange={(e) => updateStyle(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Border Color</span>
                        <input type="color" value={selectedElement.style.borderColor || '#000000'} onChange={(e) => updateStyle(selectedElement.id, { borderColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400">Corner Radius</label>
                        <input
                          type="number"
                          disabled={selectedElement.style.shapeType === 'circle'}
                          value={parseInt(selectedElement.style.borderRadius) || 0}
                          onChange={(e) => updateStyle(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
        ) : (
        <div className="p-6 space-y-6 pb-20 md:pb-6">
          <div className="text-center py-8">
            <Layers className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="text-gray-500 text-sm">Select an element to edit</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Canvas Settings</h3>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-semibold uppercase">Dimensions</label>
              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-blue-500"
                  onChange={(e) => {
                    if (e.target.value === 'custom') return;
                    const size = posterSizes.find(s => s.name === e.target.value);
                    if (size) {
                      const isLandscape = posterSize.w > posterSize.h;
                      const newW = isLandscape ? Math.max(size.w, size.h) : Math.min(size.w, size.h);
                      const newH = isLandscape ? Math.min(size.w, size.h) : Math.max(size.w, size.h);
                      setPosterSize({ w: newW, h: newH });
                    }
                  }}
                  value={posterSizes.find(s =>
                    (s.w === posterSize.w && s.h === posterSize.h) ||
                    (s.w === posterSize.h && s.h === posterSize.w)
                  )?.name || 'custom'}
                >
                  {posterSizes.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                  <option value="custom">Custom Size</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5">
                    <span className="text-[10px] text-gray-500 font-bold">W</span>
                    <input
                      type="number"
                      value={posterSize.w}
                      onChange={(e) => setPosterSize({ ...posterSize, w: parseInt(e.target.value) || 0 })}
                      className="w-full bg-transparent text-sm outline-none text-gray-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5">
                    <span className="text-[10px] text-gray-500 font-bold">H</span>
                    <input
                      type="number"
                      value={posterSize.h}
                      onChange={(e) => setPosterSize({ ...posterSize, h: parseInt(e.target.value) || 0 })}
                      className="w-full bg-transparent text-sm outline-none text-gray-300"
                    />
                  </div>
                </div>

                <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-1">
                  <button
                    className={`flex-1 text-xs py-1.5 rounded-md transition flex items-center justify-center gap-2 ${posterSize.h >= posterSize.w ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setOrientation('portrait')}
                  >
                    <div className="w-2 h-3 border border-current rounded-[1px]"></div> Portrait
                  </button>
                  <button
                    className={`flex-1 text-xs py-1.5 rounded-md transition flex items-center justify-center gap-2 ${posterSize.w > posterSize.h ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setOrientation('landscape')}
                  >
                    <div className="w-3 h-2 border border-current rounded-[1px]"></div> Landscape
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Theme Creator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500 font-semibold uppercase">My Themes</label>
                <button
                  onClick={() => setIsCreatorOpen(!isCreatorOpen)}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  <Plus size={12} /> New
                </button>
              </div>

              {isCreatorOpen && (
                <div className="bg-gray-700/50 p-3 rounded-lg space-y-3 border border-gray-600 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase mb-1 block">Theme Name</label>
                    <input
                      type="text"
                      value={tempPalette.name}
                      onChange={(e) => setTempPalette({ ...tempPalette, name: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-xs text-white outline-none focus:border-blue-500"
                      placeholder="e.g. Summer Vibes"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase block">Bg</label>
                      <input type="color" value={tempPalette.bg} onChange={(e) => setTempPalette({ ...tempPalette, bg: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase block">Text</label>
                      <input type="color" value={tempPalette.text} onChange={(e) => setTempPalette({ ...tempPalette, text: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase block">Accent</label>
                      <input type="color" value={tempPalette.accent} onChange={(e) => setTempPalette({ ...tempPalette, accent: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsCreatorOpen(false)} className="flex-1 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Cancel</button>
                    <button onClick={saveCustomTheme} className="flex-1 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center justify-center gap-1"><Save size={12} /> Save</button>
                  </div>
                </div>
              )}

              {/* Custom Themes List */}
              {customPalettes.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {customPalettes.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPalette(p)}
                      className="relative flex items-center gap-2 p-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition text-left group"
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-600 overflow-hidden flex shadow-sm shrink-0">
                        <div className="h-full w-1/3" style={{ backgroundColor: p.bg }}></div>
                        <div className="h-full w-1/3" style={{ backgroundColor: p.text }}></div>
                        <div className="h-full w-1/3" style={{ backgroundColor: p.accent }}></div>
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-white font-medium truncate flex-1">{p.name}</span>
                      <div
                        onClick={(e) => deleteCustomTheme(e, idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                      >
                        <X size={10} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-semibold uppercase flex justify-between">
                <span>Presets</span>
                <span className="opacity-50 text-[10px] lowercase">Bg / Text / Accent</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {colorPalettes.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPalette(p)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition text-left group"
                  >
                    <div className="w-8 h-8 rounded-full border border-gray-600 overflow-hidden flex shadow-sm shrink-0">
                      <div className="h-full w-1/3" style={{ backgroundColor: p.bg }}></div>
                      <div className="h-full w-1/3" style={{ backgroundColor: p.text }}></div>
                      <div className="h-full w-1/3" style={{ backgroundColor: p.accent }}></div>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-white font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-semibold uppercase">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-xs text-gray-400 uppercase">{bgColor}</span>
              </div>
            </div>
          </div>
        </div>
          )}
      </div>
    </div>
    </div >
  );
}

function ToolButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group w-auto flex-1 md:w-full"
    >
      <div className="p-3 bg-gray-700 rounded-xl group-hover:bg-blue-600 transition shadow-sm text-gray-300 group-hover:text-white">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <span className="text-[10px] text-gray-400 font-medium group-hover:text-white transition">{label}</span>
    </button>
  );
}