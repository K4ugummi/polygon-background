/// Main simulation state and public WASM API

use js_sys::Float32Array;
use wasm_bindgen::prelude::*;

use crate::constants::{
    DEFAULT_DAMPING, DEFAULT_HEIGHT_INTENSITY, DEFAULT_MOUSE_RADIUS, DEFAULT_NOISE_SCALE,
    DEFAULT_SPRING_BACK, DEFAULT_VELOCITY_INFLUENCE, GRAVITY_WELL_MAX_RANGE, MAX_DIMENSION,
    MAX_POINT_COUNT, MIN_DIMENSION, MIN_POINT_COUNT, SHOCKWAVE_WAVE_WIDTH,
};
use crate::effects::{GravityWell, MouseState, ShockwaveManager};
use crate::physics::{apply_gravity_well, apply_mouse_influence, apply_shockwave};
use crate::point::Point;
use crate::rng::Rng;
use crate::spatial_grid::SpatialGrid;
use crate::triangulation::{triangulate, TriangulationBuffers};

/// Main simulation state
#[wasm_bindgen]
pub struct Simulation {
    points: Vec<Point>,
    width: f32,
    height: f32,
    rng: Rng,

    // Noise parameters
    noise_scale: f32,
    height_intensity: f32,

    // Mouse state
    mouse: MouseState,

    // Physics settings
    spring_back: f32,
    damping: f32,
    velocity_influence: f32,

    // Effects
    shockwaves: ShockwaveManager,
    gravity_well: Option<GravityWell>,

    // Spatial partitioning
    spatial_grid: SpatialGrid,

    // Output buffers
    buffers: TriangulationBuffers,
}

