'use client';

import { useState, useEffect } from 'react';
import { Ticker } from '@/components/ui/Ticker';
import { useEvents } from '@/hooks/useEvents';

function useCurrentDate() {
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase()
    );
  }, []);
  return date;
}

function useRelativeTime(date: Date | null) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!date) return;
    const update = () => {
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 60) setText('just now');
      else if (secs < 3600) setText(`${Math.floor(secs / 60)}m ago`);
      else setText(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [date]);
  return text;
}

export function Header() {
  const currentDate = useCurrentDate();
  const { isLive, lastUpdated } = useEvents();
  const updatedAgo = useRelativeTime(lastUpdated);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(6,10,16,0.85)]">
      {/* Philippine flag accent bars */}
      <div className="flex h-[3px]">
        <div className="flex-1 bg-[#0038a8]" />
        <div className="flex-1 bg-[#ce1126]" />
        <div className="flex-1 bg-[#fcd116]" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left — title */}
        <div>
          <h1 className="text-sm font-mono tracking-widest text-[rgba(255,255,255,0.9)] uppercase">
            PH Oil Intelligence
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-[rgba(255,255,255,0.3)] uppercase mt-0.5">
            Supply Chain Dashboard
          </p>
        </div>

        {/* Right — live badge + date */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono tracking-wider ${
            isLive
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
          }`}>
            <span className="relative flex h-2 w-2">
              {isLive && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            {isLive ? 'LIVE' : 'STATIC'}
          </span>
          {updatedAgo && (
            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.2)] tracking-wider">
              {updatedAgo}
            </span>
          )}
          <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)] tracking-wider">
            {currentDate}
          </span>
        </div>
      </div>

      <Ticker />
    </header>
  );
}
