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
  TernaryRow,
  VoronoiRow,
} from '../types/chart';
import { blendHexColors, getSeriesColors } from '../constants/palettes';
import { formatNumericValue, getSlideDimensions, sanitizeNumber } from './formatters';
import {
  createRegularPolygon,
  partitionPolygonWeighted,
  Point2D,
  Polygon2D,
} from './voronoiSolver';

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

/* 9. TERNARY PLOT GEOMETRY */
export interface TernaryGridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  axis: 'A' | 'B' | 'C';
  pct: number;
  tickX: number;
  tickY: number;
  tickAnchor: 'start' | 'end' | 'middle';
  tickLabel: string;
}

export interface TernaryPointGeometry {
  id: string;
  category: string;
  group: string;
  x: number;
  y: number;
  radius: number;
  densityRadius: number;
  color: string;
  pctA: number;
  pctB: number;
  pctC: number;
  size: number;
  sizeLabel: string;
}

export interface TernaryGroupLegend {
  group: string;
  color: string;
}

export interface TernaryGeometry {
  frame: SlideFrameLayout;
  vertexA: Point2D; // Top (100% VarA)
  vertexB: Point2D; // Bottom-left (100% VarB)
  vertexC: Point2D; // Bottom-right (100% VarC)
  labelA: string;
  labelB: string;
  labelC: string;
  gridLines: TernaryGridLine[];
  points: TernaryPointGeometry[];
  groups: TernaryGroupLegend[];
}

export function barycentricToCartesian(
  a: number,
  b: number,
  c: number,
  vA: Point2D,
  vB: Point2D,
  vC: Point2D
): Point2D {
  const sa = Math.max(0, Number.isFinite(a) ? a : 0);
  const sb = Math.max(0, Number.isFinite(b) ? b : 0);
  const sc = Math.max(0, Number.isFinite(c) ? c : 0);
  const sum = sa + sb + sc;
  const na = sum > 0 ? sa / sum : 1 / 3;
  const nb = sum > 0 ? sb / sum : 1 / 3;
  const nc = sum > 0 ? sc / sum : 1 / 3;
  return {
    x: na * vA.x + nb * vB.x + nc * vC.x,
    y: na * vA.y + nb * vB.y + nc * vC.y,
  };
}

