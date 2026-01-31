import { useRef, useEffect, useState } from 'react';
import { PolygonBackground } from 'polygon-background';

export function Toolbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<PolygonBackground | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || bgRef.current) return;

    bgRef.current = new PolygonBackground(containerRef.current, {
      theme: 'ocean',
      pointCount: 25,
      speed: 0.2,
    });

    return () => {
      bgRef.current?.destroy();
      bgRef.current = null;
    };
  }, []);

  const menuItems = ['Dashboard', 'Settings', 'Profile', 'Logout'];

  return (
    <div ref={containerRef} className="toolbar">
      <div className="toolbar-content">
        <div className="toolbar-left">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h4>My Application</h4>
        </div>
        <div className="toolbar-right">
          <button className="icon-btn">🔔</button>
          <button className="icon-btn">👤</button>
        </div>
      </div>
      {menuOpen && (
        <div className="menu">
          {menuItems.map((item) => (
            <button key={item} className="menu-item">{item}</button>
          ))}
        </div>
      )}
    </div>
  );
}
