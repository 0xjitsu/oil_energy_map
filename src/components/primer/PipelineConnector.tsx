'use client';

import { useId } from 'react';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface PipelineConnectorProps {
  fromColor: string;
  toColor: string;
  label?: string;
}

export function PipelineConnector({ fromColor, toColor, label }: PipelineConnectorProps) {
  const uniqueId = useId();
  const gradientId = `pipe-grad-${uniqueId.replace(/:/g, '')}`;
  const clipId = `pipe-clip-${uniqueId.replace(/:/g, '')}`;
  const { ref, progress, isInView } = useElementScrollProgress<HTMLDivElement>();

  // Map scroll progress to fill (0 at entry, 1 at exit)
  const fill = Math.max(0, Math.min(1, (progress - 0.1) / 0.8));

  return (
    <div
      ref={ref}
      className="primer-stage flex flex-col items-center py-8 sm:py-12"
    >
      <svg
        width="48"
        height="120"
        viewBox="0 0 48 120"
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect
              x="0"
              y="0"
              width="48"
              height={120 * fill}
            />
          </clipPath>
        </defs>

        {/* Pipe body (background) */}
        <rect
          x="18"
          y="0"
          width="12"
          height="120"
          rx="6"
          fill="var(--bg-elevated)"
          stroke="var(--border-hover)"
          strokeWidth="1"
        />

        {/* Scroll-synced fill */}
        <rect
          x="20"
          y="0"
          width="8"
          height="120"
          rx="4"
          fill={`url(#${gradientId})`}
          clipPath={`url(#${clipId})`}
        />

        {/* Animated flow particles */}
        {isInView && (
          <>
            <circle cx="24" cy="20" r="1.5" fill={fromColor} opacity="0.6">
              <animate
                attributeName="cy"
                from="10"
                to="110"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.6;0.6;0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="24" cy="60" r="1" fill={toColor} opacity="0.4">
              <animate
                attributeName="cy"
                from="30"
                to="120"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.4;0.4;0"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Arrow at bottom — appears when fill > 80% */}
        <path
          d="M24 115 L18 105 L30 105 Z"
          fill={toColor}
          style={{
            opacity: fill > 0.8 ? 0.8 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      </svg>

      {/* Label — fades in when fill > 50% */}
      {label && (
        <span
          className="text-[9px] font-mono uppercase tracking-widest mt-2"
          style={{
            color: 'var(--text-dim)',
            opacity: fill > 0.5 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
