import { Component } from '@angular/core';
import { LoginCardComponent } from '../components/login-card.component';
import { ToolbarComponent } from '../components/toolbar.component';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [LoginCardComponent, ToolbarComponent, ConfirmDialogComponent],
  template: `
    <div class="page">
      <h1>Component Examples</h1>

      <section>
        <h2>Login Card</h2>
        <app-login-card />
      </section>

      <section>
        <h2>Toolbar with Menu</h2>
        <app-toolbar />
      </section>

      <section>
        <h2>Confirm Dialog</h2>
        <button class="btn-primary" (click)="dialogOpen = true">Open Dialog</button>
      </section>

      <app-confirm-dialog [open]="dialogOpen" (close)="dialogOpen = false" />
    </div>
  `,
  styles: [`
    .page {
      padding: 2rem;
      background: #0f172a;
      min-height: calc(100vh - 60px);
    }

    h1 {
      color: #fff;
      text-align: center;
      margin-bottom: 3rem;
    }

    section {
      max-width: 800px;
      margin: 0 auto 4rem;
    }

    h2 {
      color: #94a3b8;
      margin-bottom: 1rem;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      background: #6366f1;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class ComponentsComponent {
  dialogOpen = false;
}
