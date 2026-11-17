import React from 'react';
import { AspectRatio, BarbellRow, ChartSettings, PaletteColors } from '../../types/chart';
import { computeBarbellGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface BarbellChartSvgProps {
  rows: BarbellRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const BarbellChartSvg: React.FC<BarbellChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeBarbellGeometry(rows, aspectRatio, settings, colors);
  const { frame, ticks, items } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Barbell Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          <circle cx={54} cy={frame.legendY} r={5} fill={colors.neutral} />
          <text
            x={64}
            y={frame.legendY + 4}
            fontSize={12}
            fill={colors.mutedText}
            fontFamily="var(--font-sans)"
          >
            {settings.barbellStartLabel || 'Start'}
          </text>
          {settings.barbellColorMode === 'directional' ? (
            <>
              <circle cx={155} cy={frame.legendY} r={5} fill={colors.positive} />
              <text
                x={165}
                y={frame.legendY + 4}
                fontSize={12}
                fill={colors.mutedText}
                fontFamily="var(--font-sans)"
              >
                {settings.barbellEndLabel || 'End'} (Increase)
              </text>
              <circle cx={305} cy={frame.legendY} r={5} fill={colors.negative} />
              <text
                x={315}
                y={frame.legendY + 4}
                fontSize={12}
                fill={colors.mutedText}
                fontFamily="var(--font-sans)"
              >
                {settings.barbellEndLabel || 'End'} (Decrease)
              </text>
            </>
          ) : (
            <>
              <circle cx={155} cy={frame.legendY} r={5} fill={colors.primary} />
              <text
                x={165}
                y={frame.legendY + 4}
                fontSize={12}
                fill={colors.mutedText}
                fontFamily="var(--font-sans)"
              >
                {settings.barbellEndLabel || 'End'}
              </text>
            </>
          )}
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
        const startIsLeft = item.x1 <= item.x2;
        const deltaSign = item.delta > 0 ? '+' : '';
        return (
          <g
            key={item.id}
            className="cursor-pointer transition-opacity"
            onMouseEnter={() =>
              onHover?.({
                title: item.category,
                detail: `${item.startLabel} → ${item.endLabel} (${deltaSign}${item.delta.toFixed(1)})`,
              })
            }
            onMouseLeave={() => onHover?.(null)}
          >
            {settings.showGridlines && (
              <line
                x1={frame.plot.left}
                y1={item.y}
                x2={frame.plot.right}
                y2={item.y}
                stroke={colors.gridline}
                strokeDasharray="2 3"
                strokeWidth={1}
              />
            )}
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
            <line
              x1={item.x1}
              y1={item.y}
              x2={item.x2}
              y2={item.y}
              stroke={item.lineColor}
              strokeWidth={settings.lineThickness}
              strokeLinecap="round"
            />
            <circle
              cx={item.x1}
              cy={item.y}
              r={settings.dotRadius}
              fill={item.startColor}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            <circle
              cx={item.x2}
              cy={item.y}
              r={settings.dotRadius}
              fill={item.endColor}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            {settings.showValues && (
              <>
                <text
                  x={startIsLeft ? item.x1 - settings.dotRadius - 6 : item.x1 + settings.dotRadius + 6}
                  y={item.y + 4}
                  textAnchor={startIsLeft ? 'end' : 'start'}
                  fontSize={Math.max(10, settings.fontSize - 1)}
                  fill={colors.mutedText}
                  fontFamily="var(--font-mono)"
                >
                  {item.startLabel}
                </text>
                <text
                  x={startIsLeft ? item.x2 + settings.dotRadius + 6 : item.x2 - settings.dotRadius - 6}
                  y={item.y + 4}
                  textAnchor={startIsLeft ? 'start' : 'end'}
                  fontSize={Math.max(10, settings.fontSize - 1)}
                  fontWeight={600}
                  fill={item.endColor}
                  fontFamily="var(--font-mono)"
                >
                  {item.endLabel}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
