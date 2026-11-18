import React from 'react';
import { AspectRatio, ChartSettings, PaletteColors, TernaryRow } from '../../types/chart';
import { computeTernaryGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface TernaryChartSvgProps {
  rows: TernaryRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const TernaryChartSvg: React.FC<TernaryChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeTernaryGeometry(rows, aspectRatio, settings, colors);
  const { frame, vertexA, vertexB, vertexC, labelA, labelB, labelC, gridLines, points, groups } = geom;

  const legendSpacing = Math.min(165, Math.floor((frame.svgWidth - 96) / Math.max(1, groups.length)));

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Ternary Plot'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          {groups.map((grp, idx) => {
            const x = 48 + idx * legendSpacing;
            return (
              <g key={grp.group}>
                <circle cx={x + 5} cy={frame.legendY} r={5} fill={grp.color} />
                <text
                  x={x + 15}
                  y={frame.legendY + 4}
                  fontSize={12}
                  fill={colors.mutedText}
                  fontFamily="var(--font-sans)"
                >
                  {grp.group}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Triangle coordinate grid lines */}
      {settings.showGridlines &&
        gridLines.map((gl, idx) => (
          <g key={`tgl-${idx}`}>
            <line
              x1={gl.x1}
              y1={gl.y1}
              x2={gl.x2}
              y2={gl.y2}
              stroke={colors.gridline}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text
              x={gl.tickX}
              y={gl.tickY}
              textAnchor={gl.tickAnchor}
              fontSize={9.5}
              fill={colors.mutedText}
              fontFamily="var(--font-mono)"
            >
              {gl.tickLabel}
            </text>
          </g>
        ))}

      {/* Equilateral triangle frame */}
      <polygon
        points={`${vertexA.x},${vertexA.y} ${vertexB.x},${vertexB.y} ${vertexC.x},${vertexC.y}`}
        fill="none"
        stroke={colors.text}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />

      {/* Vertex Axis Titles */}
      <text
        x={vertexA.x}
        y={vertexA.y - 14}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={colors.text}
        fontFamily="var(--font-display)"
      >
        {labelA} (100%)
      </text>
      <text
        x={vertexB.x - 8}
        y={vertexB.y + 26}
        textAnchor="end"
        fontSize={13}
        fontWeight={700}
        fill={colors.text}
        fontFamily="var(--font-display)"
      >
        {labelB} (100%)
      </text>
      <text
        x={vertexC.x + 8}
        y={vertexC.y + 26}
        textAnchor="start"
        fontSize={13}
        fontWeight={700}
        fill={colors.text}
        fontFamily="var(--font-display)"
      >
        {labelC} (100%)
      </text>

      {/* Optional density halos */}
      {settings.ternaryShowDensity &&
        points.map((pt) => (
          <g key={`halo-${pt.id}`} pointerEvents="none">
            <circle cx={pt.x} cy={pt.y} r={pt.densityRadius} fill={pt.color} opacity={0.11} />
            <circle cx={pt.x} cy={pt.y} r={pt.densityRadius * 0.62} fill={pt.color} opacity={0.14} />
          </g>
        ))}

      {/* Scatter / Bubble points */}
      {points.map((pt) => (
        <g
          key={pt.id}
          className="cursor-pointer"
          onMouseEnter={() =>
            onHover?.({
              title: `${pt.category} (${pt.group})`,
              detail: `${labelA}: ${pt.pctA.toFixed(0)}% · ${labelB}: ${pt.pctB.toFixed(0)}% · ${labelC}: ${pt.pctC.toFixed(0)}% · Size: ${pt.sizeLabel}`,
            })
          }
          onMouseLeave={() => onHover?.(null)}
        >
          <circle
            cx={pt.x}
            cy={pt.y}
            r={pt.radius}
            fill={pt.color}
            opacity={0.9}
            stroke="#FFFFFF"
            strokeWidth={1.75}
          />
          {settings.showValues && (
            <text
              x={pt.x}
              y={pt.y - pt.radius - 5}
              textAnchor="middle"
              fontSize={Math.max(9.5, settings.fontSize - 2)}
              fontWeight={600}
              fill={colors.text}
              fontFamily="var(--font-sans)"
            >
              {pt.category}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};
