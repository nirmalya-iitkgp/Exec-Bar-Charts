import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
  AspectRatio,
  BarbellRow,
  BulletRow,
  BumpRow,
  ChartSettings,
  ClevelandRow,
  LollipopRow,
  PaletteColors,
  SlopegraphRow,
  SpanRow,
} from '../types/chart';
import { getSeriesColors } from '../constants/palettes';
import { formatNumericValue, getSlideDimensions, sanitizeNumber } from './formatters';

export interface PlotBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface SlideFrameLayout {
  svgWidth: number;
  svgHeight: number;
  titleX: number;
  titleY: number;
  subtitleY: number;
  legendY: number;
  footnoteY: number;
  plot: PlotBox;
}

export function computeSlideFrameLayout(
  aspectRatio: AspectRatio,
  settings: Pick<ChartSettings, 'showLegend' | 'subtitle' | 'footnote'>,
  plotOverrides?: Partial<{ left: number; right: number; top: number; bottom: number }>
): SlideFrameLayout {
  const { svgWidth, svgHeight } = getSlideDimensions(aspectRatio);
  const padX = 48;
  const titleY = 44;
  const subtitleY = 68;
  const hasSubtitle = settings.subtitle.trim().length > 0;
  const hasFootnote = settings.footnote.trim().length > 0;
  const legendY = hasSubtitle ? 96 : 74;
  const defaultTop = settings.showLegend ? (hasSubtitle ? 124 : 102) : (hasSubtitle ? 98 : 76);
  const defaultBottom = hasFootnote ? svgHeight - 54 : svgHeight - 38;
  const left = plotOverrides?.left ?? 176;
  const right = plotOverrides?.right ?? svgWidth - 58;
  const top = plotOverrides?.top ?? defaultTop;
  const bottom = plotOverrides?.bottom ?? defaultBottom;

  return {
    svgWidth,
    svgHeight,
    titleX: padX,
    titleY,
    subtitleY,
    legendY,
    footnoteY: svgHeight - 18,
    plot: {
      left,
      top,
      right,
      bottom,
      width: Math.max(40, right - left),
      height: Math.max(40, bottom - top),
    },
  };
}

function buildSafeNumericDomain(values: number[], includeZero = false): [number, number] {
  const finiteValues = values.filter((v) => Number.isFinite(v));
  if (finiteValues.length === 0) {
    return [0, 100];
  }
  let minVal = Math.min(...finiteValues);
  let maxVal = Math.max(...finiteValues);
  if (includeZero) {
    minVal = Math.min(0, minVal);
    maxVal = Math.max(0, maxVal);
  }
  if (minVal === maxVal) {
    const pad = minVal === 0 ? 10 : Math.abs(minVal) * 0.2;
    return [minVal - pad, maxVal + pad];
  }
  const span = maxVal - minVal;
  const padLow = includeZero && minVal === 0 ? 0 : span * 0.08;
  const padHigh = includeZero && maxVal === 0 ? 0 : span * 0.08;
  return [minVal - padLow, maxVal + padHigh];
}

export interface AxisTick {
  value: number;
  pos: number;
  label: string;
}

/* 1. BARBELL GEOMETRY */
export interface BarbellItemGeometry {
  id: string;
  category: string;
  y: number;
  x1: number;
  x2: number;
  startValue: number;
  endValue: number;
  delta: number;
  lineColor: string;
  startColor: string;
  endColor: string;
  startLabel: string;
  endLabel: string;
}

export interface BarbellGeometry {
  frame: SlideFrameLayout;
  ticks: AxisTick[];
  items: BarbellItemGeometry[];
}

