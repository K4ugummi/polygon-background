import AppBar from './components/AppBar';
import HeroSection from './components/HeroSection';
import CardGrid from './components/CardGrid';
import InteractiveSection from './components/InteractiveSection';
import ThemeSwitcher from './components/ThemeSwitcher';
import ControlPanel from './components/ControlPanel';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <AppBar />
      <main className={styles.main}>
        <HeroSection />
        <CardGrid />
        <InteractiveSection />
        <ThemeSwitcher />
        <ControlPanel />
      </main>
    </div>
  );
}

export default App;
