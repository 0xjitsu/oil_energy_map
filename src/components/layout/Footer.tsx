export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.04)] py-4 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
            PH Oil Intelligence Dashboard — Data as of March 25, 2026
          </p>
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.2)] mt-0.5">
            For educational purposes. Not financial advice.
          </p>
        </div>
        <p className="text-[10px] font-mono text-[rgba(255,255,255,0.2)]">
          Built with Next.js + Leaflet
        </p>
      </div>
    </footer>
  );
}
