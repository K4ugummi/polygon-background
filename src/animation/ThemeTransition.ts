/**
 * Theme transition management
 */

import type { TransitionConfig } from '../types';
import {
  getTheme,
  interpolateThemes,
  type ThemeDefinition,
} from '../themes';

/**
 * Manages smooth transitions between themes
 */
export class ThemeTransition {
  private transitionConfig: TransitionConfig;

  private currentTheme: ThemeDefinition;
  private targetTheme: ThemeDefinition | null = null;
  private transitionStartTime: number = 0;
  private transitionProgress: number = 1;

  constructor(initialTheme: string | ThemeDefinition, transitionConfig: TransitionConfig) {
    this.currentTheme = typeof initialTheme === 'string' ? getTheme(initialTheme) : initialTheme;
    this.transitionConfig = transitionConfig;
  }

  // ========== Getters ==========

  get theme(): ThemeDefinition {
    return this.currentTheme;
  }

  get isTransitioning(): boolean {
    return this.targetTheme !== null && this.transitionProgress < 1;
  }

  // ========== Configuration ==========

  updateTransitionConfig(config: TransitionConfig): void {
    this.transitionConfig = config;
  }

  // ========== Theme Control ==========

  /**
   * Set a new theme (with optional transition)
   */
  setTheme(theme: string | ThemeDefinition): void {
    const newTheme = typeof theme === 'string' ? getTheme(theme) : theme;

    if (this.transitionConfig.enabled) {
      this.targetTheme = newTheme;
      this.transitionStartTime = performance.now();
      this.transitionProgress = 0;
    } else {
      this.currentTheme = newTheme;
      this.targetTheme = null;
      this.transitionProgress = 1;
    }
  }

  /**
   * Get the effective theme (considering transitions)
   */
  getEffectiveTheme(): ThemeDefinition {
    if (this.targetTheme && this.transitionProgress < 1) {
      return interpolateThemes(
        this.currentTheme,
        this.targetTheme,
        this.easeInOutCubic(this.transitionProgress)
      );
    }
    return this.currentTheme;
  }

  /**
   * Update transition progress (call each frame)
   * Returns true if transition is complete
   */
  update(): boolean {
    if (!this.targetTheme || this.transitionProgress >= 1) {
      return false;
    }

    const now = performance.now();
    const elapsed = now - this.transitionStartTime;
    this.transitionProgress = Math.min(1, elapsed / this.transitionConfig.duration);

    if (this.transitionProgress >= 1) {
      this.currentTheme = this.targetTheme;
      this.targetTheme = null;
      return true;
    }

    return false;
  }

  // ========== Helpers ==========

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
