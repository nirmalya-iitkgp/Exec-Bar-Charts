import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { EXECUTIVE_PALETTES, normalizeHexColor } from '../../constants/palettes';
import { PaletteColors } from '../../types/chart';

interface PaletteTabProps {
  selectedPaletteId: string;
  colors: PaletteColors;
  onSelectPreset: (presetId: string) => void;
  onUpdateColor: (key: keyof PaletteColors, hex: string) => void;
}

const CUSTOM_COLOR_FIELDS: Array<{ key: keyof PaletteColors; label: string }> = [
  { key: 'primary', label: 'Primary Series' },
  { key: 'secondary', label: 'Secondary Series' },
  { key: 'tertiary', label: 'Tertiary Series' },
  { key: 'positive', label: 'Positive / Gain' },
  { key: 'negative', label: 'Negative / Target' },
  { key: 'neutral', label: 'Baseline / Neutral' },
];

export const PaletteTab: React.FC<PaletteTabProps> = ({
  selectedPaletteId,
  colors,
  onSelectPreset,
  onUpdateColor,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold text-slate-800 mb-3">Executive Palettes</h2>
        <div className="space-y-2">
          {EXECUTIVE_PALETTES.map((preset) => {
            const isSelected = preset.id === selectedPaletteId;
            const swatches = [
              preset.colors.primary,
              preset.colors.secondary,
              preset.colors.tertiary,
              preset.colors.positive,
              preset.colors.negative,
            ];
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-900">{preset.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">{preset.description}</p>
                <div className="grid grid-cols-5 h-2.5 rounded-sm overflow-hidden border border-slate-200/70">
                  {swatches.map((hex, i) => (
                    <span key={i} style={{ backgroundColor: hex }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-semibold text-slate-800">Custom Hex Overrides</h2>
          <button
            type="button"
            onClick={() => onSelectPreset(selectedPaletteId)}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Preset
          </button>
        </div>

        <div className="space-y-2.5">
          {CUSTOM_COLOR_FIELDS.map(({ key, label }) => {
            const currentHex = normalizeHexColor(colors[key]);
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <label htmlFor={`color-${key}`} className="text-xs text-slate-700">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={currentHex}
                    onChange={(e) => onUpdateColor(key, e.target.value)}
                    className="w-7 h-7 p-0.5 bg-white border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    aria-label={`${label} hex code`}
                    value={colors[key]}
                    onChange={(e) => onUpdateColor(key, e.target.value)}
                    onBlur={(e) => onUpdateColor(key, normalizeHexColor(e.target.value, currentHex))}
                    className="w-20 px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-300 rounded text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
