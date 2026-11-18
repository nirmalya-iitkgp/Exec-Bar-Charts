import Papa from 'papaparse';
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
  TernaryRow,
  VoronoiRow,
} from '../types/chart';
import { createRowId, sanitizeNumber, sanitizeOptionalNumber, sanitizeText } from './formatters';

export interface CsvParseResult<T> {
  rows: T[];
  warnings: string[];
  error: string | null;
  detectedPeriods?: string[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isStrictNumericToken(raw: unknown): boolean {
  if (typeof raw === 'number') return Number.isFinite(raw);
  if (typeof raw !== 'string') return false;
  const cleaned = raw.trim().replace(/[$,%\s,]/g, '');
  if (!cleaned) return false;
  return Number.isFinite(Number(cleaned));
}

function pickField(record: Record<string, string>, candidates: string[], fallbackIndex?: number): string | undefined {
  const keys = Object.keys(record);
  for (const candidate of candidates) {
    const target = normalizeHeader(candidate);
    const match = keys.find((k) => normalizeHeader(k) === target);
    if (match !== undefined) return record[match];
  }
  if (fallbackIndex !== undefined && keys[fallbackIndex] !== undefined) {
    return record[keys[fallbackIndex]];
  }
  return undefined;
}

export function parseCsvForChartType<K extends ChartType>(
  chartType: K,
  csvText: string
): CsvParseResult<ChartDatasetMap[K][number]> {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return { rows: [], warnings: [], error: 'CSV input is empty. Paste header and data rows to import.' };
  }

  const parsed = Papa.parse<Record<string, string>>(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      rows: [],
      warnings: [],
      error: `Could not parse CSV: ${parsed.errors[0].message}`,
    };
  }

  const fields = parsed.meta.fields?.filter((f) => f.trim().length > 0) ?? [];
  if (fields.length < 2) {
    return {
      rows: [],
      warnings: [],
      error: 'Expected at least 2 columns (header row + values). Check your delimiter (comma or tab).',
    };
  }

  const warnings: string[] = [];
  const rawRows = parsed.data.filter((row) =>
    Object.values(row).some((val) => String(val ?? '').trim() !== '')
  );

  if (rawRows.length === 0) {
    return {
      rows: [],
      warnings: [],
      error: 'No data rows found beneath the header row.',
    };
  }

