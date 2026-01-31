import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <nav class="nav">
        <span class="logo">Polygon Background</span>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
        <a routerLink="/interactive" routerLinkActive="active">Interactive</a>
        <a routerLink="/components" routerLinkActive="active">Components</a>
      </nav>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .nav {
      display: flex;
      gap: 1rem;
      padding: 1rem 2rem;
      background: rgba(0, 0, 0, 0.8);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }
    .logo {
      color: #fff;
      font-weight: bold;
      margin-right: 2rem;
    }
    .nav a {
      color: #94a3b8;
      text-decoration: none;
    }
    .nav a.active {
      color: #6366f1;
      font-weight: 600;
    }
    .main {
      flex: 1;
      padding-top: 60px;
    }
  `],
})
export class AppComponent {}
