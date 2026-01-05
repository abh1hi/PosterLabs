# PosterLabs Project JSON Schema Guide

This manual is designed for developers who want to programmatically generate or manually craft `json` project files for **PosterLabs**. By understanding this schema, you can create pixel-perfect templates, posters, and banners.

## 1. File Structure Overview
A valid PosterLabs project file (typically `.json` or `.posterLabs`) consists of a root object with two critical sections: `settings` and `elements`. Optional metadata like `thumbnail` can also be included.

```json
{
  "settings": {
    // Canvas configuration (dimensions, background)
  },
  "elements": [
    // Array of visual elements (text, images, shapes)
  ],
  "thumbnail": "data:image/png;base64,..." // Optional
}
```

---

## 2. The `settings` Object
Controls the global properties of the canvas.

| Property | Type | Description | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `w` | `number` | Width of the canvas in pixels. | Yes | `1080` |
| `h` | `number` | Height of the canvas in pixels. | Yes | `1080` |
| `bgColor` | `string` | Hex color code for solid backgrounds. | Yes | `#ffffff` |
| `backgroundType` | `"solid" \| "gradient"` | Determines if `bgColor` or `gradientStyle` is used. | Yes | `"solid"` |
| `gradientStyle` | `string` | CSS gradient string (e.g., `linear-gradient(...)`). Used if `backgroundType` is "gradient". | No | `""` |
| `showGrid` | `boolean` | Whether to display the alignment grid overlay. | No | `false` |

**Example:**
```json
"settings": {
  "w": 1200,
  "h": 630,
  "bgColor": "#1a1a1a",
  "backgroundType": "gradient",
  "gradientStyle": "linear-gradient(45deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)",
  "showGrid": false
}
```

---

## 3. The `elements` Array
This is the heart of your design. It is a list of objects, each representing a layer on the canvas. The rendering order is determined by the array order (index 0 is at the bottom).

### Common Properties (All Element Types)
Every element object **must** have these properties:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. Use a timestamp or UUID string. |
| `type` | `"text" \| "image" \| "shape" \| "custom"` | The type of element. |
| `x` | `number` | X position (left) in pixels. |
| `y` | `number` | Y position (top) in pixels. |
| `style` | `object` | Styling properties (details below). |
| `hidden` | `boolean` | If `true`, the element is not rendered. |
| `locked` | `boolean` | If `true`, the user cannot select or move logic. |
| `order` | `number` | Z-index sorting value (usually matches array index). |

### Element-Specific Properties

#### Type: `text`
Used for headlines, body copy, etc.
- **`content`** (string): The actual text to display.

```json
{
  "id": "text-123456",
  "type": "text",
  "x": 100,
  "y": 200,
  "content": "HELLO WORLD",
  "style": { ... }
}
```

#### Type: `image`
Used for photos, icons, and graphics.
- **`src`** (string): Source URL (http/https) or Base64 data URI of the image.

```json
{
  "id": "img-987654",
  "type": "image",
  "x": 0,
  "y": 0,
  "src": "https://images.unsplash.com/photo-1...",
  "style": { ... }
}
```

#### Type: `shape`
Used for geometric primitives (rectangles, circles).
- **`style.shapeType`** (string): The type of shape. Common values: `rectangle`, `circle`.
- **Note**: Shapes rely heavily on `style` properties like `width`, `height`, `backgroundColor`.

#### Type: `custom`
Used for embedding raw HTML/SVG.
- **`customHtml`** (string): The raw HTML string to render.

---

## 4. The `style` Object
This object defines the visual appearance. Most keys map directly to CSS properties.

### Dimensions & Transform
| Property | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | Width in pixels. |
| `height` | `number` | Height in pixels. |
| `rotate` | `number` | Rotation angle in degrees. |
| `opacity` | `number` | Opacity (0.0 to 1.0). |

