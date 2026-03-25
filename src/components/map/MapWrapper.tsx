'use client';

import dynamic from 'next/dynamic';

const IntelMap = dynamic(() => import('./IntelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] lg:h-[700px] w-full rounded-xl bg-[#0a0f1a] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
      <div className="text-[rgba(255,255,255,0.25)] font-mono text-xs uppercase tracking-widest">
        Loading Intelligence Map...
      </div>
    </div>
  ),
});

export default function MapWrapper() {
  return <IntelMap />;
}
