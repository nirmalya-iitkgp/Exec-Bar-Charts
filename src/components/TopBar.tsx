import React from 'react';
import { Download, Check } from 'lucide-react';
import { CHART_METADATA } from '../constants/mockData';
import { AspectRatio, ChartType } from '../types/chart';

interface TopBarProps {
  chartType: ChartType;
  onChartTypeChange: (nextType: ChartType) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (nextRatio: AspectRatio) => void;
  onDownloadPptx: () => void;
  isExporting: boolean;
  exportMessage: string | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  chartType,
  onChartTypeChange,
  aspectRatio,
  onAspectRatioChange,
  onDownloadPptx,
  isExporting,
  exportMessage,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Brand Zone */}
      <div className="flex items-center gap-2.5 shrink-0">
        <img
          src="./icon.svg"
          alt="Executive Chart Studio icon"
          className="w-8 h-8 rounded-md shrink-0"
          referrerPolicy="no-referrer"
        />
        <span className="font-display text-base lg:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Executive Chart Studio
        </span>
      </div>

      {/* Controls Zone: Chart Type Switcher + Slide Aspect Ratio */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <label htmlFor="chart-type-select" className="sr-only">
            Chart Type
          </label>
          <select
            id="chart-type-select"
            aria-label="Chart Type"
            value={chartType}
            onChange={(e) => onChartTypeChange(e.target.value as ChartType)}
            className="h-9 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-md hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors cursor-pointer"
          >
            {CHART_METADATA.map((meta) => (
              <option key={meta.type} value={meta.type}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div
          role="group"
          aria-label="Slide Aspect Ratio"
          className="hidden sm:flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md shrink-0"
        >
          <button
            type="button"
            onClick={() => onAspectRatioChange('16:9')}
            aria-pressed={aspectRatio === '16:9'}
            className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            16:9 Widescreen
          </button>
          <button
            type="button"
            onClick={() => onAspectRatioChange('4:3')}
            aria-pressed={aspectRatio === '4:3'}
            className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              aspectRatio === '4:3'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4:3 Standard
          </button>
        </div>
      </div>

      {/* Primary Action Zone */}
      <div className="flex items-center gap-3 shrink-0">
        {exportMessage && (
          <span className="hidden xl:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
            <Check className="w-3.5 h-3.5" />
            {exportMessage}
          </span>
        )}
        <button
          type="button"
          onClick={onDownloadPptx}
          disabled={isExporting}
          className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? 'Generating PPTX...' : 'Download Native PPTX'}
        </button>
      </div>
    </header>
  );
};
