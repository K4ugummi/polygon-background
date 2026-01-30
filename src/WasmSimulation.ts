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
    animationSpeed: number,
    centerFalloff: number,
    heightIntensity: number
  ): void {
    if (this.simulation) {
      this.simulation.set_noise_params(
        noiseScale,
        animationSpeed,
        centerFalloff,
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
    heightInfluence: number
  ): void {
    if (this.simulation) {
      this.simulation.set_mouse_state(x, y, inCanvas, radius, heightInfluence);
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
  update_points(deltaTime: number, speed: number, time: number, animateHeight: boolean): void {
    if (this.simulation) {
      this.simulation.update_points(deltaTime, speed, time, animateHeight);
    }
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
