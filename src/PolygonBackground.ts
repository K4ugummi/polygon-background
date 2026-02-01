/**
 * Animated polygon background component using Delaunay triangulation
 * with 3D-like lighting and topography
 */

import type {
  PolygonBackgroundOptions,
  ResolvedOptions,
  LightConfig,
  MouseConfig,
  InteractionConfig,
  HeightConfig,
  TransitionConfig,
  PerformanceConfig,
} from './types';
import {
  DEFAULT_OPTIONS,
  DEFAULT_LIGHT,
  DEFAULT_MOUSE,
  DEFAULT_INTERACTION,
  DEFAULT_HEIGHT,
  DEFAULT_TRANSITION,
  DEFAULT_PERFORMANCE,
  validateOptions,
} from './types';
import { getTheme, type ThemeDefinition } from './themes';
import { WebGLRenderer, type RenderData } from './webgl/WebGLRenderer';
import { initWasm, WasmSimulation } from './WasmSimulation';
import { MouseHandler } from './events/MouseHandler';
import { ResizeHandler } from './events/ResizeHandler';
import { AnimationLoop } from './animation/AnimationLoop';
import { ThemeTransition } from './animation/ThemeTransition';
import { FPSDisplay } from './animation/FPSDisplay';

export class PolygonBackground {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private options: ResolvedOptions;

  // Handlers
  private mouseHandler: MouseHandler;
  private resizeHandler: ResizeHandler;
  private animationLoop: AnimationLoop;
  private themeTransition: ThemeTransition;
  private fpsDisplay: FPSDisplay;

  // WASM simulation
  private wasmSimulation: WasmSimulation | null = null;

  // Cached dimensions to avoid layout thrashing
  private cachedWidth: number = 0;
  private cachedHeight: number = 0;

  // Track if instance has been destroyed
  private destroyed: boolean = false;

  constructor(container: HTMLElement, options?: PolygonBackgroundOptions) {
    this.container = container;

    // Validate and resolve options
    const validatedOptions = options ? validateOptions(options) : undefined;
    const themeName = validatedOptions?.theme || DEFAULT_OPTIONS.theme;
    const initialTheme = getTheme(themeName);

    this.options = this.resolveOptions(validatedOptions, initialTheme);

    // Create canvas
    this.canvas = this.createCanvas();
    this.setupContainer();
    this.container.insertBefore(this.canvas, this.container.firstChild);

    // Create WebGL renderer
    this.renderer = new WebGLRenderer(this.canvas);

    // Create handlers
    this.mouseHandler = new MouseHandler(
      container,
      this.options.interaction,
      {
        onShockwave: (x, y) => this.triggerShockwave(x, y),
        onGravityWellStart: (x, y, attract) => {
          this.wasmSimulation?.setGravityWell(x, y, true, attract);
        },
        onGravityWellEnd: () => {
          this.wasmSimulation?.setGravityWell(0, 0, false, false);
        },
      }
    );

    this.resizeHandler = new ResizeHandler(
      container,
      this.options.responsive,
      {
        onResize: () => this.handleResize(),
      }
    );

    this.themeTransition = new ThemeTransition(initialTheme, this.options.transition);

    this.fpsDisplay = new FPSDisplay(container);

    this.animationLoop = new AnimationLoop(
      this.options.performance,
      {
        onUpdate: (deltaTime) => this.update(deltaTime),
        onRender: () => this.render(),
      }
    );

    // Initial setup
    this.updateCanvasSize();

    // Initialize WASM, then start
    this.initializeWasm().then(() => {
      if (!this.destroyed) {
        this.start();
      }
    });
  }

