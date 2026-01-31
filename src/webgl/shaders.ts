/**
 * GLSL shader source code and compilation utilities for WebGL2 rendering
 */

// ============================================================================
// Triangle Shaders - Gouraud shading with per-vertex lighting
// ============================================================================

export const TRIANGLE_VERTEX_SHADER = `#version 300 es
precision highp float;

// Vertex attributes
in vec2 a_position;      // x, y position
in float a_height;       // z height (0-1) - average for triangle
in float a_centroidY;    // centroid Y for gradient calculation
in vec2 a_centroid;      // centroid position for lighting calculation

// Uniforms
uniform vec2 u_resolution;
uniform vec2 u_lightPosition;
uniform float u_ambientLight;
uniform float u_shadowIntensity;
uniform float u_highlightIntensity;
uniform float u_fillOpacity;

// Theme colors (as vec3 RGB normalized 0-1)
uniform vec3 u_gradientStart;
uniform vec3 u_gradientEnd;
uniform vec3 u_lightColor;
uniform vec3 u_shadowColor;

// Output to fragment shader - flat shading (no interpolation)
flat out vec4 v_color;

void main() {
  // Convert to clip space (-1 to 1)
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  // Flip Y for standard OpenGL coordinates
  gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

  // Calculate gradient color based on centroid Y position
  float gradientT = a_centroidY / u_resolution.y;
  vec3 baseColor = mix(u_gradientStart, u_gradientEnd, gradientT);

  // Calculate lighting at centroid (same for all vertices in triangle)
  vec2 toLightXY = u_lightPosition - a_centroid;
  float lightElevation = 300.0;
  vec3 toLight = vec3(toLightXY, lightElevation);
  float lightDist = length(toLight);
  vec3 lightDir = toLight / lightDist;

  // Simple normal calculation - mostly facing up
  vec3 normal = normalize(vec3(0.0, 0.0, 1.0));

  // Diffuse lighting
  float diffuse = max(0.0, dot(normal, lightDir));

  // Distance falloff
  float xyDist = length(toLightXY);
  float falloffStart = 200.0;
  float falloffEnd = 1200.0;
  float distanceFactor = xyDist < falloffStart
    ? 1.0
    : max(0.3, 1.0 - (xyDist - falloffStart) / (falloffEnd - falloffStart) * 0.7);

  // Height bonus - higher triangles catch more light (increased from 0.3 to 0.6)
  float heightBonus = a_height * 0.6;

  // Combine lighting
  float diffuseContribution = (diffuse * 0.6 + 0.4) * u_shadowIntensity * distanceFactor;
  float intensity = clamp(u_ambientLight + diffuseContribution + heightBonus, 0.0, 1.0);

  // Blend between shadow and base color based on intensity
  vec3 litColor = mix(u_shadowColor, baseColor, intensity);

  // Simple specular approximation
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float specular = pow(max(dot(normal, halfDir), 0.0), 24.0);
  float specularContribution = specular * u_highlightIntensity * distanceFactor;

  // Add specular highlight
  if (specularContribution > 0.05) {
    litColor = mix(litColor, u_lightColor, specularContribution * 0.6);
  }

  v_color = vec4(litColor, u_fillOpacity);
}
`;

export const TRIANGLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

flat in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;

// ============================================================================
// Stroke Shaders - Simple solid color lines
// ============================================================================

export const STROKE_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;

uniform vec2 u_resolution;

void main() {
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`;

export const STROKE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 u_strokeColor;
out vec4 fragColor;

void main() {
  fragColor = u_strokeColor;
}
`;

// ============================================================================
// Point Shaders - Point sprites with circular mask
// ============================================================================

export const POINT_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;

uniform vec2 u_resolution;
uniform float u_pointSize;

void main() {
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
  gl_PointSize = u_pointSize * 2.0; // Diameter
}
`;

export const POINT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 u_pointColor;
out vec4 fragColor;

void main() {
  // Create circular point with antialiasing
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Smooth edge for antialiasing
  float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

  if (alpha < 0.01) discard;

  fragColor = vec4(u_pointColor.rgb, u_pointColor.a * alpha);
}
`;

// ============================================================================
// Shader Compilation Utilities
// ============================================================================

/**
 * Compile a shader from source
 */
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }

  return shader;
}

/**
 * Create a program from vertex and fragment shaders
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${info}`);
  }

  return program;
}

/**
 * Create a program from shader source strings
 */
export function createProgramFromSource(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  try {
    return createProgram(gl, vertexShader, fragmentShader);
  } finally {
    // Shaders can be deleted after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }
}
