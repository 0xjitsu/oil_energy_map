import { Ticker } from '@/components/ui/Ticker';

export function Header() {
  return (
    <header>
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
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono tracking-wider text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            LIVE
          </span>
          <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)] tracking-wider">
            MAR 25, 2026
          </span>
        </div>
      </div>

      <Ticker />
    </header>
  );
}
