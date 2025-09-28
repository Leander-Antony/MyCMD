import React, { useEffect, useRef } from 'react';
import './BackgroundEffects.css';

const BackgroundEffects = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const gridRef = useRef({ pulse: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      // Force proper canvas sizing
      canvas.width = Math.max(window.innerWidth, document.documentElement.clientWidth);
      canvas.height = Math.max(window.innerHeight, document.documentElement.clientHeight);
      
      // Also set the canvas style to ensure it covers the full area
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      
      console.log(`BackgroundEffects canvas resized to: ${canvas.width}x${canvas.height}`);
    };

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 15000);
      
      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          pulseSpeed: Math.random() * 0.02 + 0.01
        });
      }
    };

    const handleResize = () => {
      resizeCanvas();
      initParticles(); // Reinitialize particles when canvas resizes
    };

    handleResize(); // Initial setup
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update grid pulse
      gridRef.current.pulse += 0.02;
      
      // Draw grid
      drawGrid(ctx, canvas.width, canvas.height);
      
      // Update and draw particles
      updateParticles(ctx, canvas.width, canvas.height);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawGrid = (ctx, width, height) => {
      const gridSize = 50;
      const pulse = Math.sin(gridRef.current.pulse) * 0.3 + 0.1;
      
      ctx.strokeStyle = `rgba(0, 255, 100, ${0.1 + pulse * 0.1})`;
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        const linePulse = Math.sin(gridRef.current.pulse + x * 0.01) * 0.2 + 0.1;
        ctx.globalAlpha = 0.1 + linePulse * 0.1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        const linePulse = Math.sin(gridRef.current.pulse + y * 0.01) * 0.2 + 0.1;
        ctx.globalAlpha = 0.1 + linePulse * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Grid intersections (nodes)
      ctx.fillStyle = `rgba(0, 255, 150, ${0.3 + pulse * 0.2})`;
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          const nodePulse = Math.sin(gridRef.current.pulse + (x + y) * 0.005) * 0.5 + 0.5;
          ctx.globalAlpha = 0.2 + nodePulse * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, 1 + nodePulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const updateParticles = (ctx, width, height) => {
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        
        // Update opacity with pulse
        const pulseOpacity = Math.sin(Date.now() * particle.pulseSpeed) * 0.3 + 0.7;
        
        // Draw particle
        ctx.globalAlpha = particle.opacity * pulseOpacity;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow
        ctx.globalAlpha = (particle.opacity * pulseOpacity) * 0.3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="background-effects"
      aria-hidden="true"
    />
  );
};

export default BackgroundEffects;
