import React from 'react';
import { ChartSettings, PaletteColors } from '../../types/chart';
import { SlideFrameLayout } from '../../utils/chartGeometry';

interface SlideChromeProps {
  frame: SlideFrameLayout;
  settings: ChartSettings;
  colors: PaletteColors;
}

export const SlideChrome: React.FC<SlideChromeProps> = ({ frame, settings, colors }) => {
  return (
    <g>
      <rect
        x={0}
        y={0}
        width={frame.svgWidth}
        height={frame.svgHeight}
        fill={colors.slideBg}
      />

      {settings.title.trim() && (
        <text
          x={frame.titleX}
          y={frame.titleY}
          fill={colors.text}
          fontSize={22}
          fontWeight={700}
          fontFamily="var(--font-display)"
          letterSpacing="-0.02em"
        >
          {settings.title}
        </text>
      )}

      {settings.subtitle.trim() && (
        <text
          x={frame.titleX}
          y={frame.subtitleY}
          fill={colors.mutedText}
          fontSize={13.5}
          fontWeight={400}
          fontFamily="var(--font-sans)"
        >
          {settings.subtitle}
        </text>
      )}

      {settings.footnote.trim() && (
        <text
          x={frame.titleX}
          y={frame.footnoteY}
          fill={colors.mutedText}
          fontSize={10.5}
          fontFamily="var(--font-sans)"
          opacity={0.85}
        >
          {settings.footnote}
        </text>
      )}
    </g>
  );
};
