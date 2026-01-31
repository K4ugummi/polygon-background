import { Component, ViewChild } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { PolygonContainerComponent } from '../polygon-container/polygon-container.component';
import { PolygonBackgroundOptions } from 'polygon-background';

interface Theme {
  id: string;
  label: string;
  color: string;
}

@Component({
  selector: 'theme-switcher',
  standalone: true,
  imports: [NgFor, NgClass, PolygonContainerComponent],
  template: `
    <section class="section">
      <polygon-container
        #container
        [theme]="activeTheme"
        [options]="switcherOptions"
        class="background"
      >
        <div class="content">
          <h2 class="title">Theme Switcher</h2>
          <p class="description">
            Click a theme button to smoothly transition between built-in themes.
          </p>
          <div class="buttons">
            <button
              *ngFor="let theme of themes"
              [ngClass]="{ active: activeTheme === theme.id }"
              [style.--theme-color]="theme.color"
              (click)="activeTheme = theme.id"
              class="button"
            >
              <span class="color-dot"></span>
              {{ theme.label }}
            </button>
          </div>
          <p class="current-theme">
            Current: <strong>{{ activeTheme }}</strong>
          </p>
        </div>
      </polygon-container>
    </section>
  `,
  styles: [
    `
      .section {
        min-height: 50vh;
      }

      .background {
        width: 100%;
        min-height: 50vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 2rem;
        max-width: 700px;
      }

      .title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #f8fafc;
      }

      .description {
        font-size: 1.125rem;
        color: #94a3b8;
        margin-bottom: 2rem;
      }

      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
      }

      .button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: rgba(15, 23, 42, 0.8);
        border: 2px solid rgba(99, 102, 241, 0.3);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .button:hover {
        border-color: var(--theme-color);
        background: rgba(15, 23, 42, 0.95);
      }

      .button.active {
        border-color: var(--theme-color);
        box-shadow: 0 0 20px color-mix(in srgb, var(--theme-color) 40%, transparent);
      }

      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--theme-color);
      }

      .current-theme {
        color: #64748b;
        font-size: 0.875rem;
      }

      .current-theme strong {
        color: #a5b4fc;
        text-transform: capitalize;
      }
    `,
  ],
})
export class ThemeSwitcherComponent {
  @ViewChild('container') container!: PolygonContainerComponent;

  activeTheme = 'midnight';

  themes: Theme[] = [
    { id: 'midnight', label: 'Midnight', color: '#6366f1' },
    { id: 'ocean', label: 'Ocean', color: '#06b6d4' },
    { id: 'sunset', label: 'Sunset', color: '#f97316' },
    { id: 'matrix', label: 'Matrix', color: '#22c55e' },
    { id: 'monochrome', label: 'Mono', color: '#71717a' },
  ];

  switcherOptions: Partial<PolygonBackgroundOptions> = {
    pointCount: 80,
    speed: 0.7,
    transition: {
      enabled: true,
      duration: 800,
    },
  };
}
