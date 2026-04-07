'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="glass-card max-w-lg w-full p-8 text-center">
        {/* NERV-style header */}
        <p className="text-[10px] uppercase tracking-widest text-status-red font-mono mb-6">
          System Error &mdash; Pattern Blue
        </p>

        {/* Alert icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <svg
            className="h-7 w-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-lg font-sans font-semibold text-text-primary mb-2">
          Module Failed to Load
        </h1>

        <p className="text-sm font-sans text-text-secondary mb-6">
          An unexpected error occurred in the intelligence dashboard. The system
          will attempt graceful degradation.
        </p>

        {/* Error digest */}
        {error.digest && (
          <p className="text-[10px] font-mono text-text-dim mb-6 break-all">
            Digest: {error.digest}
          </p>
        )}

        {/* Retry button */}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-border-hover text-text-primary text-sm font-mono hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Retry Module
        </button>

        {/* Footer */}
        <p className="mt-8 text-[9px] uppercase tracking-widest text-text-dim font-mono">
          Graceful Degradation Active
        </p>
      </div>
    </div>
  );
}
