/**
 * WebGL2 Renderer for GPU-accelerated triangle rendering
 */

import type { ThemeDefinition } from '../themes';
import {
  TRIANGLE_VERTEX_SHADER,
  TRIANGLE_FRAGMENT_SHADER,
  STROKE_VERTEX_SHADER,
  STROKE_FRAGMENT_SHADER,
  POINT_VERTEX_SHADER,
  POINT_FRAGMENT_SHADER,
  createProgramFromSource,
} from './shaders';

/**
 * Pre-built vertex data from WASM
 */
export interface RenderData {
  triangleVertices: Float32Array;
  strokeVertices: Float32Array;
  pointVertices: Float32Array;
  triangleCount: number;
  strokeVertexCount: number;
  pointCount: number;
  width: number;
  height: number;
  lightX: number;
  lightY: number;
  theme: ThemeDefinition;
  // User-adjustable options (override theme defaults)
  strokeWidth: number;
  pointSize: number;
  fillOpacity: number;
  strokeColor: string;
  pointColor: string;
  backgroundColor: string;
}

/**
 * Parsed RGB color (0-1 normalized)
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parsed RGBA color (0-1 normalized)
 */
interface RGBA extends RGB {
  a: number;
}

/**
 * WebGL2 renderer for polygon backgrounds
 */
export class WebGLRenderer {
  private gl: WebGL2RenderingContext;

  // Shader programs
  private triangleProgram: WebGLProgram;
  private strokeProgram: WebGLProgram;
  private pointProgram: WebGLProgram;

  // Triangle program locations
  private triangleLocations: {
    a_position: number;
    a_height: number;
    a_centroidY: number;
    a_centroid: number;
    u_resolution: WebGLUniformLocation;
    u_lightPosition: WebGLUniformLocation;
    u_ambientLight: WebGLUniformLocation;
    u_shadowIntensity: WebGLUniformLocation;
    u_highlightIntensity: WebGLUniformLocation;
    u_fillOpacity: WebGLUniformLocation;
    u_gradientStart: WebGLUniformLocation;
    u_gradientEnd: WebGLUniformLocation;
    u_lightColor: WebGLUniformLocation;
    u_shadowColor: WebGLUniformLocation;
  };

  // Stroke program locations
  private strokeLocations: {
    a_position: number;
    u_resolution: WebGLUniformLocation;
    u_strokeColor: WebGLUniformLocation;
  };

  // Point program locations
  private pointLocations: {
    a_position: number;
    u_resolution: WebGLUniformLocation;
    u_pointSize: WebGLUniformLocation;
    u_pointColor: WebGLUniformLocation;
  };

  // VAOs and buffers
  private triangleVAO: WebGLVertexArrayObject;
  private triangleVertexBuffer: WebGLBuffer;

  private strokeVAO: WebGLVertexArrayObject;
  private strokeVertexBuffer: WebGLBuffer;

  private pointVAO: WebGLVertexArrayObject;
  private pointVertexBuffer: WebGLBuffer;

