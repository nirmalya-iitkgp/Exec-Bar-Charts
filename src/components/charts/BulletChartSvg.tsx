import React from 'react';
import { AspectRatio, BulletRow, ChartSettings, PaletteColors } from '../../types/chart';
import { computeBulletGeometry } from '../../utils/chartGeometry';
import { SlideChrome } from './SlideChrome';

interface BulletChartSvgProps {
  rows: BulletRow[];
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
  onHover?: (info: { title: string; detail: string } | null) => void;
}

export const BulletChartSvg: React.FC<BulletChartSvgProps> = ({
  rows,
  aspectRatio,
  settings,
  colors,
  onHover,
}) => {
  const geom = computeBulletGeometry(rows, aspectRatio, settings);
  const { frame, items } = geom;

  return (
    <svg
      viewBox={`0 0 ${frame.svgWidth} ${frame.svgHeight}`}
      className="w-full h-full select-none"
      role="img"
      aria-label={settings.title || 'Bullet Chart'}
    >
      <SlideChrome frame={frame} settings={settings} colors={colors} />

      {settings.showLegend && (
        <g>
          <rect x={48} y={frame.legendY - 6} width={14} height={10} fill="#94A3B8" rx={1} />
          <text x={67} y={frame.legendY + 3} fontSize={11.5} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Poor
          </text>
          <rect x={115} y={frame.legendY - 6} width={14} height={10} fill="#CBD5E1" rx={1} />
          <text x={134} y={frame.legendY + 3} fontSize={11.5} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Satisfactory
          </text>
          <rect x={222} y={frame.legendY - 6} width={14} height={10} fill="#F1F5F9" stroke="#E2E8F0" rx={1} />
          <text x={241} y={frame.legendY + 3} fontSize={11.5} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Good
          </text>
          <rect x={295} y={frame.legendY - 4} width={14} height={6} fill={colors.primary} rx={1} />
          <text x={314} y={frame.legendY + 3} fontSize={11.5} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Actual
          </text>
          <line x1={374} y1={frame.legendY - 7} x2={374} y2={frame.legendY + 5} stroke={colors.negative} strokeWidth={3} />
          <text x={383} y={frame.legendY + 3} fontSize={11.5} fill={colors.mutedText} fontFamily="var(--font-sans)">
            Target
          </text>
        </g>
      )}

      {items.map((item) => {
        const actualTop = item.y + (item.bandHeight - item.actualHeight) / 2;
        return (
          <g
            key={item.id}
            className="cursor-pointer"
            onMouseEnter={() =>
              onHover?.({
                title: item.metric,
                detail: `Actual: ${item.actualLabel} · Target: ${item.targetLabel} (${item.isOnTarget ? 'On/Above Plan' : 'Below Plan'})`,
              })
            }
            onMouseLeave={() => onHover?.(null)}
          >
            <text
              x={frame.plot.left - 14}
              y={item.y + item.bandHeight / 2 + 4}
              textAnchor="end"
              fontSize={settings.fontSize}
              fontWeight={500}
              fill={colors.text}
              fontFamily="var(--font-sans)"
            >
              {item.metric}
            </text>

            {/* Qualitative background ranges */}
            <rect
              x={frame.plot.left}
              y={item.y}
              width={item.goodWidth}
              height={item.bandHeight}
              fill="#F1F5F9"
              stroke="#E2E8F0"
              strokeWidth={0.8}
            />
            <rect
              x={frame.plot.left}
              y={item.y}
              width={item.satisfactoryWidth}
              height={item.bandHeight}
              fill="#CBD5E1"
            />
            <rect
              x={frame.plot.left}
              y={item.y}
              width={item.poorWidth}
              height={item.bandHeight}
              fill="#94A3B8"
            />

            {/* Actual performance bar */}
            <rect
              x={frame.plot.left}
              y={actualTop}
              width={Math.max(2, item.actualWidth)}
              height={item.actualHeight}
              fill={colors.primary}
            />

            {/* Target tick line */}
            <line
              x1={item.targetX}
              y1={item.y - 4}
              x2={item.targetX}
              y2={item.y + item.bandHeight + 4}
              stroke={colors.negative}
              strokeWidth={3}
            />

            {/* Per-row quantitative scale ticks */}
            {settings.bulletShowTicks &&
              item.ticks.map((tick, tIdx) => (
                <g key={`btick-${tIdx}`}>
                  <line
                    x1={tick.x}
                    y1={item.y + item.bandHeight}
                    x2={tick.x}
                    y2={item.y + item.bandHeight + 4}
                    stroke={colors.mutedText}
                    strokeWidth={0.9}
                    opacity={0.7}
                  />
                  <text
                    x={tick.x}
                    y={item.y + item.bandHeight + 13}
                    textAnchor="middle"
                    fontSize={9}
                    fill={colors.mutedText}
                    fontFamily="var(--font-mono)"
                    opacity={0.85}
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

            {settings.showValues && (
              <text
                x={frame.plot.right + 12}
                y={item.y + item.bandHeight / 2 + 4}
                textAnchor="start"
                fontSize={Math.max(10, settings.fontSize - 1.5)}
                fontWeight={600}
                fill={colors.text}
                fontFamily="var(--font-mono)"
              >
                {item.actualLabel}
                <tspan fill={colors.mutedText} fontWeight={400}>
                  {' '}
                  / {item.targetLabel}
                </tspan>
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
