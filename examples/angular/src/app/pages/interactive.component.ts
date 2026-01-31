import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolygonBackground } from 'polygon-background';

@Component({
  selector: 'app-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div #container class="container">
      <div class="content">
        <h1>Interactive Physics</h1>
        <p>Move your mouse to interact. Click for shockwave. Hold for gravity well.</p>

        <div class="controls">
          <div class="control">
            <label>Mode</label>
            <div class="buttons">
              <button
                *ngFor="let m of modes"
                [class.active]="mode === m"
                (click)="setMode(m)"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <div class="control">
            <label>Strength: {{ strength }}</label>
            <input type="range" min="0" max="150" [(ngModel)]="strength" (ngModelChange)="updateConfig()" />
          </div>
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
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      color: #94a3b8;
      margin-bottom: 2rem;
      max-width: 500px;
    }
    .controls {
      background: rgba(0, 0, 0, 0.6);
      padding: 1.5rem;
      border-radius: 1rem;
      min-width: 300px;
    }
    .control {
      margin-bottom: 1.5rem;
    }
    .control:last-child {
      margin-bottom: 0;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #94a3b8;
    }
    .buttons {
      display: flex;
      gap: 0.5rem;
    }
    button {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #334155;
      background: transparent;
      color: #fff;
      border-radius: 0.5rem;
      cursor: pointer;
      text-transform: capitalize;
    }
    button.active {
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.2);
    }
    input[type="range"] {
      width: 100%;
    }
  `],
})
export class InteractiveComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  modes = ['push', 'pull', 'swirl'];
  mode = 'push';
  strength = 80;
  private bg: PolygonBackground | null = null;

  ngAfterViewInit() {
    this.bg = new PolygonBackground(this.containerRef.nativeElement, {
      theme: 'ocean',
      pointCount: 100,
      mouse: { enabled: true, mode: 'push' as const, strength: 80 },
    });
  }

  ngOnDestroy() {
    this.bg?.destroy();
  }

  setMode(m: string) {
    this.mode = m;
    this.updateConfig();
  }

  updateConfig() {
    this.bg?.setMouseConfig({
      mode: this.mode as 'push' | 'pull' | 'swirl',
      strength: this.strength,
    });
  }
}
