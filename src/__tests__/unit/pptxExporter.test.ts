import { describe, expect, it } from 'vitest';
import { EXECUTIVE_PALETTES } from '../../constants/palettes';
import { createDefaultSettings, createInitialDatasets } from '../../constants/mockData';
import { ChartType } from '../../types/chart';
import { buildPptxPresentation, computePptxLineBox } from '../../utils/pptxExporter';

describe('Unit: Native PPTX Vector Exporter', () => {
  it('computes accurate bounding boxes and flipV flags for sloped lines', () => {
    // Downward slope (left-top to right-bottom) -> flipV = false
    const down = computePptxLineBox(1, 2, 5, 6);
    expect(down).toEqual({ x: 1, y: 2, w: 4, h: 4, flipV: false });

    // Upward slope (left-bottom to right-top) -> flipV = true
    const up = computePptxLineBox(1, 6, 5, 2);
    expect(up).toEqual({ x: 1, y: 2, w: 4, h: 4, flipV: true });

    // Horizontal line -> flipV = false, h = 0
    const horiz = computePptxLineBox(2, 3, 7, 3);
    expect(horiz).toEqual({ x: 2, y: 3, w: 5, h: 0, flipV: false });
  });

  it('builds valid PowerPoint slide objects with native vector shapes for all 10 chart types', () => {
    const datasets = createInitialDatasets();
    const colors = EXECUTIVE_PALETTES[0].colors;

    (Object.values(ChartType) as ChartType[]).forEach((chartType) => {
      const settings = createDefaultSettings(chartType);
      const pptx = buildPptxPresentation({
        chartType,
        datasets,
        aspectRatio: '16:9',
        settings,
        colors,
      });

      const slides = (pptx as unknown as { slides: Array<{ _slideObjects: Array<{ shape?: string }> }> }).slides;
      expect(slides.length).toBe(1);
      expect(pptx.layout).toBe('LAYOUT_16x9');
      // Each slide must contain multiple native shape/text objects
      const slideData = slides[0]._slideObjects;
      expect(Array.isArray(slideData)).toBe(true);
      expect(slideData.length).toBeGreaterThan(5);

      if (chartType === ChartType.VORONOI) {
        const custGeomCount = slideData.filter((obj) => obj.shape === 'custGeom').length;
        expect(custGeomCount).toBeGreaterThanOrEqual(datasets[ChartType.VORONOI].length);
      }
    });
  });

  it('supports 4:3 Standard layout when selected', () => {
    const datasets = createInitialDatasets();
    const settings = createDefaultSettings(ChartType.BULLET);
    const pptx = buildPptxPresentation({
      chartType: ChartType.BULLET,
      datasets,
      aspectRatio: '4:3',
      settings,
      colors: EXECUTIVE_PALETTES[1].colors,
    });

    expect(pptx.layout).toBe('LAYOUT_4x3');
  });
});
