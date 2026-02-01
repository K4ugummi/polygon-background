/// Point structure representing a simulation particle

use crate::noise::fbm3d;
use crate::rng::Rng;
use crate::constants::BASE_VELOCITY;

/// A point with position, velocity, and displacement
#[derive(Clone, Copy)]
pub struct Point {
    /// Current X position
    pub x: f32,
    /// Current Y position
    pub y: f32,
    /// Static height for lighting (generated from noise)
    pub z: f32,
    /// Rest position X (base position without displacement)
    pub base_x: f32,
    /// Rest position Y (base position without displacement)
    pub base_y: f32,
    /// Floating velocity X (constant drift)
    pub vx: f32,
    /// Floating velocity Y (constant drift)
    pub vy: f32,
    /// Displacement velocity X (from interactions)
    pub dx: f32,
    /// Displacement velocity Y (from interactions)
    pub dy: f32,
}

impl Point {
    /// Create a new point with random position and velocity
    pub fn new_random(
        rng: &mut Rng,
        width: f32,
        height: f32,
        noise_scale: f32,
        height_intensity: f32,
    ) -> Self {
        let x = rng.next_f32() * width;
        let y = rng.next_f32() * height;
        let vx = (rng.next_f32() - 0.5) * BASE_VELOCITY * 2.0;
        let vy = (rng.next_f32() - 0.5) * BASE_VELOCITY * 2.0;
        let z = Self::calculate_height(x, y, width, height, noise_scale, height_intensity);

        Self {
            x,
            y,
            z,
            base_x: x,
            base_y: y,
            vx,
            vy,
            dx: 0.0,
            dy: 0.0,
        }
    }

    /// Calculate static height from noise (called once at creation)
    pub fn calculate_height(
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        noise_scale: f32,
        intensity: f32,
    ) -> f32 {
        let cx = width / 2.0;
        let cy = height / 2.0;
        let max_dist = (cx * cx + cy * cy).sqrt();

        // Sample noise
        let mut z = fbm3d(
            x * noise_scale,
            y * noise_scale,
            0.0, // static z
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

    /// Regenerate height based on current base position
    pub fn regenerate_height(
        &mut self,
        width: f32,
        height: f32,
        noise_scale: f32,
        height_intensity: f32,
    ) {
        self.z = Self::calculate_height(
            self.base_x,
            self.base_y,
            width,
            height,
            noise_scale,
            height_intensity,
        );
    }

    /// Update position with floating velocity and edge wrapping
    pub fn update_position(&mut self, delta_time: f32, speed: f32, width: f32, height: f32) {
        // Apply floating velocity to base position
        self.base_x += self.vx * speed * delta_time;
        self.base_y += self.vy * speed * delta_time;

        // Wrap around edges
        if self.base_x < 0.0 {
            self.base_x += width;
        }
        if self.base_x > width {
            self.base_x -= width;
        }
        if self.base_y < 0.0 {
            self.base_y += height;
        }
        if self.base_y > height {
            self.base_y -= height;
        }
    }

    /// Apply spring physics to return to base position
    pub fn apply_spring(&mut self, spring_back: f32, damping: f32) {
        // Pull displacement back to zero
        self.dx += (0.0 - (self.x - self.base_x)) * spring_back;
        self.dy += (0.0 - (self.y - self.base_y)) * spring_back;

        // Apply damping
        self.dx *= damping;
        self.dy *= damping;

        // Update position from base + displacement velocity
        self.x = self.base_x + self.dx;
        self.y = self.base_y + self.dy;
    }

    /// Scale position when canvas resizes
    pub fn scale(&mut self, scale_x: f32, scale_y: f32) {
        self.x *= scale_x;
        self.y *= scale_y;
        self.base_x *= scale_x;
        self.base_y *= scale_y;
    }
}
