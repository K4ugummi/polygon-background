import { useRef, useEffect, useState } from 'react';
import { PolygonBackground } from 'polygon-background';

const modes = ['push', 'pull', 'swirl'] as const;

export default function InteractivePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<PolygonBackground | null>(null);
  const [mode, setMode] = useState<typeof modes[number]>('push');
  const [strength, setStrength] = useState(80);

  useEffect(() => {
    if (!containerRef.current) return;
    bgRef.current = new PolygonBackground(containerRef.current, {
      theme: 'ocean',
      pointCount: 100,
      mouse: { enabled: true, mode: 'push', strength: 80 },
    });
    return () => {
      bgRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    bgRef.current?.setMouseConfig({ mode, strength });
  }, [mode, strength]);

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
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Interactive Physics</h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '2rem', maxWidth: '500px' }}>
          Move your mouse to interact. Click for shockwave. Hold for gravity well.
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '1.5rem',
          borderRadius: '1rem',
          minWidth: '300px',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {modes.map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: mode === m ? '2px solid #6366f1' : '1px solid #334155',
                    background: mode === m ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Strength: {strength}
            </label>
            <input
              type="range"
              min="0"
              max="150"
              value={strength}
              onChange={e => setStrength(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
