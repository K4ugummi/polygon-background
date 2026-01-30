import type {
  Point,
  PolygonBackgroundOptions,
  ResolvedOptions,
  LightConfig,
  MouseConfig,
  HeightConfig,
  TransitionConfig,
  PerformanceConfig,
} from './types';
import {
  DEFAULT_OPTIONS,
  DEFAULT_LIGHT,
  DEFAULT_MOUSE,
  DEFAULT_HEIGHT,
  DEFAULT_TRANSITION,
  DEFAULT_PERFORMANCE,
} from './types';
import { triangulate } from './delaunay';
import { fbm3D, seedNoise } from './noise';
import {
  calculateTriangleLighting,
  applyLighting,
  parseColorToRGB,
  interpolateGradient,
} from './lighting';
import {
  getTheme,
  interpolateThemes,
  type ThemeDefinition,
} from './themes';
import { TWO_PI } from './constants';
import { clamp01, smoothstep } from './utils';

/**
 * Animated polygon background component using Delaunay triangulation
 * with 3D-like lighting and topography
 */
export class PolygonBackground {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: ResolvedOptions;
  private points: Point[] = [];
  private animationId: number | null = null;
  private paused: boolean = false;
  private running: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private boundResizeHandler: () => void;

  // Time tracking for animation
  private startTime: number = 0;
  private currentTime: number = 0;

  // Mouse tracking
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseInCanvas: boolean = false;
  private boundMouseMoveHandler: (e: MouseEvent) => void;
  private boundMouseEnterHandler: () => void;
  private boundMouseLeaveHandler: () => void;

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

  // Delta time for frame-independent animation
  private lastUpdateTime: number = 0;
  private readonly TARGET_FRAME_TIME: number = 1000 / 60; // 60fps baseline (~16.67ms)

  constructor(container: HTMLElement, options?: PolygonBackgroundOptions) {
    this.container = container;

    // Resolve theme first
    const themeName = options?.theme || DEFAULT_OPTIONS.theme;
    this.currentTheme = getTheme(themeName);

    // Merge options with theme defaults
    this.options = this.resolveOptions(options);

    // Seed noise for consistent terrain
    seedNoise(Date.now());

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.pointerEvents = 'none';

    // Get 2D context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = ctx;

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
    this.setupMouseListeners();

    // Initial setup
    this.updateCanvasSize();
    this.initializePoints();

    // Initialize time
    this.startTime = performance.now();

    // Auto-start
    this.start();
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
    // Listen on window for smooth tracking even when pointer-events is none
    window.addEventListener('mousemove', this.boundMouseMoveHandler);
    this.container.addEventListener('mouseenter', this.boundMouseEnterHandler);
    this.container.addEventListener('mouseleave', this.boundMouseLeaveHandler);
  }

  /**
   * Remove mouse event listeners
   */
  private removeMouseListeners(): void {
    window.removeEventListener('mousemove', this.boundMouseMoveHandler);
    this.container.removeEventListener('mouseenter', this.boundMouseEnterHandler);
    this.container.removeEventListener('mouseleave', this.boundMouseLeaveHandler);
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
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    this.updateCanvasSize();

    const newWidth = this.canvas.width;
    const newHeight = this.canvas.height;

    // Scale point positions to new dimensions
    if (oldWidth > 0 && oldHeight > 0) {
      const scaleX = newWidth / oldWidth;
      const scaleY = newHeight / oldHeight;

      for (const point of this.points) {
        point.x *= scaleX;
        point.y *= scaleY;
      }
    }

    // Optionally adjust point count based on size
    if (this.options.scalePointsWithSize) {
      const rect = this.container.getBoundingClientRect();
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

    // Only resize if dimensions actually changed
    if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
      return;
    }

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Reset transform and apply DPR scaling
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Immediately fill with background color to prevent white flash
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  /**
   * Initialize points with random positions and velocities
   */
  private initializePoints(): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.points = [];

    for (let i = 0; i < this.options.pointCount; i++) {
      this.points.push(this.createRandomPoint(width, height));
    }
  }

