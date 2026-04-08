'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, snapPoints = [0.6], children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(snapPoints[0] * 100);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setHeight(snapPoints[0] * 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, snapPoints]);

  if (!isOpen) return null;

  function handleDragStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = height;
  }

  function handleDrag(e: React.TouchEvent) {
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(10, Math.min(90, dragStartHeight.current + deltaPercent));
    setHeight(newHeight);
  }

  function handleDragEnd() {
    if (height < 15) {
      onClose();
      return;
    }
    const snapPercents = snapPoints.map((s) => s * 100);
    const nearest = snapPercents.reduce((a, b) => (Math.abs(b - height) < Math.abs(a - height) ? b : a));
    setHeight(nearest);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 inset-x-0 z-[91] glass-card rounded-t-2xl overflow-y-auto"
        style={{
          height: `${height}vh`,
          maxHeight: '90vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transition: 'height 0.2s ease-out',
        }}
      >
        {/* Drag handle */}
        <div
          className="sticky top-0 flex justify-center py-3 cursor-grab active:cursor-grabbing bg-bg-card/90 backdrop-blur rounded-t-2xl z-10"
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1 rounded-full bg-border-hover" />
        </div>

        <div className="px-4 pb-4">{children}</div>
      </div>
    </>
  );
}