### Typography (Text Only)
| Property | Type | Description |
| :--- | :--- | :--- |
| `fontSize` | `number` | Font size in pixels. |
| `fontFamily` | `string` | Name of the font family (e.g., "Inter", "Playfair Display"). |
| `fontWeight` | `string` | "400", "700", "bold", "normal". |
| `fontStyle` | `string` | "normal", "italic". |
| `textAlign` | `"left" \| "center" \| "right"` | Text alignment. |
| `color` | `string` | Text color (Hex, RGB). |
| `lineHeight` | `number` | Line height multiplier (e.g., 1.5). |
| `letterSpacing` | `string` | Letter spacing (e.g., "0px", "0.05em"). |
| `textTransform` | `string` | "none", "uppercase", "lowercase". |
| `textDecoration` | `string` | "none", "underline", "line-through". |

### Appearance (Box Model)
| Property | Type | Description |
| :--- | :--- | :--- |
| `backgroundColor` | `string` | Background color of the element box. |
| `borderRadius` | `number` | Border radius in pixels (use high value for circles). |
| `borderWidth` | `number` | Border width in pixels. |
| `borderColor` | `string` | Border color. |
| `mixBlendMode` | `string` | CSS blend mode (e.g., "multiply", "overlay"). |

### Filters
| Property | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `blur` | `number` | px | Gaussian blur amount. |
| `brightness` | `number` | % | Brightness (100 is normal). |
| `contrast` | `number` | % | Contrast (100 is normal). |
| `grayscale` | `number` | % | 0 (color) to 100 (gray). |
| `sepia` | `number` | % | Sepia intensity. |
| `saturate` | `number` | % | Saturation intensity. |
| `hueRotate` | `number` | deg | Hue rotation angle. |
| `invert` | `number` | % | Color inversion. |

### Shadow
The `shadow` property is an nested object:
```json
"shadow": {
  "color": "rgba(0,0,0,0.5)",
  "blur": 10,
  "offsetX": 5,
  "offsetY": 5
}
```

### Advanced: Image Fill & Positioning
When using "Fill Container" mode (making images act like background covers):
```json
"objectFit": "cover",   // Enables fill mode
"imageScale": 1.2,      // Zoom level (1.0 = 100%)
"imagePanX": 50,        // Horizontal Pan (-100 to 100)
"imagePanY": -20        // Vertical Pan (-100 to 100)
```

### Advanced: Image Cropping (Legacy)
If an image is cropped, it uses the `crop` object:
```json
"crop": {
    "x": 0,       // Crop X position (relative 0-1 or px)
    "y": 0,       // Crop Y position
    "scale": 1.5  // Zoom level within the crop frame
}
```

---

## 5. Bare-Bones Minimum Example
Here is a minimal valid JSON file for a 1080x1080 white canvas with one text element.

```json
{
  "settings": {
    "w": 1080,
    "h": 1080,
    "bgColor": "#ffffff",
    "backgroundType": "solid"
  },
  "elements": [
    {
      "id": "demo-text-001",
      "type": "text",
      "content": "Minimalist Design",
      "x": 100,
      "y": 500,
      "style": {
        "fontSize": 80,
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "color": "#000000",
        "textAlign": "left"
      }
    }
  ]
}
```

## 6. Pro Tips for Developers
1.  **Unique IDs**: Always generate unique IDs if generating programmatically. If manually editing, ensure no two elements share an ID.
2.  **Layers**: The `elements` array is strictly ordered. The first item is the bottom-most layer. To bring "Text" over an "Image", place the Text object *after* the Image object in the array.
3.  **Fonts**: Ensure the `fontFamily` you specify is actually loaded in the `index.html` or your font loader. Common Google Fonts like *Inter*, *Roboto*, *Poppins*, *Playfair Display* are good bets.
4.  **Base64 vs URLs**: URLs are lighter (`"src": "https://..."`), but Base64 (`"src": "data:image..."`) makes the project file self-contained and offline-ready. For robust templates, Base64 is often safer if you don't control the image hosting.
5.  **Grouping**: Currently, there is no explicit "Group" container. Grouping is conceptual. To move multiple items, they must be selected together in the UI. 
