# PosterLabs Feature Roadmap

To transform **PosterLabs** into a world-class, "feature-rich" design studio (competing with Canva, Figma, or Adobe Express), here is a curated list of advanced features and sections to implement.

## 1. 🤖 AI & Automation (The "Wow" Factor)
*   **AI Background Removal**: One-click removal of image backgrounds using on-device models (e.g., Transformers.js) or APIs.
*   **Generative Fill / Text-to-Image**: Integrate Stable Diffusion or OpenAI DALL-E to generate assets on the fly.
*   **Magic Layout**: A button that automatically shuffles and aligns elements into aesthetically pleasing grids or compositions.
*   **Auto-Palette**: Generate color palettes based on the primary image used in the design.

## 2. 🎨 Advanced Design Tools
*   **Grouping & Containers**: True groupings (folders) that move/scale together, and "Frames" (images snap into shapes).
*   **curved Text**: Text along a path (circle, arc, wave).
*   **Masking**: Use shapes or text as masks for images (clipping masks).
*   **Vector Drawing**: Pen tool or freehand drawing (pencil/brush) for custom doodles.
*   **Advanced Gradients**: Radial, Conic, and multi-point gradient editor.
*   **SVG Support**: Full import/export of SVG vectors (currently mostly raster-focused).

## 3. 🖼️ Asset Library (Built-in Resources)
*   **Stock Photos Integration**: APIs for Unsplash, Pexels, or Pixabay directly in the sidebar.
*   **Icon Packs**: Integrate Lucide/FontAwesome/Material Symbols as improved drag-and-drop assets.
*   **Stickers & Shapes Library**: A categorized library of blobs, arrows, badges, and emojis.
*   **Brand Kit**: specific section to save User's Logo, Brand Colors, and Fonts for quick access.

## 4. 🛠️ Professional Workflow
*   **Rulers & Guides**: Drag-out guidelines from rulers at the top/left of the canvas.
*   **Layers Panel 2.0**:
    *   Renaming layers.
    *   Drag-and-drop reordering (implemented but could be smoother).
    *   Grouping/Folder structure.
*   **History/Version Control**: Visual undo/redo history stack (time travel).
*   **Right-Click Context Menu**: Quick access to "Bring to Front", "Duplicate", "Delete", "Lock".

## 5. 💾 Export & Sharing
*   **PDF Export**: High-quality (300 DPI) PDF export for printing.
*   **Video/GIF Export**: Simple animations (fade in, slide up) for elements to create motion posters.
*   **Social Previews**: "View as Twitter Header", "View as Instagram Story" overlays to check safe zones.

## 6. 🌐 Collaboration (Cloud)
*   **Cloud Save**: Persist projects to Firebase/Supabase implementation (User Auth is implied).
*   **Shared Templates**: Publish designs to a "Community Gallery".
*   **Real-time Multiplication**: (Very Advanced) Multiple users editing the same canvas (via Yjs or Firebase).

## 📊 Proposed UI Sections
To accommodate these, we could expand `Toolbar.vue` into a more robust "Dock" or "Sidebar":

1.  **"Assets" Tab**: Unsplash/Icon search.
2.  **"Draw" Tab**: Brushes and pens.
3.  **"Brand" Tab**: Saved colors/logos.
4.  **"Apps" Tab**: AI tools and plugins.

---
**Recommendation for Next Steps:**
Start with **Asset Library (Unsplash)** or **Grouping**, as these add immediate high value to the user experience.
