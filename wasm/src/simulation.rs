use wasm_bindgen::prelude::*;
use js_sys::Float32Array;
use delaunator::{triangulate as delaunay_triangulate, Point as DelaunayPoint};

use crate::noise::fbm3d;

/// Random number generator (xorshift32)
struct Rng {
    state: u32,
}

impl Rng {
    fn new(seed: u32) -> Self {
        Self { state: if seed == 0 { 1 } else { seed } }
    }

    #[inline]
    fn next(&mut self) -> u32 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.state = x;
        x
    }

    #[inline]
    fn next_f32(&mut self) -> f32 {
        (self.next() as f32) / (u32::MAX as f32)
    }
}

/// A point with position, velocity, and displacement
#[derive(Clone, Copy)]
struct Point {
    x: f32,
    y: f32,
    z: f32,           // static height for lighting
    base_x: f32,      // rest position X
    base_y: f32,      // rest position Y
    vx: f32,          // floating velocity X
    vy: f32,          // floating velocity Y
    dx: f32,          // displacement velocity X (from interactions)
    dy: f32,          // displacement velocity Y (from interactions)
}

/// Shockwave effect
#[derive(Clone, Copy)]
struct Shockwave {
    x: f32,
    y: f32,
    radius: f32,
    strength: f32,
    speed: f32,
}

/// Gravity well effect
#[derive(Clone, Copy)]
struct GravityWell {
    x: f32,
    y: f32,
    strength: f32,
}

/// Mouse interaction mode
#[derive(Clone, Copy, PartialEq)]
enum MouseMode {
    Push,
    Pull,
    Swirl,
}

/// Ghost point threshold as fraction of canvas dimensions
const GHOST_THRESHOLD: f32 = 0.15;
const MAX_SHOCKWAVES: usize = 10;

/// Physics constants
const DEFAULT_SPRING_BACK: f32 = 0.06;
const DEFAULT_DAMPING: f32 = 0.92;
const DEFAULT_VELOCITY_INFLUENCE: f32 = 0.3;
const SHOCKWAVE_DECAY: f32 = 0.96;
const SHOCKWAVE_WAVE_WIDTH: f32 = 60.0;
const SHOCKWAVE_SPEED: f32 = 12.0;
const GRAVITY_WELL_MIN_DIST: f32 = 20.0;
const GRAVITY_WELL_ATTRACT_STRENGTH: f32 = 3.0;
const GRAVITY_WELL_REPEL_STRENGTH: f32 = -5.0;

/// Minimum squared distance to avoid division issues
const MIN_DIST_SQ: f32 = 1.0;

/// Main simulation state
#[wasm_bindgen]
pub struct Simulation {
    points: Vec<Point>,
    width: f32,
    height: f32,
    rng: Rng,

    // Cached output buffers
    triangle_vertices: Vec<f32>,
    stroke_vertices: Vec<f32>,
    point_vertices: Vec<f32>,

    // Static height parameters (generated once)
    noise_scale: f32,
    height_intensity: f32,

    // Mouse state
    mouse_x: f32,
    mouse_y: f32,
    prev_mouse_x: f32,
    prev_mouse_y: f32,
    mouse_vx: f32,
    mouse_vy: f32,
    mouse_in_canvas: bool,
    mouse_radius: f32,
    mouse_strength: f32,
    mouse_mode: MouseMode,

    // Physics settings
    spring_back: f32,       // 0-1, spring constant
    damping: f32,           // velocity damping
    velocity_influence: f32, // how much mouse speed affects push

    // Effects
    shockwaves: Vec<Shockwave>,
    gravity_well: Option<GravityWell>,
}

