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
import {
  getTheme,
  interpolateThemes,
  type ThemeDefinition,
} from './themes';
import { WebGLRenderer } from './webgl/WebGLRenderer';
import type { RenderData } from './webgl/WebGLRenderer';
import { initWasm, WasmSimulation } from './WasmSimulation';

/**
 * Animated polygon background component using Delaunay triangulation
 * with 3D-like lighting and topography
 */
export class PolygonBackground {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private options: ResolvedOptions;
  private animationId: number | null = null;
  private paused: boolean = false;
  private running: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;


  // Mouse tracking
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseInCanvas: boolean = false;
  private boundMouseMoveHandler: (e: MouseEvent) => void;
  private boundMouseEnterHandler: () => void;
  private boundMouseLeaveHandler: () => void;
  private boundMouseDownHandler: (e: MouseEvent) => void;
  private boundMouseUpHandler: (e: MouseEvent) => void;
  private boundClickHandler: (e: MouseEvent) => void;

  // Gravity well state
  private gravityWellActive: boolean = false;
  private holdTimeout: ReturnType<typeof setTimeout> | null = null;

  // Theme transition
  private currentTheme: ThemeDefinition;
  private targetTheme: ThemeDefinition | null = null;
  private transitionStartTime: number = 0;
  private transitionProgress: number = 1;

  // FPS tracking
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  private fpsElement: HTMLDivElement | null = null;

  // Delta time for frame-independent animation
  private lastUpdateTime: number = 0;
  private readonly TARGET_FRAME_TIME: number = 1000 / 60; // 60fps baseline (~16.67ms)

  // WASM simulation
  private wasmSimulation: WasmSimulation | null = null;

  // Cached dimensions to avoid layout thrashing
  private cachedWidth: number = 0;
  private cachedHeight: number = 0;

  // Track if instance has been destroyed
  private destroyed: boolean = false;

  constructor(container: HTMLElement, options?: PolygonBackgroundOptions) {
    this.container = container;

    // Resolve theme first
    // Validate options before processing
    const validatedOptions = options ? validateOptions(options) : undefined;

    const themeName = validatedOptions?.theme || DEFAULT_OPTIONS.theme;
    this.currentTheme = getTheme(themeName);

    // Merge options with theme defaults
    this.options = this.resolveOptions(validatedOptions);

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '0';
    this.canvas.style.pointerEvents = 'none';

    // Create WebGL renderer
    this.renderer = new WebGLRenderer(this.canvas);

    // Ensure container has positioning for absolute canvas
    const containerStyle = window.getComputedStyle(this.container);
    if (containerStyle.position === 'static') {
      this.container.style.position = 'relative';
    }

    // Add canvas to container
    this.container.insertBefore(this.canvas, this.container.firstChild);

    // Set up resize handling
    this.boundResizeHandler = this.handleResize.bind(this);
    if (this.options.responsive) {
      this.setupResizeObserver();
    }

    // Set up mouse handlers
    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
    this.boundMouseEnterHandler = this.handleMouseEnter.bind(this);
    this.boundMouseLeaveHandler = this.handleMouseLeave.bind(this);
    this.boundMouseDownHandler = this.handleMouseDown.bind(this);
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);
    this.setupMouseListeners();

    // Initial setup
    this.updateCanvasSize();

    // Initialize time
    