  /**
   * Create a point with random position and velocity
   */
  private createRandomPoint(width: number, height: number): Point {
    // Base velocity range: -0.5 to 0.5 pixels per frame
    const baseVelocity = 0.5;

    const x = Math.random() * width;
    const y = Math.random() * height;

    // Calculate initial height from noise
    const baseZ = this.calculateBaseHeight(x, y, width, height, 0);

    return {
      x,
      y,
      z: baseZ,
      baseZ,
      vx: (Math.random() - 0.5) * baseVelocity * 2,
      vy: (Math.random() - 0.5) * baseVelocity * 2,
    };
  }

  /**
   * Calculate base height from noise for a position
   */
  private calculateBaseHeight(
    x: number,
    y: number,
    width: number,
    height: number,
    time: number
  ): number {
    const { noiseScale, centerFalloff, animationSpeed } = this.options.height;

    // Sample noise
    let z = fbm3D(
      x * noiseScale,
      y * noiseScale,
      time * animationSpeed,
      4, // octaves
      0.5, // persistence
      2.0 // lacunarity
    );

    // Normalize from [-1, 1] to [0, 1]
    z = (z + 1) / 2;

    // Apply center falloff (higher in center)
    if (centerFalloff > 0) {
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const falloff = 1 - (dist / maxDist) * centerFalloff;
      z *= falloff;
    }

    return z;
  }

  /**
   * Adjust the number of points (add or remove)
   */
  private adjustPointCount(targetCount: number): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    while (this.points.length < targetCount) {
      this.points.push(this.createRandomPoint(width, height));
    }

