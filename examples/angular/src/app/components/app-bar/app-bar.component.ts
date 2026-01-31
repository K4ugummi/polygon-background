import { Component } from '@angular/core';

@Component({
  selector: 'app-bar',
  standalone: true,
  template: `
    <header class="app-bar">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,2 30,28 2,28" fill="#6366f1" />
          <polygon points="16,8 24,24 8,24" fill="#818cf8" />
        </svg>
        <span class="title">Polygon Background</span>
      </div>
      <span class="badge">Angular Demo</span>
    </header>
  `,
  styles: [
    `
      .app-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 2rem;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #f8fafc;
      }

      .badge {
        padding: 0.375rem 0.75rem;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        color: white;
      }
    `,
  ],
})
export class AppBarComponent {}
