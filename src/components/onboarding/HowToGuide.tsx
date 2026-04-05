'use client';

import { useState, useCallback, useEffect } from 'react';
import { GUIDE_STEPS } from '@/data/guide-steps';
import { useDismissable } from '@/hooks/useDismissable';
import { GuideStep } from './GuideStep';

export function HowToGuide() {
  const { dismissed, dismiss } = useDismissable('how-to-guide');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [autoOpened, setAutoOpened] = useState(false);

  const handleOpen = useCallback(() => {
    setStep(0);
    setOpen(true);
  }, []);

  // Listen for Header "?" button trigger
  useEffect(() => {
    const handler = () => handleOpen();
    window.addEventListener('open-how-to-guide', handler);
    return () => window.removeEventListener('open-how-to-guide', handler);
  }, [handleOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleDismissForever = useCallback(() => {
    dismiss();
    setOpen(false);
  }, [dismiss]);

  const handleNext = useCallback(() => {
    if (step < GUIDE_STEPS.length - 1) setStep((s) => s + 1);
    else handleClose();
  }, [step, handleClose]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleNavigate = useCallback(() => {
    const target = GUIDE_STEPS[step]?.targetSection;
    if (target) {
      handleClose();
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [step, handleClose]);

  // Auto-show on first visit (only once per session)
  if (!dismissed && !open && !autoOpened) {
    return (
      <>
        <HowToTrigger onClick={handleOpen} />
        <AutoOpen onOpen={() => { setAutoOpened(true); handleOpen(); }} />
      </>
    );
  }

  return (
    <>
      <HowToTrigger onClick={handleOpen} />

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center command-palette-overlay" onClick={handleClose}>
          <div onClick={(e) => e.stopPropagation()}>
            <GuideStep
              icon={GUIDE_STEPS[step].icon}
              title={GUIDE_STEPS[step].title}
              description={GUIDE_STEPS[step].description}
              stepNumber={step + 1}
              totalSteps={GUIDE_STEPS.length}
              isActive={true}
              onNavigate={GUIDE_STEPS[step].targetSection ? handleNavigate : undefined}
            />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between max-w-md w-full mx-4 mt-3">
              <button
                onClick={handlePrev}
                disabled={step === 0}
                className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-text-dim hover:text-text-secondary disabled:opacity-30 transition-colors"
              >
                ← Back
              </button>

              {/* Progress dots */}
              <div className="flex gap-0">
                {GUIDE_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className="p-2"
                  >
                    <span className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                      i === step ? 'bg-petron' : 'bg-border-hover'
                    }`} />
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-petron/20 text-petron hover:bg-petron/30 transition-colors"
              >
                {step === GUIDE_STEPS.length - 1 ? 'Done' : 'Next →'}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={handleDismissForever}
                className="text-[9px] font-mono text-text-dim hover:text-text-secondary uppercase tracking-widest"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HowToTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 xl:bottom-6 right-6 z-40 w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-hover transition-all"
      aria-label="How to use this dashboard"
      title="How to use this dashboard"
    >
      <span className="text-sm font-mono">?</span>
    </button>
  );
}

function AutoOpen({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onOpen, 2000);
    return () => clearTimeout(timer);
  }, [onOpen]);
  return null;
}
