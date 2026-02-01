/// Physics and simulation constants

/// Ghost point threshold as fraction of canvas dimensions
pub const GHOST_THRESHOLD: f32 = 0.15;

/// Maximum concurrent shockwaves
pub const MAX_SHOCKWAVES: usize = 10;

/// Physics defaults
pub const DEFAULT_SPRING_BACK: f32 = 0.06;
pub const DEFAULT_DAMPING: f32 = 0.92;
pub const DEFAULT_VELOCITY_INFLUENCE: f32 = 0.3;

/// Shockwave behavior
pub const SHOCKWAVE_DECAY: f32 = 0.96;
pub const SHOCKWAVE_WAVE_WIDTH: f32 = 60.0;
pub const SHOCKWAVE_SPEED: f32 = 12.0;

/// Gravity well behavior
pub const GRAVITY_WELL_MIN_DIST: f32 = 20.0;
pub const GRAVITY_WELL_ATTRACT_STRENGTH: f32 = 3.0;
pub const GRAVITY_WELL_REPEL_STRENGTH: f32 = -5.0;
pub const GRAVITY_WELL_MAX_RANGE: f32 = 1000.0;

/// Minimum squared distance to avoid division issues
pub const MIN_DIST_SQ: f32 = 1.0;

/// Default mouse radius for cell size calculation
pub const DEFAULT_MOUSE_RADIUS: f32 = 150.0;

/// Default mouse strength
pub const DEFAULT_MOUSE_STRENGTH: f32 = 80.0;

/// Base velocity for new points
pub const BASE_VELOCITY: f32 = 0.5;

/// Default noise scale
pub const DEFAULT_NOISE_SCALE: f32 = 0.003;

/// Default height intensity
pub const DEFAULT_HEIGHT_INTENSITY: f32 = 0.6;

/// Validation limits
pub const MIN_POINT_COUNT: usize = 3;
pub const MAX_POINT_COUNT: usize = 10000;
pub const MIN_DIMENSION: f32 = 1.0;
pub const MAX_DIMENSION: f32 = 100000.0;
