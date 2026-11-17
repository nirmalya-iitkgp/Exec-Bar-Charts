import React from 'react';
import { AspectRatio, BumpRow, ChartSettings, PaletteColors } from '../../types/chart';
import { computeBumpGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface BumpChartSvgProps {
  rows: BumpRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const BumpChartSvg: React.FC<BumpChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeBumpGeometry(rows, aspectRatio, settings, colors);
  const { frame, periods, rankTicks, series } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Bump Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {rankTicks.map((tick) => (
        <g key={`rank-${tick.rank}`}>
          {settings.showGridlines && (
            <line
              x1={frame.plot.left}
              y1={tick.y}
              x2={frame.plot.right}
              y2={tick.y}
              stroke={colors.gridline}
              strokeWidth={1}
            />
          )}
          <text
            x={frame.plot.left - 12}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill={colors.mutedText}
            fontFamily="var(--font-mono)"
          >
            #{tick.rank}
          </text>
        </g>
      ))}

      {periods.map((period) => (
        <g key={`period-${period.label}`}>
          {settings.showGridlines && (
            <line
              x1={period.x}
              y1={frame.plot.top}
              x2={period.x}
              y2={frame.plot.bottom}
              stroke={colors.gridline}
              strokeWidth={1}
            />
          )}
          <text
            x={period.x}
            y={frame.plot.bottom + 24}
            textAnchor="middle"
            fontSize={12.5}
            fontWeight={700}
            fill={colors.text}
            fontFamily="var(--font-display)"
          >
            {period.label}
          </text>
        </g>
      ))}

      {series.map((s) => {
        const pathData = s.points
          .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
          .join(' ');
        const lastPt = s.points[s.points.length - 1];
        return (
          <g
            key={s.id}
            className="cursor-pointer"
            onMouseEnter={() =>
              onHover?.({
                title: s.entity,
                detail: s.points.map((pt) => `${pt.period}: #${pt.rank}`).join(' · '),
              })
            }
            onMouseLeave={() => onHover?.(null)}
          >
            <path
              d={pathData}
              fill="none"
              stroke={s.color}
              strokeWidth={Math.max(2, settings.lineThickness)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {s.points.map((pt) => (
              <g key={`${s.id}-${pt.period}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={Math.max(6, settings.dotRadius + 1)}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {settings.showValues && (
                  <text
                    x={pt.x}
                    y={pt.y + 3.5}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontWeight={700}
                    fill="#FFFFFF"
                    fontFamily="var(--font-mono)"
                  >
                    {pt.rank}
                  </text>
                )}
              </g>
            ))}
            {lastPt && (
              <text
                x={lastPt.x + settings.dotRadius + 12}
                y={lastPt.y + 4}
                textAnchor="start"
                fontSize={settings.fontSize}
                fontWeight={600}
                fill={s.color}
                fontFamily="var(--font-sans)"
              >
                {s.entity}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
