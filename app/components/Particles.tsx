"use client";
import { useEffect } from 'react';

declare global {
  interface Window {
    particlesJS: any;
  }
}

export default function Particles() {
  useEffect(() => {
    // Load particles.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';
    script.async = true;
    
    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-js", {
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: ["#6366F1", "#8B5CF6", "#06D6A0", "#FF6B6B"] },
            shape: { type: "circle" },
            opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
            size: { value: 4, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
            line_linked: { enable: true, distance: 150, color: "#6366F1", opacity: 0.3, width: 1 },
            move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
          },
          interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "push" } },
            modes: { 
              bubble: { distance: 200, size: 6, duration: 2, opacity: 0.8, speed: 3 },
              push: { particles_nb: 4 } 
            }
          },
          retina_detect: true
        });
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return <div id="particles-js" />;
}
