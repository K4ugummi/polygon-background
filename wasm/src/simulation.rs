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

/// A point with position, velocity, and height
#[derive(Clone, Copy)]
struct Point {
    x: f32,
    y: f32,
    z: f32,
    base_z: f32,
    vx: f32,
    vy: f32,
}

/// Ghost point threshold as fraction of canvas dimensions
const GHOST_THRESHOLD: f32 = 0.15;

/// Main simulation state
#[wasm_bindgen]
pub struct Simulation {
    points: Vec<Point>,
    width: f32,
    height: f32,

    // Cached output buffers
    triangle_vertices: Vec<f32>,
    stroke_vertices: Vec<f32>,
    point_vertices: Vec<f32>,

    // Noise parameters
    noise_scale: f32,
    animation_speed: f32,
    center_falloff: f32,
    height_intensity: f32,

    // Mouse state
    mouse_x: f32,
    mouse_y: f32,
    mouse_in_canvas: bool,
    mouse_radius: f32,
    mouse_height_influence: f32,
}

#[wasm_bindgen]
impl Simulation {
    /// Create a new simulation
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32, point_count: usize, seed: u32) -> Self {
        let mut rng = Rng::new(seed);
        let base_velocity = 0.5;

        let mut points = Vec::with_capacity(point_count);
        for _ in 0..point_count {
            let x = rng.next_f32() * width;
            let y = rng.next_f32() * height;
            let vx = (rng.next_f32() - 0.5) * base_velocity * 2.0;
            let vy = (rng.next_f32() - 0.5) * base_velocity * 2.0;

            points.push(Point {
                x,
                y,
                z: 0.0,
                base_z: 0.0,
                vx,
                vy,
            });
        }

        let mut sim = Self {
            points,
            width,
            height,
            triangle_vertices: Vec::new(),
            stroke_vertices: Vec::new(),
            point_vertices: Vec::new(),
            noise_scale: 0.003,
            animation_speed: 0.00002,
            center_falloff: 0.3,
            height_intensity: 0.6,
            mouse_x: 0.0,
            mouse_y: 0.0,
            mouse_in_canvas: false,
            mouse_radius: 150.0,
            mouse_height_influence: 0.5,
        };

        // Initialize heights
        sim.update_heights(0.0);

        sim
    }

    /// Set noise parameters
    #[wasm_bindgen]
    pub fn set_noise_params(
        &mut self,
        noise_scale: f32,
        animation_speed: f32,
        center_falloff: f32,
        height_intensity: f32,
    ) {
        self.noise_scale = noise_scale;
        self.animation_speed = animation_speed;
        self.center_falloff = center_falloff;
        self.height_intensity = height_intensity;
    }

    /// Set mouse state
    #[wasm_bindgen]
    pub fn set_mouse_state(
        &mut self,
        x: f32,
        y: f32,
        in_canvas: bool,
        radius: f32,
        height_influence: f32,
    ) {
        self.mouse_x = x;
        self.mouse_y = y;
        self.mouse_in_canvas = in_canvas;
        self.mouse_radius = radius;
        self.mouse_height_influence = height_influence;
    }

    /// Resize the simulation
    #[wasm_bindgen]
    pub fn resize(&mut self, new_width: f32, new_height: f32) {
        if self.width > 0.0 && self.height > 0.0 {
            let scale_x = new_width / self.width;
            let scale_y = new_height / self.height;

            for point in &mut self.points {
                point.x *= scale_x;
                point.y *= scale_y;
            }
        }

        self.width = new_width;
        self.height = new_height;
    }

    /// Set point count (add or remove points)
    #[wasm_bindgen]
    pub fn set_point_count(&mut self, count: usize, seed: u32) {
        let mut rng = Rng::new(seed);
        let base_velocity = 0.5;

        while self.points.len() < count {
            let x = rng.next_f32() * self.width;
            let y = rng.next_f32() * self.height;
            let vx = (rng.next_f32() - 0.5) * base_velocity * 2.0;
            let vy = (rng.next_f32() - 0.5) * base_velocity * 2.0;

            self.points.push(Point {
                x,
                y,
                z: 0.0,
                base_z: 0.0,
                vx,
                vy,
            });
        }

        self.points.truncate(count);
    }

    /// Update point positions
    #[wasm_bindgen]
    pub fn update_points(&mut self, delta_time: f32, speed: f32, time: f32, animate_height: bool) {
        let width = self.width;
        let height = self.height;

        for point in &mut self.points {
            // Apply velocity
            point.x += point.vx * speed * delta_time;
            point.y += point.vy * speed * delta_time;

            // Wrap around edges
            if point.x < 0.0 { point.x += width; }
            if point.x > width { point.x -= width; }
            if point.y < 0.0 { point.y += height; }
            if point.y > height { point.y -= height; }
        }

        // Update heights
        if animate_height {
            self.update_heights(time);
        }

        // Apply mouse influence
        self.apply_mouse_influence();
    }

    /// Calculate heights from noise
    fn update_heights(&mut self, time: f32) {
        let width = self.width;
        let height = self.height;
        let cx = width / 2.0;
        let cy = height / 2.0;
        let max_dist = (cx * cx + cy * cy).sqrt();
        let noise_scale = self.noise_scale;
        let animation_speed = self.animation_speed;
        let center_falloff = self.center_falloff;
        let height_intensity = self.height_intensity;
        let time_z = time * animation_speed;

        for point in &mut self.points {
            // Sample noise
            let mut z = fbm3d(
                point.x * noise_scale,
                point.y * noise_scale,
                time_z,
                4,    // octaves
                0.5,  // persistence
                2.0,  // lacunarity
            );

            // Normalize from [-1, 1] to [0, 1]
            z = (z + 1.0) / 2.0;

            // Apply center falloff
            if center_falloff > 0.0 {
                let dx = point.x - cx;
                let dy = point.y - cy;
                let dist = (dx * dx + dy * dy).sqrt();
                let falloff = 1.0 - (dist / max_dist) * center_falloff;
                z *= falloff;
            }

            point.base_z = z;
            point.z = z * height_intensity;
        }
    }

    /// Apply mouse height influence
    fn apply_mouse_influence(&mut self) {
        if !self.mouse_in_canvas {
            return;
        }

        let mx = self.mouse_x;
        let my = self.mouse_y;
        let radius = self.mouse_radius;
        let radius_sq = radius * radius;
        let influence = self.mouse_height_influence;

        for point in &mut self.points {
            let dx = point.x - mx;
            let dy = point.y - my;
            let dist_sq = dx * dx + dy * dy;

            if dist_sq < radius_sq {
                let dist = dist_sq.sqrt();
                let t = 1.0 - dist / radius;
                // Smoothstep
                let smooth = t * t * (3.0 - 2.0 * t);
                point.z = (point.z + smooth * influence).clamp(0.0, 1.0);
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
    /// Returns the number of triangles
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
        // Format: [x, y, height, centroidY, centroidX, centroidY] per vertex
        // 6 floats per vertex, 3 vertices per triangle
        let tri_size = num_triangles * 3 * 6;
        self.triangle_vertices.clear();
        if self.triangle_vertices.capacity() < tri_size {
            self.triangle_vertices.reserve(tri_size - self.triangle_vertices.capacity());
        }

        // Build stroke vertex buffer
        // Format: [x, y] per vertex, 2 vertices per edge, 3 edges per triangle
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
            // Edge 0-1
            self.stroke_vertices.push(p0.0);
            self.stroke_vertices.push(p0.1);
            self.stroke_vertices.push(p1.0);
            self.stroke_vertices.push(p1.1);

            // Edge 1-2
            self.stroke_vertices.push(p1.0);
            self.stroke_vertices.push(p1.1);
            self.stroke_vertices.push(p2.0);
            self.stroke_vertices.push(p2.1);

            // Edge 2-0
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

    /// Get triangle vertices as Float32Array (zero-copy view)
    #[wasm_bindgen]
    pub fn get_triangle_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.triangle_vertices) }
    }

    /// Get stroke vertices as Float32Array (zero-copy view)
    #[wasm_bindgen]
    pub fn get_stroke_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.stroke_vertices) }
    }

    /// Get point vertices as Float32Array (zero-copy view)
    #[wasm_bindgen]
    pub fn get_point_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.point_vertices) }
    }

    /// Get number of triangles (after triangulate)
    #[wasm_bindgen]
    pub fn get_triangle_count(&self) -> usize {
        self.triangle_vertices.len() / 18 // 6 floats per vertex, 3 vertices per triangle
    }

    /// Get number of stroke line segments
    #[wasm_bindgen]
    pub fn get_stroke_vertex_count(&self) -> usize {
        self.stroke_vertices.len() / 2 // 2 floats per vertex
    }

    /// Get number of points
    #[wasm_bindgen]
    pub fn get_point_count(&self) -> usize {
        self.points.len()
    }
}
