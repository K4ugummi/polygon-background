import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PolygonContainerComponent } from '../polygon-container/polygon-container.component';
import { PolygonBackgroundOptions } from 'polygon-background';

@Component({
  selector: 'control-panel',
  standalone: true,
  imports: [FormsModule, PolygonContainerComponent],
  template: `
    <section class="section">
      <polygon-container
        #container
        theme="midnight"
        [options]="controlOptions"
        class="background"
      >
        <div class="content">
          <h2 class="title">Custom Controls</h2>
          <p class="description">
            Adjust the sliders to modify the background in real-time.
          </p>

          <div class="controls">
            <div class="control">
              <div class="label-row">
                <label class="label">Point Count</label>
                <span class="value">{{ pointCount }}</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                [(ngModel)]="pointCount"
                (ngModelChange)="updatePointCount($event)"
                class="slider"
              />
            </div>

            <div class="control">
              <div class="label-row">
                <label class="label">Animation Speed</label>
                <span class="value">{{ speed.toFixed(1) }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                [(ngModel)]="speed"
                (ngModelChange)="updateSpeed($event)"
                class="slider"
              />
            </div>

            <div class="control">
              <div class="label-row">
                <label class="label">Light Position X</label>
                <span class="value">{{ lightX.toFixed(2) }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                [(ngModel)]="lightX"
                (ngModelChange)="updateLightPosition()"
                class="slider"
              />
            </div>

            <div class="control">
              <div class="label-row">
                <label class="label">Light Position Y</label>
                <span class="value">{{ lightY.toFixed(2) }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                [(ngModel)]="lightY"
                (ngModelChange)="updateLightPosition()"
                class="slider"
              />
            </div>
          </div>
        </div>
      </polygon-container>
    </section>
  `,
  styles: [
    `
      .section {
        min-height: 70vh;
      }

      .background {
        width: 100%;
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 2rem;
        max-width: 500px;
        width: 100%;
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

      .controls {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 2rem;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 12px;
        backdrop-filter: blur(8px);
      }

      .control {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #e2e8f0;
      }

      .value {
        font-size: 0.875rem;
        color: #a5b4fc;
        font-family: monospace;
        min-width: 3rem;
        text-align: right;
      }

      .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 4px;
        outline: none;
        cursor: pointer;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #6366f1;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #6366f1;
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
    `,
  ],
})
export class ControlPanelComponent implements AfterViewInit {
  @ViewChild('container') container!: PolygonContainerComponent;

  pointCount = 80;
  speed = 1;
  lightX = 0.3;
  lightY = 0.2;

  controlOptions: Partial<PolygonBackgroundOptions> = {
    pointCount: this.pointCount,
    speed: this.speed,
    light: {
      mode: 'fixed',
      position: { x: this.lightX, y: this.lightY },
    },
  };

  ngAfterViewInit(): void {}

  updatePointCount(value: number): void {
    this.container?.instance?.setOption('pointCount', value);
  }

  updateSpeed(value: number): void {
    this.container?.instance?.setOption('speed', value);
  }

  updateLightPosition(): void {
    this.container?.instance?.setLightConfig({
      position: { x: this.lightX, y: this.lightY },
    });
  }
}