#[wasm_bindgen]
impl Simulation {
    /// Create a new simulation
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32, point_count: usize, seed: u32) -> Self {
        let width = Self::validate_dimensions(width);
        let height = Self::validate_dimensions(height);
        let point_count = Self::validate_point_count(point_count);

        let mut rng = Rng::new(seed);
        let base_velocity = 0.5;
        let noise_scale = 0.003;
        let height_intensity = 0.6;

        let mut points = Vec::with_capacity(point_count);
        for _ in 0..point_count {
            let x = rng.next_f32() * width;
            let y = rng.next_f32() * height;
            let vx = (rng.next_f32() - 0.5) * base_velocity * 2.0;
            let vy = (rng.next_f32() - 0.5) * base_velocity * 2.0;

            // Generate static height from noise
            let z = Self::calculate_static_height(x, y, width, height, noise_scale, height_intensity);

            points.push(Point {
                x,
                y,
                z,
                base_x: x,
                base_y: y,
                vx,
                vy,
                dx: 0.0,
                dy: 0.0,
            });
        }

        Self {
            points,
            width,
            height,
            rng,
            triangle_vertices: Vec::new(),
            stroke_vertices: Vec::new(),
            point_vertices: Vec::new(),
            noise_scale,
            height_intensity,
            mouse_x: 0.0,
            mouse_y: 0.0,
            prev_mouse_x: 0.0,
            prev_mouse_y: 0.0,
            mouse_vx: 0.0,
            mouse_vy: 0.0,
            mouse_in_canvas: false,
            mouse_radius: 150.0,
            mouse_strength: 80.0,
            mouse_mode: MouseMode::Push,
            spring_back: DEFAULT_SPRING_BACK,
            damping: DEFAULT_DAMPING,
            velocity_influence: DEFAULT_VELOCITY_INFLUENCE,
            shockwaves: Vec::new(),
            gravity_well: None,
        }
    }

    /// Validate point count
    fn validate_point_count(count: usize) -> usize {
        count.max(3).min(10000)
    }

    /// Validate dimensions
    fn validate_dimensions(value: f32) -> f32 {
        value.max(1.0).min(100000.0)
    }

    /// Calculate static height for a point (called once at creation)
    fn calculate_static_height(x: f32, y: f32, width: f32, height: f32, noise_scale: f32, intensity: f32) -> f32 {
        let cx = width / 2.0;
        let cy = height / 2.0;
        let max_dist = (cx * cx + cy * cy).sqrt();

        // Sample noise
        let mut z = fbm3d(
            x * noise_scale,
            y * noise_scale,
            0.0,  // static z
            4,
            0.5,
            2.0,
        );

        // Normalize from [-1, 1] to [0, 1]
        z = (z + 1.0) / 2.0;

        // Apply center falloff
        let dx = x - cx;
        let dy = y - cy;
        let dist = (dx * dx + dy * dy).sqrt();
        let falloff = 1.0 - (dist / max_dist) * 0.3;
        z *= falloff;

        z * intensity
    }

    /// Set noise parameters and regenerate heights
    #[wasm_bindgen]
    pub fn set_noise_params(
        &mut self,
        noise_scale: f32,
        height_intensity: f32,
    ) {
        self.noise_scale = noise_scale.max(0.0001).min(1.0);
        self.height_intensity = height_intensity.clamp(0.0, 2.0);

        // Regenerate static heights
        for point in &mut self.points {
            point.z = Self::calculate_static_height(
                point.base_x,
                point.base_y,
                self.width,
                self.height,
                self.noise_scale,
                self.height_intensity,
            );
        }
    }

    /// Set mouse state
    #[wasm_bindgen]
    pub fn set_mouse_state(
        &mut self,
        x: f32,
        y: f32,
        in_canvas: bool,
        radius: f32,
        strength: f32,
        mode: u32,
    ) {
        self.prev_mouse_x = self.mouse_x;
        self.prev_mouse_y = self.mouse_y;
        self.mouse_x = x;
        self.mouse_y = y;
        self.mouse_in_canvas = in_canvas;
        self.mouse_radius = radius;
        self.mouse_strength = strength;

        // Update mouse velocity (smoothed)
        if in_canvas {
            let new_vx = x - self.prev_mouse_x;
            let new_vy = y - self.prev_mouse_y;
            self.mouse_vx = new_vx * 0.4 + self.mouse_vx * 0.6;
            self.mouse_vy = new_vy * 0.4 + self.mouse_vy * 0.6;
        } else {
            self.mouse_vx *= 0.9;
            self.mouse_vy *= 0.9;
        }

        self.mouse_mode = match mode {
            1 => MouseMode::Pull,
            2 => MouseMode::Swirl,
            _ => MouseMode::Push,
        };
    }

    /// Set physics parameters
    #[wasm_bindgen]
    pub fn set_physics_params(&mut self, spring_back: f32, damping: f32, velocity_influence: f32) {
        self.spring_back = spring_back;
        self.damping = damping;
        self.velocity_influence = velocity_influence;
    }

    /// Trigger a shockwave at position
    #[wasm_bindgen]
    pub fn trigger_shockwave(&mut self, x: f32, y: f32, strength: f32) {
        if self.shockwaves.len() >= MAX_SHOCKWAVES {
            self.shockwaves.remove(0);
        }
        self.shockwaves.push(Shockwave {
            x,
            y,
            radius: 0.0,
            strength: strength.clamp(0.0, 500.0),
            speed: SHOCKWAVE_SPEED,
        });
    }

    /// Set or clear gravity well
    #[wasm_bindgen]
    pub fn set_gravity_well(&mut self, x: f32, y: f32, active: bool, attract: bool) {
        if active {
            self.gravity_well = Some(GravityWell {
                x,
                y,
                strength: if attract { GRAVITY_WELL_ATTRACT_STRENGTH } else { GRAVITY_WELL_REPEL_STRENGTH },
            });
        } else {
            self.gravity_well = None;
        }
    }

    /// Update gravity well position
    #[wasm_bindgen]
    pub fn update_gravity_well_position(&mut self, x: f32, y: f32) {
        if let Some(ref mut well) = self.gravity_well {
            well.x = x;
            well.y = y;
        }
    }

    /// Resize the simulation
    #[wasm_bindgen]
    pub fn resize(&mut self, new_width: f32, new_height: f32) {
        let new_width = Self::validate_dimensions(new_width);
        let new_height = Self::validate_dimensions(new_height);

        if self.width > 0.0 && self.height > 0.0 {
            let scale_x = new_width / self.width;
            let scale_y = new_height / self.height;

            for point in &mut self.points {
                point.x *= scale_x;
                point.y *= scale_y;
                point.base_x *= scale_x;
                point.base_y *= scale_y;
            }
        }

        self.width = new_width;
        self.height = new_height;
    }

    /// Set point count (add or remove points)
    #[wasm_bindgen]
    pub fn set_point_count(&mut self, count: usize, seed: u32) {
        let count = Self::validate_point_count(count);
        self.rng = Rng::new(seed);
        let base_velocity = 0.5;

        while self.points.len() < count {
            let x = self.rng.next_f32() * self.width;
            let y = self.rng.next_f32() * self.height;
            let vx = (self.rng.next_f32() - 0.5) * base_velocity * 2.0;
            let vy = (self.rng.next_f32() - 0.5) * base_velocity * 2.0;
            let z = Self::calculate_static_height(x, y, self.width, self.height, self.noise_scale, self.height_intensity);

            self.points.push(Point {
                x,
                y,
                z,
                base_x: x,
                base_y: y,
                vx,
                vy,
                dx: 0.0,
                dy: 0.0,
            });
        }

        self.points.truncate(count);
    }

    /// Update point positions
    #[wasm_bindgen]
    pub fn update_points(&mut self, delta_time: f32, speed: f32) {
        let width = self.width;
        let height = self.height;
        let delta_time = delta_time.clamp(0.0, 10.0); // Prevent huge time jumps
        let speed = speed.clamp(0.0, 10.0);

        // Update shockwaves
        self.update_shockwaves();

        for point in &mut self.points {
            // Apply floating velocity to base position
            point.base_x += point.vx * speed * delta_time;
            point.base_y += point.vy * speed * delta_time;

            // Wrap around edges
            if point.base_x < 0.0 { point.base_x += width; }
            if point.base_x > width { point.base_x -= width; }
            if point.base_y < 0.0 { point.base_y += height; }
            if point.base_y > height { point.base_y -= height; }

            // Apply spring physics - pull displacement back to zero
            point.dx += (0.0 - (point.x - point.base_x)) * self.spring_back;
            point.dy += (0.0 - (point.y - point.base_y)) * self.spring_back;

            // Apply damping
            point.dx *= self.damping;
            point.dy *= self.damping;

            // Update position from base + displacement velocity
            point.x = point.base_x + point.dx;
            point.y = point.base_y + point.dy;
        }

        // Apply mouse influence
        self.apply_mouse_influence();

        // Apply gravity well
        self.apply_gravity_well();

        // Apply shockwave forces
        self.apply_shockwave_forces();
    }

    /// Update shockwaves (expand and decay)
    fn update_shockwaves(&mut self) {
        for wave in &mut self.shockwaves {
            wave.radius += wave.speed;
            wave.strength *= SHOCKWAVE_DECAY;
        }
        // Remove dead shockwaves
        self.shockwaves.retain(|w| w.strength > 0.5);
    }

    /// Apply shockwave forces to points
    fn apply_shockwave_forces(&mut self) {
        for wave in &self.shockwaves {
            // Pre-calculate bounds for early exit
            let min_radius = (wave.radius - SHOCKWAVE_WAVE_WIDTH).max(0.0);
            let max_radius = wave.radius + SHOCKWAVE_WAVE_WIDTH;
            let min_radius_sq = min_radius * min_radius;
            let max_radius_sq = max_radius * max_radius;

            for point in &mut self.points {
                let dx = point.x - wave.x;
                let dy = point.y - wave.y;
                let dist_sq = dx * dx + dy * dy;

                // Early exit using squared distance bounds
                if dist_sq < min_radius_sq || dist_sq > max_radius_sq || dist_sq < MIN_DIST_SQ {
                    continue;
                }

                // Only calculate sqrt when we know point is in range
                let dist = dist_sq.sqrt();
                let ring_dist = (dist - wave.radius).abs();

                if ring_dist < SHOCKWAVE_WAVE_WIDTH {
                    let falloff = 1.0 - ring_dist / SHOCKWAVE_WAVE_WIDTH;
                    let push = wave.strength * falloff * 0.15;

                    // Push outward from wave center
                    let inv_dist = 1.0 / dist;
                    let nx = dx * inv_dist;
                    let ny = dy * inv_dist;
                    point.dx += nx * push;
                    point.dy += ny * push;
                }
            }
        }
    }

    /// Apply gravity well force
    fn apply_gravity_well(&mut self) {
        if let Some(well) = &self.gravity_well {
            let min_dist_sq = GRAVITY_WELL_MIN_DIST * GRAVITY_WELL_MIN_DIST;

            for point in &mut self.points {
                let dx = well.x - point.x;
                let dy = well.y - point.y;
                let dist_sq = dx * dx + dy * dy;

                // Use squared distance for minimum check
                let dist = if dist_sq < min_dist_sq {
                    GRAVITY_WELL_MIN_DIST
                } else {
                    dist_sq.sqrt()
                };

                let force = well.strength / (dist * 0.1);
                let inv_dist = 1.0 / dist;
                let nx = dx * inv_dist;
                let ny = dy * inv_dist;

                point.dx += nx * force;
                point.dy += ny * force;
            }
        }
    }

    /// Apply mouse displacement
    fn apply_mouse_influence(&mut self) {
        if !self.mouse_in_canvas {
            return;
        }

        let mx = self.mouse_x;
        let my = self.mouse_y;
        let radius = self.mouse_radius;
        let radius_sq = radius * radius;
        let strength = self.mouse_strength;

        // Velocity boost (use squared distance to avoid sqrt)
        let mouse_speed_sq = self.mouse_vx * self.mouse_vx + self.mouse_vy * self.mouse_vy;
        let mouse_speed = mouse_speed_sq.sqrt();
        let velocity_boost = 1.0 + mouse_speed * self.velocity_influence;

        for point in &mut self.points {
            let dx = point.x - mx;
            let dy = point.y - my;
            let dist_sq = dx * dx + dy * dy;

            // Early exit using squared distance
            if dist_sq >= radius_sq || dist_sq < MIN_DIST_SQ {
                continue;
            }

            // Only calculate sqrt when point is in range
            let dist = dist_sq.sqrt();
            let t = 1.0 - dist / radius;

            // Smoothstep falloff
            let falloff = t * t * (3.0 - 2.0 * t);

            let push = strength * falloff * velocity_boost * 0.08;
            let inv_dist = 1.0 / dist;

            match self.mouse_mode {
                MouseMode::Push => {
                    // Push away from cursor
                    let nx = dx * inv_dist;
                    let ny = dy * inv_dist;
                    point.dx += nx * push;
                    point.dy += ny * push;
                }
                MouseMode::Pull => {
                    // Pull toward cursor
                    let nx = dx * inv_dist;
                    let ny = dy * inv_dist;
                    point.dx -= nx * push * 0.5;
                    point.dy -= ny * push * 0.5;
                }
                MouseMode::Swirl => {
                    // Tangential force (orbit around cursor)
                    let tangent_x = -dy * inv_dist;
                    let tangent_y = dx * inv_dist;
                    point.dx += tangent_x * push * 0.7;
                    point.dy += tangent_y * push * 0.7;
                    // Plus slight outward push
                    let nx = dx * inv_dist;
                    let ny = dy * inv_dist;
                    point.dx += nx * push * 0.2;
                    point.dy += ny * push * 0.2;
                }
            }
        }
    }

    /// Generate ghost points for edge continuity
    fn generate_ghost_points(&self) -> Vec<(f32, f32, f32)> {
        let width = self.width;
        let height = self.height;
        let threshold_x = width * GHOST_THRESHOLD;
        let threshold_y = height * GHOST_THRESHOLD;

        let mut ghosts = Vec::new();

        for point in &self.points {
            let near_left = point.x < threshold_x;
            let near_right = point.x > width - threshold_x;
            let near_top = point.y < threshold_y;
            let near_bottom = point.y > height - threshold_y;

            if near_left {
                ghosts.push((point.x + width, point.y, point.z));
            }
            if near_right {
                ghosts.push((point.x - width, point.y, point.z));
            }
            if near_top {
                ghosts.push((point.x, point.y + height, point.z));
            }
            if near_bottom {
                ghosts.push((point.x, point.y - height, point.z));
            }

            // Corner ghosts
            if near_left && near_top {
                ghosts.push((point.x + width, point.y + height, point.z));
            }
            if near_left && near_bottom {
                ghosts.push((point.x + width, point.y - height, point.z));
            }
            if near_right && near_top {
                ghosts.push((point.x - width, point.y + height, point.z));
            }
            if near_right && near_bottom {
                ghosts.push((point.x - width, point.y - height, point.z));
            }
        }

        ghosts
    }

    /// Perform triangulation and build vertex buffers
    #[wasm_bindgen]
    pub fn triangulate(&mut self) -> usize {
        // Generate ghost points
        let ghosts = self.generate_ghost_points();

        // Add corner points for full coverage
        let margin = 1.0;
        let corners = [
            (-margin, -margin, 0.0f32),
            (self.width + margin, -margin, 0.0),
            (self.width + margin, self.height + margin, 0.0),
            (-margin, self.height + margin, 0.0),
        ];

        // Build combined points array
        let total_points = self.points.len() + ghosts.len() + corners.len();
        let mut all_points: Vec<(f32, f32, f32)> = Vec::with_capacity(total_points);

        for p in &self.points {
            all_points.push((p.x, p.y, p.z));
        }
        for g in &ghosts {
            all_points.push(*g);
        }
        for c in &corners {
            all_points.push(*c);
        }

        // Convert to delaunator format
        let delaunay_points: Vec<DelaunayPoint> = all_points
            .iter()
            .map(|(x, y, _)| DelaunayPoint { x: *x as f64, y: *y as f64 })
            .collect();

        // Triangulate
        let result = delaunay_triangulate(&delaunay_points);
        let triangles = &result.triangles;
        let num_triangles = triangles.len() / 3;

        // Build triangle vertex buffer
        let tri_size = num_triangles * 3 * 6;
        self.triangle_vertices.clear();
        if self.triangle_vertices.capacity() < tri_size {
            self.triangle_vertices.reserve(tri_size - self.triangle_vertices.capacity());
        }

        // Build stroke vertex buffer
        let stroke_size = num_triangles * 3 * 2 * 2;
        self.stroke_vertices.clear();
        if self.stroke_vertices.capacity() < stroke_size {
            self.stroke_vertices.reserve(stroke_size - self.stroke_vertices.capacity());
        }

        for i in (0..triangles.len()).step_by(3) {
            let i0 = triangles[i];
            let i1 = triangles[i + 1];
            let i2 = triangles[i + 2];

            let p0 = all_points[i0];
            let p1 = all_points[i1];
            let p2 = all_points[i2];

            // Calculate centroid
            let centroid_x = (p0.0 + p1.0 + p2.0) / 3.0;
            let centroid_y = (p0.1 + p1.1 + p2.1) / 3.0;
            let avg_height = (p0.2 + p1.2 + p2.2) / 3.0;

            // Vertex 0
            self.triangle_vertices.push(p0.0);
            self.triangle_vertices.push(p0.1);
            self.triangle_vertices.push(avg_height);
            self.triangle_vertices.push(centroid_y);
            self.triangle_vertices.push(centroid_x);
            self.triangle_vertices.push(centroid_y);

            // Vertex 1
            self.triangle_vertices.push(p1.0);
            self.triangle_vertices.push(p1.1);
            self.triangle_vertices.push(avg_height);
            self.triangle_vertices.push(centroid_y);
            self.triangle_vertices.push(centroid_x);
            self.triangle_vertices.push(centroid_y);

            // Vertex 2
            self.triangle_vertices.push(p2.0);
            self.triangle_vertices.push(p2.1);
            self.triangle_vertices.push(avg_height);
            self.triangle_vertices.push(centroid_y);
            self.triangle_vertices.push(centroid_x);
            self.triangle_vertices.push(centroid_y);

            // Stroke edges
            self.stroke_vertices.push(p0.0);
            self.stroke_vertices.push(p0.1);
            self.stroke_vertices.push(p1.0);
            self.stroke_vertices.push(p1.1);

            self.stroke_vertices.push(p1.0);
            self.stroke_vertices.push(p1.1);
            self.stroke_vertices.push(p2.0);
            self.stroke_vertices.push(p2.1);

            self.stroke_vertices.push(p2.0);
            self.stroke_vertices.push(p2.1);
            self.stroke_vertices.push(p0.0);
            self.stroke_vertices.push(p0.1);
        }

        // Build point vertex buffer (only real points)
        let point_size = self.points.len() * 2;
        self.point_vertices.clear();
        if self.point_vertices.capacity() < point_size {
            self.point_vertices.reserve(point_size - self.point_vertices.capacity());
        }

        for p in &self.points {
            self.point_vertices.push(p.x);
            self.point_vertices.push(p.y);
        }

        num_triangles
    }

    /// Get triangle vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_triangle_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.triangle_vertices) }
    }

    /// Get stroke vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_stroke_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.stroke_vertices) }
    }

    /// Get point vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_point_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.point_vertices) }
    }

    /// Get number of triangles
    #[wasm_bindgen]
    pub fn get_triangle_count(&self) -> usize {
        self.triangle_vertices.len() / 18
    }

    /// Get number of stroke line segments
    #[wasm_bindgen]
    pub fn get_stroke_vertex_count(&self) -> usize {
        self.stroke_vertices.len() / 2
    }

    /// Get number of points
    #[wasm_bindgen]
    pub fn get_point_count(&self) -> usize {
        self.points.len()
    }

    /// Combined tick method - reduces JS-WASM boundary crossings
    /// Performs update_points + triangulate in a single call
    #[wasm_bindgen]
    pub fn tick(
        &mut self,
        delta_time: f32,
        speed: f32,
        mouse_x: f32,
        mouse_y: f32,
        mouse_in_canvas: bool,
        mouse_radius: f32,
        mouse_strength: f32,
        mouse_mode: u32,
    ) -> usize {
        // Update mouse state
        self.set_mouse_state(mouse_x, mouse_y, mouse_in_canvas, mouse_radius, mouse_strength, mouse_mode);

        // Update physics
        self.update_points(delta_time, speed);

        // Triangulate and return triangle count
        self.triangulate()
    }

    /// Get all vertex data sizes for buffer pre-allocation
    #[wasm_bindgen]
    pub fn get_buffer_sizes(&self) -> js_sys::Uint32Array {
        let sizes = [
            self.triangle_vertices.len() as u32,
            self.stroke_vertices.len() as u32,
            self.point_vertices.len() as u32,
        ];
        js_sys::Uint32Array::from(&sizes[..])
    }
}
