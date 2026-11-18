import React from 'react';
import { AspectRatio, ChartSettings, PaletteColors, VoronoiRow } from '../../types/chart';
import { computeVoronoiGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface VoronoiChartSvgProps {
  rows: VoronoiRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const VoronoiChartSvg: React.FC<VoronoiChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeVoronoiGeometry(rows, aspectRatio, settings, colors);
  const { frame, containerPolygon, parents } = geom;

  const toPointsAttr = (poly: { x: number; y: number }[]) =>
    poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Voronoi Treemap'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {/* Left Hierarchical Division Summary Legend */}
      {settings.showLegend && (
        <g>
          <text
            x={48}
            y={frame.plot.top + 18}
            fontSize={11}
            fontWeight={700}
            fill={colors.mutedText}
            fontFamily="var(--font-sans)"
          >
            Division Breakdown
          </text>
          {parents.slice(0, 8).map((parent, idx) => {
            const rowY = frame.plot.top + 42 + idx * 36;
            return (
              <g key={parent.category}>
                <rect x={48} y={rowY - 10} width={12} height={12} rx={2} fill={parent.color} />
                <text
                  x={66}
                  y={rowY}
                  fontSize={12}
                  fontWeight={600}
                  fill={colors.text}
                  fontFamily="var(--font-sans)"
                >
                  {parent.category}
                </text>
                <text
                  x={66}
                  y={rowY + 14}
                  fontSize={10.5}
                  fill={colors.mutedText}
                  fontFamily="var(--font-mono)"
                >
                  {parent.totalLabel} ({parent.sharePct.toFixed(1)}%)
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Child Voronoi Cells */}
      {parents.map((parent) =>
        parent.children.map((cell) => {
          if (cell.polygon.length < 3) return null;
          const canShowName = cell.bboxWidth >= 56 && cell.bboxHeight >= 30;
          const canShowValue = cell.bboxWidth >= 66 && cell.bboxHeight >= 46;
          const maxChars = Math.max(5, Math.floor(cell.bboxWidth / 7.5));
          const displayTitle =
            cell.subcategory.length > maxChars
              ? `${cell.subcategory.slice(0, maxChars - 1)}…`
              : cell.subcategory;

          return (
            <g
              key={cell.id}
              className="cursor-pointer transition-opacity hover:opacity-90"
              onMouseEnter={() =>
                onHover?.({
                  title: `${cell.parentCategory} · ${cell.subcategory}`,
                  detail: `${cell.valueLabel} (${cell.sharePct.toFixed(1)}% of total)`,
                })
              }
              onMouseLeave={() => onHover?.(null)}
            >
              <polygon
                points={toPointsAttr(cell.polygon)}
                fill={cell.fillColor}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              {settings.showValues && canShowName && (
                <text
                  x={cell.centroid.x}
                  y={canShowValue ? cell.centroid.y - 3 : cell.centroid.y + 4}
                  textAnchor="middle"
                  fontSize={Math.max(10, Math.min(13, settings.fontSize - 1))}
                  fontWeight={600}
                  fill={cell.textColor}
                  fontFamily="var(--font-sans)"
                  pointerEvents="none"
                >
                  {displayTitle}
                </text>
              )}
              {settings.showValues && canShowValue && (
                <text
                  x={cell.centroid.x}
                  y={cell.centroid.y + 13}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={500}
                  fill={cell.textColor}
                  opacity={0.9}
                  fontFamily="var(--font-mono)"
                  pointerEvents="none"
                >
                  {cell.valueLabel} · {cell.sharePct.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Parent Hierarchical Containment Borders */}
      {settings.voronoiShowHierarchyBorders &&
        parents.map((parent) =>
          parent.polygon.length >= 3 ? (
            <polygon
              key={`border-${parent.category}`}
              points={toPointsAttr(parent.polygon)}
              fill="none"
              stroke={colors.text}
              strokeWidth={2.25}
              strokeLinejoin="round"
              pointerEvents="none"
            />
          ) : null
        )}

      {/* Outer Container Frame */}
      {containerPolygon.length >= 3 && (
        <polygon
          points={toPointsAttr(containerPolygon)}
          fill="none"
          stroke={colors.text}
          strokeWidth={2}
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
    </svg>
  );
};