export function computeTernaryGeometry(
  rows: TernaryRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): TernaryGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, {
    left: 60,
    right: 900,
    top: settings.subtitle ? 128 : 104,
    bottom: aspectRatio === '4:3' ? 642 : 464,
  });

  const maxTriHeight = Math.max(120, frame.plot.height - 34);
  const maxTriSide = Math.min(frame.plot.width - 140, (maxTriHeight * 2) / Math.sqrt(3));
  const side = Math.max(140, maxTriSide);
  const triHeight = (side * Math.sqrt(3)) / 2;
  const cx = (frame.plot.left + frame.plot.right) / 2;
  const topY = frame.plot.top + (frame.plot.height - triHeight) / 2;
  const bottomY = topY + triHeight;

  const vertexA: Point2D = { x: cx, y: topY };
  const vertexB: Point2D = { x: cx - side / 2, y: bottomY };
  const vertexC: Point2D = { x: cx + side / 2, y: bottomY };

  const gridLevels = [0.2, 0.4, 0.6, 0.8];
  const gridLines: TernaryGridLine[] = [];

  gridLevels.forEach((t) => {
    const pct = Math.round(t * 100);
    // Constant A = t (horizontal lines)
    const a1 = barycentricToCartesian(t, 1 - t, 0, vertexA, vertexB, vertexC);
    const a2 = barycentricToCartesian(t, 0, 1 - t, vertexA, vertexB, vertexC);
    gridLines.push({
      x1: a1.x,
      y1: a1.y,
      x2: a2.x,
      y2: a2.y,
      axis: 'A',
      pct,
      tickX: a1.x - 8,
      tickY: a1.y + 4,
      tickAnchor: 'end',
      tickLabel: `${pct}%`,
    });

    // Constant B = t (parallel to AC)
    const b1 = barycentricToCartesian(1 - t, t, 0, vertexA, vertexB, vertexC);
    const b2 = barycentricToCartesian(0, t, 1 - t, vertexA, vertexB, vertexC);
    gridLines.push({
      x1: b1.x,
      y1: b1.y,
      x2: b2.x,
      y2: b2.y,
      axis: 'B',
      pct,
      tickX: b2.x,
      tickY: b2.y + 15,
      tickAnchor: 'middle',
      tickLabel: `${pct}%`,
    });

    // Constant C = t (parallel to AB)
    const c1 = barycentricToCartesian(1 - t, 0, t, vertexA, vertexB, vertexC);
    const c2 = barycentricToCartesian(0, 1 - t, t, vertexA, vertexB, vertexC);
    gridLines.push({
      x1: c1.x,
      y1: c1.y,
      x2: c2.x,
      y2: c2.y,
      axis: 'C',
      pct,
      tickX: c1.x + 8,
      tickY: c1.y + 4,
      tickAnchor: 'start',
      tickLabel: `${pct}%`,
    });
  });

  const paletteCycle = getSeriesColors(colors);
  const uniqueGroups: string[] = [];
  rows.forEach((r) => {
    const g = (r.group || 'Core').trim() || 'Core';
    if (!uniqueGroups.includes(g)) uniqueGroups.push(g);
  });
  const groupColorMap = new Map<string, string>();
  uniqueGroups.forEach((g, idx) => {
    groupColorMap.set(g, paletteCycle[idx % paletteCycle.length]);
  });

  const sizes = rows.map((r) => Math.max(1, sanitizeNumber(r.size, 20)));
  const maxSize = Math.max(1, ...sizes);
  const minSize = Math.min(...sizes);

  const points: TernaryPointGeometry[] = rows.map((row, i) => {
    const sa = Math.max(0, sanitizeNumber(row.varA, 0));
    const sb = Math.max(0, sanitizeNumber(row.varB, 0));
    const sc = Math.max(0, sanitizeNumber(row.varC, 0));
    const sum = sa + sb + sc;
    const pctA = sum > 0 ? (sa / sum) * 100 : 33.3;
    const pctB = sum > 0 ? (sb / sum) * 100 : 33.3;
    const pctC = sum > 0 ? (sc / sum) * 100 : 33.3;

    const pt = barycentricToCartesian(sa, sb, sc, vertexA, vertexB, vertexC);
    const sz = Math.max(1, sanitizeNumber(row.size, 20));
    const normSize = maxSize === minSize ? 0.5 : (sz - minSize) / (maxSize - minSize);
    const radius = Math.max(4, settings.dotRadius * (0.75 + normSize * 0.95));
    const densityRadius = radius * 2.5;
    const group = (row.group || 'Core').trim() || 'Core';

    return {
      id: row.id,
      category: row.category || `Item ${i + 1}`,
      group,
      x: pt.x,
      y: pt.y,
      radius,
      densityRadius,
      color: groupColorMap.get(group) ?? colors.primary,
      pctA,
      pctB,
      pctC,
      size: sz,
      sizeLabel: formatNumericValue(sz, settings),
    };
  });

  const groups: TernaryGroupLegend[] = uniqueGroups.map((group) => ({
    group,
    color: groupColorMap.get(group) ?? colors.primary,
  }));

  return {
    frame,
    vertexA,
    vertexB,
    vertexC,
    labelA: settings.ternaryAxisLabels[0] || 'Variable A',
    labelB: settings.ternaryAxisLabels[1] || 'Variable B',
    labelC: settings.ternaryAxisLabels[2] || 'Variable C',
    gridLines,
    points,
    groups,
  };
}

/* 10. VORONOI TREEMAP GEOMETRY */
export interface VoronoiCellGeometry {
  id: string;
  parentCategory: string;
  subcategory: string;
  value: number;
  valueLabel: string;
  sharePct: number;
  polygon: Polygon2D;
  centroid: Point2D;
  bboxWidth: number;
  bboxHeight: number;
  fillColor: string;
  textColor: string;
}

export interface VoronoiParentGeometry {
  category: string;
  totalValue: number;
  totalLabel: string;
  sharePct: number;
  color: string;
  polygon: Polygon2D;
  centroid: Point2D;
  children: VoronoiCellGeometry[];
}

