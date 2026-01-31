import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolygonBackground } from 'polygon-background';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="container">
      <div class="content">
        <h1>Polygon Background</h1>
        <p>Beautiful, animated polygon backgrounds with physics-based mouse interactions.</p>
        <div class="themes">
          <button
            *ngFor="let t of themes"
            [class.active]="theme === t"
            (click)="setTheme(t)"
          >
            {{ t }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      height: calc(100vh - 60px);
      position: relative;
    }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #fff;
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.25rem;
      color: #94a3b8;
      margin-bottom: 2rem;
      max-width: 600px;
    }
    .themes {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #334155;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      border-radius: 0.5rem;
      cursor: pointer;
      text-transform: capitalize;
    }
    button.active {
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.2);
    }
  `],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  themes = ['midnight', 'ocean', 'sunset', 'matrix', 'monochrome'];
  theme = 'midnight';
  private bg: PolygonBackground | null = null;

  ngAfterViewInit() {
    this.bg = new PolygonBackground(this.containerRef.nativeElement, {
      theme: this.theme,
      pointCount: 80,
    });
  }

  ngOnDestroy() {
    this.bg?.destroy();
  }

  setTheme(t: string) {
    this.theme = t;
    this.bg?.setTheme(t);
  }
}
