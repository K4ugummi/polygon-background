import PolygonContainer from './PolygonContainer';
import styles from './HeroSection.module.css';

function HeroSection() {
  return (
    <section className={styles.section}>
      <PolygonContainer
        theme="midnight"
        options={{
          pointCount: 100,
          speed: 0.8,
        }}
        className={styles.background}
      >
        <div className={styles.content}>
          <h1 className={styles.title}>Polygon Background</h1>
          <p className={styles.subtitle}>
            Beautiful, animated polygon backgrounds for your web applications.
            Built with WebGL and WebAssembly for smooth 60fps performance.
          </p>
          <div className={styles.features}>
            <span className={styles.feature}>WebGL Rendering</span>
            <span className={styles.feature}>WASM Acceleration</span>
            <span className={styles.feature}>5 Built-in Themes</span>
            <span className={styles.feature}>Mouse Interaction</span>
          </div>
        </div>
      </PolygonContainer>
    </section>
  );
}

export default HeroSection;