export function computeBarbellGeometry(
  rows: BarbellRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): BarbellGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 185, right: 900 });
  const values = rows.flatMap((r) => [sanitizeNumber(r.startValue), sanitizeNumber(r.endValue)]);
  const domain = buildSafeNumericDomain(values, false);
  const xScale = scaleLinear().domain(domain).range([frame.plot.left, frame.plot.right]).nice();
  const yScale = scalePoint<number>()
    .domain(rows.map((_, i) => i))
    .range([frame.plot.top + 14, frame.plot.bottom - 14])
    .padding(0.45);

  const ticks: AxisTick[] = xScale.ticks(6).map((value) => ({
    value,
    pos: xScale(value),
    label: formatNumericValue(value, settings),
  }));

  const items: BarbellItemGeometry[] = rows.map((row, i) => {
    const s = sanitizeNumber(row.startValue);
    const e = sanitizeNumber(row.endValue);
    const delta = e - s;
    const isDirectional = settings.barbellColorMode === 'directional';
    const semanticColor = delta >= 0 ? colors.positive : colors.negative;
    return {
      id: row.id,
      category: row.category || `Row ${i + 1}`,
      y: yScale(i) ?? frame.plot.top,
      x1: xScale(s),
      x2: xScale(e),
      startValue: s,
      endValue: e,
      delta,
      lineColor: isDirectional ? semanticColor : colors.neutral,
      startColor: isDirectional ? colors.neutral : colors.secondary,
      endColor: isDirectional ? semanticColor : colors.primary,
      startLabel: formatNumericValue(s, settings),
      endLabel: formatNumericValue(e, settings),
    };
  });

  return { frame, ticks, items };
}

/* 2. LOLLIPOP GEOMETRY */
export interface LollipopItemGeometry {
  id: string;
  category: string;
  value: number;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface LollipopGeometry {
  frame: SlideFrameLayout;
  orientation: 'horizontal' | 'vertical';
  baselinePos: number;
  ticks: AxisTick[];
  items: LollipopItemGeometry[];
}

export function computeLollipopGeometry(
  rows: LollipopRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): LollipopGeometry {
  const orientation = settings.lollipopOrientation;
  const frame =
    orientation === 'horizontal'
      ? computeSlideFrameLayout(aspectRatio, settings, { left: 195, right: 895 })
      : computeSlideFrameLayout(aspectRatio, settings, {
          left: 84,
          right: 910,
          bottom: aspectRatio === '4:3' ? 625 : 448,
        });

  const values = rows.map((r) => sanitizeNumber(r.value));
  const domain = buildSafeNumericDomain(values, true);

  if (orientation === 'horizontal') {
    const xScale = scaleLinear().domain(domain).range([frame.plot.left, frame.plot.right]).nice();
    const yScale = scalePoint<number>()
      .domain(rows.map((_, i) => i))
      .range([frame.plot.top + 14, frame.plot.bottom - 14])
      .padding(0.45);
    const zeroX = xScale(0);
    const ticks: AxisTick[] = xScale.ticks(6).map((value) => ({
      value,
      pos: xScale(value),
      label: formatNumericValue(value, settings),
    }));
    const items: LollipopItemGeometry[] = rows.map((row, i) => {
      const val = sanitizeNumber(row.value);
      const y = yScale(i) ?? frame.plot.top;
      return {
        id: row.id,
        category: row.category || `Item ${i + 1}`,
        value: val,
        label: formatNumericValue(val, settings),
        x1: zeroX,
        y1: y,
        x2: xScale(val),
        y2: y,
        color: val >= 0 ? colors.primary : colors.negative,
      };
    });
    return { frame, orientation, baselinePos: zeroX, ticks, items };
  } else {
    const yScale = scaleLinear().domain(domain).range([frame.plot.bottom, frame.plot.top]).nice();
    const xScale = scalePoint<number>()
      .domain(rows.map((_, i) => i))
      .range([frame.plot.left + 20, frame.plot.right - 20])
      .padding(0.45);
    const zeroY = yScale(0);
    const ticks: AxisTick[] = yScale.ticks(5).map((value) => ({
      value,
      pos: yScale(value),
      label: formatNumericValue(value, settings),
    }));
    const items: LollipopItemGeometry[] = rows.map((row, i) => {
      const val = sanitizeNumber(row.value);
      const x = xScale(i) ?? frame.plot.left;
      return {
        id: row.id,
        category: row.category || `Item ${i + 1}`,
        value: val,
        label: formatNumericValue(val, settings),
        x1: x,
        y1: zeroY,
        x2: x,
        y2: yScale(val),
        color: val >= 0 ? colors.primary : colors.negative,
      };
    });
    return { frame, orientation, baselinePos: zeroY, ticks, items };
  }
}

/* 3. CLEVELAND DOT PLOT GEOMETRY */
export interface ClevelandDotPoint {
  seriesKey: 'A' | 'B' | 'C';
  seriesName: string;
  value: number;
  label: string;
  x: number;
  color: string;
}

export interface ClevelandRowGeometry {
  id: string;
  category: string;
  y: number;
  points: ClevelandDotPoint[];
}

export interface ClevelandGeometry {
  frame: SlideFrameLayout;
  ticks: AxisTick[];
  rows: ClevelandRowGeometry[];
}

export function computeClevelandGeometry(
  rows: ClevelandRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): ClevelandGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 195, right: 905 });
  const values = rows.flatMap((r) => [
    sanitizeNumber(r.seriesA),
    sanitizeNumber(r.seriesB),
    sanitizeNumber(r.seriesC),
  ]);
  const domain = buildSafeNumericDomain(values, false);
  const xScale = scaleLinear().domain(domain).range([frame.plot.left, frame.plot.right]).nice();
  const yScale = scalePoint<number>()
    .domain(rows.map((_, i) => i))
    .range([frame.plot.top + 16, frame.plot.bottom - 16])
    .padding(0.45);

  const ticks: AxisTick[] = xScale.ticks(6).map((value) => ({
    value,
    pos: xScale(value),
    label: formatNumericValue(value, settings),
  }));

  const [nameA, nameB, nameC] = settings.clevelandSeriesNames;
  const computedRows: ClevelandRowGeometry[] = rows.map((row, i) => {
    const y = yScale(i) ?? frame.plot.top;
    const a = sanitizeNumber(row.seriesA);
    const b = sanitizeNumber(row.seriesB);
    const c = sanitizeNumber(row.seriesC);
    return {
      id: row.id,
      category: row.category || `Row ${i + 1}`,
      y,
      points: [
        {
          seriesKey: 'A',
          seriesName: nameA || 'Series A',
          value: a,
          label: formatNumericValue(a, settings),
          x: xScale(a),
          color: colors.primary,
        },
        {
          seriesKey: 'B',
          seriesName: nameB || 'Series B',
          value: b,
          label: formatNumericValue(b, settings),
          x: xScale(b),
          color: colors.secondary,
        },
        {
          seriesKey: 'C',
          seriesName: nameC || 'Series C',
          value: c,
          label: formatNumericValue(c, settings),
          x: xScale(c),
          color: colors.tertiary,
        },
      ],
    };
  });

  return { frame, ticks, rows: computedRows };
}

