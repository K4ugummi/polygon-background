/// Physics calculations for point interactions

use crate::constants::{
    GRAVITY_WELL_MAX_RANGE, GRAVITY_WELL_MIN_DIST, MIN_DIST_SQ, SHOCKWAVE_WAVE_WIDTH,
};
use crate::effects::{GravityWell, MouseMode, MouseState, Shockwave};
use crate::point::Point;
use crate::spatial_grid::SpatialGrid;

/// Apply mouse influence to nearby points
pub fn apply_mouse_influence(
    points: &mut [Point],
    mouse: &MouseState,
    velocity_influence: f32,
    grid: &SpatialGrid,
) {
    if !mouse.in_canvas {
        return;
    }

    let radius = mouse.radius;
    let radius_sq = radius * radius;
    let strength = mouse.strength;

    // Velocity boost
    let velocity_boost = 1.0 + mouse.speed() * velocity_influence;

    // Query only nearby points
    let nearby: Vec<usize> = grid.query_radius(mouse.x, mouse.y, radius).collect();

    for point_idx in nearby {
        let point = &mut points[point_idx];
        let dx = point.x - mouse.x;
        let dy = point.y - mouse.y;
        let dist_sq = dx * dx + dy * dy;

        // Early exit using squared distance
        if dist_sq >= radius_sq || dist_sq < MIN_DIST_SQ {
            continue;
        }

        // Only calculate sqrt when point is in range
        let dist = dist_sq.sqrt();
        let t = 1.0 - dist / radius;

        // Smoothstep falloff: t² × (3 - 2t)
        let falloff = t * t * (3.0 - 2.0 * t);

        let push = strength * falloff * velocity_boost * 0.08;
        let inv_dist = 1.0 / dist;

        match mouse.mode {
            MouseMode::Push => {
                // Push away from cursor
                let nx = dx * inv_dist;
                let ny = dy * inv_dist;
                point.dx += nx * push;
                point.dy += ny * push;
            }
            MouseMode::Pull => {
                // Pull toward cursor (0.5x strength)
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

/// Apply gravity well force to nearby points
pub fn apply_gravity_well(points: &mut [Point], well: &GravityWell, grid: &SpatialGrid) {
    let min_dist_sq = GRAVITY_WELL_MIN_DIST * GRAVITY_WELL_MIN_DIST;
    let max_range_sq = GRAVITY_WELL_MAX_RANGE * GRAVITY_WELL_MAX_RANGE;

    // Query nearby points
    let nearby: Vec<usize> = grid
        .query_radius(well.x, well.y, GRAVITY_WELL_MAX_RANGE)
        .collect();

    for point_idx in nearby {
        let point = &mut points[point_idx];
        let dx = well.x - point.x;
        let dy = well.y - point.y;
        let dist_sq = dx * dx + dy * dy;

        // Skip if beyond max range
        if dist_sq > max_range_sq {
            continue;
        }

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

/// Apply shockwave force to nearby points
pub fn apply_shockwave(points: &mut [Point], wave: &Shockwave, grid: &SpatialGrid) {
    // Pre-calculate bounds for early exit
    let min_radius = (wave.radius - SHOCKWAVE_WAVE_WIDTH).max(0.0);
    let max_radius = wave.radius + SHOCKWAVE_WAVE_WIDTH;
    let min_radius_sq = min_radius * min_radius;
    let max_radius_sq = max_radius * max_radius;

    // Query nearby points
    let nearby: Vec<usize> = grid.query_radius(wave.x, wave.y, max_radius).collect();

    for point_idx in nearby {
        let point = &mut points[point_idx];
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
