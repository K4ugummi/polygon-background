import { useState } from 'react';
import { LoginCard } from '../components/LoginCard';
import { Toolbar } from '../components/Toolbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import '../components/components.css';

export default function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="components-page">
      <h1>Component Examples</h1>

      <section>
        <h2>Login Card</h2>
        <LoginCard />
      </section>

      <section>
        <h2>Toolbar with Menu</h2>
        <Toolbar />
      </section>

      <section>
        <h2>Confirm Dialog</h2>
        <button className="btn-primary btn-inline" onClick={() => setDialogOpen(true)}>
          Open Dialog
        </button>
        <ConfirmDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </section>
    </div>
  );
}
