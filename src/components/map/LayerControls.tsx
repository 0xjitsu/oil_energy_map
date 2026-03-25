'use client';

interface LayerControlsProps {
  layers: {
    facilities: boolean;
    routes: boolean;
    labels: boolean;
  };
  onToggle: (layer: string) => void;
}

const layerConfig: { key: string; label: string }[] = [
  { key: 'facilities', label: 'Infrastructure' },
  { key: 'routes', label: 'Routes' },
  { key: 'labels', label: 'Labels' },
];

export default function LayerControls({ layers, onToggle }: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-50 bg-[#0a0f1a] border border-[rgba(255,255,255,0.04)] rounded-xl p-3 flex flex-col gap-2">
      {layerConfig.map(({ key, label }) => {
        const isActive = layers[key as keyof typeof layers];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all font-mono text-[10px] uppercase tracking-widest ${
              isActive
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.06)]'
                : 'text-[rgba(255,255,255,0.25)] bg-transparent'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                isActive ? 'bg-emerald-400' : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
