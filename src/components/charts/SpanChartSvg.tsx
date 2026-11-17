import React from 'react';
import { AspectRatio, ChartSettings, PaletteColors, SpanRow } from '../../types/chart';
import { computeSpanGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface SpanChartSvgProps {
  rows: SpanRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const SpanChartSvg: React.FC<SpanChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeSpanGeometry(rows, aspectRatio, settings);
  const { frame, ticks, items } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Span Range Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          <rect x={48} y={frame.legendY - 6} width={18} height={11} rx={3} fill={colors.secondary} opacity={0.85} />
          <text x={73} y={frame.legendY + 4} fontSize={12} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Min–Max Spread
          </text>
          <circle cx={194} cy={frame.legendY} r={5} fill={colors.primary} stroke="#FFFFFF" strokeWidth={1.2} />
          <text x={205} y={frame.legendY + 4} fontSize={12} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Average / Median
          </text>
        </g>
      )}

      {ticks.map((tick, idx) => (
        <g key={`tick-${idx}`}>
          {settings.showGridlines && (
            <line
              x1={tick.pos}
              y1={frame.plot.top}
              x2={tick.pos}
              y2={frame.plot.bottom}
              stroke={colors.gridline}
              strokeWidth={1}
            />
          )}
          <text
            x={tick.pos}
            y={frame.plot.bottom + 18}
            textAnchor="middle"
            fontSize={11}
            fill={colors.mutedText}
            fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {items.map((item) => {
        const barWidth = Math.max(4, item.xMax - item.xMin);
        return (
          <g
            key={item.id}
            className="cursor-pointer"
            onMouseEnter={() =>
              onHover?.({
                title: item.category,
                detail: item.avgLabel
                  ? `Range: ${item.minLabel} – ${item.maxLabel} · Avg: ${item.avgLabel}`
                  : `Range: ${item.minLabel} – ${item.maxLabel}`,
              })
            }
            onMouseLeave={() => onHover?.(null)}
          >
            <text
              x={frame.plot.left - 14}
              y={item.y + 4}
              textAnchor="end"
              fontSize={settings.fontSize}
              fontWeight={500}
              fill={colors.text}
              fontFamily="var(--font-sans)"
            >
              {item.category}
            </text>

            <rect
              x={item.xMin}
              y={item.y - item.barHeight / 2}
              width={barWidth}
              height={item.barHeight}
              rx={3}
              fill={colors.secondary}
              opacity={0.85}
              stroke={colors.primary}
              strokeWidth={0.75}
            />

            {item.xAvg !== null && (
              <circle
                cx={item.xAvg}
                cy={item.y}
                r={Math.max(5, settings.dotRadius * 0.9)}
                fill={colors.primary}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}

            {settings.showValues && (
              <>
                <text
                  x={item.xMin - 8}
                  y={item.y + 4}
                  textAnchor="end"
                  fontSize={Math.max(10, settings.fontSize - 1)}
                  fill={colors.mutedText}
                  fontFamily="var(--font-mono)"
                >
                  {item.minLabel}
                </text>
                <text
                  x={item.xMax + 8}
                  y={item.y + 4}
                  textAnchor="start"
                  fontSize={Math.max(10, settings.fontSize - 1)}
                  fontWeight={600}
                  fill={colors.text}
                  fontFamily="var(--font-mono)"
                >
                  {item.maxLabel}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