#[wasm_bindgen]
impl Simulation {
    /// Create a new simulation
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32, point_count: usize, seed: u32) -> Self {
        let width = Self::validate_dimension(width);
        let height = Self::validate_dimension(height);
        let point_count = Self::validate_point_count(point_count);

        let mut rng = Rng::new(seed);
        let noise_scale = DEFAULT_NOISE_SCALE;
        let height_intensity = DEFAULT_HEIGHT_INTENSITY;

        // Create points
        let mut points = Vec::with_capacity(point_count);
        for _ in 0..point_count {
            points.push(Point::new_random(
                &mut rng,
                width,
                height,
                noise_scale,
                height_intensity,
            ));
        }

        // Default cell size based on mouse radius
        let default_cell_size = DEFAULT_MOUSE_RADIUS / 2.0;

        Self {
            points,
            width,
            height,
            rng,
            noise_scale,
            height_intensity,
            mouse: MouseState::new(),
            spring_back: DEFAULT_SPRING_BACK,
            damping: DEFAULT_DAMPING,
            velocity_influence: DEFAULT_VELOCITY_INFLUENCE,
            shockwaves: ShockwaveManager::new(),
            gravity_well: None,
            spatial_grid: SpatialGrid::new(width, height, default_cell_size),
            buffers: TriangulationBuffers::new(),
        }
    }

    // ========== Validation Helpers ==========

    fn validate_point_count(count: usize) -> usize {
        count.max(MIN_POINT_COUNT).min(MAX_POINT_COUNT)
    }

    fn validate_dimension(value: f32) -> f32 {
        value.max(MIN_DIMENSION).min(MAX_DIMENSION)
    }

    // ========== Configuration ==========

    /// Set noise parameters and regenerate heights
    #[wasm_bindgen]
    pub fn set_noise_params(&mut self, noise_scale: f32, height_intensity: f32) {
        self.noise_scale = noise_scale.max(0.0001).min(1.0);
        self.height_intensity = height_intensity.clamp(0.0, 2.0);

        // Regenerate static heights
        for point in &mut self.points {
            point.regenerate_height(
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
        self.mouse.update(x, y, in_canvas, radius, strength, mode);
    }

    /// Set physics parameters
    #[wasm_bindgen]
    pub fn set_physics_params(&mut self, spring_back: f32, damping: f32, velocity_influence: f32) {
        self.spring_back = spring_back;
        self.damping = damping;
        self.velocity_influence = velocity_influence;
    }

    // ========== Effects ==========

    /// Trigger a shockwave at position
    #[wasm_bindgen]
    pub fn trigger_shockwave(&mut self, x: f32, y: f32, strength: f32) {
        self.shockwaves.add(x, y, strength);
    }

    /// Set or clear gravity well
    #[wasm_bindgen]
    pub fn set_gravity_well(&mut self, x: f32, y: f32, active: bool, attract: bool) {
        if active {
            self.gravity_well = Some(if attract {
                GravityWell::attract(x, y)
            } else {
                GravityWell::repel(x, y)
            });
        } else {
            self.gravity_well = None;
        }
    }

    /// Update gravity well position
    #[wasm_bindgen]
    pub fn update_gravity_well_position(&mut self, x: f32, y: f32) {
        if let Some(ref mut well) = self.gravity_well {
            well.set_position(x, y);
        }
    }

    // ========== Simulation Control ==========

    /// Resize the simulation
    #[wasm_bindgen]
    pub fn resize(&mut self, new_width: f32, new_height: f32) {
        let new_width = Self::validate_dimension(new_width);
        let new_height = Self::validate_dimension(new_height);

        if self.width > 0.0 && self.height > 0.0 {
            let scale_x = new_width / self.width;
            let scale_y = new_height / self.height;

            for point in &mut self.points {
                point.scale(scale_x, scale_y);
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

        // Add new points if needed
        while self.points.len() < count {
            self.points.push(Point::new_random(
                &mut self.rng,
                self.width,
                self.height,
                self.noise_scale,
                self.height_intensity,
            ));
        }

        // Remove excess points
        self.points.truncate(count);
    }

    /// Update point positions
    #[wasm_bindgen]
    pub fn update_points(&mut self, delta_time: f32, speed: f32) {
        let delta_time = delta_time.clamp(0.0, 10.0);
        let speed = speed.clamp(0.0, 10.0);

        // Update shockwaves
        self.shockwaves.update();

        // Update point positions and physics
        for point in &mut self.points {
            point.update_position(delta_time, speed, self.width, self.height);
            point.apply_spring(self.spring_back, self.damping);
        }

        // Rebuild spatial grid
        self.rebuild_spatial_grid();

        // Apply effects using spatial queries
        apply_mouse_influence(
            &mut self.points,
            &self.mouse,
            self.velocity_influence,
            &self.spatial_grid,
        );

        if let Some(ref well) = self.gravity_well {
            apply_gravity_well(&mut self.points, well, &self.spatial_grid);
        }

        for wave in self.shockwaves.iter() {
            apply_shockwave(&mut self.points, wave, &self.spatial_grid);
        }
    }

    /// Rebuild spatial grid with optimal cell size
    fn rebuild_spatial_grid(&mut self) {
        // Calculate optimal cell size based on effect radii
        let max_shockwave_radius = self.shockwaves.max_radius(SHOCKWAVE_WAVE_WIDTH);
        let gravity_range = if self.gravity_well.is_some() {
            GRAVITY_WELL_MAX_RANGE
        } else {
            0.0
        };
        let max_radius = self.mouse.radius.max(max_shockwave_radius).max(gravity_range);
        let cell_size = (max_radius / 2.0).max(50.0);

        // Resize if needed
        if (self.spatial_grid.cell_size - cell_size).abs() > 1.0
            || self.spatial_grid.width != self.width
            || self.spatial_grid.height != self.height
        {
            self.spatial_grid
                .resize(self.width, self.height, cell_size);
        } else {
            self.spatial_grid.clear();
        }

        // Insert all points
        for (i, point) in self.points.iter().enumerate() {
            self.spatial_grid.insert(i, point.x, point.y);
        }
    }

    // ========== Triangulation ==========

    /// Perform triangulation and build vertex buffers
    #[wasm_bindgen]
    pub fn triangulate(&mut self) -> usize {
        triangulate(&self.points, self.width, self.height, &mut self.buffers)
    }

    // ========== Data Access ==========

    /// Get triangle vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_triangle_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.buffers.triangle_vertices) }
    }

    /// Get stroke vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_stroke_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.buffers.stroke_vertices) }
    }

    /// Get point vertices as Float32Array
    #[wasm_bindgen]
    pub fn get_point_vertices(&self) -> Float32Array {
        unsafe { Float32Array::view(&self.buffers.point_vertices) }
    }

    /// Get number of triangles
    #[wasm_bindgen]
    pub fn get_triangle_count(&self) -> usize {
        self.buffers.triangle_count()
    }

    /// Get number of stroke line segments
    #[wasm_bindgen]
    pub fn get_stroke_vertex_count(&self) -> usize {
        self.buffers.stroke_vertex_count()
    }

    /// Get number of points
    #[wasm_bindgen]
    pub fn get_point_count(&self) -> usize {
        self.points.len()
    }

    // ========== Combined Operations ==========

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
        self.set_mouse_state(
            mouse_x,
            mouse_y,
            mouse_in_canvas,
            mouse_radius,
            mouse_strength,
            mouse_mode,
        );

        // Update physics
        self.update_points(delta_time, speed);

        // Triangulate and return triangle count
        self.triangulate()
    }

    /// Get all vertex data sizes for buffer pre-allocation
    #[wasm_bindgen]
    pub fn get_buffer_sizes(&self) -> js_sys::Uint32Array {
        let sizes = [
            self.buffers.triangle_vertices.len() as u32,
            self.buffers.stroke_vertices.len() as u32,
            self.buffers.point_vertices.len() as u32,
        ];
        js_sys::Uint32Array::from(&sizes[..])
    }
}
