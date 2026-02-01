/**
 * Resize handling for PolygonBackground
 */

export interface ResizeHandlerCallbacks {
  onResize: (width: number, height: number) => void;
}

/**
 * Handles container resize events using ResizeObserver
 */
export class ResizeHandler {
  private container: HTMLElement;
  private callbacks: ResizeHandlerCallbacks;
  private resizeObserver: ResizeObserver | null = null;
  private enabled: boolean;

  constructor(
    container: HTMLElement,
    enabled: boolean,
    callbacks: ResizeHandlerCallbacks
  ) {
    this.container = container;
    this.enabled = enabled;
    this.callbacks = callbacks;

    if (enabled) {
      this.attach();
    }
  }

  // ========== Configuration ==========

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;

    this.enabled = enabled;
    if (enabled) {
      this.attach();
    } else {
      this.detach();
    }
  }

  // ========== Lifecycle ==========

  private attach(): void {
    if (this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      const rect = this.container.getBoundingClientRect();
      this.callbacks.onResize(rect.width, rect.height);
    });
    this.resizeObserver.observe(this.container);
  }

  private detach(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  dispose(): void {
    this.detach();
  }
}
