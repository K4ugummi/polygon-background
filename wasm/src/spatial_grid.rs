/// Uniform grid for spatial partitioning
/// Enables O(k) spatial queries instead of O(n)

pub struct SpatialGrid {
    /// Cell index -> list of point indices
    cells: Vec<Vec<usize>>,
    /// Size of each cell
    pub cell_size: f32,
    /// Number of columns
    cols: usize,
    /// Number of rows
    rows: usize,
    /// Grid width
    pub width: f32,
    /// Grid height
    pub height: f32,
}

impl SpatialGrid {
    /// Create a new spatial grid
    pub fn new(width: f32, height: f32, cell_size: f32) -> Self {
        let cell_size = cell_size.max(1.0);
        let cols = ((width / cell_size).ceil() as usize).max(1);
        let rows = ((height / cell_size).ceil() as usize).max(1);

        Self {
            cells: vec![Vec::new(); cols * rows],
            cell_size,
            cols,
            rows,
            width,
            height,
        }
    }

    /// Clear all cells (keeps capacity for reuse)
    pub fn clear(&mut self) {
        for cell in &mut self.cells {
            cell.clear();
        }
    }

    /// Resize the grid for new dimensions
    pub fn resize(&mut self, width: f32, height: f32, cell_size: f32) {
        self.width = width;
        self.height = height;
        self.cell_size = cell_size.max(1.0);
        self.cols = ((width / self.cell_size).ceil() as usize).max(1);
        self.rows = ((height / self.cell_size).ceil() as usize).max(1);

        let new_size = self.cols * self.rows;
        self.cells.resize_with(new_size, Vec::new);
        self.clear();
    }

    /// Get cell index for a position
    #[inline]
    fn cell_index(&self, x: f32, y: f32) -> usize {
        let col = ((x / self.cell_size) as usize).min(self.cols - 1);
        let row = ((y / self.cell_size) as usize).min(self.rows - 1);
        row * self.cols + col
    }

    /// Insert a point into the grid
    pub fn insert(&mut self, point_index: usize, x: f32, y: f32) {
        let idx = self.cell_index(x, y);
        self.cells[idx].push(point_index);
    }

    /// Query all points within radius of (cx, cy)
    /// Returns an iterator over point indices
    pub fn query_radius(&self, cx: f32, cy: f32, radius: f32) -> impl Iterator<Item = usize> + '_ {
        let min_col = ((cx - radius) / self.cell_size).floor().max(0.0) as usize;
        let max_col = ((cx + radius) / self.cell_size).ceil().min(self.cols as f32) as usize;
        let min_row = ((cy - radius) / self.cell_size).floor().max(0.0) as usize;
        let max_row = ((cy + radius) / self.cell_size).ceil().min(self.rows as f32) as usize;

        (min_row..max_row).flat_map(move |row| {
            (min_col..max_col).flat_map(move |col| {
                self.cells[row * self.cols + col].iter().copied()
            })
        })
    }
}
