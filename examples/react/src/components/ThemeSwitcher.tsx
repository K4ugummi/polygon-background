import { useState, useRef } from 'react';
import PolygonContainer, { PolygonContainerRef } from './PolygonContainer';
import styles from './ThemeSwitcher.module.css';

const themes = [
  { id: 'midnight', label: 'Midnight', color: '#6366f1' },
  { id: 'ocean', label: 'Ocean', color: '#06b6d4' },
  { id: 'sunset', label: 'Sunset', color: '#f97316' },
  { id: 'matrix', label: 'Matrix', color: '#22c55e' },
  { id: 'monochrome', label: 'Mono', color: '#71717a' },
];

function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState('midnight');
  const containerRef = useRef<PolygonContainerRef>(null);

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
  };

  return (
    <section className={styles.section}>
      <PolygonContainer
        ref={containerRef}
        theme={activeTheme}
        options={{
          pointCount: 80,
          speed: 0.7,
          transition: {
            enabled: true,
            duration: 800,
          },
        }}
        className={styles.background}
      >
        <div className={styles.content}>
          <h2 className={styles.title}>Theme Switcher</h2>
          <p className={styles.description}>
            Click a theme button to smoothly transition between built-in themes.
          </p>
          <div className={styles.buttons}>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`${styles.button} ${activeTheme === theme.id ? styles.active : ''}`}
                style={{ '--theme-color': theme.color } as React.CSSProperties}
              >
                <span className={styles.colorDot} />
                {theme.label}
              </button>
            ))}
          </div>
          <p className={styles.currentTheme}>
            Current: <strong>{activeTheme}</strong>
          </p>
        </div>
      </PolygonContainer>
    </section>
  );
}

export default ThemeSwitcher;