/* 4. SLOPEGRAPH GEOMETRY */
export interface SlopegraphItemGeometry {
  id: string;
  category: string;
  p1Value: number;
  p2Value: number;
  y1: number;
  y2: number;
  leftLabelY: number;
  rightLabelY: number;
  p1Label: string;
  p2Label: string;
  color: string;
  isPositive: boolean;
}

export interface SlopegraphGeometry {
  frame: SlideFrameLayout;
  x1: number;
  x2: number;
  items: SlopegraphItemGeometry[];
}

function resolveLabelCollisions(positions: number[], minGap: number, minY: number, maxY: number): number[] {
  if (positions.length === 0) return [];
  const indexed = positions.map((y, idx) => ({ y, idx })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < indexed.length; i++) {
    if (indexed[i].y - indexed[i - 1].y < minGap) {
      indexed[i].y = indexed[i - 1].y + minGap;
    }
  }
  const overflow = indexed[indexed.length - 1].y - maxY;
  if (overflow > 0) {
    for (let i = 0; i < indexed.length; i++) {
      indexed[i].y -= overflow;
    }
    for (let i = indexed.length - 2; i >= 0; i--) {
      if (indexed[i + 1].y - indexed[i].y < minGap) {
        indexed[i].y = indexed[i + 1].y - minGap;
      }
    }
  }
  const underflow = minY - indexed[0].y;
  if (underflow > 0) {
    for (let i = 0; i < indexed.length; i++) {
      indexed[i].y += underflow;
    }
  }
  const result = new Array<number>(positions.length);
  indexed.forEach((item) => {
    result[item.idx] = item.y;
  });
  return result;
}

