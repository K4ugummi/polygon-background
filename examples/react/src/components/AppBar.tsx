import styles from './AppBar.module.css';

function AppBar() {
  return (
    <header className={styles.appBar}>
      <div className={styles.logo}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,2 30,28 2,28" fill="#6366f1" />
          <polygon points="16,8 24,24 8,24" fill="#818cf8" />
        </svg>
        <span className={styles.title}>Polygon Background</span>
      </div>
      <span className={styles.badge}>React Demo</span>
    </header>
  );
}

export default AppBar;
