import React from 'react';
import { AspectRatio, ChartSettings, PaletteColors, SlopegraphRow } from '../../types/chart';
import { computeSlopegraphGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface SlopegraphChartSvgProps {
  rows: SlopegraphRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const SlopegraphChartSvg: React.FC<SlopegraphChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeSlopegraphGeometry(rows, aspectRatio, settings, colors);
  const { frame, x1, x2, items } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Slopegraph'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      <line
        x1={x1}
        y1={frame.plot.top}
        x2={x1}
        y2={frame.plot.bottom}
        stroke={colors.gridline}
        strokeWidth={1.5}
      />
      <line
        x1={x2}
        y1={frame.plot.top}
        x2={x2}
        y2={frame.plot.bottom}
        stroke={colors.gridline}
        strokeWidth={1.5}
      />

      <text
        x={x1}
        y={frame.plot.top - 10}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={colors.text}
        fontFamily="var(--font-display)"
      >
        {settings.period1Label || 'Period 1'}
      </text>
      <text
        x={x2}
        y={frame.plot.top - 10}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={colors.text}
        fontFamily="var(--font-display)"
      >
        {settings.period2Label || 'Period 2'}
      </text>

      {items.map((item) => (
        <g
          key={item.id}
          className="cursor-pointer"
          onMouseEnter={() =>
            onHover?.({
              title: item.category,
              detail: `${settings.period1Label || 'P1'}: ${item.p1Label} → ${settings.period2Label || 'P2'}: ${item.p2Label}`,
            })
          }
          onMouseLeave={() => onHover?.(null)}
        >
          <line
            x1={x1}
            y1={item.y1}
            x2={x2}
            y2={item.y2}
            stroke={item.color}
            strokeWidth={settings.lineThickness}
            strokeLinecap="round"
          />
          <circle
            cx={x1}
            cy={item.y1}
            r={settings.dotRadius}
            fill={item.color}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
          <circle
            cx={x2}
            cy={item.y2}
            r={settings.dotRadius}
            fill={item.color}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />

          <text
            x={x1 - settings.dotRadius - 10}
            y={item.leftLabelY + 4}
            textAnchor="end"
            fontSize={Math.max(10.5, settings.fontSize - 1)}
            fill={colors.text}
            fontFamily="var(--font-sans)"
          >
            {item.category}
            {settings.showValues && (
              <tspan dx="8" fontFamily="var(--font-mono)" fill={colors.mutedText}>
                {item.p1Label}
              </tspan>
            )}
          </text>

          <text
            x={x2 + settings.dotRadius + 10}
            y={item.rightLabelY + 4}
            textAnchor="start"
            fontSize={Math.max(10.5, settings.fontSize - 1)}
            fontWeight={600}
            fill={item.color}
            fontFamily="var(--font-sans)"
          >
            {settings.showValues && (
              <tspan fontFamily="var(--font-mono)">{item.p2Label}</tspan>
            )}
            <tspan dx={settings.showValues ? '8' : '0'} fontWeight={500} fill={colors.text}>
              {item.category}
            </tspan>
          </text>
        </g>
      ))}
    </svg>
  );
};