    // Initialize WASM, then start (unless already destroyed)
    this.initializeWasm().then(() => {
      if (!this.destroyed) {
        this.start();
      }
    });
  }

  /**
   * Initialize WASM simulation
   */
  private async initializeWasm(): Promise<void> {
    const available = await initWasm();
    if (!available) {
      throw new Error('WASM module failed to load. WebAssembly is required.');
    }

    // Wait for container to have valid dimensions
    let rect = this.container.getBoundingClientRect();
    let attempts = 0;
    const maxAttempts = 20; // ~1 second max wait
    while ((rect.width === 0 || rect.height === 0) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (this.destroyed) return;
      rect = this.container.getBoundingClientRect();
      attempts++;
    }

    // Use minimum dimensions if still zero to avoid initialization errors
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    this.wasmSimulation = new WasmSimulation(
      width,
      height,
      this.options.pointCount
    );
    this.wasmSimulation.setNoiseParams(
      this.options.height.noiseScale,
      this.options.height.intensity
    );
    this.updatePhysicsParams();
  }

  /**
   * Update physics parameters in WASM
   */
  private updatePhysicsParams(): void {
    if (!this.wasmSimulation) return;

    this.wasmSimulation.setPhysicsParams(
      this.options.mouse.springBack,
      0.85, // damping constant
      this.options.mouse.velocityInfluence
    );
  }

  /**
   * Resolve options by merging theme, defaults, and user options
   */
  private resolveOptions(options?: PolygonBackgroundOptions): ResolvedOptions {
    const theme = this.currentTheme;

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
        ...theme.lightPosition && { position: theme.lightPosition },
        color: theme.lightColor,
        ...options?.light,
      },
      mouse: {
        ...DEFAULT_MOUSE,
        ...options?.mouse,
      },
      interaction: {
        ...DEFAULT_INTERACTION,
        ...options?.interaction,
      },
      height: {
        ...DEFAULT_HEIGHT,
        ...options?.height,
      },
      transition: {
        ...DEFAULT_TRANSITION,
        ...options?.transition,
      },
      performance: {
        ...DEFAULT_PERFORMANCE,
        ...options?.performance,
      },
    };
  }

  /**
   * Set up mouse event listeners
   */
  private setupMouseListeners(): void {
    // Listen on window for smooth tracking even when container has z-index: -1
    window.addEventListener('mousemove', this.boundMouseMoveHandler);
    this.container.addEventListener('mouseenter', this.boundMouseEnterHandler);
    this.container.addEventListener('mouseleave', this.boundMouseLeaveHandler);
    window.addEventListener('mousedown', this.boundMouseDownHandler);
    window.addEventListener('mouseup', this.boundMouseUpHandler);
    window.addEventListener('click', this.boundClickHandler);
  }

  /**
   * Remove mouse event listeners
   */
  private removeMouseListeners(): void {
    window.removeEventListener('mousemove', this.boundMouseMoveHandler);
    this.container.removeEventListener('mouseenter', this.boundMouseEnterHandler);
    this.container.removeEventListener('mouseleave', this.boundMouseLeaveHandler);
    window.removeEventListener('mousedown', this.boundMouseDownHandler);
    window.removeEventListener('mouseup', this.boundMouseUpHandler);
    window.removeEventListener('click', this.boundClickHandler);
  }

  /**
   * Handle mouse movement
   */
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    // Check if mouse is within container bounds (works even with z-index: -1)
    this.mouseInCanvas =
      this.mouseX >= 0 &&
      this.mouseX <= rect.width &&
      this.mouseY >= 0 &&
      this.mouseY <= rect.height;
  }

  /**
   * Handle mouse entering container
   */
  private handleMouseEnter(): void {
    this.mouseInCanvas = true;
  }

  /**
   * Handle mouse leaving container
   */
  private handleMouseLeave(): void {
    this.mouseInCanvas = false;
  }

  /**
   * Handle mouse down - start gravity well after delay
   */
  private handleMouseDown(e: MouseEvent): void {
    if (!this.options.interaction.holdGravityWell) return;
    if (!this.mouseInCanvas) return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start gravity well after short delay (150ms hold)
    this.holdTimeout = setTimeout(() => {
      this.gravityWellActive = true;
      if (this.wasmSimulation) {
        this.wasmSimulation.setGravityWell(
          x,
          y,
          true,
          this.options.interaction.gravityWellAttract
        );
      }
    }, 150);
  }

  /**
   * Handle mouse up - stop gravity well
   */
  private handleMouseUp(): void {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }

    if (this.gravityWellActive && this.wasmSimulation) {
      this.wasmSimulation.setGravityWell(0, 0, false, false);
      this.gravityWellActive = false;
    }
  }

  /**
   * Handle click - trigger shockwave
   */
  private handleClick(e: MouseEvent): void {
    if (!this.options.interaction.clickShockwave) return;
    if (!this.mouseInCanvas) return;

    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.triggerShockwave(x, y);
  }

  /**
   * Set up ResizeObserver for responsive canvas
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(this.boundResizeHandler);
    this.resizeObserver.observe(this.container);
  }

  /**
   * Handle container resize
   */
  private handleResize(): void {
    this.updateCanvasSize();

    const rect = this.container.getBoundingClientRect();

    // Update WASM simulation size
    if (this.wasmSimulation) {
      this.wasmSimulation.resize(rect.width, rect.height);
    }

    // Optionally adjust point count based on size
    if (this.options.scalePointsWithSize) {
      const targetCount = Math.floor(
        (rect.width * rect.height * this.options.pointsPerPixel) / 100
      );
      this.adjustPointCount(targetCount);
    }
  }

  /**
   * Update canvas size to match container
   */
  private updateCanvasSize(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

    // Cache dimensions for use in render loop
    this.cachedWidth = rect.width;
    this.cachedHeight = rect.height;

    // Only resize if dimensions actually changed
    if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
      return;
    }

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Update WebGL viewport
    this.renderer.resize(newWidth, newHeight);
  }

  /**
   * Adjust the number of points (add or remove)
   */
  private adjustPointCount(targetCount: number): void {
    if (this.wasmSimulation) {
      this.wasmSimulation.setPointCount(targetCount);
    }
  }

  /**
   * Update WASM simulation using combined tick() for fewer boundary crossings
   */
  private updateWasm(deltaTime: number): void {
    if (!this.wasmSimulation) return;

    // Use cached dimensions
    const width = this.cachedWidth;
    const height = this.cachedHeight;

    const {
      enabled: mouseEnabled,
      radius,
      radiusUnit,
      strength,
      mode,
    } = this.options.mouse;

    // Calculate mouse radius in pixels
    const mouseRadius = radiusUnit === 'percent'
      ? Math.min(width, height) * (radius / 100)
      : radius;

    // Convert mode string to number
    const modeNum = mode === 'pull' ? 1 : mode === 'swirl' ? 2 : 0;

    // Update gravity well position if active (separate call needed)
    if (this.gravityWellActive) {
      this.wasmSimulation.updateGravityWellPosition(this.mouseX, this.mouseY);
    }

    // Combined tick: mouse state + physics + triangulation in single WASM call
    this.wasmSimulation.tick(
      deltaTime,
      this.options.speed,
      this.mouseX,
      this.mouseY,
      mouseEnabled && this.mouseInCanvas,
      mouseRadius,
      strength,
      modeNum
    );
  }

  /**
   * Get current effective theme (considering transitions)
   */
  private getEffectiveTheme(): ThemeDefinition {
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
   * Easing function for smooth transitions
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Render the current frame
   */
  private render(): void {
    if (!this.wasmSimulation || this.destroyed) return;

    // Use cached dimensions to avoid layout thrashing
    const width = this.cachedWidth;
    const height = this.cachedHeight;

    if (width === 0 || height === 0) return;

    const theme = this.getEffectiveTheme();

    // Calculate light position
    let lightX: number, lightY: number;
    if (this.options.light.mode === 'mouse' && this.mouseInCanvas) {
      lightX = this.mouseX;
      lightY = this.mouseY;
    } else {
      lightX = this.options.light.position.x * width;
      lightY = this.options.light.position.y * height;
    }

    // Get vertex data from WASM (already triangulated in updateWasm)
    const wasmRenderData: RenderData = {
      triangleVertices: this.wasmSimulation.get_triangle_vertices(),
      strokeVertices: this.wasmSimulation.get_stroke_vertices(),
      pointVertices: this.wasmSimulation.get_point_vertices(),
      triangleCount: this.wasmSimulation.get_triangle_count(),
      strokeVertexCount: this.wasmSimulation.get_stroke_vertex_count(),
      pointCount: this.wasmSimulation.get_point_count(),
      width,
      height,
      lightX,
      lightY,
      theme,
      // Pass user-adjustable options
      strokeWidth: this.options.strokeWidth,
      pointSize: this.options.pointSize,
      fillOpacity: this.options.fillOpacity,
      strokeColor: this.options.strokeColor,
      pointColor: this.options.pointColor,
      backgroundColor: this.options.backgroundColor,
    };

    this.renderer.render(wasmRenderData);
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.running || this.destroyed) return;

    const now = performance.now();

    // Frame rate limiting
    const { targetFPS } = this.options.performance;
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

    // Update theme transition
    if (this.targetTheme && this.transitionProgress < 1) {
      const transitionElapsed = now - this.transitionStartTime;
      this.transitionProgress = Math.min(1, transitionElapsed / this.options.transition.duration);

      // During transition, interpolate options
      const effectiveTheme = this.getEffectiveTheme();
      this.applyThemeToOptions(effectiveTheme);

      if (this.transitionProgress >= 1) {
        this.currentTheme = this.targetTheme;
        this.applyThemeToOptions(this.currentTheme);
        this.targetTheme = null;
      }
    }

    if (!this.paused) {
      // Calculate delta time normalized to 60fps baseline
      // deltaTime = 1.0 at 60fps, 2.0 at 30fps, 0.5 at 120fps, etc.
      const rawDeltaTime = this.lastUpdateTime > 0 ? now - this.lastUpdateTime : this.TARGET_FRAME_TIME;
      const deltaTime = rawDeltaTime / this.TARGET_FRAME_TIME;
      this.lastUpdateTime = now;

      this.updateWasm(deltaTime);
    }

    this.render();

    // Draw FPS counter if enabled
    if (this.options.performance.showFPS) {
      this.renderFPS();
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Render FPS counter using HTML overlay
   */
  private renderFPS(): void {
    if (!this.fpsElement) {
      this.fpsElement = document.createElement('div');
      this.fpsElement.style.position = 'absolute';
      this.fpsElement.style.top = '10px';
      this.fpsElement.style.left = '10px';
      this.fpsElement.style.color = 'rgba(255, 255, 255, 0.7)';
      this.fpsElement.style.font = '12px monospace';
      this.fpsElement.style.pointerEvents = 'none';
      this.fpsElement.style.zIndex = '1';
      this.container.appendChild(this.fpsElement);
    }
    this.fpsElement.textContent = `${this.fps} FPS`;
  }

  /**
   * Remove FPS counter element
   */
  private removeFPSElement(): void {
    if (this.fpsElement && this.fpsElement.parentNode) {
      this.fpsElement.parentNode.removeChild(this.fpsElement);
      this.fpsElement = null;
    }
  }

  /**
   * Start the animation
   */
  start(): void {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.paused = false;
        this.lastUpdateTime = 0; // Reset to avoid delta time jump
    this.animate();
  }

  /**
   * Stop the animation completely
   */
  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause the animation (keeps rendering but stops movement)
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume the animation from pause
   */
  resume(): void {
    this.paused = false;
    this.lastUpdateTime = 0; // Reset to avoid delta time jump after pause
  }

  /**
   * Clean up and remove the component
   */
  destroy(): void {
    this.destroyed = true;
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.removeMouseListeners();
    this.removeFPSElement();

    // Dispose WASM simulation
    if (this.wasmSimulation) {
      this.wasmSimulation.dispose();
      this.wasmSimulation = null;
    }

    // Dispose WebGL resources
    this.renderer.dispose();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  /**
   * Check if animation is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Check if animation is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Set theme by name or custom theme definition
   */
  setTheme(theme: string | ThemeDefinition): void {
    const newTheme = typeof theme === 'string' ? getTheme(theme) : theme;

    if (this.options.transition.enabled) {
      this.targetTheme = newTheme;
      this.transitionStartTime = performance.now();
      this.transitionProgress = 0;
    } else {
      this.currentTheme = newTheme;
      // Update options with new theme values
      this.applyThemeToOptions(newTheme);
    }

    this.options.theme = typeof theme === 'string' ? theme : 'custom';
  }

  /**
   * Apply theme values to options
   */
  private applyThemeToOptions(theme: ThemeDefinition): void {
    this.options.pointSize = theme.pointSize;
    this.options.pointColor = theme.pointColor;
    this.options.fillOpacity = theme.fillOpacity;
    this.options.strokeWidth = theme.strokeWidth;
    this.options.strokeColor = theme.strokeColor;
    this.options.backgroundColor = theme.backgroundColor;
    this.options.light.position = { ...theme.lightPosition };
  }

  /**
   * Update an option at runtime
   */
  setOption<K extends keyof ResolvedOptions>(
    key: K,
    value: ResolvedOptions[K]
  ): void {
    const oldValue = this.options[key];
    this.options[key] = value;

    // Handle special cases
    if (key === 'pointCount' && value !== oldValue) {
      this.adjustPointCount(value as number);
    }

    if (key === 'responsive') {
      if (value && !this.resizeObserver) {
        this.setupResizeObserver();
      } else if (!value && this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    }

    if (key === 'theme') {
      this.setTheme(value as string);
    }
  }

  /**
   * Update light configuration
   */
  setLightConfig(config: Partial<LightConfig>): void {
    this.options.light = { ...this.options.light, ...config };
  }

  /**
   * Update mouse configuration
   */
  setMouseConfig(config: Partial<MouseConfig>): void {
    this.options.mouse = { ...this.options.mouse, ...config };

    // Update physics params if they changed
    if (config.springBack !== undefined || config.velocityInfluence !== undefined) {
      this.updatePhysicsParams();
    }
  }

  /**
   * Update height/topography configuration
   */
  setHeightConfig(config: Partial<HeightConfig>): void {
    this.options.height = { ...this.options.height, ...config };

    // Update WASM simulation
    if (this.wasmSimulation) {
      this.wasmSimulation.setNoiseParams(
        this.options.height.noiseScale,
        this.options.height.intensity
      );
    }
  }

  /**
   * Update interaction configuration
   */
  setInteractionConfig(config: Partial<InteractionConfig>): void {
    this.options.interaction = { ...this.options.interaction, ...config };
  }

  /**
   * Trigger a shockwave at position (defaults to center)
   */
  triggerShockwave(x?: number, y?: number): void {
    if (!this.wasmSimulation) return;

    const posX = x ?? this.cachedWidth / 2;
    const posY = y ?? this.cachedHeight / 2;

    this.wasmSimulation.triggerShockwave(posX, posY);
  }

  /**
   * Start or stop a gravity well at position
   */
  setGravityWell(x: number, y: number, active: boolean, attract?: boolean): void {
    if (!this.wasmSimulation) return;

    this.gravityWellActive = active;
    this.wasmSimulation.setGravityWell(
      x,
      y,
      active,
      attract ?? this.options.interaction.gravityWellAttract
    );
  }

  /**
   * Update transition configuration
   */
  setTransitionConfig(config: Partial<TransitionConfig>): void {
    this.options.transition = { ...this.options.transition, ...config };
  }

  /**
   * Update performance configuration
   */
  setPerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.options.performance = { ...this.options.performance, ...config };
  }

  /**
   * Get the current value of an option
   */
  getOption<K extends keyof ResolvedOptions>(key: K): ResolvedOptions[K] {
    return this.options[key];
  }

  /**
   * Get the current theme
   */
  getTheme(): ThemeDefinition {
    return this.getEffectiveTheme();
  }

  /**
   * Get current FPS (for external display)
   */
  getFPS(): number {
    return this.fps;
  }
}