  // Track allocated GPU buffer sizes to avoid reallocation
  private triangleBufferSize: number = 0;
  private strokeBufferSize: number = 0;
  private pointBufferSize: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // Get WebGL2 context
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error('WebGL2 is not supported');
    }

    this.gl = gl;

    // Create shader programs
    this.triangleProgram = createProgramFromSource(
      gl,
      TRIANGLE_VERTEX_SHADER,
      TRIANGLE_FRAGMENT_SHADER
    );

    this.strokeProgram = createProgramFromSource(
      gl,
      STROKE_VERTEX_SHADER,
      STROKE_FRAGMENT_SHADER
    );

    this.pointProgram = createProgramFromSource(
      gl,
      POINT_VERTEX_SHADER,
      POINT_FRAGMENT_SHADER
    );

    // Get locations
    this.triangleLocations = this.getTriangleLocations();
    this.strokeLocations = this.getStrokeLocations();
    this.pointLocations = this.getPointLocations();

    // Create VAOs and buffers
    this.triangleVAO = this.createVAO();
    this.triangleVertexBuffer = this.createBuffer();
    this.setupTriangleVAO();

    this.strokeVAO = this.createVAO();
    this.strokeVertexBuffer = this.createBuffer();
    this.setupStrokeVAO();

    this.pointVAO = this.createVAO();
    this.pointVertexBuffer = this.createBuffer();
    this.setupPointVAO();

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private getTriangleLocations() {
    const gl = this.gl;
    const program = this.triangleProgram;

    return {
      a_position: gl.getAttribLocation(program, 'a_position'),
      a_height: gl.getAttribLocation(program, 'a_height'),
      a_centroidY: gl.getAttribLocation(program, 'a_centroidY'),
      a_centroid: gl.getAttribLocation(program, 'a_centroid'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution')!,
      u_lightPosition: gl.getUniformLocation(program, 'u_lightPosition')!,
      u_ambientLight: gl.getUniformLocation(program, 'u_ambientLight')!,
      u_shadowIntensity: gl.getUniformLocation(program, 'u_shadowIntensity')!,
      u_highlightIntensity: gl.getUniformLocation(program, 'u_highlightIntensity')!,
      u_fillOpacity: gl.getUniformLocation(program, 'u_fillOpacity')!,
      u_gradientStart: gl.getUniformLocation(program, 'u_gradientStart')!,
      u_gradientEnd: gl.getUniformLocation(program, 'u_gradientEnd')!,
      u_lightColor: gl.getUniformLocation(program, 'u_lightColor')!,
      u_shadowColor: gl.getUniformLocation(program, 'u_shadowColor')!,
    };
  }

  private getStrokeLocations() {
    const gl = this.gl;
    const program = this.strokeProgram;

    return {
      a_position: gl.getAttribLocation(program, 'a_position'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution')!,
      u_strokeColor: gl.getUniformLocation(program, 'u_strokeColor')!,
    };
  }

  private getPointLocations() {
    const gl = this.gl;
    const program = this.pointProgram;

    return {
      a_position: gl.getAttribLocation(program, 'a_position'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution')!,
      u_pointSize: gl.getUniformLocation(program, 'u_pointSize')!,
      u_pointColor: gl.getUniformLocation(program, 'u_pointColor')!,
    };
  }

  private createVAO(): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray();
    if (!vao) {
      throw new Error('Failed to create VAO');
    }
    return vao;
  }

  private createBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }
    return buffer;
  }

  private setupTriangleVAO(): void {
    const gl = this.gl;
    const loc = this.triangleLocations;

    gl.bindVertexArray(this.triangleVAO);

    // Vertex buffer: [x, y, z, centroidY, centroidX, centroidY2] per vertex
    // = [position.x, position.y, height, centroidY, centroid.x, centroid.y]
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexBuffer);

    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // a_position (x, y)
    gl.enableVertexAttribArray(loc.a_position);
    gl.vertexAttribPointer(loc.a_position, 2, gl.FLOAT, false, stride, 0);

    // a_height (z)
    gl.enableVertexAttribArray(loc.a_height);
    gl.vertexAttribPointer(
      loc.a_height,
      1,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT
    );

    // a_centroidY
    gl.enableVertexAttribArray(loc.a_centroidY);
    gl.vertexAttribPointer(
      loc.a_centroidY,
      1,
      gl.FLOAT,
      false,
      stride,
      3 * Float32Array.BYTES_PER_ELEMENT
    );

    // a_centroid (x, y)
    gl.enableVertexAttribArray(loc.a_centroid);
    gl.vertexAttribPointer(
      loc.a_centroid,
      2,
      gl.FLOAT,
      false,
      stride,
      4 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.bindVertexArray(null);
  }

  private setupStrokeVAO(): void {
    const gl = this.gl;
    const loc = this.strokeLocations;

    gl.bindVertexArray(this.strokeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.strokeVertexBuffer);

    // a_position (x, y)
    gl.enableVertexAttribArray(loc.a_position);
    gl.vertexAttribPointer(loc.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  private setupPointVAO(): void {
    const gl = this.gl;
    const loc = this.pointLocations;

    gl.bindVertexArray(this.pointVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointVertexBuffer);

    // a_position (x, y)
    gl.enableVertexAttribArray(loc.a_position);
    gl.vertexAttribPointer(loc.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  /**
   * Parse color string to normalized RGB (0-1)
   */
  private parseColor(color: string): RGB {
    // Handle rgba
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
        };
      }
    }

    // Handle hex
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16) / 255,
          g: parseInt(hex[1] + hex[1], 16) / 255,
          b: parseInt(hex[2] + hex[2], 16) / 255,
        };
      }
      if (hex.length >= 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16) / 255,
          g: parseInt(hex.substring(2, 4), 16) / 255,
          b: parseInt(hex.substring(4, 6), 16) / 255,
        };
      }
    }

    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  /**
   * Parse color string to normalized RGBA (0-1)
   */
  private parseColorWithAlpha(color: string): RGBA {
    // Handle rgba
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
          a: parseFloat(match[4]),
        };
      }
    }

    // Handle rgb
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
          a: 1,
        };
      }
    }

    // Handle hex
    const rgb = this.parseColor(color);
    return { ...rgb, a: 1 };
  }

  // Cached theme colors to avoid parsing every frame
  private cachedThemeName: string = '';
  private cachedGradientStart: RGB = { r: 0, g: 0, b: 0 };
  private cachedGradientEnd: RGB = { r: 0, g: 0, b: 0 };
  private cachedLightColor: RGB = { r: 0, g: 0, b: 0 };
  private cachedShadowColor: RGB = { r: 0, g: 0, b: 0 };

  /**
   * Update cached theme colors if theme changed
   */
  private updateCachedColors(theme: ThemeDefinition): void {
    // Simple cache key based on theme name + colors
    const cacheKey = theme.name + theme.gradientStart + theme.gradientEnd;
    if (cacheKey === this.cachedThemeName) return;

    this.cachedThemeName = cacheKey;
    this.cachedGradientStart = this.parseColor(theme.gradientStart);
    this.cachedGradientEnd = this.parseColor(theme.gradientEnd);
    this.cachedLightColor = this.parseColor(theme.lightColor);
    this.cachedShadowColor = this.parseColor(theme.shadowColor);
  }

  /**
   * Render a frame using pre-built WASM vertex data
   */
  render(data: RenderData): void {
    const gl = this.gl;
    const {
      triangleVertices,
      strokeVertices,
      pointVertices,
      triangleCount,
      strokeVertexCount,
      pointCount,
      width,
      height,
      lightX,
      lightY,
      theme,
      strokeWidth,
      pointSize,
      fillOpacity,
      strokeColor,
      pointColor,
      backgroundColor,
    } = data;

    // Update cached colors only if theme changed
    this.updateCachedColors(theme);

    // Parse user-adjustable colors (these may differ from theme)
    const bgColor = this.parseColor(backgroundColor);
    const parsedStrokeColor = this.parseColorWithAlpha(strokeColor);
    const parsedPointColor = this.parseColorWithAlpha(pointColor);

    // Clear with background color
    gl.clearColor(bgColor.r, bgColor.g, bgColor.b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Skip if no triangles
    if (triangleCount < 1) return;

    // 1. Draw filled triangles
    this.renderTriangles(
      triangleVertices,
      triangleCount,
      width,
      height,
      lightX,
      lightY,
      theme,
      fillOpacity,
      this.cachedGradientStart,
      this.cachedGradientEnd,
      this.cachedLightColor,
      this.cachedShadowColor
    );

    // 2. Draw strokes if enabled
    if (strokeWidth > 0 && strokeVertexCount > 0) {
      this.renderStrokes(strokeVertices, strokeVertexCount, width, height, parsedStrokeColor);
    }

    // 3. Draw points if enabled
    if (pointSize > 0 && pointCount > 0) {
      this.renderPoints(pointVertices, pointCount, width, height, parsedPointColor, pointSize);
    }
  }

  private renderTriangles(
    vertexData: Float32Array,
    triangleCount: number,
    width: number,
    height: number,
    lightX: number,
    lightY: number,
    theme: ThemeDefinition,
    fillOpacity: number,
    gradientStart: RGB,
    gradientEnd: RGB,
    lightColor: RGB,
    shadowColor: RGB
  ): void {
    const gl = this.gl;
    const loc = this.triangleLocations;

    gl.useProgram(this.triangleProgram);

    // Upload pre-built vertex data from WASM
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexBuffer);
    const dataSize = vertexData.byteLength;
    if (dataSize > this.triangleBufferSize) {
      // Need to reallocate buffer
      gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
      this.triangleBufferSize = dataSize;
    } else {
      // Reuse existing buffer
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
    }

    // Set uniforms
    gl.uniform2f(loc.u_resolution, width, height);
    gl.uniform2f(loc.u_lightPosition, lightX, lightY);
    gl.uniform1f(loc.u_ambientLight, theme.ambientLight);
    gl.uniform1f(loc.u_shadowIntensity, theme.shadowIntensity);
    gl.uniform1f(loc.u_highlightIntensity, theme.highlightIntensity);
    gl.uniform1f(loc.u_fillOpacity, fillOpacity);
    gl.uniform3f(loc.u_gradientStart, gradientStart.r, gradientStart.g, gradientStart.b);
    gl.uniform3f(loc.u_gradientEnd, gradientEnd.r, gradientEnd.g, gradientEnd.b);
    gl.uniform3f(loc.u_lightColor, lightColor.r, lightColor.g, lightColor.b);
    gl.uniform3f(loc.u_shadowColor, shadowColor.r, shadowColor.g, shadowColor.b);

    // Draw
    gl.bindVertexArray(this.triangleVAO);
    gl.drawArrays(gl.TRIANGLES, 0, triangleCount * 3);
    gl.bindVertexArray(null);
  }

  private renderStrokes(
    vertexData: Float32Array,
    vertexCount: number,
    width: number,
    height: number,
    strokeColor: RGBA
  ): void {
    const gl = this.gl;
    const loc = this.strokeLocations;

    gl.useProgram(this.strokeProgram);

    // Upload pre-built vertex data from WASM
    gl.bindBuffer(gl.ARRAY_BUFFER, this.strokeVertexBuffer);
    const dataSize = vertexData.byteLength;
    if (dataSize > this.strokeBufferSize) {
      gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
      this.strokeBufferSize = dataSize;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
    }

    // Set uniforms
    gl.uniform2f(loc.u_resolution, width, height);
    gl.uniform4f(loc.u_strokeColor, strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a);

    // Note: gl.lineWidth() is not supported on most modern GPUs (only width 1 works)
    // Strokes are shown/hidden based on strokeWidth > 0

    // Draw
    gl.bindVertexArray(this.strokeVAO);
    gl.drawArrays(gl.LINES, 0, vertexCount);
    gl.bindVertexArray(null);
  }

  private renderPoints(
    vertexData: Float32Array,
    pointCount: number,
    width: number,
    height: number,
    pointColor: RGBA,
    pointSize: number
  ): void {
    const gl = this.gl;
    const loc = this.pointLocations;

    gl.useProgram(this.pointProgram);

    // Upload pre-built vertex data from WASM
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointVertexBuffer);
    const dataSize = vertexData.byteLength;
    if (dataSize > this.pointBufferSize) {
      gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
      this.pointBufferSize = dataSize;
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
    }

    // Set uniforms
    gl.uniform2f(loc.u_resolution, width, height);
    gl.uniform1f(loc.u_pointSize, pointSize);
    gl.uniform4f(loc.u_pointColor, pointColor.r, pointColor.g, pointColor.b, pointColor.a);

    // Draw
    gl.bindVertexArray(this.pointVAO);
    gl.drawArrays(gl.POINTS, 0, pointCount);
    gl.bindVertexArray(null);
  }

  /**
   * Resize the renderer viewport
   */
  resize(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    const gl = this.gl;

    // Delete buffers
    gl.deleteBuffer(this.triangleVertexBuffer);
    gl.deleteBuffer(this.strokeVertexBuffer);
    gl.deleteBuffer(this.pointVertexBuffer);

    // Delete VAOs
    gl.deleteVertexArray(this.triangleVAO);
    gl.deleteVertexArray(this.strokeVAO);
    gl.deleteVertexArray(this.pointVAO);

    // Delete programs
    gl.deleteProgram(this.triangleProgram);
    gl.deleteProgram(this.strokeProgram);
    gl.deleteProgram(this.pointProgram);
  }
}
