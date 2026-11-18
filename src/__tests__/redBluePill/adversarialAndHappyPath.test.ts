import { describe, expect, it } from 'vitest';
import { EXECUTIVE_PALETTES, normalizeHexColor } from '../../constants/palettes';
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
import { parseCsvForChartType } from '../../utils/csvParser';
import { buildPptxPresentation } from '../../utils/pptxExporter';

describe('Blue Pill Tests: Nominal Executive Workflows', () => {
  it('produces finite, in-bounds SVG coordinates for every chart type with default data', () => {
    const datasets = createInitialDatasets();
    const colors = EXECUTIVE_PALETTES[2].colors;

    const barbell = computeBarbellGeometry(
      datasets[ChartType.BARBELL],
      '16:9',
      createDefaultSettings(ChartType.BARBELL),
      colors
    );
    barbell.items.forEach((item) => {
      expect(Number.isFinite(item.x1)).toBe(true);
      expect(Number.isFinite(item.x2)).toBe(true);
      expect(Number.isFinite(item.y)).toBe(true);
    });

    const slope = computeSlopegraphGeometry(
      datasets[ChartType.SLOPEGRAPH],
      '4:3',
      createDefaultSettings(ChartType.SLOPEGRAPH),
      colors
    );
    slope.items.forEach((item) => {
      expect(Number.isFinite(item.y1)).toBe(true);
      expect(Number.isFinite(item.y2)).toBe(true);
      expect(item.leftLabelY).toBeGreaterThanOrEqual(slope.frame.plot.top);
    });
  });
});

describe('Red Pill Tests: Adversarial, Malformed & Extreme Edge Cases', () => {
  it('handles 0 rows cleanly across all 7 geometry calculators and PPTX exporter', () => {
    const emptyDatasets = {
      [ChartType.BARBELL]: [],
      [ChartType.LOLLIPOP]: [],
      [ChartType.CLEVELAND]: [],
      [ChartType.SLOPEGRAPH]: [],
      [ChartType.BUMP]: [],
      [ChartType.BULLET]: [],
      [ChartType.SPAN]: [],
      [ChartType.DIVERGING]: [],
    };
    const colors = EXECUTIVE_PALETTES[0].colors;

    expect(() =>
      computeBarbellGeometry([], '16:9', createDefaultSettings(ChartType.BARBELL), colors)
    ).not.toThrow();
    expect(() =>
      computeLollipopGeometry([], '16:9', createDefaultSettings(ChartType.LOLLIPOP), colors)
    ).not.toThrow();
    expect(() =>
      computeClevelandGeometry([], '16:9', createDefaultSettings(ChartType.CLEVELAND), colors)
    ).not.toThrow();
    expect(() =>
      computeSlopegraphGeometry([], '16:9', createDefaultSettings(ChartType.SLOPEGRAPH), colors)
    ).not.toThrow();
    expect(() =>
      computeBumpGeometry([], '16:9', createDefaultSettings(ChartType.BUMP), colors)
    ).not.toThrow();
    expect(() =>
      computeBulletGeometry([], '16:9', createDefaultSettings(ChartType.BULLET))
    ).not.toThrow();
    expect(() =>
      computeSpanGeometry([], '16:9', createDefaultSettings(ChartType.SPAN))
    ).not.toThrow();
    expect(() =>
      computeDivergingGeometry([], '16:9', createDefaultSettings(ChartType.DIVERGING), colors)
    ).not.toThrow();

    (Object.values(ChartType) as ChartType[]).forEach((chartType) => {
      expect(() =>
        buildPptxPresentation({
          chartType,
          datasets: emptyDatasets,
          aspectRatio: '16:9',
          settings: createDefaultSettings(chartType),
          colors,
        })
      ).not.toThrow();
    });
  });

  it('survives NaN, Infinity, -Infinity, and inverted Span min > max without NaN coordinates', () => {
    const colors = EXECUTIVE_PALETTES[3].colors;

    const hostileBarbell = computeBarbellGeometry(
      [
        { id: '1', category: 'NaN Row', startValue: Number.NaN, endValue: Number.POSITIVE_INFINITY },
        { id: '2', category: 'All Zero', startValue: 0, endValue: 0 },
      ],
      '16:9',
      createDefaultSettings(ChartType.BARBELL),
      colors
    );
    hostileBarbell.items.forEach((item) => {
      expect(Number.isFinite(item.x1)).toBe(true);
      expect(Number.isFinite(item.x2)).toBe(true);
      expect(Number.isFinite(item.y)).toBe(true);
    });

    const invertedSpan = computeSpanGeometry(
      [{ id: 's1', category: 'Inverted', minValue: 500, maxValue: 100, averageValue: null }],
      '16:9',
      createDefaultSettings(ChartType.SPAN)
    );
    expect(invertedSpan.items[0].minValue).toBe(100);
    expect(invertedSpan.items[0].maxValue).toBe(500);
    expect(invertedSpan.items[0].xMax).toBeGreaterThanOrEqual(invertedSpan.items[0].xMin);
    expect(invertedSpan.items[0].xAvg).toBeNull();
  });

  it('rejects empty or single-column malformed CSVs gracefully with user-friendly errors', () => {
    const emptyRes = parseCsvForChartType(ChartType.LOLLIPOP, '   \n  ');
    expect(emptyRes.error).not.toBeNull();
    expect(emptyRes.rows).toHaveLength(0);

    const singleCol = parseCsvForChartType(ChartType.BARBELL, 'OnlyHeader\nRow1');
    expect(singleCol.error).not.toBeNull();

    const badBump = parseCsvForChartType(ChartType.BUMP, 'Entity,Q1\nAcme,1');
    expect(badBump.error).toMatch(/at least 2 period columns/i);
  });

  it('coerces garbage numeric tokens in CSV with warnings instead of crashing', () => {
    const dirtyCsv = 'Category,StartValue,EndValue\n"Unit <script>alert(1)</script>",N/A,25.5';
    const res = parseCsvForChartType(ChartType.BARBELL, dirtyCsv);
    expect(res.error).toBeNull();
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].startValue).toBe(0);
    expect(res.rows[0].endValue).toBe(25.5);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('neutralizes invalid hex color strings before PPTX export', () => {
    expect(normalizeHexColor('javascript:alert(1)', '#1E3A8A')).toBe('#1E3A8A');
    expect(normalizeHexColor('ZZZZZZ', '#0F172A')).toBe('#0F172A');
  });

  it('handles all-zero and negative Likert inputs safely without NaN widths', () => {
    const colors = EXECUTIVE_PALETTES[0].colors;
    const geom = computeDivergingGeometry(
      [
        {
          id: 'd1',
          category: 'Zero Survey',
          strongNegative: 0,
          negative: 0,
          neutral: 0,
          positive: 0,
          strongPositive: 0,
        },
        {
          id: 'd2',
          category: 'Negative Hostile',
          strongNegative: -15,
          negative: Number.NaN,
          neutral: 10,
          positive: 40,
          strongPositive: Number.POSITIVE_INFINITY,
        },
      ],
      '16:9',
      createDefaultSettings(ChartType.DIVERGING),
      colors
    );
    expect(Number.isFinite(geom.zeroX)).toBe(true);
    geom.items.forEach((item) => {
      item.segments.forEach((seg) => {
        expect(Number.isFinite(seg.x)).toBe(true);
        expect(Number.isFinite(seg.width)).toBe(true);
      });
    });
  });
});
