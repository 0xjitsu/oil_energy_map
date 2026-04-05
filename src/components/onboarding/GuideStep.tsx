'use client';

interface GuideStepProps {
  icon: string;
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  isActive: boolean;
  onNavigate?: () => void;
}

export function GuideStep({
  icon,
  title,
  description,
  stepNumber,
  totalSteps,
  isActive,
  onNavigate,
}: GuideStepProps) {
  if (!isActive) return null;

  return (
    <div className="glass-card p-6 max-w-md w-full mx-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
            Step {stepNumber} of {totalSteps}
          </p>
          <h3 className="text-base font-mono text-text-primary font-semibold">{title}</h3>
        </div>
      </div>
      <p className="text-sm font-sans text-text-secondary leading-relaxed">{description}</p>
      {onNavigate && (
        <button
          onClick={onNavigate}
          className="mt-3 text-[10px] font-mono text-petron hover:text-petron/80 uppercase tracking-widest"
        >
          Jump to section →
        </button>
      )}
    </div>
  );
}
