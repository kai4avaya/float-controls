# Floating Controls

A beautiful, customizable floating control panel web component built with Lit. Features a stunning glassmorphic design that automatically adjusts to its parent container size and elegantly slides up **on hover** - no clicks required! Perfect for card interfaces, image galleries, dashboards, and any UI that needs elegant hover-activated controls.

![Version](https://img.shields.io/npm/v/floating-controls)
![License](https://img.shields.io/npm/l/floating-controls)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

## ?? Live Demo

**Try it now:** [View Demo on GitHub Pages](https://kai4avaya.github.io/float-controls/)

![Demo](assets/demo-controls.gif)

The control panel elegantly slides up from the bottom when you **hover** over the parent container - no clicking required! It provides a beautiful glassmorphic interface for your controls with smooth animations and customizable styling.

## Features

- **? Hover-Only Activation**: No clicks required! The panel smoothly slides up on hover and hides when you move away
- **?? Glassmorphic Design**: Beautiful backdrop blur and translucent styling out of the box
- **? Smooth Animations**: Elegant slide-up transitions with customizable timing and easing
- **?? Framework Agnostic**: Works with React, Vue, Angular, Svelte, or vanilla HTML/JS
- **?? Auto-sizing**: Automatically adjusts to parent container dimensions (91.666667% width by default)
- **??? Highly Customizable**: Configure appearance, animations, and controls entirely via TypeScript
- **?? Button System**: Built-in button support with custom actions and SVG icons
- **?? Slot Support**: Add custom content via HTML slots
- **?? Responsive**: Works seamlessly across all screen sizes
- **?? Zero Dependencies**: Only requires Lit (peer dependency)
- **?? TypeScript**: Full TypeScript support with type definitions included

## Installation

```bash
npm install floating-controls
```

**Note**: This package requires `lit` as a peer dependency. If you don't already have it:

```bash
npm install lit floating-controls
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { ControlPanelOverlay } from 'floating-controls';
  </script>
</head>
<body>
  <div style="position: relative; width: 400px; height: 300px; background: url('image.jpg');">
    <control-panel-overlay 
      label="Card Title" 
      subtitle="Card description">
    </control-panel-overlay>
  </div>
</body>
</html>
```

### With Action Buttons

```html
<div style="position: relative; width: 400px; height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <control-panel-overlay 
    label="My Card" 
    subtitle="Description"
    id="myPanel">
  </control-panel-overlay>
</div>

<script type="module">
  import { ControlPanelOverlay } from 'floating-controls';
  
  const panel = document.getElementById('myPanel');
  panel.config = {
    buttons: [
      {
        label: 'Like',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        action: () => {
          console.log('Liked!');
          alert('Liked!');
        }
      },
      {
        label: 'Share',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
        action: () => {
          console.log('Shared!');
          alert('Shared!');
        }
      }
    ]
  };
</script>
```

### Custom Styling

```javascript
import { ControlPanelOverlay } from 'floating-controls';

const panel = document.getElementById('myPanel');
panel.config = {
  width: '90%',
  padding: '1.25rem',
  borderRadius: '0.75rem',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropBlur: '16px',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  transitionDuration: '0.6s',
  slideUpOffset: '-0.5rem',
  buttons: [
    // ... your buttons
  ]
};
```

### With Custom Slot Content

```html
<control-panel-overlay label="Title" subtitle="Subtitle">
  <div style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.8;">
    Your custom content here
  </div>
</control-panel-overlay>
```

### React Example

```jsx
import { useEffect, useRef } from 'react';
import { ControlPanelOverlay } from 'floating-controls';

function Card({ image, title, subtitle }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.config = {
        buttons: [
          {
            label: 'Like',
            icon: '<svg>...</svg>',
            action: () => console.log('Liked!')
          }
        ]
      };
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '400px', height: '300px' }}>
      <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <control-panel-overlay 
        ref={panelRef}
        label={title} 
        subtitle={subtitle}
      />
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div style="position: relative; width: 400px; height: 300px;">
    <img :src="image" :alt="title" style="width: 100%; height: 100%; object-fit: cover;" />
    <control-panel-overlay 
      ref="panel"
      :label="title" 
      :subtitle="subtitle"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ControlPanelOverlay } from 'floating-controls';

const panel = ref(null);

onMounted(() => {
  if (panel.value) {
    panel.value.config = {
      buttons: [
        {
          label: 'Like',
          icon: '<svg>...</svg>',
          action: () => console.log('Liked!')
        }
      ]
    };
  }
});
</script>
```

## API Reference

### Component: `<control-panel-overlay>`

The main web component that renders the floating control panel.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `'Controls'` | Main title text displayed in the panel |
| `subtitle` | `string` | `''` | Subtitle text displayed below the title |
| `config` | `ControlPanelConfig` | `{}` | Configuration object for styling and buttons |

### ControlPanelConfig Interface

```typescript
interface ControlPanelConfig {
  // Layout
  width?: string;              // Panel width (default: '91.666667%')
  padding?: string;             // Panel padding (default: '1rem')
  borderRadius?: string;        // Border radius (default: '1rem')
  
  // Visual styling
  backgroundColor?: string;     // Background color (default: 'rgba(255, 255, 255, 0.1)')
  backdropBlur?: string;        // Backdrop blur amount (default: '12px')
  borderColor?: string;         // Border color (default: 'rgba(255, 255, 255, 0.2)')
  
  // Animation
  transitionDuration?: string;  // Transition duration (default: '0.5s')
  slideUpOffset?: string;       // Slide up offset when visible (default: '-1rem')
  
  // Controls
  buttons?: ControlButton[];    // Array of button configurations
}
```

### ControlButton Interface

```typescript
interface ControlButton {
  label?: string;      // Button label/tooltip (displayed when no icon)
  icon?: string;       // SVG icon HTML string (takes precedence over label)
  action: () => void;  // Click handler function
  className?: string;  // Additional CSS class for custom styling
}
```

### CSS Classes

The component injects classes into the parent element for styling hooks:

- `.control-panel-host` - Added to the parent element automatically
- `.control-panel-active` - Added when the panel is visible (on hover)

You can use these classes to style the parent when the panel is active:

```css
.control-panel-host {
  transition: transform 0.3s ease;
}

.control-panel-host.control-panel-active {
  transform: scale(1.02);
}
```

## Styling Examples

### Dark Theme Panel

```javascript
panel.config = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropBlur: '20px',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  width: '95%'
};
```

### Minimal Panel

```javascript
panel.config = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropBlur: '8px',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  padding: '0.75rem',
  borderRadius: '0.5rem'
};
```

### Wide Panel

```javascript
panel.config = {
  width: '98%',
  padding: '1.5rem'
};
```

## Development

### Setup

```bash
git clone https://github.com/kai4avaya/float-controls.git
cd float-controls
npm install
```

### Build

```bash
# Build library version (requires lit as peer dependency)
npm run build

# Build bundled demo version (includes lit)
npm run build:demo
```

### Development Server

```bash
npm run dev
```

Then open `http://localhost:5173/demo.html` in your browser.

### Running the Demo

After building, you can view the demo:

```bash
# Option 1: Use Python HTTP server
python3 -m http.server 8000
# Then open http://localhost:8000/demo.html

# Option 2: Use Vite preview
npm run preview
```

### Testing

```bash
npm test
```

## How It Works

1. **Parent Detection**: The component automatically detects its parent element on mount
2. **Position Injection**: Adds `position: relative` to the parent if not already set
3. **Event Listeners**: Attaches mouse enter/leave listeners to the parent element
4. **Slide Animation**: Smoothly slides up from the bottom when parent is hovered
5. **Styling**: Uses CSS transforms and opacity for smooth animations
6. **Customization**: All styling and controls configurable via the `config` property

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Any browser supporting:
  - Web Components (Custom Elements v1)
  - CSS `backdrop-filter`
  - ES Modules

**Note**: For older browsers, you may need polyfills for Web Components and CSS backdrop-filter.

## License

MIT License - feel free to use in personal and commercial projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Built with [Lit](https://lit.dev/) - a simple library for building fast, lightweight web components.

---

Made with ?? for the web component community
jects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

Built with [Lit](https://lit.dev/) - a simple library for building fast, lightweight web components.

---

Made with ?? for the web component community
