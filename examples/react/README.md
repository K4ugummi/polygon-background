# React Example

## Setup

```bash
# From the repository root
npm link

# Install and run
cd examples/react
npm install
npm link polygon-background
npm run dev
```

Open http://localhost:3000

## Pages

- **Home** - Theme switching demo
- **Interactive** - Mouse physics (push/pull/swirl modes)
- **Themes** - All themes displayed in a grid

## Usage

```tsx
import { useRef, useEffect } from 'react';
import { PolygonBackground } from 'polygon-background';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bg = new PolygonBackground(containerRef.current, {
      theme: 'midnight',
      pointCount: 80,
    });

    return () => bg.destroy();
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

## Changing Theme

```tsx
const [theme, setTheme] = useState('midnight');
const bgRef = useRef<PolygonBackground | null>(null);

useEffect(() => {
  bgRef.current?.setTheme(theme);
}, [theme]);
```

## Mouse Interaction

```tsx
const bg = new PolygonBackground(container, {
  theme: 'ocean',
  mouse: {
    enabled: true,
    mode: 'push',      // 'push' | 'pull' | 'swirl'
    strength: 80,
  },
  interaction: {
    clickShockwave: true,
    holdGravityWell: true,
  },
});
```
