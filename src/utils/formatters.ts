import { AspectRatio, ChartSettings, SlideDimensions } from '../types/chart';

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[$,%\s,]/g, '');
    if (cleaned === '') return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function sanitizeOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const cleaned = typeof value === 'string' ? value.trim().replace(/[$,%\s,]/g, '') : value;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  // Strip ASCII control characters while preserving printable labels
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export function formatNumericValue(value: number, settings: Pick<ChartSettings, 'numberFormat' | 'decimalPlaces' | 'valuePrefix' | 'valueSuffix'>): string {
  if (!Number.isFinite(value)) return '—';

  const decimals = clamp(Math.round(settings.decimalPlaces), 0, 4);
  const abs = Math.abs(value);
  let formattedCore: string;

  switch (settings.numberFormat) {
    case 'compact': {
      if (abs >= 1_000_000_000) {
        formattedCore = `${(value / 1_000_000_000).toFixed(decimals).replace(/\.0+$/, '')}B`;
      } else if (abs >= 1_000_000) {
        formattedCore = `${(value / 1_000_000).toFixed(decimals).replace(/\.0+$/, '')}M`;
      } else if (abs >= 1_000) {
        formattedCore = `${(value / 1_000).toFixed(decimals).replace(/\.0+$/, '')}K`;
      } else {
        formattedCore = Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.?0+$/, '');
      }
      break;
    }
    case 'currency': {
      formattedCore = value.toLocaleString('en-US', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(decimals, 2),
        maximumFractionDigits: Math.max(decimals, 2),
      });
      return `${settings.valuePrefix || '$'}${formattedCore}${settings.valueSuffix}`;
    }
    case 'percent': {
      formattedCore = Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.?0+$/, '');
      return `${settings.valuePrefix}${formattedCore}${settings.valueSuffix || '%'}`;
    }
    case 'standard':
    default: {
      formattedCore = Number.isInteger(value)
        ? value.toLocaleString('en-US')
        : value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
          });
      break;
    }
  }

  return `${settings.valuePrefix}${formattedCore}${settings.valueSuffix}`;
}

export function getSlideDimensions(aspectRatio: AspectRatio): SlideDimensions {
  if (aspectRatio === '4:3') {
    return {
      svgWidth: 960,
      svgHeight: 720,
      pptxWidthIn: 10,
      pptxHeightIn: 7.5,
      pptxLayout: 'LAYOUT_4x3',
    };
  }
  return {
    svgWidth: 960,
    svgHeight: 540,
    pptxWidthIn: 10,
    pptxHeightIn: 5.625,
    pptxLayout: 'LAYOUT_16x9',
  };
}

export function createRowId(prefix = 'row'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}
