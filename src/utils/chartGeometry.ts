import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
  AspectRatio,
  BarbellRow,
  BulletRow,
  BumpRow,
  ChartSettings,
  ClevelandRow,
  DivergingRow,
  LollipopRow,
  PaletteColors,
  SlopegraphRow,
  SpanRow,
} from '../types/chart';
import { blendHexColors, getSeriesColors } from '../constants/palettes';
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
  ticks: { x: number; label: string }[];
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
    .range([frame.plot.top + 6, frame.plot.bottom - 14])
    .padding(0.35);

  const bandHeight = Math.max(18, Math.min(42, yBand.bandwidth()));
  const actualHeight = Math.max(6, Math.round(bandHeight * 0.36));

  const items: BulletItemGeometry[] = rows.map((row, i) => {
    const actual = Math.max(0, sanitizeNumber(row.actual));
    const target = Math.max(0, sanitizeNumber(row.target));
    const poorRaw = Math.max(0, sanitizeNumber(row.poorThreshold));
    const goodRaw = Math.max(poorRaw, sanitizeNumber(row.goodThreshold));
    const rowMax = Math.max(actual, target, goodRaw, 1) * 1.12;

    const xScale = scaleLinear().domain([0, rowMax]).range([0, frame.plot.width]).nice();
    const bandTop = (yBand(i) ?? frame.plot.top) + (yBand.bandwidth() - bandHeight) / 2;
    const ticks = xScale.ticks(4).map((val) => ({
      x: frame.plot.left + xScale(val),
      label: formatNumericValue(val, settings),
    }));

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
      ticks,
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

/* 8. DIVERGING STACKED BAR CHART GEOMETRY */
export type DivergingSegmentKey =
  | 'strongNegative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'strongPositive';

export interface DivergingSegmentGeometry {
  key: DivergingSegmentKey;
  label: string;
  value: number;
  displayLabel: string;
  x: number;
  width: number;
  color: string;
  textColor: string;
}

export interface DivergingItemGeometry {
  id: string;
  category: string;
  y: number;
  barHeight: number;
  netSentiment: number;
  netLabel: string;
  segments: DivergingSegmentGeometry[];
}

export interface DivergingLegendItem {
  key: DivergingSegmentKey;
  label: string;
  color: string;
}

export interface DivergingGeometry {
  frame: SlideFrameLayout;
  zeroX: number;
  ticks: AxisTick[];
  legendItems: DivergingLegendItem[];
  items: DivergingItemGeometry[];
}

export function computeDivergingGeometry(
  rows: DivergingRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): DivergingGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, { left: 190, right: 862 });

  const segColors: Record<DivergingSegmentKey, string> = {
    strongNegative: colors.negative,
    negative: blendHexColors(colors.negative, '#FFFFFF', 0.44),
    neutral: blendHexColors(colors.neutral, '#FFFFFF', 0.35),
    positive: blendHexColors(colors.positive, '#FFFFFF', 0.44),
    strongPositive: colors.positive,
  };

  const labels = settings.divergingLabels;
  const isSplitNeutral = settings.divergingCenterMode === 'split-neutral';

  const normalizedRows = rows.map((row, idx) => {
    const rawSN = Math.max(0, sanitizeNumber(row.strongNegative));
    const rawN = Math.max(0, sanitizeNumber(row.negative));
    const rawNeu = Math.max(0, sanitizeNumber(row.neutral));
    const rawP = Math.max(0, sanitizeNumber(row.positive));
    const rawSP = Math.max(0, sanitizeNumber(row.strongPositive));
    const sum = rawSN + rawN + rawNeu + rawP + rawSP;
    const factor = settings.divergingNormalize100 && sum > 0 ? 100 / sum : 1;

    const sn = rawSN * factor;
    const neg = rawN * factor;
    const neu = isSplitNeutral ? rawNeu * factor : 0;
    const pos = rawP * factor;
    const sp = rawSP * factor;

    const halfNeu = neu / 2;
    const leftReach = halfNeu + neg + sn;
    const rightReach = halfNeu + pos + sp;

    return {
      id: row.id,
      category: row.category || `Question ${idx + 1}`,
      sn,
      neg,
      neu,
      pos,
      sp,
      halfNeu,
      leftReach,
      rightReach,
    };
  });

  const maxReachRaw = Math.max(
    10,
    ...normalizedRows.flatMap((r) => [r.leftReach, r.rightReach])
  );
  const bound = settings.divergingNormalize100
    ? Math.min(100, Math.max(20, Math.ceil(maxReachRaw / 10) * 10))
    : Math.ceil(maxReachRaw * 1.1);

  const xScale = scaleLinear().domain([-bound, bound]).range([frame.plot.left, frame.plot.right]).nice();
  const zeroX = xScale(0);

  const yBand = scaleBand<number>()
    .domain(rows.map((_, i) => i))
    .range([frame.plot.top + 8, frame.plot.bottom - 10])
    .padding(0.36);

  const barHeight = Math.max(14, Math.min(34, yBand.bandwidth()));

  const ticks: AxisTick[] = xScale.ticks(6).map((value) => {
    const absVal = Math.abs(value);
    const formatted = settings.divergingNormalize100
      ? `${Math.round(absVal)}%`
      : formatNumericValue(absVal, settings);
    return {
      value,
      pos: xScale(value),
      label: value === 0 ? (settings.divergingNormalize100 ? '0%' : '0') : formatted,
    };
  });

  const fmtSeg = (val: number) =>
    settings.divergingNormalize100
      ? `${Math.round(val)}%`
      : formatNumericValue(val, settings);

  const items: DivergingItemGeometry[] = normalizedRows.map((row, i) => {
    const centerY = (yBand(i) ?? frame.plot.top) + yBand.bandwidth() / 2;
    const segments: DivergingSegmentGeometry[] = [];

    const pushSeg = (
      key: DivergingSegmentKey,
      label: string,
      val: number,
      domainStart: number,
      domainEnd: number,
      textColor: string
    ) => {
      if (val <= 0) return;
      const xStart = xScale(domainStart);
      const xEnd = xScale(domainEnd);
      segments.push({
        key,
        label,
        value: val,
        displayLabel: fmtSeg(val),
        x: Math.min(xStart, xEnd),
        width: Math.abs(xEnd - xStart),
        color: segColors[key],
        textColor,
      });
    };

    pushSeg(
      'strongNegative',
      labels[0] || 'Strongly Disagree',
      row.sn,
      -(row.halfNeu + row.neg + row.sn),
      -(row.halfNeu + row.neg),
      '#FFFFFF'
    );
    pushSeg(
      'negative',
      labels[1] || 'Disagree',
      row.neg,
      -(row.halfNeu + row.neg),
      -row.halfNeu,
      colors.text
    );
    if (isSplitNeutral) {
      pushSeg(
        'neutral',
        labels[2] || 'Neutral',
        row.neu,
        -row.halfNeu,
        row.halfNeu,
        colors.text
      );
    }
    pushSeg(
      'positive',
      labels[3] || 'Agree',
      row.pos,
      row.halfNeu,
      row.halfNeu + row.pos,
      colors.text
    );
    pushSeg(
      'strongPositive',
      labels[4] || 'Strongly Agree',
      row.sp,
      row.halfNeu + row.pos,
      row.halfNeu + row.pos + row.sp,
      '#FFFFFF'
    );

    const netSentiment = row.pos + row.sp - (row.neg + row.sn);
    const netRounded = Math.round(netSentiment);
    const netLabel = settings.divergingNormalize100
      ? `${netRounded > 0 ? '+' : ''}${netRounded}%`
      : `${netRounded > 0 ? '+' : ''}${formatNumericValue(netSentiment, settings)}`;

    return {
      id: row.id,
      category: row.category,
      y: centerY,
      barHeight,
      netSentiment,
      netLabel,
      segments,
    };
  });

  const legendItems: DivergingLegendItem[] = [
    { key: 'strongNegative', label: labels[0] || 'Strongly Disagree', color: segColors.strongNegative },
    { key: 'negative', label: labels[1] || 'Disagree', color: segColors.negative },
    ...(isSplitNeutral
      ? [{ key: 'neutral' as const, label: labels[2] || 'Neutral', color: segColors.neutral }]
      : []),
    { key: 'positive', label: labels[3] || 'Agree', color: segColors.positive },
    { key: 'strongPositive', label: labels[4] || 'Strongly Agree', color: segColors.strongPositive },
  ];

  return {
    frame,
    zeroX,
    ticks,
    legendItems,
    items,
  };
}
