'use client';

interface MapToolbarPanelProps {
  activeLayer: string;
  layers: { facilities: boolean; routes: boolean; labels: boolean };
  onClose: () => void;
}

export default function MapToolbarPanel({
  activeLayer,
  onClose,
}: MapToolbarPanelProps) {
  return (
    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 glass-card p-3 w-[220px] toolbar-panel-enter">
      {/* Close button */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          {activeLayer === 'facilities' ? 'Infrastructure' : activeLayer === 'routes' ? 'Shipping Routes' : 'Labels'}
        </span>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-secondary text-xs"
        >
          {'\u2715'}
        </button>
      </div>

      {/* Infrastructure legend */}
      {activeLayer === 'facilities' && (
        <div className="space-y-2">
          {[
            { label: 'Refinery', color: 'bg-blue-500' },
            { label: 'Terminal', color: 'bg-emerald-500' },
            { label: 'Depot', color: 'bg-amber-500' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-[10px] font-mono text-text-secondary">{label}</span>
            </div>
          ))}
          <div className="h-px bg-border-subtle my-1" />
          <p className="text-[9px] font-mono text-text-dim">
            Circle size = capacity (bpd)
          </p>
        </div>
      )}

      {/* Routes info */}
      {activeLayer === 'routes' && (
        <div className="space-y-2">
          {[
            { label: 'Active Route', color: 'bg-emerald-500' },
            { label: 'Disrupted', color: 'bg-red-500' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-4 h-0.5 ${color} rounded`} />
              <span className="text-[10px] font-mono text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Labels info */}
      {activeLayer === 'labels' && (
        <p className="text-[10px] font-mono text-text-dim">
          Geographic labels overlay. Toggle to reduce map clutter.
        </p>
      )}
    </div>
  );
}
