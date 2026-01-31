import { Component, ElementRef, ViewChildren, QueryList, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolygonBackground, THEMES } from 'polygon-background';

@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>All Themes</h1>
      <div class="grid">
        <div
          *ngFor="let theme of themeNames"
          #card
          [attr.data-theme]="theme"
          class="card"
        >
          <div class="label">{{ theme }}</div>
        </div>
      </div>
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
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      height: 300px;
      border-radius: 1rem;
      overflow: hidden;
      position: relative;
    }
    .label {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      color: #fff;
      font-size: 1.25rem;
      font-weight: 600;
      text-transform: capitalize;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  `],
})
export class ThemesComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('card') cards!: QueryList<ElementRef<HTMLDivElement>>;

  themeNames = Object.keys(THEMES);
  private instances: PolygonBackground[] = [];

  ngAfterViewInit() {
    this.cards.forEach((card) => {
      const theme = card.nativeElement.getAttribute('data-theme');
      if (theme) {
        const bg = new PolygonBackground(card.nativeElement, {
          theme,
          pointCount: 40,
          speed: 0.5,
          mouse: { enabled: true },
        });
        this.instances.push(bg);
      }
    });
  }

  ngOnDestroy() {
    this.instances.forEach((bg) => bg.destroy());
  }
}
