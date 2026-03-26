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
    <div className="absolute top-4 right-4 z-50 rounded-xl p-3 flex flex-col gap-2 bg-[rgba(10,15,26,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] shadow-lg">
      {layerConfig.map(({ key, label }) => {
        const isActive = layers[key as keyof typeof layers];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 font-mono text-[10px] uppercase tracking-widest ${
              isActive
                ? 'text-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.08)]'
                : 'text-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                  : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