  // ========== Initialization ==========

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    return canvas;
  }

  private setupContainer(): void {
    const containerStyle = window.getComputedStyle(this.container);
    if (containerStyle.position === 'static') {
      this.container.style.position = 'relative';
    }
  }

  private async initializeWasm(): Promise<void> {
    const available = await initWasm();
    if (!available) {
      throw new Error('WASM module failed to load. WebAssembly is required.');
    }

    // Wait for container to have valid dimensions
    let rect = this.container.getBoundingClientRect();
    let attempts = 0;
    const maxAttempts = 20;

    while ((rect.width === 0 || rect.height === 0) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (this.destroyed) return;
      rect = this.container.getBoundingClientRect();
      attempts++;
    }

    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    this.wasmSimulation = new WasmSimulation(width, height, this.options.pointCount);
    this.wasmSimulation.setNoiseParams(
      this.options.height.noiseScale,
      this.options.height.intensity
    );
    this.updatePhysicsParams();
  }

  private resolveOptions(
    options: PolygonBackgroundOptions | undefined,
    theme: ThemeDefinition
  ): ResolvedOptions {
    return {
      pointCount: options?.pointCount ?? DEFAULT_OPTIONS.pointCount,
      pointSize: options?.pointSize ?? theme.pointSize,
      pointColor: options?.pointColor ?? theme.pointColor,
      speed: options?.speed ?? DEFAULT_OPTIONS.speed,
      fillOpacity: options?.fillOpacity ?? theme.fillOpacity,
      strokeWidth: options?.strokeWidth ?? theme.strokeWidth,
      strokeColor: options?.strokeColor ?? theme.strokeColor,
      backgroundColor: options?.backgroundColor ?? theme.backgroundColor,
      responsive: options?.responsive ?? DEFAULT_OPTIONS.responsive,
      scalePointsWithSize: options?.scalePointsWithSize ?? DEFAULT_OPTIONS.scalePointsWithSize,
      pointsPerPixel: options?.pointsPerPixel ?? DEFAULT_OPTIONS.pointsPerPixel,
      theme: options?.theme ?? DEFAULT_OPTIONS.theme,
      light: {
        ...DEFAULT_LIGHT,
        ...(theme.lightPosition && { position: theme.lightPosition }),
        color: theme.lightColor,
        ...options?.light,
      },
      mouse: { ...DEFAULT_MOUSE, ...options?.mouse },
      interaction: { ...DEFAULT_INTERACTION, ...options?.interaction },
      height: { ...DEFAULT_HEIGHT, ...options?.height },
      transition: { ...DEFAULT_TRANSITION, ...options?.transition },
      performance: { ...DEFAULT_PERFORMANCE, ...options?.performance },
    };
  }

  // ========== Update & Render ==========

  private update(deltaTime: number): void {
    if (!this.wasmSimulation) return;

    // Update theme transition
    if (this.themeTransition.update()) {
      this.applyThemeToOptions(this.themeTransition.theme);
    }

    // Update gravity well position if active
    if (this.mouseHandler.isGravityWellActive) {
      this.wasmSimulation.updateGravityWellPosition(
        this.mouseHandler.mouseX,
        this.mouseHandler.mouseY
      );
    }

    // Update WASM simulation
    const { enabled, radius, radiusUnit, strength, mode } = this.options.mouse;
    const mouseRadius =
      radiusUnit === 'percent'
        ? Math.min(this.cachedWidth, this.cachedHeight) * (radius / 100)
        : radius;
    const modeNum = mode === 'pull' ? 1 : mode === 'swirl' ? 2 : 0;

    this.wasmSimulation.tick(
      deltaTime,
      this.options.speed,
      this.mouseHandler.mouseX,
      this.mouseHandler.mouseY,
      enabled && this.mouseHandler.mouseInCanvas,
      mouseRadius,
      strength,
      modeNum
    );
  }

  private render(): void {
    if (!this.wasmSimulation || this.destroyed) return;
    if (this.cachedWidth === 0 || this.cachedHeight === 0) return;

    const theme = this.themeTransition.getEffectiveTheme();

    // Calculate light position
    let lightX: number, lightY: number;
    if (this.options.light.mode === 'mouse' && this.mouseHandler.mouseInCanvas) {
      lightX = this.mouseHandler.mouseX;
      lightY = this.mouseHandler.mouseY;
    } else {
      lightX = this.options.light.position.x * this.cachedWidth;
      lightY = this.options.light.position.y * this.cachedHeight;
    }

    const renderData: RenderData = {
      triangleVertices: this.wasmSimulation.get_triangle_vertices(),
      strokeVertices: this.wasmSimulation.get_stroke_vertices(),
      pointVertices: this.wasmSimulation.get_point_vertices(),
      triangleCount: this.wasmSimulation.get_triangle_count(),
      strokeVertexCount: this.wasmSimulation.get_stroke_vertex_count(),
      pointCount: this.wasmSimulation.get_point_count(),
      width: this.cachedWidth,
      height: this.cachedHeight,
      lightX,
      lightY,
      theme,
      strokeWidth: this.options.strokeWidth,
      pointSize: this.options.pointSize,
      fillOpacity: this.options.fillOpacity,
      strokeColor: this.options.strokeColor,
      pointColor: this.options.pointColor,
      backgroundColor: this.options.backgroundColor,
    };

    this.renderer.render(renderData);

    // Update FPS display
    this.fpsDisplay.update(
      this.animationLoop.currentFPS,
      this.options.performance.showFPS
    );
  }

  // ========== Resize Handling ==========

  private handleResize(): void {
    this.updateCanvasSize();

    if (this.wasmSimulation) {
      const rect = this.container.getBoundingClientRect();
      this.wasmSimulation.resize(rect.width, rect.height);
    }

    if (this.options.scalePointsWithSize) {
      const rect = this.container.getBoundingClientRect();
      const targetCount = Math.floor(
        (rect.width * rect.height * this.options.pointsPerPixel) / 100
      );
      this.wasmSimulation?.setPointCount(targetCount);
    }
  }

  private updateCanvasSize(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

    this.cachedWidth = rect.width;
    this.cachedHeight = rect.height;

    if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
      return;
    }

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.renderer.resize(newWidth, newHeight);
  }

  // ========== Physics ==========

  private updatePhysicsParams(): void {
    this.wasmSimulation?.setPhysicsParams(
      this.options.mouse.springBack,
      0.85,
      this.options.mouse.velocityInfluence
    );
  }

  private applyThemeToOptions(theme: ThemeDefinition): void {
    this.options.pointSize = theme.pointSize;
    this.options.pointColor = theme.pointColor;
    this.options.fillOpacity = theme.fillOpacity;
    this.options.strokeWidth = theme.strokeWidth;
    this.options.strokeColor = theme.strokeColor;
    this.options.backgroundColor = theme.backgroundColor;
    this.options.light.position = { ...theme.lightPosition };
  }

  // ========== Public API: Animation Control ==========

  start(): void {
    if (this.destroyed) return;
    this.animationLoop.start();
  }

  stop(): void {
    this.animationLoop.stop();
  }

  pause(): void {
    this.animationLoop.pause();
  }

  resume(): void {
    this.animationLoop.resume();
  }

  destroy(): void {
    this.destroyed = true;
    this.animationLoop.stop();
    this.mouseHandler.dispose();
    this.resizeHandler.dispose();
    this.fpsDisplay.dispose();

    if (this.wasmSimulation) {
      this.wasmSimulation.dispose();
      this.wasmSimulation = null;
    }

    this.renderer.dispose();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  // ========== Public API: State Queries ==========

  isPaused(): boolean {
    return this.animationLoop.isPaused;
  }

  isRunning(): boolean {
    return this.animationLoop.isRunning;
  }

  getFPS(): number {
    return this.animationLoop.currentFPS;
  }

  getTheme(): ThemeDefinition {
    return this.themeTransition.getEffectiveTheme();
  }

  getOption<K extends keyof ResolvedOptions>(key: K): ResolvedOptions[K] {
    return this.options[key];
  }

  // ========== Public API: Configuration ==========

  setTheme(theme: string | ThemeDefinition): void {
    this.themeTransition.setTheme(theme);
    this.options.theme = typeof theme === 'string' ? theme : 'custom';
  }

  setOption<K extends keyof ResolvedOptions>(key: K, value: ResolvedOptions[K]): void {
    const oldValue = this.options[key];
    this.options[key] = value;

    if (key === 'pointCount' && value !== oldValue) {
      this.wasmSimulation?.setPointCount(value as number);
    }

    if (key === 'responsive') {
      this.resizeHandler.setEnabled(value as boolean);
    }

    if (key === 'theme') {
      this.setTheme(value as string);
    }
  }

  setLightConfig(config: Partial<LightConfig>): void {
    this.options.light = { ...this.options.light, ...config };
  }

  setMouseConfig(config: Partial<MouseConfig>): void {
    this.options.mouse = { ...this.options.mouse, ...config };

    if (config.springBack !== undefined || config.velocityInfluence !== undefined) {
      this.updatePhysicsParams();
    }
  }

  setHeightConfig(config: Partial<HeightConfig>): void {
    this.options.height = { ...this.options.height, ...config };

    this.wasmSimulation?.setNoiseParams(
      this.options.height.noiseScale,
      this.options.height.intensity
    );
  }

  setInteractionConfig(config: Partial<InteractionConfig>): void {
    this.options.interaction = { ...this.options.interaction, ...config };
    this.mouseHandler.updateInteractionConfig(this.options.interaction);
  }

  setTransitionConfig(config: Partial<TransitionConfig>): void {
    this.options.transition = { ...this.options.transition, ...config };
    this.themeTransition.updateTransitionConfig(this.options.transition);
  }

  setPerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.options.performance = { ...this.options.performance, ...config };
    this.animationLoop.updatePerformanceConfig(this.options.performance);
  }

  // ========== Public API: Effects ==========

  triggerShockwave(x?: number, y?: number): void {
    if (!this.wasmSimulation) return;

    const posX = x ?? this.cachedWidth / 2;
    const posY = y ?? this.cachedHeight / 2;
    this.wasmSimulation.triggerShockwave(posX, posY);
  }

  setGravityWell(x: number, y: number, active: boolean, attract?: boolean): void {
    if (!this.wasmSimulation) return;

    this.wasmSimulation.setGravityWell(
      x,
      y,
      active,
      attract ?? this.options.interaction.gravityWellAttract
    );
  }
}
