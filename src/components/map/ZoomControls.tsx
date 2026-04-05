'use client';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className="w-12 h-12 flex items-center justify-center rounded-lg glass-card text-text-primary text-lg font-mono hover:bg-surface-hover transition-colors active:scale-95"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="w-12 h-12 flex items-center justify-center rounded-lg glass-card text-text-primary text-lg font-mono hover:bg-surface-hover transition-colors active:scale-95"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={onReset}
        className="w-12 h-12 flex items-center justify-center rounded-lg glass-card text-text-dim text-[10px] font-mono uppercase tracking-widest hover:bg-surface-hover hover:text-text-secondary transition-colors active:scale-95"
        aria-label="Reset view"
      >
        PH
      </button>
    </div>
  );
}
