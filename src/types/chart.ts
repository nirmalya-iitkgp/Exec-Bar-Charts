export enum ChartType {
  BARBELL = 'barbell',
  LOLLIPOP = 'lollipop',
  CLEVELAND = 'cleveland',
  SLOPEGRAPH = 'slopegraph',
  BUMP = 'bump',
  BULLET = 'bullet',
  SPAN = 'span',
  DIVERGING = 'diverging',
}

export type AspectRatio = '16:9' | '4:3';

export type SidebarTab = 'data' | 'palette' | 'settings';

export type NumberFormatMode = 'standard' | 'currency' | 'percent' | 'compact';

export interface BarbellRow {
  id: string;
  category: string;
  startValue: number;
  endValue: number;
}

export interface LollipopRow {
  id: string;
  category: string;
  value: number;
}

export interface ClevelandRow {
  id: string;
  category: string;
  seriesA: number;
  seriesB: number;
  seriesC: number;
}

export interface SlopegraphRow {
  id: string;
  category: string;
  period1Value: number;
  period2Value: number;
}

export interface BumpRow {
  id: string;
  entity: string;
  ranks: Record<string, number>;
}

export interface BulletRow {
  id: string;
  metric: string;
  actual: number;
  target: number;
  poorThreshold: number;
  goodThreshold: number;
}

export interface SpanRow {
  id: string;
  category: string;
  minValue: number;
  maxValue: number;
  averageValue: number | null;
}

export interface DivergingRow {
  id: string;
  category: string;
  strongNegative: number;
  negative: number;
  neutral: number;
  positive: number;
  strongPositive: number;
}

export interface ChartDatasetMap {
  [ChartType.BARBELL]: BarbellRow[];
  [ChartType.LOLLIPOP]: LollipopRow[];
  [ChartType.CLEVELAND]: ClevelandRow[];
  [ChartType.SLOPEGRAPH]: SlopegraphRow[];
  [ChartType.BUMP]: BumpRow[];
  [ChartType.BULLET]: BulletRow[];
  [ChartType.SPAN]: SpanRow[];
  [ChartType.DIVERGING]: DivergingRow[];
}

export interface PaletteColors {
  primary: string;
  secondary: string;
  tertiary: string;
  positive: string;
  negative: string;
  neutral: string;
  gridline: string;
  text: string;
  mutedText: string;
  slideBg: string;
}

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: PaletteColors;
}

export interface ChartSettings {
  title: string;
  subtitle: string;
  footnote: string;
  showGridlines: boolean;
  showValues: boolean;
  showLegend: boolean;
  fontSize: number;
  dotRadius: number;
  lineThickness: number;
  numberFormat: NumberFormatMode;
  decimalPlaces: number;
  valuePrefix: string;
  valueSuffix: string;
  lollipopOrientation: 'horizontal' | 'vertical';
  barbellColorMode: 'directional' | 'palette';
  barbellStartLabel: string;
  barbellEndLabel: string;
  period1Label: string;
  period2Label: string;
  clevelandSeriesNames: [string, string, string];
  bumpPeriods: string[];
  divergingCenterMode: 'split-neutral' | 'zero-split';
  divergingNormalize100: boolean;
  divergingLabels: [string, string, string, string, string];
  bulletShowTicks: boolean;
}

export interface ChartMeta {
  type: ChartType;
  label: string;
  shortLabel: string;
  description: string;
  schemaHint: string;
}

export interface SlideDimensions {
  svgWidth: number;
  svgHeight: number;
  pptxWidthIn: number;
  pptxHeightIn: number;
  pptxLayout: 'LAYOUT_16x9' | 'LAYOUT_4x3';
}
