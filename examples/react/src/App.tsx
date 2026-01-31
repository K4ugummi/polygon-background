import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/interactive', label: 'Interactive' },
  { path: '/components', label: 'Components' },
];

function App() {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 2rem',
        background: 'rgba(0,0,0,0.8)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}>
        <span style={{ color: '#fff', fontWeight: 'bold', marginRight: '2rem' }}>
          Polygon Background
        </span>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#6366f1' : '#94a3b8',
              fontWeight: location.pathname === item.path ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main style={{ flex: 1, paddingTop: '60px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
