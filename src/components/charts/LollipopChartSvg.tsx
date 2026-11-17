import React from 'react';
import { AspectRatio, ChartSettings, LollipopRow, PaletteColors } from '../../types/chart';
import { computeLollipopGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface LollipopChartSvgProps {
  rows: LollipopRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const LollipopChartSvg: React.FC<LollipopChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeLollipopGeometry(rows, aspectRatio, settings, colors);
  const { frame, orientation, ticks, items } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Lollipop Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {orientation === 'horizontal' ? (
        <>
          {ticks.map((tick, idx) => (
            <g key={`tick-${idx}`}>
              {settings.showGridlines && (
                <line
                  x1={tick.pos}
                  y1={frame.plot.top}
                  x2={tick.pos}
                  y2={frame.plot.bottom}
                  stroke={tick.value === 0 ? colors.neutral : colors.gridline}
                  strokeWidth={tick.value === 0 ? 1.5 : 1}
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
            const isPos = item.value >= 0;
            return (
              <g
                key={item.id}
                className="cursor-pointer"
                onMouseEnter={() => onHover?.({ title: item.category, detail: item.label })}
                onMouseLeave={() => onHover?.(null)}
              >
                <text
                  x={frame.plot.left - 14}
                  y={item.y1 + 4}
                  textAnchor="end"
                  fontSize={settings.fontSize}
                  fontWeight={500}
                  fill={colors.text}
                  fontFamily="var(--font-sans)"
                >
                  {item.category}
                </text>
                <line
                  x1={item.x1}
                  y1={item.y1}
                  x2={item.x2}
                  y2={item.y2}
                  stroke={item.color}
                  strokeWidth={settings.lineThickness}
                  strokeLinecap="round"
                />
                <circle
                  cx={item.x2}
                  cy={item.y2}
                  r={settings.dotRadius}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                {settings.showValues && (
                  <text
                    x={isPos ? item.x2 + settings.dotRadius + 8 : item.x2 - settings.dotRadius - 8}
                    y={item.y2 + 4}
                    textAnchor={isPos ? 'start' : 'end'}
                    fontSize={Math.max(10, settings.fontSize - 1)}
                    fontWeight={600}
                    fill={colors.text}
                    fontFamily="var(--font-mono)"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            );
          })}
        </>
      ) : (
        <>
          {ticks.map((tick, idx) => (
            <g key={`tick-${idx}`}>
              {settings.showGridlines && (
                <line
                  x1={frame.plot.left}
                  y1={tick.pos}
                  x2={frame.plot.right}
                  y2={tick.pos}
                  stroke={tick.value === 0 ? colors.neutral : colors.gridline}
                  strokeWidth={tick.value === 0 ? 1.5 : 1}
                />
              )}
              <text
                x={frame.plot.left - 10}
                y={tick.pos + 4}
                textAnchor="end"
                fontSize={11}
                fill={colors.mutedText}
                fontFamily="var(--font-mono)"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {items.map((item) => {
            const isPos = item.value >= 0;
            return (
              <g
                key={item.id}
                className="cursor-pointer"
                onMouseEnter={() => onHover?.({ title: item.category, detail: item.label })}
                onMouseLeave={() => onHover?.(null)}
              >
                <line
                  x1={item.x1}
                  y1={item.y1}
                  x2={item.x2}
                  y2={item.y2}
                  stroke={item.color}
                  strokeWidth={settings.lineThickness}
                  strokeLinecap="round"
                />
                <circle
                  cx={item.x2}
                  cy={item.y2}
                  r={settings.dotRadius}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
                <text
                  x={item.x1}
                  y={frame.plot.bottom + 20}
                  textAnchor="middle"
                  fontSize={Math.max(10, settings.fontSize - 1)}
                  fontWeight={500}
                  fill={colors.text}
                  fontFamily="var(--font-sans)"
                >
                  {item.category.length > 16 ? `${item.category.slice(0, 15)}…` : item.category}
                </text>
                {settings.showValues && (
                  <text
                    x={item.x2}
                    y={isPos ? item.y2 - settings.dotRadius - 7 : item.y2 + settings.dotRadius + 14}
                    textAnchor="middle"
                    fontSize={Math.max(10, settings.fontSize - 1)}
                    fontWeight={600}
                    fill={colors.text}
                    fontFamily="var(--font-mono)"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
};
