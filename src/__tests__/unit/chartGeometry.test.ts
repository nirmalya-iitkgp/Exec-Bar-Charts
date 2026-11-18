import { describe, expect, it } from 'vitest';
import { blendHexColors, EXECUTIVE_PALETTES, normalizeHexColor, stripHashForPptx } from '../../constants/palettes';
import { createDefaultSettings, createInitialDatasets } from '../../constants/mockData';
import { ChartType } from '../../types/chart';
import {
  computeBarbellGeometry,
  computeBulletGeometry,
  computeBumpGeometry,
  computeClevelandGeometry,
  computeDivergingGeometry,
  computeLollipopGeometry,
  computeSlopegraphGeometry,
  computeSpanGeometry,
} from '../../utils/chartGeometry';
import { formatNumericValue, getSlideDimensions } from '../../utils/formatters';

const colors = EXECUTIVE_PALETTES[0].colors;

describe('Unit: Chart Geometry Engine & Formatters', () => {
  it('computes accurate 16:9 and 4:3 slide dimensions', () => {
    const wide = getSlideDimensions('16:9');
    expect(wide.svgWidth).toBe(960);
    expect(wide.svgHeight).toBe(540);
    expect(wide.pptxWidthIn).toBe(10);
    expect(wide.pptxHeightIn).toBe(5.625);

    const std = getSlideDimensions('4:3');
    expect(std.svgWidth).toBe(960);
    expect(std.svgHeight).toBe(720);
    expect(std.pptxWidthIn).toBe(10);
    expect(std.pptxHeightIn).toBe(7.5);
  });

  it('formats standard, currency, percent, and compact numbers cleanly', () => {
    expect(
      formatNumericValue(1250000, {
        numberFormat: 'compact',
        decimalPlaces: 1,
        valuePrefix: '$',
        valueSuffix: '',
      })
    ).toBe('$1.3M');

    expect(
      formatNumericValue(42.5, {
        numberFormat: 'percent',
        decimalPlaces: 1,
        valuePrefix: '',
        valueSuffix: '%',
      })
    ).toBe('42.5%');

    expect(
      formatNumericValue(1400, {
        numberFormat: 'currency',
        decimalPlaces: 0,
        valuePrefix: '',
        valueSuffix: '',
      })
    ).toBe('$1,400');
  });

  it('normalizes 3-digit, 6-digit, and invalid hex strings safely', () => {
    expect(normalizeHexColor('#abc')).toBe('#AABBCC');
    expect(normalizeHexColor('1e3a8a')).toBe('#1E3A8A');
    expect(normalizeHexColor('not-a-hex', '#0F172A')).toBe('#0F172A');
    expect(stripHashForPptx('#3b82f6')).toBe('3B82F6');
  });

  it('computes Barbell geometry with directional positive/negative colors', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.BARBELL);
    const geom = computeBarbellGeometry(datasets[ChartType.BARBELL], '16:9', settings, colors);

    expect(geom.items.length).toBe(datasets[ChartType.BARBELL].length);
    const gainItem = geom.items.find((i) => i.delta > 0)!;
    const lossItem = geom.items.find((i) => i.delta < 0)!;
    expect(gainItem.endColor).toBe(colors.positive);
    expect(lossItem.endColor).toBe(colors.negative);
    expect(gainItem.x2).toBeGreaterThan(gainItem.x1);
    expect(lossItem.x2).toBeLessThan(lossItem.x1);
  });

  it('computes Lollipop geometry in both horizontal and vertical orientations', () => {
    const datasets = createInitialDatasets();
    const hSettings = createDefaultSettings(ChartType.LOLLIPOP);
    const hGeom = computeLollipopGeometry(datasets[ChartType.LOLLIPOP], '16:9', hSettings, colors);
    expect(hGeom.orientation).toBe('horizontal');
    expect(hGeom.items[0].y1).toBe(hGeom.items[0].y2);
    expect(hGeom.items[0].x2).toBeGreaterThan(hGeom.items[0].x1);

    const vSettings = { ...hSettings, lollipopOrientation: 'vertical' as const };
    const vGeom = computeLollipopGeometry(datasets[ChartType.LOLLIPOP], '16:9', vSettings, colors);
    expect(vGeom.orientation).toBe('vertical');
    expect(vGeom.items[0].x1).toBe(vGeom.items[0].x2);
    expect(vGeom.items[0].y2).toBeLessThan(vGeom.items[0].y1);
  });

  it('computes Cleveland Dot Plot 3-series coordinates along shared row Y', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.CLEVELAND);
    const geom = computeClevelandGeometry(datasets[ChartType.CLEVELAND], '16:9', settings, colors);
    expect(geom.rows.length).toBe(5);
    expect(geom.rows[0].points).toHaveLength(3);
    expect(geom.rows[0].points[0].x).toBeLessThan(geom.rows[0].points[1].x);
    expect(geom.rows[0].points[1].x).toBeLessThan(geom.rows[0].points[2].x);
  });

  it('computes Slopegraph geometry with anti-collision label spacing', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.SLOPEGRAPH);
    const geom = computeSlopegraphGeometry(datasets[ChartType.SLOPEGRAPH], '16:9', settings, colors);
    expect(geom.x2).toBeGreaterThan(geom.x1);
    expect(geom.items.length).toBe(6);
  });

  it('computes Bump chart with inverted Y-axis (Rank 1 higher on slide than Rank 5)', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.BUMP);
    const geom = computeBumpGeometry(datasets[ChartType.BUMP], '16:9', settings, colors);
    const rank1 = geom.rankTicks.find((t) => t.rank === 1)!;
    const rank5 = geom.rankTicks.find((t) => t.rank === 5)!;
    expect(rank1.y).toBeLessThan(rank5.y);
  });

  it('computes Bullet chart qualitative band widths and target X', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.BULLET);
    const geom = computeBulletGeometry(datasets[ChartType.BULLET], '16:9', settings);
    expect(geom.items.length).toBe(5);
    geom.items.forEach((item) => {
      expect(item.poorWidth).toBeLessThanOrEqual(item.satisfactoryWidth);
      expect(item.satisfactoryWidth).toBeLessThanOrEqual(item.goodWidth);
      expect(item.targetX).toBeGreaterThanOrEqual(geom.frame.plot.left);
    });
  });

  it('computes Span chart with optional average marker', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.SPAN);
    const geom = computeSpanGeometry(datasets[ChartType.SPAN], '16:9', settings);
    expect(geom.items.length).toBe(6);
    geom.items.forEach((item) => {
      expect(item.xMax).toBeGreaterThanOrEqual(item.xMin);
      expect(item.xAvg).not.toBeNull();
    });
  });

  it('computes Diverging Stacked Bar geometry centered at zero for split-neutral and zero-split modes', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.DIVERGING);
    const splitGeom = computeDivergingGeometry(datasets[ChartType.DIVERGING], '16:9', settings, colors);

    expect(splitGeom.items.length).toBe(6);
    expect(splitGeom.legendItems).toHaveLength(5);
    const first = splitGeom.items[0];
    const neutralSeg = first.segments.find((s) => s.key === 'neutral')!;
    // Neutral segment must straddle zeroX symmetrically
    const neutralCenter = neutralSeg.x + neutralSeg.width / 2;
    expect(Math.abs(neutralCenter - splitGeom.zeroX)).toBeLessThan(0.5);

    // Zero-split mode excludes neutral from the center seam so negative/positive touch zeroX
    const zeroSettings = { ...settings, divergingCenterMode: 'zero-split' as const };
    const zeroGeom = computeDivergingGeometry(datasets[ChartType.DIVERGING], '16:9', zeroSettings, colors);
    expect(zeroGeom.legendItems).toHaveLength(4);
    const negSeg = zeroGeom.items[0].segments.find((s) => s.key === 'negative')!;
    const posSeg = zeroGeom.items[0].segments.find((s) => s.key === 'positive')!;
    expect(Math.abs(negSeg.x + negSeg.width - zeroGeom.zeroX)).toBeLessThan(0.5);
    expect(Math.abs(posSeg.x - zeroGeom.zeroX)).toBeLessThan(0.5);
  });

  it('blends hex colors accurately for derived Likert shades', () => {
    expect(blendHexColors('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(blendHexColors('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(blendHexColors('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
});
