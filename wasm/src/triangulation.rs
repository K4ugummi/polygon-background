/// Delaunay triangulation and vertex buffer generation

use delaunator::{triangulate as delaunay_triangulate, Point as DelaunayPoint};

use crate::constants::GHOST_THRESHOLD;
use crate::point::Point;

/// Generate ghost points for edge wrapping continuity
pub fn generate_ghost_points(points: &[Point], width: f32, height: f32) -> Vec<(f32, f32, f32)> {
    let threshold_x = width * GHOST_THRESHOLD;
    let threshold_y = height * GHOST_THRESHOLD;

    let mut ghosts = Vec::new();

    for point in points {
        let near_left = point.x < threshold_x;
        let near_right = point.x > width - threshold_x;
        let near_top = point.y < threshold_y;
        let near_bottom = point.y > height - threshold_y;

        // Edge ghosts
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

/// Output buffers for triangulation results
pub struct TriangulationBuffers {
    /// Triangle vertices: [x, y, z, centroidY, centroidX, centroidY] per vertex
    pub triangle_vertices: Vec<f32>,
    /// Stroke vertices: [x1, y1, x2, y2] per edge
    pub stroke_vertices: Vec<f32>,
    /// Point vertices: [x, y] per point
    pub point_vertices: Vec<f32>,
}

impl TriangulationBuffers {
    pub fn new() -> Self {
        Self {
            triangle_vertices: Vec::new(),
            stroke_vertices: Vec::new(),
            point_vertices: Vec::new(),
        }
    }

    /// Get number of triangles
    pub fn triangle_count(&self) -> usize {
        self.triangle_vertices.len() / 18
    }

    /// Get number of stroke line segments (vertices / 2)
    pub fn stroke_vertex_count(&self) -> usize {
        self.stroke_vertices.len() / 2
    }
}

/// Perform Delaunay triangulation and build vertex buffers
pub fn triangulate(
    points: &[Point],
    width: f32,
    height: f32,
    buffers: &mut TriangulationBuffers,
) -> usize {
    // Generate ghost points for edge continuity
    let ghosts = generate_ghost_points(points, width, height);

    // Add corner points for full coverage
    let margin = 1.0;
    let corners = [
        (-margin, -margin, 0.0f32),
        (width + margin, -margin, 0.0),
        (width + margin, height + margin, 0.0),
        (-margin, height + margin, 0.0),
    ];

    // Build combined points array
    let total_points = points.len() + ghosts.len() + corners.len();
    let mut all_points: Vec<(f32, f32, f32)> = Vec::with_capacity(total_points);

    for p in points {
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
        .map(|(x, y, _)| DelaunayPoint {
            x: *x as f64,
            y: *y as f64,
        })
        .collect();

    // Triangulate
    let result = delaunay_triangulate(&delaunay_points);
    let triangles = &result.triangles;
    let num_triangles = triangles.len() / 3;

    // Build triangle vertex buffer
    build_triangle_buffer(&all_points, triangles, &mut buffers.triangle_vertices);

    // Build stroke vertex buffer
    build_stroke_buffer(&all_points, triangles, &mut buffers.stroke_vertices);

    // Build point vertex buffer (only real points)
    build_point_buffer(points, &mut buffers.point_vertices);

    num_triangles
}

/// Build triangle vertex buffer from triangulation result
fn build_triangle_buffer(
    all_points: &[(f32, f32, f32)],
    triangles: &[usize],
    buffer: &mut Vec<f32>,
) {
    let num_triangles = triangles.len() / 3;
    let tri_size = num_triangles * 3 * 6;

    buffer.clear();
    if buffer.capacity() < tri_size {
        buffer.reserve(tri_size - buffer.capacity());
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

        // Vertex 0: [x, y, height, centroidY, centroidX, centroidY]
        buffer.push(p0.0);
        buffer.push(p0.1);
        buffer.push(avg_height);
        buffer.push(centroid_y);
        buffer.push(centroid_x);
        buffer.push(centroid_y);

        // Vertex 1
        buffer.push(p1.0);
        buffer.push(p1.1);
        buffer.push(avg_height);
        buffer.push(centroid_y);
        buffer.push(centroid_x);
        buffer.push(centroid_y);

        // Vertex 2
        buffer.push(p2.0);
        buffer.push(p2.1);
        buffer.push(avg_height);
        buffer.push(centroid_y);
        buffer.push(centroid_x);
        buffer.push(centroid_y);
    }
}

/// Build stroke (edge) vertex buffer from triangulation result
fn build_stroke_buffer(all_points: &[(f32, f32, f32)], triangles: &[usize], buffer: &mut Vec<f32>) {
    let num_triangles = triangles.len() / 3;
    let stroke_size = num_triangles * 3 * 2 * 2;

    buffer.clear();
    if buffer.capacity() < stroke_size {
        buffer.reserve(stroke_size - buffer.capacity());
    }

    for i in (0..triangles.len()).step_by(3) {
        let i0 = triangles[i];
        let i1 = triangles[i + 1];
        let i2 = triangles[i + 2];

        let p0 = all_points[i0];
        let p1 = all_points[i1];
        let p2 = all_points[i2];

        // Edge 0-1
        buffer.push(p0.0);
        buffer.push(p0.1);
        buffer.push(p1.0);
        buffer.push(p1.1);

        // Edge 1-2
        buffer.push(p1.0);
        buffer.push(p1.1);
        buffer.push(p2.0);
        buffer.push(p2.1);

        // Edge 2-0
        buffer.push(p2.0);
        buffer.push(p2.1);
        buffer.push(p0.0);
        buffer.push(p0.1);
    }
}

/// Build point vertex buffer (only real points, not ghosts)
fn build_point_buffer(points: &[Point], buffer: &mut Vec<f32>) {
    let point_size = points.len() * 2;

    buffer.clear();
    if buffer.capacity() < point_size {
        buffer.reserve(point_size - buffer.capacity());
    }

    for p in points {
        buffer.push(p.x);
        buffer.push(p.y);
    }
}
