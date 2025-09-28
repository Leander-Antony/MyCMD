import React, { useEffect, useRef } from 'react';
import './MatrixRain.css';

const MatrixRain = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Matrix characters
    const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ012345678901234567890123456789';
    const fontSize = 14;
    let columns = 0;
    let drops = [];
    
    const resizeCanvas = () => {
      // Force proper canvas sizing
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(window.innerWidth, document.documentElement.clientWidth);
      canvas.height = Math.max(window.innerHeight, document.documentElement.clientHeight);
      
      // Also set the canvas style to ensure it covers the full area
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      
      // Recalculate columns and reset drops array when canvas resizes
      columns = Math.floor(canvas.width / fontSize);
      drops = new Array(columns).fill(0);
      
      // Randomize initial drop positions so they don't all start at the same time
      for (let i = 0; i < drops.length; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
      }
      
      console.log(`Canvas resized to: ${canvas.width}x${canvas.height}, columns: ${columns}`);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      // Only draw if we have columns and drops initialized
      if (columns === 0 || drops.length === 0) return;
      
      // Black background with slight transparency for fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff41'; // Matrix green
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Draw character
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        // Reset drop randomly or when it reaches bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start with a small delay so drops don't all start at once
    setTimeout(() => {
      animate();
    }, Math.random() * 1000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="matrix-rain"
      aria-hidden="true"
    />
  );
};

export default MatrixRain;
