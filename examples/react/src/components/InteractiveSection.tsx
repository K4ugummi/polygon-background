import PolygonContainer from './PolygonContainer';
import styles from './InteractiveSection.module.css';

function InteractiveSection() {
  return (
    <section className={styles.section}>
      <PolygonContainer
        theme="midnight"
        options={{
          pointCount: 120,
          speed: 0.6,
          mouse: {
            enabled: true,
            radius: 150,
            radiusUnit: 'px',
            heightInfluence: 0.8,
          },
          height: {
            mode: 'mouse',
            intensity: 0.7,
          },
        }}
        className={styles.background}
      >
        <div className={styles.content}>
          <div className={styles.badge}>Interactive</div>
          <h2 className={styles.title}>Mouse Interaction</h2>
          <p className={styles.description}>
            Move your mouse over this section to create ripples in the polygon mesh.
            The triangles respond to your cursor position with height deformation.
          </p>
          <div className={styles.hint}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>Hover to interact</span>
          </div>
        </div>
      </PolygonContainer>
    </section>
  );
}

export default InteractiveSection;
