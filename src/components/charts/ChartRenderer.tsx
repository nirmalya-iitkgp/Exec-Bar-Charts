import React from 'react';
import { BarChart3, RotateCcw } from 'lucide-react';
import {
  AspectRatio,
  BarbellRow,
  BulletRow,
  BumpRow,
  ChartDatasetMap,
  ChartSettings,
  ChartType,
  ClevelandRow,
  DivergingRow,
  LollipopRow,
  PaletteColors,
  SlopegraphRow,
  SpanRow,
} from '../../types/chart';
import { BarbellChartSvg } from './BarbellChartSvg';
import { LollipopChartSvg } from './LollipopChartSvg';
import { ClevelandChartSvg } from './ClevelandChartSvg';
import { SlopegraphChartSvg } from './SlopegraphChartSvg';
import { BumpChartSvg } from './BumpChartSvg';
import { BulletChartSvg } from './BulletChartSvg';
import { SpanChartSvg } from './SpanChartSvg';
import { DivergingChartSvg } from './DivergingChartSvg';

interface ChartRendererProps {
  chartType: ChartType;
  datasets: ChartDatasetMap;
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onResetSample: () => void;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartType,
  datasets,
  aspectRatio,
  settings,
  colors,
  onResetSample,
  onHover,
}) => {
  const activeRows = datasets[chartType];

  if (!activeRows || activeRows.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No Data Rows Available</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-5">
          Add rows in the Data tab or paste CSV values to render this slide chart.
        </p>
        <button
          type="button"
          onClick={onResetSample}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore Sample Dataset
        </button>
      </div>
    );
  }

  switch (chartType) {
    case ChartType.BARBELL:
      return (
        <BarbellChartSvg
          rows={datasets[ChartType.BARBELL] as BarbellRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.LOLLIPOP:
      return (
        <LollipopChartSvg
          rows={datasets[ChartType.LOLLIPOP] as LollipopRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.CLEVELAND:
      return (
        <ClevelandChartSvg
          rows={datasets[ChartType.CLEVELAND] as ClevelandRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.SLOPEGRAPH:
      return (
        <SlopegraphChartSvg
          rows={datasets[ChartType.SLOPEGRAPH] as SlopegraphRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.BUMP:
      return (
        <BumpChartSvg
          rows={datasets[ChartType.BUMP] as BumpRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.BULLET:
      return (
        <BulletChartSvg
          rows={datasets[ChartType.BULLET] as BulletRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.SPAN:
      return (
        <SpanChartSvg
          rows={datasets[ChartType.SPAN] as SpanRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
    case ChartType.DIVERGING:
      return (
        <DivergingChartSvg
          rows={datasets[ChartType.DIVERGING] as DivergingRow[]}
          aspectRatio={aspectRatio}
          settings={settings}
          colors={colors}
          onHover={onHover}
        />
      );
  }
};
