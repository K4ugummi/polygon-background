import { useRef, useEffect } from 'react';
import { PolygonBackground } from 'polygon-background';

export function LoginCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<PolygonBackground | null>(null);

  useEffect(() => {
    if (!containerRef.current || bgRef.current) return;

    bgRef.current = new PolygonBackground(containerRef.current, {
      theme: 'midnight',
      pointCount: 30,
      speed: 0.3,
    });

    return () => {
      bgRef.current?.destroy();
      bgRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="login-card">
      <div className="login-content">
        <h3>Welcome Back</h3>
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <button className="btn-primary">Sign In</button>
        <button className="btn-secondary">Create Account</button>
      </div>
    </div>
  );
}