export function computeSlopegraphGeometry(
  rows: SlopegraphRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): SlopegraphGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 265, right: 695, top: settings.subtitle ? 128 : 104 });
  const values = rows.flatMap((r) => [sanitizeNumber(r.period1Value), sanitizeNumber(r.period2Value)]);
  const domain = buildSafeNumericDomain(values, false);
  const yScale = scaleLinear().domain(domain).range([frame.plot.bottom - 12, frame.plot.top + 16]).nice();

  const rawY1 = rows.map((r) => yScale(sanitizeNumber(r.period1Value)));
  const rawY2 = rows.map((r) => yScale(sanitizeNumber(r.period2Value)));
  const minGap = Math.max(16, settings.fontSize + 4);
  const leftLabelYs = resolveLabelCollisions(rawY1, minGap, frame.plot.top + 8, frame.plot.bottom - 4);
  const rightLabelYs = resolveLabelCollisions(rawY2, minGap, frame.plot.top + 8, frame.plot.bottom - 4);

  const items: SlopegraphItemGeometry[] = rows.map((row, i) => {
    const p1 = sanitizeNumber(row.period1Value);
    const p2 = sanitizeNumber(row.period2Value);
    const isPositive = p2 >= p1;
    return {
      id: row.id,
      category: row.category || `Series ${i + 1}`,
      p1Value: p1,
      p2Value: p2,
      y1: rawY1[i],
      y2: rawY2[i],
      leftLabelY: leftLabelYs[i],
      rightLabelY: rightLabelYs[i],
      p1Label: formatNumericValue(p1, settings),
      p2Label: formatNumericValue(p2, settings),
      color: isPositive ? colors.primary : colors.negative,
      isPositive,
    };
  });

  return {
    frame,
    x1: frame.plot.left,
    x2: frame.plot.right,
    items,
  };
}

/* 5. BUMP CHART GEOMETRY */
export interface BumpPoint {
  period: string;
  rank: number;
  x: number;
  y: number;
}

export interface BumpSeriesGeometry {
  id: string;
  entity: string;
  color: string;
  points: BumpPoint[];
}

export interface BumpGeometry {
  frame: SlideFrameLayout;
  periods: { label: string; x: number }[];
  rankTicks: { rank: number; y: number }[];
  series: BumpSeriesGeometry[];
  maxRank: number;
}

export function computeBumpGeometry(
  rows: BumpRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): BumpGeometry {
  const periods = settings.bumpPeriods.length >= 2 ? settings.bumpPeriods : ['Q1', 'Q2', 'Q3', 'Q4'];
  const frame = computeSlideFrameLayout(aspectRatio, settings, {
    left: 105,
    right: 785,
    bottom: aspectRatio === '4:3' ? 632 : 458,
  });

  const allRanks = rows.flatMap((r) => periods.map((p) => Math.max(1, sanitizeNumber(r.ranks[p], 1))));
  const maxRank = Math.max(rows.length || 1, ...allRanks, 2);

  const xScale = scalePoint<string>()
    .domain(periods)
    .range([frame.plot.left + 20, frame.plot.right - 20]);

  // Inverted Y-axis: Rank 1 at the top!
  const yScale = scaleLinear()
    .domain([1, maxRank])
    .range([frame.plot.top + 16, frame.plot.bottom - 16]);

  const paletteCycle = getSeriesColors(colors);

  const rankTicks = Array.from({ length: maxRank }, (_, idx) => idx + 1).map((rank) => ({
    rank,
    y: yScale(rank),
  }));

  const periodCols = periods.map((label) => ({
    label,
    x: xScale(label) ?? frame.plot.left,
  }));

  const series: BumpSeriesGeometry[] = rows.map((row, idx) => ({
    id: row.id,
    entity: row.entity || `Entity ${idx + 1}`,
    color: paletteCycle[idx % paletteCycle.length],
    points: periods.map((period) => {
      const rank = Math.max(1, Math.min(maxRank, Math.round(sanitizeNumber(row.ranks[period], idx + 1))));
      return {
        period,
        rank,
        x: xScale(period) ?? frame.plot.left,
        y: yScale(rank),
      };
    }),
  }));

  return {
    frame,
    periods: periodCols,
    rankTicks,
    series,
    maxRank,
  };
}

/* 6. BULLET CHART GEOMETRY */
export interface BulletItemGeometry {
  id: string;
  metric: string;
  y: number;
  bandHeight: number;
  actualHeight: number;
  poorWidth: number;
  satisfactoryWidth: number;
  goodWidth: number;
  actualWidth: number;
  targetX: number;
  actualValue: number;
  targetValue: number;
  actualLabel: string;
  targetLabel: string;
  isOnTarget: boolean;
}

export interface BulletGeometry {
  frame: SlideFrameLayout;
  items: BulletItemGeometry[];
}

