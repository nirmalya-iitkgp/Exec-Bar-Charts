import React, { useRef, useState } from 'react';
import { Plus, Trash2, RotateCcw, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  BarbellRow,
  BulletRow,
  BumpRow,
  ChartDatasetMap,
  ChartSettings,
  ChartType,
  ClevelandRow,
  DivergingRow,
  LollipopRow,
  SlopegraphRow,
  SpanRow,
} from '../../types/chart';
import { CHART_METADATA } from '../../constants/mockData';
import { parseCsvForChartType, serializeDatasetToCsv } from '../../utils/csvParser';
import { createRowId, sanitizeNumber, sanitizeOptionalNumber } from '../../utils/formatters';

interface DataTabProps {
  chartType: ChartType;
  datasets: ChartDatasetMap;
  settings: ChartSettings;
  onUpdateRows: <K extends ChartType>(type: K, rows: ChartDatasetMap[K]) => void;
  onUpdateSettings: (patch: Partial<ChartSettings>) => void;
  onResetSample: () => void;
}

export const DataTab: React.FC<DataTabProps> = ({
  chartType,
  datasets,
  settings,
  onUpdateRows,
  onUpdateSettings,
  onResetSample,
}) => {
  const [csvText, setCsvText] = useState('');
  const [csvStatus, setCsvStatus] = useState<{ type: 'error' | 'success'; message: string; warnings?: string[] } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const meta = CHART_METADATA.find((m) => m.type === chartType)!;
  const rows = datasets[chartType];

  const handleLoadCurrentCsv = () => {
    setCsvText(serializeDatasetToCsv(chartType, rows, settings));
    setCsvStatus(null);
  };

  const handleApplyCsv = () => {
    const res = parseCsvForChartType(chartType, csvText);
    if (res.error) {
      setCsvStatus({ type: 'error', message: res.error, warnings: res.warnings });
      return;
    }
    onUpdateRows(chartType, res.rows as ChartDatasetMap[typeof chartType]);
    if (chartType === ChartType.BUMP && res.detectedPeriods && res.detectedPeriods.length >= 2) {
      onUpdateSettings({ bumpPeriods: res.detectedPeriods });
    }
    setCsvStatus({
      type: 'success',
      message: `Imported ${res.rows.length} rows successfully.`,
      warnings: res.warnings,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setCsvText(content);
      const res = parseCsvForChartType(chartType, content);
      if (res.error) {
        setCsvStatus({ type: 'error', message: res.error, warnings: res.warnings });
      } else {
        onUpdateRows(chartType, res.rows as ChartDatasetMap[typeof chartType]);
        if (chartType === ChartType.BUMP && res.detectedPeriods && res.detectedPeriods.length >= 2) {
          onUpdateSettings({ bumpPeriods: res.detectedPeriods });
        }
        setCsvStatus({
          type: 'success',
          message: `Loaded ${res.rows.length} rows from ${file.name}.`,
          warnings: res.warnings,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteRow = (id: string) => {
    const filtered = (rows as Array<{ id: string }>).filter((r) => r.id !== id);
    onUpdateRows(chartType, filtered as ChartDatasetMap[typeof chartType]);
  };

  const handleAddRow = () => {
    switch (chartType) {
      case ChartType.BARBELL:
        onUpdateRows(ChartType.BARBELL, [
          ...(datasets[ChartType.BARBELL] as BarbellRow[]),
          { id: createRowId('bb'), category: 'New Unit', startValue: 15, endValue: 22 },
        ]);
        break;
      case ChartType.LOLLIPOP:
        onUpdateRows(ChartType.LOLLIPOP, [
          ...(datasets[ChartType.LOLLIPOP] as LollipopRow[]),
          { id: createRowId('lp'), category: 'New Segment', value: 42 },
        ]);
        break;
      case ChartType.CLEVELAND:
        onUpdateRows(ChartType.CLEVELAND, [
          ...(datasets[ChartType.CLEVELAND] as ClevelandRow[]),
          { id: createRowId('cl'), category: 'New Region', seriesA: 45, seriesB: 62, seriesC: 79 },
        ]);
        break;
      case ChartType.SLOPEGRAPH:
        onUpdateRows(ChartType.SLOPEGRAPH, [
          ...(datasets[ChartType.SLOPEGRAPH] as SlopegraphRow[]),
          { id: createRowId('sg'), category: 'New Vertical', period1Value: 35, period2Value: 48 },
        ]);
        break;
      case ChartType.BUMP: {
        const current = datasets[ChartType.BUMP] as BumpRow[];
        const nextRank = current.length + 1;
        const ranks: Record<string, number> = {};
        settings.bumpPeriods.forEach((p) => {
          ranks[p] = nextRank;
        });
        onUpdateRows(ChartType.BUMP, [
          ...current,
          { id: createRowId('bp'), entity: `Competitor ${nextRank}`, ranks },
        ]);
        break;
      }
      case ChartType.BULLET:
        onUpdateRows(ChartType.BULLET, [
          ...(datasets[ChartType.BULLET] as BulletRow[]),
          { id: createRowId('bl'), metric: 'New KPI', actual: 78, target: 85, poorThreshold: 60, goodThreshold: 80 },
        ]);
        break;
      case ChartType.SPAN:
        onUpdateRows(ChartType.SPAN, [
          ...(datasets[ChartType.SPAN] as SpanRow[]),
          { id: createRowId('sp'), category: 'New Band', minValue: 140, maxValue: 210, averageValue: 175 },
        ]);
        break;
      case ChartType.DIVERGING:
        onUpdateRows(ChartType.DIVERGING, [
          ...(datasets[ChartType.DIVERGING] as DivergingRow[]),
          {
            id: createRowId('dv'),
            category: 'New Question',
            strongNegative: 10,
            negative: 15,
            neutral: 20,
            positive: 35,
            strongPositive: 20,
          },
        ]);
        break;
    }
  };

  const updateRowField = <T extends { id: string }>(id: string, patch: Partial<T>) => {
    const updated = (rows as unknown as T[]).map((row) => (row.id === id ? { ...row, ...patch } : row));
    onUpdateRows(chartType, updated as unknown as ChartDatasetMap[typeof chartType]);
  };

  const renderDynamicTable = () => {
    switch (chartType) {
      case ChartType.BARBELL: {
        const data = rows as BarbellRow[];
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-right py-2 px-1.5 w-20">Start</th>
                <th className="text-right py-2 px-1.5 w-20">End</th>
                <th className="w-7" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      aria-label={`Category for ${row.category}`}
                      value={row.category}
                      onChange={(e) => updateRowField<BarbellRow>(row.id, { category: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      type="number"
                      step="any"
                      aria-label={`Start value for ${row.category}`}
                      value={row.startValue}
                      onChange={(e) =>
                        updateRowField<BarbellRow>(row.id, { startValue: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      type="number"
                      step="any"
                      aria-label={`End value for ${row.category}`}
                      value={row.endValue}
                      onChange={(e) =>
                        updateRowField<BarbellRow>(row.id, { endValue: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.category}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.LOLLIPOP: {
        const data = rows as LollipopRow[];
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-right py-2 px-1.5 w-24">Value</th>
                <th className="w-7" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      aria-label={`Category for ${row.category}`}
                      value={row.category}
                      onChange={(e) => updateRowField<LollipopRow>(row.id, { category: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      type="number"
                      step="any"
                      aria-label={`Value for ${row.category}`}
                      value={row.value}
                      onChange={(e) =>
                        updateRowField<LollipopRow>(row.id, { value: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.category}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.CLEVELAND: {
        const data = rows as ClevelandRow[];
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-1">Category</th>
                <th className="text-right py-2 px-1 w-14">A</th>
                <th className="text-right py-2 px-1 w-14">B</th>
                <th className="text-right py-2 px-1 w-14">C</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-1">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRowField<ClevelandRow>(row.id, { category: e.target.value })}
                      className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      value={row.seriesA}
                      onChange={(e) =>
                        updateRowField<ClevelandRow>(row.id, { seriesA: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      value={row.seriesB}
                      onChange={(e) =>
                        updateRowField<ClevelandRow>(row.id, { seriesB: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      value={row.seriesC}
                      onChange={(e) =>
                        updateRowField<ClevelandRow>(row.id, { seriesC: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-0.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.category}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.SLOPEGRAPH: {
        const data = rows as SlopegraphRow[];
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-right py-2 px-1.5 w-20">{settings.period1Label || 'P1'}</th>
                <th className="text-right py-2 px-1.5 w-20">{settings.period2Label || 'P2'}</th>
                <th className="w-7" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRowField<SlopegraphRow>(row.id, { category: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      type="number"
                      step="any"
                      value={row.period1Value}
                      onChange={(e) =>
                        updateRowField<SlopegraphRow>(row.id, { period1Value: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-1">
                    <input
                      type="number"
                      step="any"
                      value={row.period2Value}
                      onChange={(e) =>
                        updateRowField<SlopegraphRow>(row.id, { period2Value: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.category}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.BUMP: {
        const data = rows as BumpRow[];
        const periods = settings.bumpPeriods;
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-1">Entity</th>
                {periods.map((p) => (
                  <th key={p} className="text-right py-2 px-1 w-11">
                    {p}
                  </th>
                ))}
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-1">
                    <input
                      type="text"
                      value={row.entity}
                      onChange={(e) => updateRowField<BumpRow>(row.id, { entity: e.target.value })}
                      className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  {periods.map((p) => (
                    <td key={p} className="py-1.5 px-0.5">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={row.ranks[p] ?? 1}
                        onChange={(e) => {
                          const nextVal = Math.max(1, Math.round(sanitizeNumber(e.target.value, 1)));
                          updateRowField<BumpRow>(row.id, {
                            ranks: { ...row.ranks, [p]: nextVal },
                          });
                        }}
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="py-1.5 pl-0.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.entity}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.BULLET: {
        const data = rows as BulletRow[];
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="text-left py-2 pr-1">Metric</th>
                  <th className="text-right py-2 px-1 w-14">Actual</th>
                  <th className="text-right py-2 px-1 w-14">Target</th>
                  <th className="text-right py-2 px-1 w-12">Poor</th>
                  <th className="text-right py-2 px-1 w-12">Good</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="py-1.5 pr-1">
                      <input
                        type="text"
                        value={row.metric}
                        onChange={(e) => updateRowField<BulletRow>(row.id, { metric: e.target.value })}
                        className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-0.5">
                      <input
                        type="number"
                        step="any"
                        value={row.actual}
                        onChange={(e) =>
                          updateRowField<BulletRow>(row.id, { actual: sanitizeNumber(e.target.value, 0) })
                        }
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-0.5">
                      <input
                        type="number"
                        step="any"
                        value={row.target}
                        onChange={(e) =>
                          updateRowField<BulletRow>(row.id, { target: sanitizeNumber(e.target.value, 0) })
                        }
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-0.5">
                      <input
                        type="number"
                        step="any"
                        value={row.poorThreshold}
                        onChange={(e) =>
                          updateRowField<BulletRow>(row.id, { poorThreshold: sanitizeNumber(e.target.value, 0) })
                        }
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-0.5">
                      <input
                        type="number"
                        step="any"
                        value={row.goodThreshold}
                        onChange={(e) =>
                          updateRowField<BulletRow>(row.id, { goodThreshold: sanitizeNumber(e.target.value, 0) })
                        }
                        className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pl-0.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        aria-label={`Delete ${row.metric}`}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case ChartType.SPAN: {
        const data = rows as SpanRow[];
        return (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left py-2 pr-1">Category</th>
                <th className="text-right py-2 px-1 w-14">Min</th>
                <th className="text-right py-2 px-1 w-14">Max</th>
                <th className="text-right py-2 px-1 w-14">Avg</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="py-1.5 pr-1">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRowField<SpanRow>(row.id, { category: e.target.value })}
                      className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      value={row.minValue}
                      onChange={(e) =>
                        updateRowField<SpanRow>(row.id, { minValue: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      value={row.maxValue}
                      onChange={(e) =>
                        updateRowField<SpanRow>(row.id, { maxValue: sanitizeNumber(e.target.value, 0) })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 px-0.5">
                    <input
                      type="number"
                      step="any"
                      placeholder="—"
                      value={row.averageValue ?? ''}
                      onChange={(e) =>
                        updateRowField<SpanRow>(row.id, {
                          averageValue: sanitizeOptionalNumber(e.target.value),
                        })
                      }
                      className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-0.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label={`Delete ${row.category}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case ChartType.DIVERGING: {
        const data = rows as DivergingRow[];
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[370px] text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="text-left py-2 pr-1">Question</th>
                  <th className="text-right py-2 px-0.5 w-11" title="Strongly Negative">--</th>
                  <th className="text-right py-2 px-0.5 w-11" title="Negative">-</th>
                  <th className="text-right py-2 px-0.5 w-11" title="Neutral">0</th>
                  <th className="text-right py-2 px-0.5 w-11" title="Positive">+</th>
                  <th className="text-right py-2 px-0.5 w-11" title="Strongly Positive">++</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="py-1.5 pr-1">
                      <input
                        type="text"
                        aria-label={`Category for ${row.category}`}
                        value={row.category}
                        onChange={(e) => updateRowField<DivergingRow>(row.id, { category: e.target.value })}
                        className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    {(
                      [
                        ['strongNegative', 'Strong Negative'],
                        ['negative', 'Negative'],
                        ['neutral', 'Neutral'],
                        ['positive', 'Positive'],
                        ['strongPositive', 'Strong Positive'],
                      ] as const
                    ).map(([field, label]) => (
                      <td key={field} className="py-1.5 px-0.5">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          aria-label={`${label} for ${row.category}`}
                          value={row[field]}
                          onChange={(e) =>
                            updateRowField<DivergingRow>(row.id, {
                              [field]: Math.max(0, sanitizeNumber(e.target.value, 0)),
                            })
                          }
                          className="w-full px-1 py-1 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="py-1.5 pl-0.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        aria-label={`Delete ${row.category}`}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-xs font-semibold text-slate-800">Interactive Data Table</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResetSample}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Row
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">
          Schema: <span className="font-mono text-slate-700">{meta.schemaHint}</span>
        </p>

        {rows.length === 0 ? (
          <div className="p-4 border border-dashed border-slate-300 rounded-md text-center text-xs text-slate-500">
            No rows in dataset. Click &ldquo;Add Row&rdquo; or &ldquo;Reset&rdquo; above.
          </div>
        ) : (
          renderDynamicTable()
        )}
      </div>

      <div className="border-t border-slate-200 pt-5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-slate-800">CSV / TSV Bulk Paste</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLoadCurrentCsv}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3" />
              Fill Current
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <textarea
          rows={5}
          aria-label="Paste CSV or TSV data"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={`Paste CSV with header row:\n${meta.schemaHint}`}
          className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
        />

        <button
          type="button"
          onClick={handleApplyCsv}
          className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
        >
          Apply CSV Data
        </button>

        {csvStatus && (
          <div
            role="status"
            className={`p-2.5 rounded-md text-xs border ${
              csvStatus.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {csvStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{csvStatus.message}</p>
                {csvStatus.warnings && csvStatus.warnings.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[11px] opacity-90 space-y-0.5">
                    {csvStatus.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
