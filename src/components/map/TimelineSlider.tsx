'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface TimelineSliderProps {
  position: number;
  onPositionChange: (position: number) => void;
  visible: boolean;
}

export default function TimelineSlider({
  position,
  onPositionChange,
  visible,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number>(0);
  const positionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);

  // Keep refs in sync to avoid stale closures in rAF
  positionRef.current = position;
  onPositionChangeRef.current = onPositionChange;

  const week = Math.round((position / 1000) * 16);

  // Play/pause animation — reads from refs to avoid stale closures
  useEffect(() => {
    if (!isPlaying || !visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // ~2 units per frame at 60fps → full timeline in ~8 seconds
      const increment = delta * 0.12;
      const next = Math.min(positionRef.current + increment, 1000);

      onPositionChangeRef.current(next);

      if (next >= 1000) {
        setIsPlaying(false);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, visible]);

  const handlePlayPause = useCallback(() => {
    if (positionRef.current >= 1000) {
      // Reset to start if at end
      onPositionChangeRef.current(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, []);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPlaying(false);
      onPositionChangeRef.current(Number(e.target.value));
    },
    [],
  );

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(10,15,26,0.75)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
      <button
        onClick={handlePlayPause}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] transition-all text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.9)]"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        value={position}
        onChange={handleSliderChange}
        className="flex-1 h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-cyan-500 cursor-pointer"
      />

      <span className="shrink-0 text-[10px] font-mono tracking-widest text-[rgba(255,255,255,0.5)] min-w-[60px] text-right">
        WEEK {week}
      </span>
    </div>
  );
}
