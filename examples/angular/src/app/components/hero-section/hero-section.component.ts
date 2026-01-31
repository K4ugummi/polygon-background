import { Component } from '@angular/core';
import { PolygonContainerComponent } from '../polygon-container/polygon-container.component';

@Component({
  selector: 'hero-section',
  standalone: true,
  imports: [PolygonContainerComponent],
  template: `
    <section class="section">
      <polygon-container
        theme="midnight"
        [options]="{ pointCount: 100, speed: 0.8 }"
        class="background"
      >
        <div class="content">
          <h1 class="title">Polygon Background</h1>
          <p class="subtitle">
            Beautiful, animated polygon backgrounds for your web applications.
            Built with WebGL and WebAssembly for smooth 60fps performance.
          </p>
          <div class="features">
            <span class="feature">WebGL Rendering</span>
            <span class="feature">WASM Acceleration</span>
            <span class="feature">5 Built-in Themes</span>
            <span class="feature">Mouse Interaction</span>
          </div>
        </div>
      </polygon-container>
    </section>
  `,
  styles: [
    `
      .section {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .background {
        width: 100%;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .content {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 2rem;
        max-width: 800px;
      }

      .title {
        font-size: 4rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 60px rgba(99, 102, 241, 0.5);
      }

      .subtitle {
        font-size: 1.25rem;
        color: #94a3b8;
        margin-bottom: 2rem;
        line-height: 1.8;
      }

      .features {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
      }

      .feature {
        padding: 0.5rem 1rem;
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 9999px;
        font-size: 0.875rem;
        color: #a5b4fc;
      }

      @media (max-width: 768px) {
        .title {
          font-size: 2.5rem;
        }

        .subtitle {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class HeroSectionComponent {}
