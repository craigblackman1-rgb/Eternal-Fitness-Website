"use client";

import { useEffect, useRef } from "react";

/**
 * Triple concentric wireframe icosahedra in EF rose, gently rotating.
 * Ported from the OpenDesign concept. Respects prefers-reduced-motion.
 */
const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let disposed = false;

    (async () => {
      const THREE = await import("three");
      if (disposed || !canvas.parentElement) return;

      const size = Math.min(460, canvas.parentElement.offsetWidth * 0.84);
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.z = 310;

      const mesh = (r: number, detail: number, opacity: number) => {
        const geo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, detail));
        const mat = new THREE.LineBasicMaterial({ color: 0xc1839f, transparent: true, opacity });
        return new THREE.LineSegments(geo, mat);
      };

      const m1 = mesh(86, 2, 0.82);
      const m2 = mesh(118, 1, 0.3);
      const m3 = mesh(158, 0, 0.14);
      scene.add(m1, m2, m3);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let my = 0;
      const onMove = (e: MouseEvent) => {
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      if (!reduceMotion) window.addEventListener("mousemove", onMove);

      let t = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        t += 0.005;
        m1.rotation.x = Math.sin(t * 0.65) * 0.22 + my * 0.1;
        m1.rotation.y += 0.009;
        m2.rotation.x = -Math.sin(t * 0.5) * 0.18 + my * 0.07;
        m2.rotation.y -= 0.005;
        m3.rotation.x = Math.cos(t * 0.55) * 0.14 + my * 0.06;
        m3.rotation.y += 0.006;
        renderer!.render(scene, camera);
      };
      animate();

      // Cleanup hook stored on the element-level closure
      canvas.dataset.cleanup = "1";
      (canvas as unknown as { __cleanup?: () => void }).__cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        cancelAnimationFrame(raf);
        m1.geometry.dispose();
        m2.geometry.dispose();
        m3.geometry.dispose();
        renderer?.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      const c = canvas as unknown as { __cleanup?: () => void };
      c.__cleanup?.();
    };
  }, []);

  return <canvas id="hcanvas" ref={canvasRef} />;
};

export default HeroCanvas;
