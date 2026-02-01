use wasm_bindgen::prelude::*;

mod constants;
mod effects;
mod noise;
mod physics;
mod point;
mod rng;
mod simulation;
mod spatial_grid;
mod triangulation;

pub use simulation::Simulation;

/// Initialize panic hook for better error messages in development
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Create a new simulation instance
#[wasm_bindgen]
pub fn create_simulation(
    width: f32,
    height: f32,
    point_count: usize,
    seed: u32,
) -> Simulation {
    Simulation::new(width, height, point_count, seed)
}
