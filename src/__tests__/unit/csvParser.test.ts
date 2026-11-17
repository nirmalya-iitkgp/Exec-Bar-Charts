import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialDatasets } from '../../constants/mockData';
import { ChartType } from '../../types/chart';
import { parseCsvForChartType, serializeDatasetToCsv } from '../../utils/csvParser';

describe('Unit: CSV Parser & Serializer', () => {
  it('round-trips all 7 chart datasets through CSV serialize -> parse cleanly', () => {
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
});
