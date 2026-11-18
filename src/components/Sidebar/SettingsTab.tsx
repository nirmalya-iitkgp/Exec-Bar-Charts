import React from 'react';
import { ChartSettings, ChartType, NumberFormatMode } from '../../types/chart';

interface SettingsTabProps {
  chartType: ChartType;
  settings: ChartSettings;
  onUpdateSettings: (patch: Partial<ChartSettings>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  chartType,
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="space-y-6">
      {/* Slide Copy */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-800">Slide Titles &amp; Source</h2>
        <div>
          <label htmlFor="setting-title" className="block text-[11px] font-medium text-slate-600 mb-1">
            Slide Headline
          </label>
          <input
            id="setting-title"
            type="text"
            value={settings.title}
            onChange={(e) => onUpdateSettings({ title: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="setting-subtitle" className="block text-[11px] font-medium text-slate-600 mb-1">
            Subtitle
          </label>
          <input
            id="setting-subtitle"
            type="text"
            value={settings.subtitle}
            onChange={(e) => onUpdateSettings({ subtitle: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="setting-footnote" className="block text-[11px] font-medium text-slate-600 mb-1">
            Source Footnote
          </label>
          <input
            id="setting-footnote"
            type="text"
            value={settings.footnote}
            onChange={(e) => onUpdateSettings({ footnote: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Geometry & Typography Sliders */}
      <div className="border-t border-slate-200 pt-5 space-y-3.5">
        <h2 className="text-xs font-semibold text-slate-800">Geometry &amp; Typography</h2>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <label htmlFor="slider-font" className="text-slate-700">
              Label Font Size
            </label>
            <span className="font-mono text-slate-900 tabular-nums">{settings.fontSize}px</span>
          </div>
          <input
            id="slider-font"
            type="range"
            min={10}
            max={18}
            step={1}
            value={settings.fontSize}
            onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
            className="w-full cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <label htmlFor="slider-dot" className="text-slate-700">
              Marker / Dot Radius
            </label>
            <span className="font-mono text-slate-900 tabular-nums">{settings.dotRadius}px</span>
          </div>
          <input
            id="slider-dot"
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={settings.dotRadius}
            onChange={(e) => onUpdateSettings({ dotRadius: Number(e.target.value) })}
            className="w-full cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <label htmlFor="slider-line" className="text-slate-700">
              Line / Stem Thickness
            </label>
            <span className="font-mono text-slate-900 tabular-nums">{settings.lineThickness}px</span>
          </div>
          <input
            id="slider-line"
            type="range"
            min={1.5}
            max={6}
            step={0.5}
            value={settings.lineThickness}
            onChange={(e) => onUpdateSettings({ lineThickness: Number(e.target.value) })}
            className="w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Axis Formatting */}
      <div className="border-t border-slate-200 pt-5 space-y-3">
        <h2 className="text-xs font-semibold text-slate-800">Axis &amp; Value Formatting</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="select-num-format" className="block text-[11px] font-medium text-slate-600 mb-1">
              Number Format
            </label>
            <select
              id="select-num-format"
              value={settings.numberFormat}
              onChange={(e) => onUpdateSettings({ numberFormat: e.target.value as NumberFormatMode })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="standard">Standard</option>
              <option value="currency">Currency ($)</option>
              <option value="percent">Percent (%)</option>
              <option value="compact">Compact (K/M/B)</option>
            </select>
          </div>
          <div>
            <label htmlFor="input-decimals" className="block text-[11px] font-medium text-slate-600 mb-1">
              Max Decimals
            </label>
            <input
              id="input-decimals"
              type="number"
              min={0}
              max={3}
              value={settings.decimalPlaces}
              onChange={(e) => onUpdateSettings({ decimalPlaces: Math.max(0, Math.min(3, Number(e.target.value))) })}
              className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="input-prefix" className="block text-[11px] font-medium text-slate-600 mb-1">
              Value Prefix
            </label>
            <input
              id="input-prefix"
              type="text"
              placeholder="e.g. $"
              value={settings.valuePrefix}
              onChange={(e) => onUpdateSettings({ valuePrefix: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="input-suffix" className="block text-[11px] font-medium text-slate-600 mb-1">
              Value Suffix
            </label>
            <input
              id="input-suffix"
              type="text"
              placeholder="e.g. %"
              value={settings.valueSuffix}
              onChange={(e) => onUpdateSettings({ valueSuffix: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>Show Gridlines</span>
            <input
              type="checkbox"
              checked={settings.showGridlines}
              onChange={(e) => onUpdateSettings({ showGridlines: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>Show Data Labels</span>
            <input
              type="checkbox"
              checked={settings.showValues}
              onChange={(e) => onUpdateSettings({ showValues: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>Show Legend</span>
            <input
              type="checkbox"
              checked={settings.showLegend}
              onChange={(e) => onUpdateSettings({ showLegend: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
        </div>
      </div>

      {/* Chart-Specific Options */}
      {chartType === ChartType.LOLLIPOP && (
        <div className="border-t border-slate-200 pt-5 space-y-2">
          <h2 className="text-xs font-semibold text-slate-800">Lollipop Orientation</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['horizontal', 'vertical'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateSettings({ lollipopOrientation: mode })}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border capitalize cursor-pointer ${
                  settings.lollipopOrientation === mode
                    ? 'bg-blue-50 border-blue-600 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {chartType === ChartType.BARBELL && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-800">Barbell Options</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ barbellColorMode: 'directional' })}
              className={`py-1.5 px-2 text-xs font-medium rounded-md border cursor-pointer ${
                settings.barbellColorMode === 'directional'
                  ? 'bg-blue-50 border-blue-600 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Gain / Loss
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ barbellColorMode: 'palette' })}
              className={`py-1.5 px-2 text-xs font-medium rounded-md border cursor-pointer ${
                settings.barbellColorMode === 'palette'
                  ? 'bg-blue-50 border-blue-600 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Palette Primary
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Start Legend</label>
              <input
                type="text"
                value={settings.barbellStartLabel}
                onChange={(e) => onUpdateSettings({ barbellStartLabel: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">End Legend</label>
              <input
                type="text"
                value={settings.barbellEndLabel}
                onChange={(e) => onUpdateSettings({ barbellEndLabel: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {chartType === ChartType.SLOPEGRAPH && (
        <div className="border-t border-slate-200 pt-5 space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-800">Slopegraph Periods</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Period 1 Label</label>
              <input
                type="text"
                value={settings.period1Label}
                onChange={(e) => onUpdateSettings({ period1Label: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Period 2 Label</label>
              <input
                type="text"
                value={settings.period2Label}
                onChange={(e) => onUpdateSettings({ period2Label: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {chartType === ChartType.CLEVELAND && (
        <div className="border-t border-slate-200 pt-5 space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-800">Series Names</h2>
          <div className="space-y-2">
            {([0, 1, 2] as const).map((idx) => (
              <input
                key={idx}
                type="text"
                aria-label={`Series ${idx + 1} name`}
                value={settings.clevelandSeriesNames[idx]}
                onChange={(e) => {
                  const next: [string, string, string] = [...settings.clevelandSeriesNames] as [string, string, string];
                  next[idx] = e.target.value;
                  onUpdateSettings({ clevelandSeriesNames: next });
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
              />
            ))}
          </div>
        </div>
      )}

      {chartType === ChartType.BULLET && (
        <div className="border-t border-slate-200 pt-5 space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-800">Bullet Gauge Options</h2>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>Show Per-Row Scale Ticks</span>
            <input
              type="checkbox"
              checked={settings.bulletShowTicks}
              onChange={(e) => onUpdateSettings({ bulletShowTicks: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
        </div>
      )}

      {chartType === ChartType.DIVERGING && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-800">Likert &amp; Sentiment Alignment</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ divergingCenterMode: 'split-neutral' })}
              className={`py-1.5 px-2 text-xs font-medium rounded-md border cursor-pointer ${
                settings.divergingCenterMode === 'split-neutral'
                  ? 'bg-blue-50 border-blue-600 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Split Neutral
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ divergingCenterMode: 'zero-split' })}
              className={`py-1.5 px-2 text-xs font-medium rounded-md border cursor-pointer ${
                settings.divergingCenterMode === 'zero-split'
                  ? 'bg-blue-50 border-blue-600 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              Pure Sentiment Split
            </button>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>Normalize Rows to 100%</span>
            <input
              type="checkbox"
              checked={settings.divergingNormalize100}
              onChange={(e) => onUpdateSettings({ divergingNormalize100: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-medium text-slate-600">Segment Legend Labels</span>
            {([0, 1, 2, 3, 4] as const).map((idx) => (
              <input
                key={idx}
                type="text"
                aria-label={`Likert label ${idx + 1}`}
                value={settings.divergingLabels[idx]}
                onChange={(e) => {
                  const next = [...settings.divergingLabels] as [string, string, string, string, string];
                  next[idx] = e.target.value;
                  onUpdateSettings({ divergingLabels: next });
                }}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded"
              />
            ))}
          </div>
        </div>
      )}

      {chartType === ChartType.TERNARY && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-800">Ternary Vertex Axes &amp; Density</h2>
          <div className="space-y-2">
            {(['Top Vertex (Var A)', 'Bottom-Left (Var B)', 'Bottom-Right (Var C)'] as const).map(
              (axisTitle, idx) => (
                <div key={axisTitle}>
                  <label className="block text-[11px] text-slate-600 mb-1">{axisTitle}</label>
                  <input
                    type="text"
                    aria-label={axisTitle}
                    value={settings.ternaryAxisLabels[idx]}
                    onChange={(e) => {
                      const next = [...settings.ternaryAxisLabels] as [string, string, string];
                      next[idx] = e.target.value;
                      onUpdateSettings({ ternaryAxisLabels: next });
                    }}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded"
                  />
                </div>
              )
            )}
          </div>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer pt-1">
            <span>Show Density Halos</span>
            <input
              type="checkbox"
              checked={settings.ternaryShowDensity}
              onChange={(e) => onUpdateSettings({ ternaryShowDensity: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
        </div>
      )}

      {chartType === ChartType.VORONOI && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h2 className="text-xs font-semibold text-slate-800">Voronoi Container &amp; Hierarchy</h2>
          <div>
            <span className="block text-[11px] font-medium text-slate-600 mb-1.5">Container Boundary</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['circle', 'hexagon', 'octagon'] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => onUpdateSettings({ voronoiContainerShape: shape })}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md border capitalize cursor-pointer ${
                    settings.voronoiContainerShape === shape
                      ? 'bg-blue-50 border-blue-600 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer pt-1">
            <span>Show Parent Division Borders</span>
            <input
              type="checkbox"
              checked={settings.voronoiShowHierarchyBorders}
              onChange={(e) => onUpdateSettings({ voronoiShowHierarchyBorders: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
          </label>
        </div>
      )}
    </div>
  );
};
