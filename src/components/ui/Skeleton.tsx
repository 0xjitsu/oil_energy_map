'use client';

interface SkeletonBarProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonBar({ width = '100%', height = '12px', className = '' }: SkeletonBarProps) {
  return (
    <div
      className={`animate-pulse rounded bg-border-subtle ${className}`}
      style={{ width, height }}
    />
  );
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 48, className = '' }: SkeletonCircleProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-border-subtle ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface SkeletonCardProps {
  minH?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({ minH = '120px', className = '', children }: SkeletonCardProps) {
  return (
    <div className={`glass-card p-4 ${className}`} style={{ minHeight: minH }}>
      {children ?? (
        <div className="space-y-3">
          <SkeletonBar width="40%" height="10px" />
          <SkeletonBar width="100%" height="12px" />
          <SkeletonBar width="75%" height="12px" />
          <SkeletonBar width="60%" height="12px" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component-specific skeletons                                        */
/* ------------------------------------------------------------------ */

export function PricePanelSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ minHeight: 320 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} minH="140px">
          <div className="space-y-3">
            <SkeletonBar width="50%" height="10px" />
            <SkeletonBar width="60%" height="24px" />
            <SkeletonBar width="40%" height="10px" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function ScenarioPlannerSkeleton() {
  return (
    <SkeletonCard minH="400px">
      <div className="space-y-6">
        <SkeletonBar width="30%" height="10px" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBar width="25%" height="10px" />
            <SkeletonBar width="100%" height="8px" />
          </div>
        ))}
        <SkeletonBar width="100%" height="40px" />
      </div>
    </SkeletonCard>
  );
}

export function MarketShareSkeleton() {
  return (
    <SkeletonCard minH="300px">
      <div className="flex flex-col items-center gap-4">
        <SkeletonBar width="30%" height="10px" />
        <SkeletonCircle size={160} />
        <div className="grid grid-cols-2 gap-2 w-full">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBar key={i} width="100%" height="16px" />
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

export function PlayerCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ minHeight: 300 }}>
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} minH="160px">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonCircle size={24} />
              <SkeletonBar width="40%" height="14px" />
            </div>
            <SkeletonBar width="60%" height="12px" />
            <SkeletonBar width="100%" height="8px" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function ImpactCalculatorSkeleton() {
  return (
    <div style={{ minHeight: 320 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} minH="100px">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SkeletonCircle size={20} />
                <SkeletonBar width="50%" height="12px" />
              </div>
              <SkeletonBar width="70%" height="14px" />
              <SkeletonBar width="40%" height="10px" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

export function StressTestSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ minHeight: 320 }}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} minH="140px">
          <div className="space-y-3">
            <SkeletonBar width="45%" height="10px" />
            <SkeletonBar width="100%" height="20px" />
            <SkeletonBar width="60%" height="12px" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export function TimelineScrubberSkeleton() {
  return (
    <div className="glass-card p-4" style={{ minHeight: 80 }}>
      <div className="space-y-3">
        <SkeletonBar width="20%" height="10px" />
        <SkeletonBar width="100%" height="8px" />
      </div>
    </div>
  );
}

export function HowToGuideSkeleton() {
  return null;
}
