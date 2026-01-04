# PosterLab

PosterLab is a powerful, mobile-friendly web application for designing beautiful posters. It features a responsive workspace, dynamic canvas scaling, and a suite of design tools including text, shapes, and image uploads.

## Features

- **Responsive Design:** Seamlessly adapts to desktop and mobile screens.
- **Mobile-First Experience:** Bottom sheet properties panel and touch-friendly controls.
- **Canvas Interaction:**
  - **Zoom & Pan:** Pinch-to-zoom on mobile, manual zoom controls, and drag-to-pan functionality.
  - **Dynamic Scaling:** Canvas automatically fits the screen size.
- **Rich Design Tools:**
  - **Text:** Add headings and paragraphs with customizable fonts (Google Fonts integration), colors, and spacing.
  - **Shapes:** Insert rectangles, circles, triangles, stars, and hexagons.
  - **Images:** Upload and manipulate images.
- **Customization:**
  - **Filters:** Apply CSS filters (grayscale, sepia, blur, etc.) to elements.
  - **Styling:** extensive control over borders, shadows, opacity, and blend modes.
- **Export Options:**
  - Save designs as PNG, JPEG, or PDF.
  - Export/Import projects as JSON files.

## Tech Stack

- **Frontend:** React (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React
- **Exporting:** html2canvas

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abh1hi/PosterLabs.git
    cd PosterLabs
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## Usage

- **Adding Elements:** Use the toolbar (left on desktop, bottom on mobile) to add text, shapes, or upload images.
- **Editing:** Click on an element to open the properties panel (slides up on mobile) to adjust styles.
- **Navigation:** Use the zoom controls or pinch gestures to zoom. Drag on the background to pan around the canvas.
- **Fullscreen:** Toggle fullscreen mode via the header button for an immersive experience.

## License

[MIT](LICENSE)
