import { Component } from '@angular/core';
import { PolygonContainerComponent } from '../polygon-container/polygon-container.component';
import { PolygonBackgroundOptions } from 'polygon-background';

@Component({
  selector: 'interactive-section',
  standalone: true,
  imports: [PolygonContainerComponent],
  template: `
    <section class="section">
      <polygon-container
        theme="midnight"
        [options]="interactiveOptions"
        class="background"
      >
        <div class="content">
          <div class="badge">Interactive</div>
          <h2 class="title">Mouse Interaction</h2>
          <p class="description">
            Move your mouse over this section to create ripples in the polygon mesh.
            The triangles respond to your cursor position with height deformation.
          </p>
          <div class="hint">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>Hover to interact</span>
          </div>
        </div>
      </polygon-container>
    </section>
  `,
  styles: [
    `
      .section {
        min-height: 60vh;
      }

      .background {
        width: 100%;
        min-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 2rem;
        max-width: 600px;
      }

      .badge {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        background: rgba(99, 102, 241, 0.3);
        border: 1px solid rgba(99, 102, 241, 0.5);
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #a5b4fc;
        margin-bottom: 1rem;
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
        line-height: 1.8;
      }

      .hint {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 9999px;
        color: #a5b4fc;
        font-size: 0.875rem;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class InteractiveSectionComponent {
  interactiveOptions: Partial<PolygonBackgroundOptions> = {
    pointCount: 120,
    speed: 0.6,
    mouse: {
      enabled: true,
      radius: 150,
      radiusUnit: 'px',
      heightInfluence: 0.8,
    },
    height: {
      mode: 'mouse',
      intensity: 0.7,
    },
  };
}
