import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialDatasets } from '../../constants/mockData';
import { ChartType } from '../../types/chart';
import { parseCsvForChartType, serializeDatasetToCsv } from '../../utils/csvParser';

describe('Unit: CSV Parser & Serializer', () => {
  it('round-trips all 10 chart datasets through CSV serialize -> parse cleanly', () => {
    const datasets = createInitialDatasets();
    (Object.values(ChartType) as ChartType[]).forEach((chartType) => {
      const settings = createDefaultSettings(chartType);
      const csv = serializeDatasetToCsv(chartType, datasets[chartType], settings);
      const parsed = parseCsvForChartType(chartType, csv);
      expect(parsed.error).toBeNull();
      expect(parsed.rows.length).toBe(datasets[chartType].length);
    });
  });

  it('parses tab-separated (TSV) spreadsheet paste for Barbell charts', () => {
    const tsv = 'Category\tStartValue\tEndValue\nAlpha\t10\t22\nBeta\t30\t18';
    const res = parseCsvForChartType(ChartType.BARBELL, tsv);
    expect(res.error).toBeNull();
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0]).toMatchObject({ category: 'Alpha', startValue: 10, endValue: 22 });
    expect(res.rows[1]).toMatchObject({ category: 'Beta', startValue: 30, endValue: 18 });
  });

  it('detects dynamic Bump chart period columns from CSV header', () => {
    const csv = 'Entity,2022,2023,2024\nAcme,2,1,1\nZenith,1,2,2';
    const res = parseCsvForChartType(ChartType.BUMP, csv);
    expect(res.error).toBeNull();
    expect(res.detectedPeriods).toEqual(['2022', '2023', '2024']);
    expect(res.rows[0].ranks).toEqual({ '2022': 2, '2023': 1, '2024': 1 });
  });

  it('handles optional AverageValue in Span chart CSV cleanly', () => {
    const csv = 'Category,MinValue,MaxValue,AverageValue\nRole A,100,200,\nRole B,120,220,170';
    const res = parseCsvForChartType(ChartType.SPAN, csv);
    expect(res.error).toBeNull();
    expect(res.rows[0].averageValue).toBeNull();
    expect(res.rows[1].averageValue).toBe(170);
  });

  it('parses Ternary and Voronoi CSV inputs with default optional values', () => {
    const ternaryCsv = 'Category,VarA,VarB,VarC,Size,Group\nAPAC,40,35,25,60,Growth';
    const tRes = parseCsvForChartType(ChartType.TERNARY, ternaryCsv);
    expect(tRes.error).toBeNull();
    expect(tRes.rows[0]).toMatchObject({ category: 'APAC', varA: 40, varB: 35, varC: 25, size: 60, group: 'Growth' });

    const voronoiCsv = 'Category,Subcategory,Value\nCloud,Compute,42\nCloud,Storage,18';
    const vRes = parseCsvForChartType(ChartType.VORONOI, voronoiCsv);
    expect(vRes.error).toBeNull();
    expect(vRes.rows).toHaveLength(2);
    expect(vRes.rows[0]).toMatchObject({ category: 'Cloud', subcategory: 'Compute', value: 42 });
  });
});
