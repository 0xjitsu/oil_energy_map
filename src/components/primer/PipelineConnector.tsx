'use client';

import { useEffect, useRef, useState } from 'react';

interface PipelineConnectorProps {
  fromColor: string;
  toColor: string;
  label?: string;
}

export function PipelineConnector({ fromColor, toColor, label }: PipelineConnectorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="primer-stage flex flex-col items-center py-8 sm:py-12"
    >
      {/* Animated pipe */}
      <svg
        width="48"
        height="120"
        viewBox="0 0 48 120"
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Pipe body */}
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
        {/* Animated flow fill */}
        <rect
          x="20"
          y="0"
          width="8"
          height="120"
          rx="4"
          style={{
            fill: `url(#flow-${fromColor.replace(/[^a-z0-9]/gi, '')})`,
            clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
            transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id={`flow-${fromColor.replace(/[^a-z0-9]/gi, '')}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={fromColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Arrow at bottom */}
        <path
          d="M24 115 L18 105 L30 105 Z"
          fill={toColor}
          style={{
            opacity: visible ? 0.8 : 0,
            transition: 'opacity 0.5s ease 1s',
          }}
        />
      </svg>

      {/* Optional label */}
      {label && (
        <span
          className="text-[9px] font-mono uppercase tracking-widest mt-2"
          style={{
            color: 'var(--text-dim)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 1.2s',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
