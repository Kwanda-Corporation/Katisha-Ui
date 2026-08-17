import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface BusAnimationProps {
  size?: number
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export default function BusAnimation({ size = 50, className = '', loop = true, autoplay = true }: BusAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      path: '/bus.json',
    });
    return () => anim.destroy();
  }, [loop, autoplay]);

  return (
    <div ref={containerRef} className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }} />
  );
}
