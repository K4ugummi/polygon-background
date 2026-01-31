import { useRef, useEffect } from 'react';
import { PolygonBackground } from 'polygon-background';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ConfirmDialog({ open, onClose }: ConfirmDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<PolygonBackground | null>(null);

  useEffect(() => {
    if (open && containerRef.current && !bgRef.current) {
      bgRef.current = new PolygonBackground(containerRef.current, {
        theme: 'sunset',
        pointCount: 25,
        speed: 0.3,
      });
    }
    return () => {
      if (bgRef.current) {
        bgRef.current.destroy();
        bgRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div ref={containerRef} className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-content">
          <div className="dialog-icon">⚠️</div>
          <h3>Delete Project?</h3>
          <p>This action cannot be undone. All data associated with this project will be permanently removed.</p>
          <div className="dialog-actions">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-danger" onClick={onClose}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