export interface VoronoiGeometry {
  frame: SlideFrameLayout;
  containerPolygon: Polygon2D;
  center: Point2D;
  radius: number;
  totalValue: number;
  parents: VoronoiParentGeometry[];
}

export function computeVoronoiGeometry(
  rows: VoronoiRow[],
  aspectRatio: AspectRatio,
  settings: ChartSettings,
  colors: PaletteColors
): VoronoiGeometry {
  const frame = computeSlideFrameLayout(aspectRatio, settings, {
    left: 48,
    right: 912,
    top: settings.subtitle ? 106 : 82,
    bottom: aspectRatio === '4:3' ? 662 : 494,
  });

  const availW = frame.plot.width - 255;
  const availH = frame.plot.height;
  const radius = Math.max(70, Math.min(availW, availH) * 0.46);
  const cx = frame.plot.left + 255 + availW / 2;
  const cy = frame.plot.top + availH / 2;

  const sides =
    settings.voronoiContainerShape === 'hexagon'
      ? 6
      : settings.voronoiContainerShape === 'octagon'
        ? 8
        : 48;
  const rotation = settings.voronoiContainerShape === 'octagon' ? Math.PI / 8 : -Math.PI / 2;
  const containerPolygon = createRegularPolygon(cx, cy, radius, sides, rotation);

  // Group rows by parent category while preserving insertion order
  const groupMap = new Map<string, VoronoiRow[]>();
  rows.forEach((r, idx) => {
    const cat = (r.category || `Division ${idx + 1}`).trim() || `Division ${idx + 1}`;
    const list = groupMap.get(cat) ?? [];
    list.push(r);
    groupMap.set(cat, list);
  });

  const grandTotal = rows.reduce(
    (acc, r) => acc + Math.max(0.01, sanitizeNumber(r.value, 1)),
    0
  );

  const paletteCycle = getSeriesColors(colors);
  const parentItems = Array.from(groupMap.entries()).map(([category, children], idx) => {
    const total = children.reduce(
      (acc, c) => acc + Math.max(0.01, sanitizeNumber(c.value, 1)),
      0
    );
    return {
      id: category,
      category,
      weight: total,
      color: paletteCycle[idx % paletteCycle.length],
      rawChildren: children,
    };
  });

  const parentPartitions = partitionPolygonWeighted(containerPolygon, parentItems, 28);

  const parents: VoronoiParentGeometry[] = parentPartitions.map((part) => {
    const childItems = part.item.rawChildren.map((c, cIdx) => ({
      id: c.id,
      subcategory: c.subcategory || `Item ${cIdx + 1}`,
      weight: Math.max(0.01, sanitizeNumber(c.value, 1)),
    }));

    const childPartitions = partitionPolygonWeighted(part.polygon, childItems, 26);

    const children: VoronoiCellGeometry[] = childPartitions.map((cp, cIdx) => {
      const tintWeight =
        childPartitions.length <= 1
          ? 0.08
          : 0.08 + (cIdx / Math.max(1, childPartitions.length - 1)) * 0.42;
      const fillColor = blendHexColors(part.item.color, '#FFFFFF', tintWeight);
      const sharePct = grandTotal > 0 ? (cp.item.weight / grandTotal) * 100 : 0;

      return {
        id: cp.item.id,
        parentCategory: part.item.category,
        subcategory: cp.item.subcategory,
        value: cp.item.weight,
        valueLabel: formatNumericValue(cp.item.weight, settings),
        sharePct,
        polygon: cp.polygon,
        centroid: cp.centroid,
        bboxWidth: cp.bbox.width,
        bboxHeight: cp.bbox.height,
        fillColor,
        textColor: tintWeight > 0.34 ? colors.text : '#FFFFFF',
      };
    });

    return {
      category: part.item.category,
      totalValue: part.item.weight,
      totalLabel: formatNumericValue(part.item.weight, settings),
      sharePct: grandTotal > 0 ? (part.item.weight / grandTotal) * 100 : 0,
      color: part.item.color,
      polygon: part.polygon,
      centroid: part.centroid,
      children,
    };
  });

  return {
    frame,
    containerPolygon,
    center: { x: cx, y: cy },
    radius,
    totalValue: grandTotal,
    parents,
  };
}
