/**
 * WASM-accelerated simulation wrapper with JS fallback
 */

import type { Simulation } from './wasm-pkg/polygon_background_wasm';

// Dynamic import for WASM module
let wasmModule: typeof import('./wasm-pkg/polygon_background_wasm') | null = null;
let wasmInitPromise: Promise<boolean> | null = null;

/**
 * Initialize WASM module (call once at startup)
 */
export async function initWasm(): Promise<boolean> {
  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    try {
      wasmModule = await import('./wasm-pkg/polygon_background_wasm');
      await wasmModule.default();
      wasmModule.init();
      console.log('WASM simulation module loaded');
      return true;
    } catch (e) {
      console.warn('WASM module failed to load, using JS fallback:', e);
      wasmModule = null;
      return false;
    }
  })();

  return wasmInitPromise;
}

/**
 * Check if WASM is available
 */
export function isWasmAvailable(): boolean {
  return wasmModule !== null;
}

/**
 * Simulation data returned from WASM or JS fallback
 */
export interface SimulationData {
  triangleVertices: Float32Array;
  strokeVertices: Float32Array;
  pointVertices: Float32Array;
  triangleCount: number;
  strokeVertexCount: number;
  pointCount: number;
}

/**
 * WASM-backed simulation class
 */
export class WasmSimulation {
  private simulation: Simulation | null = null;
  private width: number;
  private height: number;

  constructor(width: number, height: number, pointCount: number) {
    this.width = width;
    this.height = height;

    if (wasmModule) {
      this.simulation = wasmModule.create_simulation(
        width,
        height,
        pointCount,
        Date.now() & 0xffffffff
      );
    }
  }

  /**
   * Check if WASM backend is active
   */
  isWasm(): boolean {
    return this.simulation !== null;
  }

  /**
   * Set noise parameters
   */
  setNoiseParams(
    noiseScale: number,
    heightIntensity: number
  ): void {
    if (this.simulation) {
      this.simulation.set_noise_params(
        noiseScale,
        heightIntensity
      );
    }
  }

  /**
   * Set mouse state
   */
  setMouseState(
    x: number,
    y: number,
    inCanvas: boolean,
    radius: number,
    strength: number,
    mode: number // 0=push, 1=pull, 2=swirl
  ): void {
    if (this.simulation) {
      this.simulation.set_mouse_state(
        x,
        y,
        inCanvas,
        radius,
        strength,
        mode
      );
    }
  }

  /**
   * Set physics parameters for spring-back behavior
   */
  setPhysicsParams(springBack: number, damping: number, velocityInfluence: number): void {
    if (this.simulation) {
      this.simulation.set_physics_params(springBack, damping, velocityInfluence);
    }
  }

  /**
   * Trigger a shockwave at position
   */
  triggerShockwave(x: number, y: number, strength: number = 100): void {
    if (this.simulation) {
      this.simulation.trigger_shockwave(x, y, strength);
    }
  }

  /**
   * Set gravity well state
   */
  setGravityWell(x: number, y: number, active: boolean, attract: boolean): void {
    if (this.simulation) {
      this.simulation.set_gravity_well(x, y, active, attract);
    }
  }

  /**
   * Update gravity well position (while active)
   */
  updateGravityWellPosition(x: number, y: number): void {
    if (this.simulation) {
      this.simulation.update_gravity_well_position(x, y);
    }
  }

  /**
   * Resize the simulation
   */
  resize(newWidth: number, newHeight: number): void {
    this.width = newWidth;
    this.height = newHeight;

    if (this.simulation) {
      this.simulation.resize(newWidth, newHeight);
    }
  }

  /**
   * Set point count
   */
  setPointCount(count: number): void {
    if (this.simulation) {
      this.simulation.set_point_count(count, Date.now() & 0xffffffff);
    }
  }

  /**
   * Update point positions
   */
  update_points(deltaTime: number, speed: number): void {
    if (this.simulation) {
      this.simulation.update_points(deltaTime, speed);
    }
  }

  /**
   * Combined tick - update physics + triangulate in single WASM call
   * Reduces JS-WASM boundary crossings for better performance
   */
  tick(
    deltaTime: number,
    speed: number,
    mouseX: number,
    mouseY: number,
    mouseInCanvas: boolean,
    mouseRadius: number,
    mouseStrength: number,
    mouseMode: number
  ): number {
    if (this.simulation) {
      return this.simulation.tick(
        deltaTime,
        speed,
        mouseX,
        mouseY,
        mouseInCanvas,
        mouseRadius,
        mouseStrength,
        mouseMode
      );
    }
    return 0;
  }

  /**
   * Perform triangulation
   */
  triangulate(): number {
    if (this.simulation) {
      return this.simulation.triangulate();
    }
    return 0;
  }

  /**
   * Get triangle vertices
   */
  get_triangle_vertices(): Float32Array {
    if (this.simulation) {
      return this.simulation.get_triangle_vertices();
    }
    return new Float32Array(0);
  }

  /**
   * Get stroke vertices
   */
  get_stroke_vertices(): Float32Array {
    if (this.simulation) {
      return this.simulation.get_stroke_vertices();
    }
    return new Float32Array(0);
  }

  /**
   * Get point vertices
   */
  get_point_vertices(): Float32Array {
    if (this.simulation) {
      return this.simulation.get_point_vertices();
    }
    return new Float32Array(0);
  }

  /**
   * Get triangle count
   */
  get_triangle_count(): number {
    if (this.simulation) {
      return this.simulation.get_triangle_count();
    }
    return 0;
  }

  /**
   * Get stroke vertex count
   */
  get_stroke_vertex_count(): number {
    if (this.simulation) {
      return this.simulation.get_stroke_vertex_count();
    }
    return 0;
  }

  /**
   * Get point count
   */
  get_point_count(): number {
    if (this.simulation) {
      return this.simulation.get_point_count();
    }
    return 0;
  }

  /**
   * Get current dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.simulation) {
      this.simulation.free();
      this.simulation = null;
    }
  }
}
