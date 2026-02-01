/**
 * FPS counter display
 */

/**
 * Manages an FPS counter overlay element
 */
export class FPSDisplay {
  private container: HTMLElement;
  private element: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Update the displayed FPS value
   */
  update(fps: number, show: boolean): void {
    if (!show) {
      this.remove();
      return;
    }

    if (!this.element) {
      this.create();
    }

    if (this.element) {
      this.element.textContent = `${fps} FPS`;
    }
  }

  private create(): void {
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.top = '10px';
    this.element.style.left = '10px';
    this.element.style.color = 'rgba(255, 255, 255, 0.7)';
    this.element.style.font = '12px monospace';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '1';
    this.container.appendChild(this.element);
  }

  private remove(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  dispose(): void {
    this.remove();
  }
}