export function computeBulletGeometry(
  rows: BulletRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings
): BulletGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 205, right: 870 });
  const yBand = scaleBand<number>()
    .domain(rows.map((_, i) => i))
    .range([frame.plot.top + 6, frame.plot.bottom - 6])
    .padding(0.32);

  const bandHeight = Math.max(18, Math.min(44, yBand.bandwidth()));
  const actualHeight = Math.max(6, Math.round(bandHeight * 0.36));

  const items: BulletItemGeometry[] = rows.map((row, i) => {
    const actual = Math.max(0, sanitizeNumber(row.actual));
    const target = Math.max(0, sanitizeNumber(row.target));
    const poorRaw = Math.max(0, sanitizeNumber(row.poorThreshold));
    const goodRaw = Math.max(poorRaw, sanitizeNumber(row.goodThreshold));
    const rowMax = Math.max(actual, target, goodRaw, 1) * 1.12;

    const xScale = scaleLinear().domain([0, rowMax]).range([0, frame.plot.width]);
    const bandTop = (yBand(i) ?? frame.plot.top) + (yBand.bandwidth() - bandHeight) / 2;

    return {
      id: row.id,
      metric: row.metric || `KPI ${i + 1}`,
      y: bandTop,
      bandHeight,
      actualHeight,
      poorWidth: xScale(poorRaw),
      satisfactoryWidth: xScale(goodRaw),
      goodWidth: frame.plot.width,
      actualWidth: xScale(actual),
      targetX: frame.plot.left + xScale(target),
      actualValue: actual,
      targetValue: target,
      actualLabel: formatNumericValue(actual, settings),
      targetLabel: formatNumericValue(target, settings),
      isOnTarget: actual >= target,
    };
  });

  return { frame, items };
}

/* 7. SPAN (RANGE) CHART GEOMETRY */
export interface SpanItemGeometry {
  id: string;
  category: string;
  y: number;
  barHeight: number;
  xMin: number;
  xMax: number;
  xAvg: number | null;
  minValue: number;
  maxValue: number;
  averageValue: number | null;
  minLabel: string;
  maxLabel: string;
  avgLabel: string | null;
}

export interface SpanGeometry {
  frame: SlideFrameLayout;
  ticks: AxisTick[];
  items: SpanItemGeometry[];
}

export function computeSpanGeometry(
  rows: SpanRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings
): SpanGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 195, right: 895 });
  const values = rows.flatMap((r) => {
    const list = [sanitizeNumber(r.minValue), sanitizeNumber(r.maxValue)];
    if (r.averageValue !== null && r.averageValue !== undefined && Number.isFinite(r.averageValue)) {
      list.push(r.averageValue);
    }
    return list;
  });

  const domain = buildSafeNumericDomain(values, false);
  const xScale = scaleLinear().domain(domain).range([frame.plot.left, frame.plot.right]).nice();
  const yBand = scaleBand<number>()
    .domain(rows.map((_, i) => i))
    .range([frame.plot.top + 8, frame.plot.bottom - 12])
    .padding(0.42);

  const barHeight = Math.max(10, Math.min(24, yBand.bandwidth()));

  const ticks: AxisTick[] = xScale.ticks(6).map((value) => ({
    value,
    pos: xScale(value),
    label: formatNumericValue(value, settings),
  }));

  const items: SpanItemGeometry[] = rows.map((row, i) => {
    const rawMin = sanitizeNumber(row.minValue);
    const rawMax = sanitizeNumber(row.maxValue);
    const lo = Math.min(rawMin, rawMax);
    const hi = Math.max(rawMin, rawMax);
    const avg =
      row.averageValue !== null && row.averageValue !== undefined && Number.isFinite(row.averageValue)
        ? row.averageValue
        : null;
    const centerY = (yBand(i) ?? frame.plot.top) + yBand.bandwidth() / 2;

    return {
      id: row.id,
      category: row.category || `Row ${i + 1}`,
      y: centerY,
      barHeight,
      xMin: xScale(lo),
      xMax: xScale(hi),
      xAvg: avg !== null ? xScale(avg) : null,
      minValue: lo,
      maxValue: hi,
      averageValue: avg,
      minLabel: formatNumericValue(lo, settings),
      maxLabel: formatNumericValue(hi, settings),
      avgLabel: avg !== null ? formatNumericValue(avg, settings) : null,
    };
  });

  return { frame, ticks, items };
}
