import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { PolygonBackground, PolygonBackgroundOptions } from 'polygon-background';

export interface PolygonContainerRef {
  instance: PolygonBackground | null;
}

interface PolygonContainerProps {
  theme?: string;
  options?: Partial<PolygonBackgroundOptions>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const PolygonContainer = forwardRef<PolygonContainerRef, PolygonContainerProps>(
  ({ theme = 'midnight', options = {}, className, style, children }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<PolygonBackground | null>(null);

    useImperativeHandle(ref, () => ({
      get instance() {
        return instanceRef.current;
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      instanceRef.current = new PolygonBackground(containerRef.current, {
        theme,
        ...options,
      });

      return () => {
        instanceRef.current?.destroy();
        instanceRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (instanceRef.current) {
        instanceRef.current.setTheme(theme);
      }
    }, [theme]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{ position: 'relative', ...style }}
      >
        {children}
      </div>
    );
  }
);

PolygonContainer.displayName = 'PolygonContainer';

export default PolygonContainer;
