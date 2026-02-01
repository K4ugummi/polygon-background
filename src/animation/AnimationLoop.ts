/**
 * Animation loop with frame rate control and FPS tracking
 */

import type { PerformanceConfig } from '../types';

export interface AnimationLoopCallbacks {
  /** Called each frame with normalized delta time (1.0 = 60fps) */
  onUpdate: (deltaTime: number) => void;
  /** Called each frame for rendering */
  onRender: () => void;
}

/**
 * Manages the animation loop with optional frame rate limiting
 */
export class AnimationLoop {
  private callbacks: AnimationLoopCallbacks;
  private performanceConfig: PerformanceConfig;

  // Animation state
  private animationId: number | null = null;
  private running: boolean = false;
  private paused: boolean = false;

  // Timing
  private lastFrameTime: number = 0;
  private lastUpdateTime: number = 0;
  private readonly TARGET_FRAME_TIME: number = 1000 / 60; // 60fps baseline (~16.67ms)

  // FPS tracking
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;

  constructor(
    performanceConfig: PerformanceConfig,
    callbacks: AnimationLoopCallbacks
  ) {
    this.performanceConfig = performanceConfig;
    this.callbacks = callbacks;
  }

  // ========== Getters ==========

  get currentFPS(): number {
    return this.fps;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  // ========== Configuration ==========

  updatePerformanceConfig(config: PerformanceConfig): void {
    this.performanceConfig = config;
  }

  // ========== Control ==========

  start(): void {
    if (this.running) return;

    this.running = true;
    this.paused = false;
    this.lastUpdateTime = 0; // Reset to avoid delta time jump
    this.animate();
  }

  stop(): void {
    this.running = false;
    this.paused = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.lastUpdateTime = 0; // Reset to avoid delta time jump after pause
  }

  // ========== Animation Loop ==========

  private animate = (): void => {
    if (!this.running) return;

    const now = performance.now();

    // Frame rate limiting
    const { targetFPS } = this.performanceConfig;
    if (targetFPS > 0) {
      const frameInterval = 1000 / targetFPS;
      const elapsed = now - this.lastFrameTime;

      if (elapsed < frameInterval) {
        this.animationId = requestAnimationFrame(this.animate);
        return;
      }

      // Adjust for drift
      this.lastFrameTime = now - (elapsed % frameInterval);
    } else {
      this.lastFrameTime = now;
    }

    // FPS tracking
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    // Update (if not paused)
    if (!this.paused) {
      // Calculate delta time normalized to 60fps baseline
      // deltaTime = 1.0 at 60fps, 2.0 at 30fps, 0.5 at 120fps, etc.
      const rawDeltaTime =
        this.lastUpdateTime > 0 ? now - this.lastUpdateTime : this.TARGET_FRAME_TIME;
      const deltaTime = rawDeltaTime / this.TARGET_FRAME_TIME;
      this.lastUpdateTime = now;

      this.callbacks.onUpdate(deltaTime);
    }

    // Always render (even when paused, for theme transitions etc.)
    this.callbacks.onRender();

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  };
}