    while (this.points.length > targetCount) {
      this.points.pop();
    }
  }

  /**
   * Update point positions and heights
   * @param deltaTime - Time elapsed since last update, normalized to 60fps baseline
   */
  private updatePoints(deltaTime: number): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const time = this.currentTime;

    const { mode: heightMode, intensity: heightIntensity } = this.options.height;
    const { enabled: mouseEnabled, radius, radiusUnit, heightInfluence } = this.options.mouse;

    // Calculate mouse radius in pixels
    const mouseRadius = radiusUnit === 'percent'
      ? Math.min(width, height) * (radius / 100)
      : radius;

    for (const point of this.points) {
      // Apply velocity with speed multiplier and delta time for frame-independent movement
      point.x += point.vx * this.options.speed * deltaTime;
      point.y += point.vy * this.options.speed * deltaTime;

      // Wrap around edges
      if (point.x < 0) point.x += width;
      if (point.x > width) point.x -= width;
      if (point.y < 0) point.y += height;
      if (point.y > height) point.y -= height;

      // Update height based on mode
      if (heightMode === 'animate') {
        point.baseZ = this.calculateBaseHeight(point.x, point.y, width, height, time);
      } else if (heightMode === 'static' && point.baseZ === undefined) {
        point.baseZ = this.calculateBaseHeight(point.x, point.y, width, height, 0);
      }

      // Start with base height
      point.z = point.baseZ * heightIntensity;

      // Apply mouse influence
      if (mouseEnabled && this.mouseInCanvas) {
        const dx = point.x - this.mouseX;
        const dy = point.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius) {
          const influence = 1 - dist / mouseRadius;
          // Smooth falloff
          const smoothInfluence = smoothstep(influence);
          point.z += smoothInfluence * heightInfluence;
        }
      }

      // Clamp z to [0, 1]
      point.z = clamp01(point.z);
    }
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
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const theme = this.getEffectiveTheme();

    // Clear canvas with background color (use options for user-adjustable value)
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Skip rendering if no points
    if (this.points.length < 3) return;

    // Perform triangulation with ghost points
    const { triangles, allPoints } = triangulate(
      this.points,
      width,
      height
    );

    // Calculate light position
    let lightX: number, lightY: number;
    if (this.options.light.mode === 'mouse' && this.mouseInCanvas) {
      lightX = this.mouseX;
      lightY = this.mouseY;
    } else {
      // Use options.light.position (updated by sliders) not theme.lightPosition
      lightX = this.options.light.position.x * width;
      lightY = this.options.light.position.y * height;
    }

    // Parse theme colors
    const gradientStart = parseColorToRGB(theme.gradientStart);
    const gradientEnd = parseColorToRGB(theme.gradientEnd);
    const lightColor = parseColorToRGB(theme.lightColor);
    const shadowColor = parseColorToRGB(theme.shadowColor);

    // Draw triangles - use options for user-adjustable values, theme for colors
    this.ctx.lineWidth = this.options.strokeWidth;
    this.ctx.strokeStyle = this.options.strokeColor;

    for (let i = 0; i < triangles.length; i += 3) {
      const i0 = triangles[i];
      const i1 = triangles[i + 1];
      const i2 = triangles[i + 2];

      const p0 = allPoints[i0];
      const p1 = allPoints[i1];
      const p2 = allPoints[i2];

      // Calculate triangle centroid for gradient
      const centroidY = (p0.y + p1.y + p2.y) / 3;
      const gradientT = centroidY / height;

      // Get base color from gradient
      const baseColor = interpolateGradient(gradientStart, gradientEnd, gradientT);

      // Calculate lighting
      const lighting = calculateTriangleLighting(
        p0, p1, p2,
        lightX, lightY,
        theme.ambientLight,
        theme.shadowIntensity,
        theme.highlightIntensity
      );

      // Apply lighting to base color
      const fillColor = applyLighting(
        baseColor,
        lightColor,
        shadowColor,
        lighting,
        this.options.fillOpacity
      );

      // Draw triangle
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.closePath();

      this.ctx.fillStyle = fillColor;
      this.ctx.fill();

      if (this.options.strokeWidth > 0) {
        this.ctx.stroke();
      }
    }

    // Draw points (only real points, not ghosts)
    if (this.options.pointSize > 0) {
      this.ctx.fillStyle = this.options.pointColor;
      for (const point of this.points) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.options.pointSize, 0, TWO_PI);
        this.ctx.fill();
      }
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.running) return;

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

    // Update time
    this.currentTime = now - this.startTime;

    // Update theme transition
    if (this.targetTheme && this.transitionProgress < 1) {
      const transitionElapsed = now - this.transitionStartTime;
      this.transitionProgress = Math.min(1, transitionElapsed / this.options.transition.duration);

      // During transition, interpolate options
      const effectiveTheme = this.getEffectiveTheme();
      this.applyThemeToOptions(effectiveTheme);

      if (this.transitionProgress >= 1) {
        this.currentTheme = this.targetTheme;
        this.targetTheme = null;
      }
    }

    if (!this.paused) {
      // Calculate delta time normalized to 60fps baseline
      // deltaTime = 1.0 at 60fps, 2.0 at 30fps, 0.5 at 120fps, etc.
      const rawDeltaTime = this.lastUpdateTime > 0 ? now - this.lastUpdateTime : this.TARGET_FRAME_TIME;
      const deltaTime = rawDeltaTime / this.TARGET_FRAME_TIME;
      this.lastUpdateTime = now;

      this.updatePoints(deltaTime);
    }

    this.render();

    // Draw FPS counter if enabled
    if (this.options.performance.showFPS) {
      this.renderFPS();
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Render FPS counter
   */
  private renderFPS(): void {
    const text = `${this.fps} FPS`;
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText(text, 10, 20);
  }

  /**
   * Start the animation
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.startTime = performance.now();
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
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.removeMouseListeners();

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
  }

  /**
   * Update height/topography configuration
   */
  setHeightConfig(config: Partial<HeightConfig>): void {
    this.options.height = { ...this.options.height, ...config };
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
