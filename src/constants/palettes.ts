import { PaletteColors, PalettePreset } from '../types/chart';

export const EXECUTIVE_PALETTES: PalettePreset[] = [
  {
    id: 'consulting-blues',
    name: 'Consulting Blues',
    description: 'Boardroom navy, steel blue, and crisp semantic accents',
    colors: {
      primary: '#1E3A8A',
      secondary: '#3B82F6',
      tertiary: '#64748B',
      positive: '#059669',
      negative: '#DC2626',
      neutral: '#94A3B8',
      gridline: '#E2E8F0',
      text: '#0F172A',
      mutedText: '#475569',
      slideBg: '#FFFFFF',
    },
  },
  {
    id: 'emerald-slate',
    name: 'Emerald & Slate',
    description: 'Deep forest green paired with cool graphite and teal',
    colors: {
      primary: '#065F46',
      secondary: '#10B981',
      tertiary: '#475569',
      positive: '#047857',
      negative: '#E11D48',
      neutral: '#94A3B8',
      gridline: '#E2E8F0',
      text: '#0F172A',
      mutedText: '#475569',
      slideBg: '#FFFFFF',
    },
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta',
    description: 'Burnt sienna, espresso ink, and warm ochre highlights',
    colors: {
      primary: '#9A3412',
      secondary: '#EA580C',
      tertiary: '#D97706',
      positive: '#15803D',
      negative: '#B91C1C',
      neutral: '#A8A29E',
      gridline: '#E7E5E4',
      text: '#1C1917',
      mutedText: '#57534E',
      slideBg: '#FFFFFF',
    },
  },
  {
    id: 'monochrome-graphite',
    name: 'Monochrome Graphite',
    description: 'Editorial charcoal, pewter, and disciplined contrast',
    colors: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#9CA3AF',
      positive: '#15803D',
      negative: '#B91C1C',
      neutral: '#D1D5DB',
      gridline: '#E5E7EB',
      text: '#111827',
      mutedText: '#4B5563',
      slideBg: '#FFFFFF',
    },
  },
  {
    id: 'vibrant-tech',
    name: 'Vibrant Tech',
    description: 'Electric cobalt, violet, and cyan for high-clarity decks',
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      tertiary: '#0891B2',
      positive: '#16A34A',
      negative: '#E11D48',
      neutral: '#94A3B8',
      gridline: '#E2E8F0',
      text: '#0F172A',
      mutedText: '#475569',
      slideBg: '#FFFFFF',
    },
  },
];

const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;
const HEX_SHORT_REGEX = /^#?[0-9a-fA-F]{3}$/;

export function normalizeHexColor(input: string, fallback = '#1E3A8A'): string {
  const trimmed = (input || '').trim();
  if (HEX_COLOR_REGEX.test(trimmed)) {
    return (trimmed.startsWith('#') ? trimmed : `#${trimmed}`).toUpperCase();
  }
  if (HEX_SHORT_REGEX.test(trimmed)) {
    const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    const expanded = raw
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

export function stripHashForPptx(hex: string, fallback = '1E3A8A'): string {
  return normalizeHexColor(hex, `#${fallback}`).replace('#', '');
}

export function getSeriesColors(colors: PaletteColors): string[] {
  return [
    colors.primary,
    colors.secondary,
    colors.tertiary,
    colors.positive,
    colors.negative,
  ];
}

export function blendHexColors(hexA: string, hexB: string, weightB: number): string {
  const a = normalizeHexColor(hexA, '#000000').slice(1);
  const b = normalizeHexColor(hexB, '#FFFFFF').slice(1);
  const t = Math.min(1, Math.max(0, Number.isFinite(weightB) ? weightB : 0.5));

  const r1 = parseInt(a.slice(0, 2), 16);
  const g1 = parseInt(a.slice(2, 4), 16);
  const b1 = parseInt(a.slice(4, 6), 16);

  const r2 = parseInt(b.slice(0, 2), 16);
  const g2 = parseInt(b.slice(2, 4), 16);
  const b2 = parseInt(b.slice(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