  switch (chartType) {
    case ChartType.BARBELL: {
      const rows: BarbellRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'name', 'label', 'unit'], 0));
        const rawStart = pickField(rec, ['startvalue', 'start', 'before', 'fy24', 'baseline'], 1);
        const rawEnd = pickField(rec, ['endvalue', 'end', 'after', 'fy25', 'current'], 2);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawStart) || !isStrictNumericToken(rawEnd)) {
          warnings.push(`Row ${idx + 1} (${category}): Non-numeric start/end value coerced to 0.`);
        }
        rows.push({
          id: createRowId('bb'),
          category,
          startValue: sanitizeNumber(rawStart, 0),
          endValue: sanitizeNumber(rawEnd, 0),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Barbell rows could be parsed.' : null,
      };
    }

    case ChartType.LOLLIPOP: {
      const rows: LollipopRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'name', 'label', 'segment'], 0));
        const rawVal = pickField(rec, ['value', 'score', 'amount', 'metric'], 1);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawVal)) {
          warnings.push(`Row ${idx + 1} (${category}): Invalid numeric value coerced to 0.`);
        }
        rows.push({
          id: createRowId('lp'),
          category,
          value: sanitizeNumber(rawVal, 0),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Lollipop rows could be parsed.' : null,
      };
    }

    case ChartType.CLEVELAND: {
      const rows: ClevelandRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'region', 'name', 'label'], 0));
        const rawA = pickField(rec, ['seriesa', 'a', 'series1'], 1);
        const rawB = pickField(rec, ['seriesb', 'b', 'series2'], 2);
        const rawC = pickField(rec, ['seriesc', 'c', 'series3'], 3);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawA) || !isStrictNumericToken(rawB) || !isStrictNumericToken(rawC)) {
          warnings.push(`Row ${idx + 1} (${category}): One or more series values coerced to 0.`);
        }
        rows.push({
          id: createRowId('cl'),
          category,
          seriesA: sanitizeNumber(rawA, 0),
          seriesB: sanitizeNumber(rawB, 0),
          seriesC: sanitizeNumber(rawC, 0),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Cleveland Dot Plot rows could be parsed.' : null,
      };
    }

    case ChartType.SLOPEGRAPH: {
      const rows: SlopegraphRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'name', 'label', 'sector'], 0));
        const rawP1 = pickField(rec, ['period1value', 'period1', 'p1', 'start', 'before'], 1);
        const rawP2 = pickField(rec, ['period2value', 'period2', 'p2', 'end', 'after'], 2);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawP1) || !isStrictNumericToken(rawP2)) {
          warnings.push(`Row ${idx + 1} (${category}): Non-numeric period value coerced to 0.`);
        }
        rows.push({
          id: createRowId('sg'),
          category,
          period1Value: sanitizeNumber(rawP1, 0),
          period2Value: sanitizeNumber(rawP2, 0),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Slopegraph rows could be parsed.' : null,
      };
    }

    case ChartType.BUMP: {
      const entityField = fields[0];
      const periodFields = fields.slice(1);
      if (periodFields.length < 2) {
        return {
          rows: [],
          warnings: [],
          error: 'Bump Chart requires an Entity column plus at least 2 period columns (e.g., Q1, Q2, Q3, Q4).',
        };
      }
      const rows: BumpRow[] = [];
      rawRows.forEach((rec, idx) => {
        const entity = sanitizeText(rec[entityField] ?? pickField(rec, ['entity', 'company', 'name'], 0));
        if (!entity) {
          warnings.push(`Row ${idx + 1}: Missing entity name, skipped.`);
          return;
        }
        const ranks: Record<string, number> = {};
        periodFields.forEach((period) => {
          const rawRank = rec[period];
          if (!isStrictNumericToken(rawRank)) {
            warnings.push(`Row ${idx + 1} (${entity}, ${period}): Rank coerced to ${idx + 1}.`);
          }
          ranks[period] = Math.max(1, Math.round(sanitizeNumber(rawRank, idx + 1)));
        });
        rows.push({
          id: createRowId('bp'),
          entity,
          ranks,
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Bump Chart rows could be parsed.' : null,
        detectedPeriods: periodFields,
      };
    }

    case ChartType.BULLET: {
      const rows: BulletRow[] = [];
      rawRows.forEach((rec, idx) => {
        const metric = sanitizeText(pickField(rec, ['metric', 'kpi', 'category', 'name'], 0));
        const rawActual = pickField(rec, ['actual', 'value', 'current'], 1);
        const rawTarget = pickField(rec, ['target', 'goal', 'plan'], 2);
        const rawPoor = pickField(rec, ['poorthreshold', 'poor', 'low'], 3);
        const rawGood = pickField(rec, ['goodthreshold', 'good', 'high'], 4);
        if (!metric) {
          warnings.push(`Row ${idx + 1}: Missing metric name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawActual) || !isStrictNumericToken(rawTarget)) {
          warnings.push(`Row ${idx + 1} (${metric}): Actual or Target coerced to 0.`);
        }
        const actual = sanitizeNumber(rawActual, 0);
        const target = sanitizeNumber(rawTarget, 0);
        const poorThreshold = sanitizeNumber(rawPoor, Math.round(target * 0.65));
        const goodThreshold = sanitizeNumber(rawGood, Math.round(target * 0.9));
        rows.push({
          id: createRowId('bl'),
          metric,
          actual,
          target,
          poorThreshold,
          goodThreshold,
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Bullet Chart rows could be parsed.' : null,
      };
    }

    case ChartType.SPAN: {
      const rows: SpanRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'role', 'name', 'label'], 0));
        const rawMin = pickField(rec, ['minvalue', 'min', 'low', 'floor'], 1);
        const rawMax = pickField(rec, ['maxvalue', 'max', 'high', 'ceiling'], 2);
        const rawAvg = pickField(rec, ['averagevalue', 'average', 'avg', 'mean', 'median'], 3);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawMin) || !isStrictNumericToken(rawMax)) {
          warnings.push(`Row ${idx + 1} (${category}): Min or Max coerced to 0.`);
        }
        rows.push({
          id: createRowId('sp'),
          category,
          minValue: sanitizeNumber(rawMin, 0),
          maxValue: sanitizeNumber(rawMax, 0),
          averageValue: sanitizeOptionalNumber(rawAvg),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Span Chart rows could be parsed.' : null,
      };
    }

    case ChartType.DIVERGING: {
      const rows: DivergingRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'question', 'dimension', 'name', 'label'], 0));
        const rawSN = pickField(rec, ['strongnegative', 'stronglydisagree', 'detractor', 'sn'], 1);
        const rawN = pickField(rec, ['negative', 'disagree', 'neg'], 2);
        const rawNeu = pickField(rec, ['neutral', 'passive', 'undecided', 'neu'], 3);
        const rawP = pickField(rec, ['positive', 'agree', 'pos'], 4);
        const rawSP = pickField(rec, ['strongpositive', 'stronglyagree', 'promoter', 'sp'], 5);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (
          !isStrictNumericToken(rawSN) ||
          !isStrictNumericToken(rawN) ||
          !isStrictNumericToken(rawP) ||
          !isStrictNumericToken(rawSP)
        ) {
          warnings.push(`Row ${idx + 1} (${category}): Non-numeric sentiment value coerced to 0.`);
        }
        rows.push({
          id: createRowId('dv'),
          category,
          strongNegative: Math.max(0, sanitizeNumber(rawSN, 0)),
          negative: Math.max(0, sanitizeNumber(rawN, 0)),
          neutral: Math.max(0, sanitizeNumber(rawNeu, 0)),
          positive: Math.max(0, sanitizeNumber(rawP, 0)),
          strongPositive: Math.max(0, sanitizeNumber(rawSP, 0)),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Diverging Stacked Bar rows could be parsed.' : null,
      };
    }

    case ChartType.TERNARY: {
      const rows: TernaryRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'name', 'label', 'segment', 'product'], 0));
        const rawA = pickField(rec, ['vara', 'a', 'top', 'rd', 'x'], 1);
        const rawB = pickField(rec, ['varb', 'b', 'left', 'gtm', 'y'], 2);
        const rawC = pickField(rec, ['varc', 'c', 'right', 'ops', 'z'], 3);
        const rawSize = pickField(rec, ['size', 'weight', 'arr', 'value'], 4);
        const rawGroup = pickField(rec, ['group', 'cluster', 'tier', 'series'], 5);
        if (!category) {
          warnings.push(`Row ${idx + 1}: Missing category name, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawA) || !isStrictNumericToken(rawB) || !isStrictNumericToken(rawC)) {
          warnings.push(`Row ${idx + 1} (${category}): Non-numeric ternary coordinate coerced to 0.`);
        }
        rows.push({
          id: createRowId('tn'),
          category,
          varA: Math.max(0, sanitizeNumber(rawA, 0)),
          varB: Math.max(0, sanitizeNumber(rawB, 0)),
          varC: Math.max(0, sanitizeNumber(rawC, 0)),
          size: Math.max(1, sanitizeNumber(rawSize, 40)),
          group: sanitizeText(rawGroup, 'Core') || 'Core',
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Ternary Plot rows could be parsed.' : null,
      };
    }

    case ChartType.VORONOI: {
      const rows: VoronoiRow[] = [];
      rawRows.forEach((rec, idx) => {
        const category = sanitizeText(pickField(rec, ['category', 'group', 'parent', 'division'], 0));
        const subcategory = sanitizeText(pickField(rec, ['subcategory', 'child', 'name', 'product', 'label'], 1));
        const rawValue = pickField(rec, ['value', 'weight', 'size', 'revenue', 'amount'], 2);
        if (!category || !subcategory) {
          warnings.push(`Row ${idx + 1}: Missing Category or Subcategory, skipped.`);
          return;
        }
        if (!isStrictNumericToken(rawValue)) {
          warnings.push(`Row ${idx + 1} (${subcategory}): Non-numeric value coerced to 1.`);
        }
        rows.push({
          id: createRowId('vr'),
          category,
          subcategory,
          value: Math.max(0.01, sanitizeNumber(rawValue, 1)),
        });
      });
      return {
        rows: rows as ChartDatasetMap[K][number][],
        warnings,
        error: rows.length === 0 ? 'No valid Voronoi Treemap rows could be parsed.' : null,
      };
    }
  }
}

export function serializeDatasetToCsv<K extends ChartType>(
  chartType: K,
  rows: ChartDatasetMap[K],
  settings: Pick<ChartSettings, 'bumpPeriods'>
): string {
  switch (chartType) {
    case ChartType.BARBELL:
      return Papa.unparse(
        (rows as BarbellRow[]).map((r) => ({
          Category: r.category,
          StartValue: r.startValue,
          EndValue: r.endValue,
        }))
      );
    case ChartType.LOLLIPOP:
      return Papa.unparse(
        (rows as LollipopRow[]).map((r) => ({
          Category: r.category,
          Value: r.value,
        }))
      );
    case ChartType.CLEVELAND:
      return Papa.unparse(
        (rows as ClevelandRow[]).map((r) => ({
          Category: r.category,
          SeriesA: r.seriesA,
          SeriesB: r.seriesB,
          SeriesC: r.seriesC,
        }))
      );
    case ChartType.SLOPEGRAPH:
      return Papa.unparse(
        (rows as SlopegraphRow[]).map((r) => ({
          Category: r.category,
          Period1Value: r.period1Value,
          Period2Value: r.period2Value,
        }))
      );
    case ChartType.BUMP: {
      const periods = settings.bumpPeriods.length > 0 ? settings.bumpPeriods : ['Q1', 'Q2', 'Q3', 'Q4'];
      return Papa.unparse(
        (rows as BumpRow[]).map((r) => {
          const obj: Record<string, string | number> = { Entity: r.entity };
          periods.forEach((p) => {
            obj[p] = r.ranks[p] ?? 1;
          });
          return obj;
        })
      );
    }
    case ChartType.BULLET:
      return Papa.unparse(
        (rows as BulletRow[]).map((r) => ({
          Metric: r.metric,
          Actual: r.actual,
          Target: r.target,
          PoorThreshold: r.poorThreshold,
          GoodThreshold: r.goodThreshold,
        }))
      );
    case ChartType.SPAN:
      return Papa.unparse(
        (rows as SpanRow[]).map((r) => ({
          Category: r.category,
          MinValue: r.minValue,
          MaxValue: r.maxValue,
          AverageValue: r.averageValue ?? '',
        }))
      );
    case ChartType.DIVERGING:
      return Papa.unparse(
        (rows as DivergingRow[]).map((r) => ({
          Category: r.category,
          StrongNegative: r.strongNegative,
          Negative: r.negative,
          Neutral: r.neutral,
          Positive: r.positive,
          StrongPositive: r.strongPositive,
        }))
      );
    case ChartType.TERNARY:
      return Papa.unparse(
        (rows as TernaryRow[]).map((r) => ({
          Category: r.category,
          VarA: r.varA,
          VarB: r.varB,
          VarC: r.varC,
          Size: r.size,
          Group: r.group,
        }))
      );
    case ChartType.VORONOI:
      return Papa.unparse(
        (rows as VoronoiRow[]).map((r) => ({
          Category: r.category,
          Subcategory: r.subcategory,
          Value: r.value,
        }))
      );
  }
}
