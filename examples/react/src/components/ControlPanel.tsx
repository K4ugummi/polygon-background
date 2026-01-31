import { useState, useRef, useEffect } from 'react';
import PolygonContainer, { PolygonContainerRef } from './PolygonContainer';
import styles from './ControlPanel.module.css';

function ControlPanel() {
  const containerRef = useRef<PolygonContainerRef>(null);
  const [pointCount, setPointCount] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [lightX, setLightX] = useState(0.3);
  const [lightY, setLightY] = useState(0.2);

  useEffect(() => {
    const instance = containerRef.current?.instance;
    if (instance) {
      instance.setOption('pointCount', pointCount);
    }
  }, [pointCount]);

  useEffect(() => {
    const instance = containerRef.current?.instance;
    if (instance) {
      instance.setOption('speed', speed);
    }
  }, [speed]);

  useEffect(() => {
    const instance = containerRef.current?.instance;
    if (instance) {
      instance.setLightConfig({
        position: { x: lightX, y: lightY },
      });
    }
  }, [lightX, lightY]);

  return (
    <section className={styles.section}>
      <PolygonContainer
        ref={containerRef}
        theme="midnight"
        options={{
          pointCount,
          speed,
          light: {
            mode: 'fixed',
            position: { x: lightX, y: lightY },
          },
        }}
        className={styles.background}
      >
        <div className={styles.content}>
          <h2 className={styles.title}>Custom Controls</h2>
          <p className={styles.description}>
            Adjust the sliders to modify the background in real-time.
          </p>

          <div className={styles.controls}>
            <div className={styles.control}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Point Count</label>
                <span className={styles.value}>{pointCount}</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                value={pointCount}
                onChange={(e) => setPointCount(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.control}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Animation Speed</label>
                <span className={styles.value}>{speed.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.control}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Light Position X</label>
                <span className={styles.value}>{lightX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={lightX}
                onChange={(e) => setLightX(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.control}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Light Position Y</label>
                <span className={styles.value}>{lightY.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={lightY}
                onChange={(e) => setLightY(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        </div>
      </PolygonContainer>
    </section>
  );
}

export default ControlPanel;
