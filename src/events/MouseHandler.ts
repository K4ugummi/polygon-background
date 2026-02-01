/**
 * Mouse event handling for PolygonBackground
 */

import type { InteractionConfig } from '../types';

export interface MouseHandlerCallbacks {
  onShockwave: (x: number, y: number) => void;
  onGravityWellStart: (x: number, y: number, attract: boolean) => void;
  onGravityWellEnd: () => void;
}

/**
 * Handles mouse events for canvas interaction
 */
export class MouseHandler {
  private container: HTMLElement;
  private callbacks: MouseHandlerCallbacks;
  private interactionConfig: InteractionConfig;

  // Mouse state
  private _mouseX: number = 0;
  private _mouseY: number = 0;
  private _mouseInCanvas: boolean = false;

  // Gravity well state
  private gravityWellActive: boolean = false;
  private holdTimeout: ReturnType<typeof setTimeout> | null = null;

  // Bound handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseEnter: () => void;
  private boundMouseLeave: () => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundClick: (e: MouseEvent) => void;

  constructor(
    container: HTMLElement,
    interactionConfig: InteractionConfig,
    callbacks: MouseHandlerCallbacks
  ) {
    this.container = container;
    this.interactionConfig = interactionConfig;
    this.callbacks = callbacks;

    // Bind handlers
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseEnter = this.handleMouseEnter.bind(this);
    this.boundMouseLeave = this.handleMouseLeave.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundClick = this.handleClick.bind(this);

    this.attach();
  }

  // ========== Getters ==========

  get mouseX(): number {
    return this._mouseX;
  }

  get mouseY(): number {
    return this._mouseY;
  }

  get mouseInCanvas(): boolean {
    return this._mouseInCanvas;
  }

  get isGravityWellActive(): boolean {
    return this.gravityWellActive;
  }

  // ========== Configuration ==========

  updateInteractionConfig(config: InteractionConfig): void {
    this.interactionConfig = config;
  }

  // ========== Event Handlers ==========

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this._mouseX = e.clientX - rect.left;
    this._mouseY = e.clientY - rect.top;

    // Check if mouse is within container bounds
    this._mouseInCanvas =
      this._mouseX >= 0 &&
      this._mouseX <= rect.width &&
      this._mouseY >= 0 &&
      this._mouseY <= rect.height;
  }

  private handleMouseEnter(): void {
    this._mouseInCanvas = true;
  }

  private handleMouseLeave(): void {
    this._mouseInCanvas = false;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.interactionConfig.holdGravityWell) return;
    if (!this._mouseInCanvas) return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start gravity well after short delay (150ms hold)
    this.holdTimeout = setTimeout(() => {
      this.gravityWellActive = true;
      this.callbacks.onGravityWellStart(
        x,
        y,
        this.interactionConfig.gravityWellAttract
      );
    }, 150);
  }

  private handleMouseUp(): void {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }

    if (this.gravityWellActive) {
      this.callbacks.onGravityWellEnd();
      this.gravityWellActive = false;
    }
  }

  private handleClick(e: MouseEvent): void {
    if (!this.interactionConfig.clickShockwave) return;
    if (!this._mouseInCanvas) return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.callbacks.onShockwave(x, y);
  }

  // ========== Lifecycle ==========

  private attach(): void {
    // Listen on window for smooth tracking even when container has z-index: -1
    window.addEventListener('mousemove', this.boundMouseMove);
    this.container.addEventListener('mouseenter', this.boundMouseEnter);
    this.container.addEventListener('mouseleave', this.boundMouseLeave);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('click', this.boundClick);
  }

  dispose(): void {
    window.removeEventListener('mousemove', this.boundMouseMove);
    this.container.removeEventListener('mouseenter', this.boundMouseEnter);
    this.container.removeEventListener('mouseleave', this.boundMouseLeave);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('click', this.boundClick);

    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
  }
}
