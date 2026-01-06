# Custom JSON Assets Guide

PosterLabs allows you to create and import custom assets using JSON files. This is a powerful feature for designers and developers who want to generate templates programmatically or share complex elements.

## File Format

The file must be a standard `.json` file containing an **array** of asset objects. Even if you are importing a single asset, it must be wrapped in an array `[...]`.

```json
[
  {
    "type": "text",
    "content": "Hello World",
    "style": { ... }
  }
]
```

## Asset Structure

Each asset object supports the following properties:

| Property | Type | Description |
|---|---|---|
| `type` | `string` | **Required**. One of: `'text'`, `'image'`, `'shape'`, `'custom'`, `'group'`. |
| `x` | `number` | X position (default: 0). |
| `y` | `number` | Y position (default: 0). |
| `width` | `number` | Width in pixels (optional for text). |
| `height` | `number` | Height in pixels (optional for text). |
| `rotate` | `number` | Rotation in degrees (default: 0). |
| `style` | `object` | CSS-like style object (see Style Properties below). |
| `content` | `string` | **Required for 'text'**. The actual text content. |
| `src` | `string` | **Required for 'image'**. URL or Data URI of the image. |
| `customHtml` | `string` | **Required for 'custom'**. Raw HTML string to render. |
| `children` | `array` | **Required for 'group'**. Array of child element objects (relative coordinates). |

### Style Properties

The `style` object maps directly to CSS properties, with camelCase keys.

Common properties:
- `backgroundColor` (Hex, RGB, or Gradient strings)
- `color` (Text/Stroke color)
- `fontFamily`, `fontSize`, `fontWeight`, `fontStyle` (Typography)
- `borderRadius`, `borderWidth`, `borderColor`
- `opacity` (0-1)
- `shadow` (Object: `{ color, blur, offsetX, offsetY }`)
- `padding` (number)

## Examples

### 1. Simple Text

```json
[
  {
    "type": "text",
    "content": "PosterLabs",
    "x": 100,
    "y": 100,
    "style": {
      "fontFamily": "Inter",
      "fontSize": 48,
      "fontWeight": "bold",
      "color": "#3b82f6",
      "padding": 20,
      "backgroundColor": "#eff6ff",
      "borderRadius": 12
    }
  }
]
```

### 2. Complex Shape with Gradient

```json
[
  {
    "type": "shape",
    "x": 300,
    "y": 100,
    "width": 100,
    "height": 100,
    "style": {
      "backgroundColor": "linear-gradient(45deg, #ff0000, #ffff00)",
      "borderRadius": "50%",
      "shadow": {
        "color": "#000000",
        "blur": 20,
        "offsetX": 5,
        "offsetY": 10
      }
    }
  }
]
```

### 3. Custom HTML Element

Use `type: 'custom'` to render raw HTML. This is useful for SVG icons or specific layouts.

```json
[
  {
    "type": "custom",
    "x": 50,
    "y": 400,
    "width": 64,
    "height": 64,
    "customHtml": "<div style='display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:black; color:white; border-radius:8px;'><span>🔥</span></div>"
  }
]
```

## Importing into PosterLabs

1. Open the **Assets** tab in the left sidebar.
2. Click the **Import JSON** button (Upload Icon) in the "Saved Assets" section header.
3. Select your `.json` file.
4. The assets will appear in your "Imported" or "General" category instantly.
5. Drag and drop them onto the canvas to use.
