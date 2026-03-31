'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { allStations } from '@/data/stations';
import { facilities } from '@/data/facilities';
import { REGION_NAMES } from '@/data/regions';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectStation?: (stationId: string) => void;
  onSelectRegion?: (region: string) => void;
  onToggleLayer?: (layer: string) => void;
}

interface SearchResult {
  type: 'station' | 'facility' | 'region' | 'action';
  icon: string;
  label: string;
  detail?: string;
  id: string;
}

const LAYER_ACTIONS: SearchResult[] = [
  { type: 'action', icon: '\u{1F3ED}', label: 'Toggle Infrastructure', id: 'toggle-facilities' },
  { type: 'action', icon: '\u26FD', label: 'Toggle Stations', id: 'toggle-stations' },
  { type: 'action', icon: '\u{1F6A2}', label: 'Toggle Routes', id: 'toggle-routes' },
  { type: 'action', icon: '\u{1F3F7}\uFE0F', label: 'Toggle Labels', id: 'toggle-labels' },
];

export default function CommandPalette({
  open,
  onClose,
  onSelectStation,
  onSelectRegion,
  onToggleLayer,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return LAYER_ACTIONS;

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search stations (cap at 8)
    const stationMatches = allStations
      .filter((s) => s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q))
      .slice(0, 8)
      .map((s): SearchResult => ({
        type: 'station',
        icon: '\u26FD',
        label: s.name,
        detail: `${s.brand} \u00B7 ${s.region ?? 'Unknown'}`,
        id: s.id,
      }));
    matches.push(...stationMatches);

    // Search facilities
    const facilityMatches = facilities
      .filter((f) => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q))
      .slice(0, 5)
      .map((f): SearchResult => ({
        type: 'facility',
        icon: f.type === 'refinery' ? '\u{1F3ED}' : f.type === 'terminal' ? '\u{1F6A2}' : '\u{1F4E6}',
        label: f.name,
        detail: `${f.operator} \u00B7 ${f.location}`,
        id: f.id,
      }));
    matches.push(...facilityMatches);

    // Search regions
    const regionMatches = REGION_NAMES
      .filter((r) => r.toLowerCase().includes(q))
      .slice(0, 5)
      .map((r): SearchResult => ({
        type: 'region',
        icon: '\u{1F4CD}',
        label: r,
        id: `region-${r}`,
      }));
    matches.push(...regionMatches);

    // Search actions
    const actionMatches = LAYER_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
    matches.push(...actionMatches);

    return matches.slice(0, 20);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'station':
        onSelectStation?.(result.id);
        break;
      case 'region':
        onSelectRegion?.(result.label);
        break;
      case 'action':
        onToggleLayer?.(result.id.replace('toggle-', ''));
        break;
    }
    onClose();
  }, [onSelectStation, onSelectRegion, onToggleLayer, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, handleSelect]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="w-full max-w-lg glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <span className="text-text-dim text-sm">{'\u{1F50D}'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search stations, regions, actions..."
            className="flex-1 bg-transparent text-sm font-mono text-text-primary outline-none placeholder:text-text-dim"
          />
          <span className="shortcut-badge">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-3 text-sm font-mono text-text-dim">No results found</p>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? 'bg-border-hover' : 'hover:bg-surface-hover'
              }`}
            >
              <span className="text-sm">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-text-primary truncate">{result.label}</p>
                {result.detail && (
                  <p className="text-[10px] font-mono text-text-dim truncate">{result.detail}</p>
                )}
              </div>
              <span className="text-[9px] font-mono text-text-dim uppercase">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
