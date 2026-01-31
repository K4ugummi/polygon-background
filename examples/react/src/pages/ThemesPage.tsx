import { useRef, useEffect } from 'react';
import { PolygonBackground, THEMES } from 'polygon-background';

const themeNames = Object.keys(THEMES) as Array<keyof typeof THEMES>;

function ThemeCard({ theme }: { theme: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const bg = new PolygonBackground(containerRef.current, {
      theme,
      pointCount: 40,
      speed: 0.5,
      mouse: { enabled: true },
    });
    return () => bg.destroy();
  }, [theme]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '300px',
        borderRadius: '1rem',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        color: '#fff',
        fontSize: '1.25rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}>
        {theme}
      </div>
    </div>
  );
}

export default function ThemesPage() {
  return (
    <div style={{ padding: '2rem', background: '#0f172a', minHeight: 'calc(100vh - 60px)' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '2rem' }}>All Themes</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {themeNames.map(theme => (
          <ThemeCard key={theme} theme={theme} />
        ))}
      </div>
    </div>
  );
}
