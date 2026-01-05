# PosterLabs

An advanced, browser-based poster and banner design studio built with Vue 3 and TypeScript. Create professional designs with a powerful, intuitive drag-and-drop interface.

## 🚀 Features

### Core Design Tools
- **Drag & Drop Interface**: Easily add texts, images, and shapes.
- **Advanced Typography**: Google Fonts integration, text styles, and effects.
- **Image Editing**: Crop, filter, and adjust images directly on the canvas.
- **Smart Alignment Guides**: Intelligent snapping and measurement measuring (gaps) to create pixel-perfect layouts.
- **Marquee Selection**: Drag-to-select multiple elements for group editing.

### Project Management
- **Local Storage / JSON Import & Export**: Save your projects locally or export them as `.json` or `.posterLabs` files to share or backup.
- **Import as New**: Seamlessly import existing project files to start fresh versions.
- **Undo/Redo History**: Fearless editing with robust state management.

### Tech Stack
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Material Web Components
- **Icons**: Lucide Vue Next
- **Build Tool**: Vite

## 🔄 System Architecture & Flows

### 1. Project Initialization
```mermaid
sequenceDiagram
actor User
participant App
participant useProjects
participant useCanvas
participant Storage
User->>App: Opens Application
App->>useProjects: Initialize
useProjects->>Storage: Load Projects
Storage-->>useProjects: Projects List
alt New Project
User->>App: Click "New Project"
App->>useProjects: Create Project
useProjects->>useCanvas: Reset Canvas State
else Load Project
User->>App: Select Project
App->>useProjects: Load Project ID
useProjects->>Storage: Get Project Data
Storage-->>useProjects: Project JSON
useProjects->>useCanvas: Hydrate State (Elements, Size, Background)
end
```

### 2. Element Interaction Cycle
```mermaid
graph TD
User([User]) -->|Select Tool| Toolbar[Toolbar UI]
Toolbar -->|Add Element| Canvas[Canvas Area]
Canvas -->|Render| Element[RenderElement Component]
User -->|Click/Touch| Element
Element -->|Set Selected| useElements[useElements Composable]
useElements -->|Update Selection| Properties[Properties Panel]
User -->|Edit Properties| Properties
Properties -->|Update Store| useElements
useElements -->|Re-render| Element
User -->|Drag/Resize| Overlay[Transform Overlay]
Overlay -->|Update Coordinates| useElements
```

### 3. Theme Management
```mermaid
sequenceDiagram
actor User
participant ToolbarDesign
participant ThemeDesigner
participant useThemes
participant Canvas
User->>ToolbarDesign: View Themes
ToolbarDesign->>useThemes: Fetch Standard Themes
opt Create Custom Theme
User->>ThemeDesigner: Open Designer
ThemeDesigner->>useThemes: Initialize Draft Theme
loop Live Preview
User->>ThemeDesigner: Change Colors/Typos
ThemeDesigner->>useThemes: Apply Temporary
useThemes->>Canvas: Update CSS Variables/Styles
end
User->>ThemeDesigner: Save Theme
ThemeDesigner->>useThemes: Commit to Global State
useThemes->>LocalStorage: Persist Custom Theme
end
```

### 4. Export Workflow
```mermaid
graph LR
Start([Export Request]) --> Choose{"Type?"}
Choose -->|JSON| Serialize[Serialize useElements + useCanvas]
Serialize --> BlobJSON[Create JSON Blob]
BlobJSON --> Download1[Trigger Download]
Choose -->|Image| Clone[Clone DOM Node]
Clone --> Rast[Rasterize to Canvas]
Rast --> BlobImg[Create PNG/JPG Blob]
BlobImg --> Download2[Trigger Download]
```

## 📘 Developer Manual
For developers looking to programmatically generate templates or understand the project file structure, check out the [JSON Schema Guide](./project_schema_guide.md).

## 🛠️ Project Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📂 Project Structure
- `src/components/Editor/`: Canvas, Renderer, and interactive elements.
- `src/components/UI/sections/`: Modular toolbar components (Projects, Design, Elements, etc.).
- `src/composables/`: Shared logic (State Management) via Composables (`useCanvas`, `useElements`, `useProjects`, etc.).


Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
