/// Visual effects: Shockwaves, Gravity Wells, Mouse Modes

use crate::constants::{
    GRAVITY_WELL_ATTRACT_STRENGTH, GRAVITY_WELL_REPEL_STRENGTH,
    MAX_SHOCKWAVES, SHOCKWAVE_DECAY, SHOCKWAVE_SPEED,
};

/// Expanding shockwave effect triggered by clicks
#[derive(Clone, Copy)]
pub struct Shockwave {
    pub x: f32,
    pub y: f32,
    pub radius: f32,
    pub strength: f32,
    pub speed: f32,
}

impl Shockwave {
    /// Create a new shockwave at position with given strength
    pub fn new(x: f32, y: f32, strength: f32) -> Self {
        Self {
            x,
            y,
            radius: 0.0,
            strength: strength.clamp(0.0, 500.0),
            speed: SHOCKWAVE_SPEED,
        }
    }

    /// Update shockwave (expand and decay)
    pub fn update(&mut self) {
        self.radius += self.speed;
        self.strength *= SHOCKWAVE_DECAY;
    }

    /// Check if shockwave is still active
    pub fn is_active(&self) -> bool {
        self.strength > 0.5
    }
}

/// Collection of active shockwaves
pub struct ShockwaveManager {
    waves: Vec<Shockwave>,
}

impl ShockwaveManager {
    pub fn new() -> Self {
        Self { waves: Vec::new() }
    }

    /// Add a new shockwave, removing oldest if at capacity
    pub fn add(&mut self, x: f32, y: f32, strength: f32) {
        if self.waves.len() >= MAX_SHOCKWAVES {
            self.waves.remove(0);
        }
        self.waves.push(Shockwave::new(x, y, strength));
    }

    /// Update all shockwaves and remove dead ones
    pub fn update(&mut self) {
        for wave in &mut self.waves {
            wave.update();
        }
        self.waves.retain(|w| w.is_active());
    }

    /// Get iterator over active shockwaves
    pub fn iter(&self) -> impl Iterator<Item = &Shockwave> {
        self.waves.iter()
    }

    /// Get max radius among all active shockwaves (for spatial grid sizing)
    pub fn max_radius(&self, wave_width: f32) -> f32 {
        self.waves
            .iter()
            .map(|w| w.radius + wave_width)
            .fold(0.0f32, f32::max)
    }
}

/// Gravity well effect (attract or repel points)
#[derive(Clone, Copy)]
pub struct GravityWell {
    pub x: f32,
    pub y: f32,
    pub strength: f32,
}

impl GravityWell {
    /// Create an attracting gravity well
    pub fn attract(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            strength: GRAVITY_WELL_ATTRACT_STRENGTH,
        }
    }

    /// Create a repelling gravity well
    pub fn repel(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            strength: GRAVITY_WELL_REPEL_STRENGTH,
        }
    }

    /// Update position
    pub fn set_position(&mut self, x: f32, y: f32) {
        self.x = x;
        self.y = y;
    }
}

/// Mouse interaction mode
#[derive(Clone, Copy, PartialEq, Default)]
pub enum MouseMode {
    #[default]
    Push,
    Pull,
    Swirl,
}

impl MouseMode {
    /// Convert from numeric value (for JS interop)
    pub fn from_u32(value: u32) -> Self {
        match value {
            1 => MouseMode::Pull,
            2 => MouseMode::Swirl,
            _ => MouseMode::Push,
        }
    }
}

/// Mouse state for interaction calculations
pub struct MouseState {
    pub x: f32,
    pub y: f32,
    pub prev_x: f32,
    pub prev_y: f32,
    pub vx: f32,
    pub vy: f32,
    pub in_canvas: bool,
    pub radius: f32,
    pub strength: f32,
    pub mode: MouseMode,
}

impl MouseState {
    pub fn new() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            prev_x: 0.0,
            prev_y: 0.0,
            vx: 0.0,
            vy: 0.0,
            in_canvas: false,
            radius: 150.0,
            strength: 80.0,
            mode: MouseMode::Push,
        }
    }

    /// Update mouse state with new position
    pub fn update(
        &mut self,
        x: f32,
        y: f32,
        in_canvas: bool,
        radius: f32,
        strength: f32,
        mode: u32,
    ) {
        self.prev_x = self.x;
        self.prev_y = self.y;
        self.x = x;
        self.y = y;
        self.in_canvas = in_canvas;
        self.radius = radius;
        self.strength = strength;

        // Update velocity (smoothed)
        if in_canvas {
            let new_vx = x - self.prev_x;
            let new_vy = y - self.prev_y;
            self.vx = new_vx * 0.4 + self.vx * 0.6;
            self.vy = new_vy * 0.4 + self.vy * 0.6;
        } else {
            self.vx *= 0.9;
            self.vy *= 0.9;
        }

        self.mode = MouseMode::from_u32(mode);
    }

    /// Get current mouse speed
    pub fn speed(&self) -> f32 {
        (self.vx * self.vx + self.vy * self.vy).sqrt()
    }
}
