import { useRef, useEffect, useState } from 'react';
import { PolygonBackground } from 'polygon-background';

const themes = ['midnight', 'ocean', 'sunset', 'matrix', 'monochrome'] as const;

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<PolygonBackground | null>(null);
  const [theme, setTheme] = useState<typeof themes[number]>('midnight');

  useEffect(() => {
    if (!containerRef.current) return;
    bgRef.current = new PolygonBackground(containerRef.current, {
      theme,
      pointCount: 80,
    });
    return () => {
      bgRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    bgRef.current?.setTheme(theme);
  }, [theme]);

  return (
    <div ref={containerRef} style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Polygon Background</h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2rem', maxWidth: '600px' }}>
          Beautiful, animated polygon backgrounds with physics-based mouse interactions.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {themes.map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                padding: '0.5rem 1rem',
                border: theme === t ? '2px solid #6366f1' : '1px solid #334155',
                background: theme === t ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.5)',
                color: '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
