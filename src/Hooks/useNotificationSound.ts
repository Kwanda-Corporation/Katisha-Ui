import { useCallback, useRef, useEffect } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctx.resume();
      unlockedRef.current = true;
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        const audio = new Audio();
        audio.src = '/notification.wav';
        audio.volume = 0.7;
        audio.preload = 'auto';
        audioRef.current = audio;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(800, ctx.currentTime);
          o.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          o.start(ctx.currentTime);
          o.stop(ctx.currentTime + 0.3);
        } catch {}
      });
    } catch {}
  }, []);

  const playNotificationSequence = useCallback(() => {
    playSound();
    setTimeout(() => playSound(), 600);
  }, [playSound]);

  return { playSound, playNotificationSequence };
}
