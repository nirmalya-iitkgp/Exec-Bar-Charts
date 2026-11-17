import React from 'react';
import { AspectRatio, ChartSettings, ClevelandRow, PaletteColors } from '../../types/chart';
import { computeClevelandGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface ClevelandChartSvgProps {
  rows: ClevelandRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const ClevelandChartSvg: React.FC<ClevelandChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeClevelandGeometry(rows, aspectRatio, settings, colors);
  const { frame, ticks, rows: rowGeoms } = geom;

  const legendItems = [
    { name: settings.clevelandSeriesNames[0] || 'Series A', color: colors.primary, x: 54 },
    { name: settings.clevelandSeriesNames[1] || 'Series B', color: colors.secondary, x: 204 },
    { name: settings.clevelandSeriesNames[2] || 'Series C', color: colors.tertiary, x: 354 },
  ];

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Cleveland Dot Plot'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          {legendItems.map((item) => (
            <g key={item.name}>
              <circle cx={item.x} cy={frame.legendY} r={5} fill={item.color} />
              <text
                x={item.x + 10}
                y={frame.legendY + 4}
                fontSize={12}
                fill={colors.mutedText}
                fontFamily="var(--font-sans)"
              >
                {item.name}
              </text>
            </g>
          ))}
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

      {rowGeoms.map((row) => (
        <g
          key={row.id}
          className="cursor-pointer"
          onMouseEnter={() =>
            onHover?.({
              title: row.category,
              detail: row.points.map((p) => `${p.seriesName}: ${p.label}`).join(' · '),
            })
          }
          onMouseLeave={() => onHover?.(null)}
        >
          {settings.showGridlines && (
            <line
              x1={frame.plot.left}
              y1={row.y}
              x2={frame.plot.right}
              y2={row.y}
              stroke={colors.gridline}
              strokeWidth={1}
            />
          )}
          <text
            x={frame.plot.left - 14}
            y={row.y + 4}
            textAnchor="end"
            fontSize={settings.fontSize}
            fontWeight={500}
            fill={colors.text}
            fontFamily="var(--font-sans)"
          >
            {row.category}
          </text>
          {row.points.map((pt) => (
            <g key={pt.seriesKey}>
              <circle
                cx={pt.x}
                cy={row.y}
                r={settings.dotRadius}
                fill={pt.color}
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
              {settings.showValues && (
                <text
                  x={pt.x}
                  y={row.y - settings.dotRadius - 6}
                  textAnchor="middle"
                  fontSize={Math.max(9.5, settings.fontSize - 2)}
                  fill={colors.mutedText}
                  fontFamily="var(--font-mono)"
                >
                  {pt.label}
                </text>
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
};
