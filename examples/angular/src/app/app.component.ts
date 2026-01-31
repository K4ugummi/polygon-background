import { Component } from '@angular/core';
import { AppBarComponent } from './components/app-bar/app-bar.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { CardGridComponent } from './components/card-grid/card-grid.component';
import { InteractiveSectionComponent } from './components/interactive-section/interactive-section.component';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AppBarComponent,
    HeroSectionComponent,
    CardGridComponent,
    InteractiveSectionComponent,
    ThemeSwitcherComponent,
    ControlPanelComponent,
  ],
  template: `
    <div class="app">
      <app-bar />
      <main class="main">
        <hero-section />
        <card-grid />
        <interactive-section />
        <theme-switcher />
        <control-panel />
      </main>
    </div>
  `,
  styles: [
    `
      .app {
        min-height: 100vh;
      }

      .main {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
    `,
  ],
})
export class AppComponent {}
