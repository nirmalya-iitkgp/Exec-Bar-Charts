import React, { useState } from 'react';
import { AspectRatio, ChartDatasetMap, ChartMeta, ChartSettings, ChartType, PaletteColors } from '../types/chart';
import { ChartRenderer } from './charts/ChartRenderer';

interface SlideCanvasProps {
  chartType: ChartType;
  chartMeta: ChartMeta;
  datasets: ChartDatasetMap;
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onResetSample: () => void;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  chartType,
  chartMeta,
  datasets,
  aspectRatio,
  settings,
  colors,
  onResetSample,
}) => {
  const [hoverInfo, setHoverInfo] = useState<{ title: string; detail: string } | null>(null);
  const activeRowCount = datasets[chartType]?.length ?? 0;

  return (
    <main className="flex-1 min-w-0 bg-[#EEF0F4] flex flex-col items-center justify-center p-4 lg:p-8 overflow-auto">
      <div className="w-full max-w-[960px] flex flex-col gap-3">
        {/* Subtle unboxed slide context bar */}
        <div className="flex items-center justify-between gap-4 text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-700">{chartMeta.label}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{activeRowCount} rows</span>
            <span aria-hidden="true">·</span>
            <span>{aspectRatio === '16:9' ? '16:9 Widescreen (10 × 5.625 in)' : '4:3 Standard (10 × 7.5 in)'}</span>
          </div>
          <div className="hidden sm:block text-right truncate font-mono text-[11px] text-slate-600 min-h-[16px]">
            {hoverInfo ? `${hoverInfo.title}: ${hoverInfo.detail}` : 'Hover chart elements to inspect values'}
          </div>
        </div>

        {/* Slide card container */}
        <div
          data-testid="slide-canvas-frame"
          data-aspect-ratio={aspectRatio}
          className={`w-full bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-150 ${
            aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-[4/3] max-w-[780px] mx-auto'
          }`}
        >
          <ChartRenderer
            chartType={chartType}
            datasets={datasets}
            aspectRatio={aspectRatio}
            settings={settings}
            colors={colors}
            onResetSample={onResetSample}
            onHover={setHoverInfo}
          />
        </div>
      </div>
    </main>
  );
};
