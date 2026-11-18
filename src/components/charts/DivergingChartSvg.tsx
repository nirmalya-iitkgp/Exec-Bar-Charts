import React from 'react';
import { AspectRatio, ChartSettings, DivergingRow, PaletteColors } from '../../types/chart';
import { computeDivergingGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface DivergingChartSvgProps {
  rows: DivergingRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const DivergingChartSvg: React.FC<DivergingChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeDivergingGeometry(rows, aspectRatio, settings, colors);
  const { frame, zeroX, ticks, legendItems, items } = geom;

  const legendSpacing = Math.min(162, Math.floor((frame.svgWidth - 96) / Math.max(1, legendItems.length)));

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Diverging Stacked Bar Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          {legendItems.map((lg, idx) => {
            const x = 48 + idx * legendSpacing;
            return (
              <g key={lg.key}>
                <rect x={x} y={frame.legendY - 6} width={12} height={11} rx={2} fill={lg.color} />
                <text
                  x={x + 17}
                  y={frame.legendY + 4}
                  fontSize={11.5}
                  fill={colors.mutedText}
                  fontFamily="var(--font-sans)"
                >
                  {lg.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Gridlines & X-Axis Ticks */}
      {ticks.map((tick, idx) => (
        <g key={`tick-${idx}`}>
          {settings.showGridlines && tick.value !== 0 && (
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
            fontWeight={tick.value === 0 ? 700 : 400}
            fill={tick.value === 0 ? colors.text : colors.mutedText}
            fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* Right column header for Net Sentiment */}
      {settings.showValues && (
        <text
          x={frame.plot.right + 16}
          y={frame.plot.top - 4}
          textAnchor="start"
          fontSize={10.5}
          fontWeight={600}
          fill={colors.mutedText}
          fontFamily="var(--font-sans)"
        >
          Net Split
        </text>
      )}

      {/* Rows */}
      {items.map((item) => (
        <g
          key={item.id}
          className="cursor-pointer"
          onMouseEnter={() =>
            onHover?.({
              title: item.category,
              detail: `${item.segments.map((s) => `${s.label}: ${s.displayLabel}`).join(' · ')} (${item.netLabel} Net)`,
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

          {item.segments.map((seg) => (
            <g key={seg.key}>
              <rect
                x={seg.x}
                y={item.y - item.barHeight / 2}
                width={Math.max(0.5, seg.width)}
                height={item.barHeight}
                fill={seg.color}
                stroke="#FFFFFF"
                strokeWidth={0.75}
              />
              {settings.showValues && seg.width >= 30 && (
                <text
                  x={seg.x + seg.width / 2}
                  y={item.y + 4}
                  textAnchor="middle"
                  fontSize={Math.max(9.5, settings.fontSize - 2)}
                  fontWeight={600}
                  fill={seg.textColor}
                  fontFamily="var(--font-mono)"
                >
                  {seg.displayLabel}
                </text>
              )}
            </g>
          ))}

          {settings.showValues && (
            <text
              x={frame.plot.right + 16}
              y={item.y + 4}
              textAnchor="start"
              fontSize={Math.max(10, settings.fontSize - 1)}
              fontWeight={700}
              fill={item.netSentiment >= 0 ? colors.positive : colors.negative}
              fontFamily="var(--font-mono)"
            >
              {item.netLabel}
            </text>
          )}
        </g>
      ))}

      {/* Central Zero Reference Line (drawn above bars for sharp Likert alignment) */}
      <line
        x1={zeroX}
        y1={frame.plot.top}
        x2={zeroX}
        y2={frame.plot.bottom}
        stroke={colors.text}
        strokeWidth={1.75}
        opacity={0.75}
      />
    </svg>
  );
};
