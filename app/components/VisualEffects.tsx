"use client";
import { useEffect, useRef } from 'react';

export default function VisualEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Floating orbs animation
    const orbs: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      color: string;
    }> = [];

    // Initialize orbs
    const colors = ['#6366F1', '#8B5CF6', '#06D6A0', '#FF6B6B'];
    for (let i = 0; i < 8; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 60 + 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach(orb => {
        // Update position
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce off edges
        if (orb.x + orb.radius > canvas.width || orb.x - orb.radius < 0) {
          orb.vx *= -1;
        }
        if (orb.y + orb.radius > canvas.height || orb.y - orb.radius < 0) {
          orb.vy *= -1;
        }

        // Keep within bounds
        orb.x = Math.max(orb.radius, Math.min(canvas.width - orb.radius, orb.x));
        orb.y = Math.max(orb.radius, Math.min(canvas.height - orb.radius, orb.y));

        // Draw orb with glow effect
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, `${orb.color}${Math.floor(orb.opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${orb.color}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -2,
        pointerEvents: 'none'
      }}
    />
  );
}
