import PptxGenJS from 'pptxgenjs';
import {
  AspectRatio,
  BarbellRow,
  BulletRow,
  BumpRow,
  ChartDatasetMap,
  ChartSettings,
  ChartType,
  ClevelandRow,
  LollipopRow,
  PaletteColors,
  SlopegraphRow,
  SpanRow,
} from '../types/chart';
import { stripHashForPptx } from '../constants/palettes';
import { getSlideDimensions } from './formatters';
import {
  computeBarbellGeometry,
  computeBulletGeometry,
  computeBumpGeometry,
  computeClevelandGeometry,
  computeLollipopGeometry,
  computeSlopegraphGeometry,
  computeSpanGeometry,
  SlideFrameLayout,
} from './chartGeometry';

export interface LineVectorBox {
  x: number;
  y: number;
  w: number;
  h: number;
  flipV: boolean;
}

export function computePptxLineBox(x1: number, y1: number, x2: number, y2: number): LineVectorBox {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  const flipV = (x2 - x1) * (y2 - y1) < 0;
  return { x, y, w, h, flipV };
}

function addVectorLine(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  x1In: number,
  y1In: number,
  x2In: number,
  y2In: number,
  hexColor: string,
  widthPt: number,
  dashType?: 'solid' | 'dash' | 'sysDot'
) {
  const box = computePptxLineBox(x1In, y1In, x2In, y2In);
  slide.addShape(pptx.ShapeType.line, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    flipV: box.flipV,
    line: {
      color: stripHashForPptx(hexColor),
      width: Math.max(0.5, widthPt),
      dashType: dashType ?? 'solid',
    },
  });
}

function addVectorCircle(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  cxIn: number,
  cyIn: number,
  rIn: number,
  fillHex: string,
  strokeHex?: string,
  strokeWidthPt = 1
) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cxIn - rIn,
    y: cyIn - rIn,
    w: rIn * 2,
    h: rIn * 2,
    fill: { color: stripHashForPptx(fillHex) },
    line: strokeHex
      ? { color: stripHashForPptx(strokeHex), width: strokeWidthPt }
      : { color: stripHashForPptx(fillHex), width: 0 },
  });
}

function addSlideChrome(
  slide: PptxGenJS.Slide,
  frame: SlideFrameLayout,
  toInX: (px: number) => number,
  toInY: (px: number) => number,
  settings: ChartSettings,
  colors: PaletteColors
) {
  slide.background = { color: stripHashForPptx(colors.slideBg, 'FFFFFF') };

  if (settings.title.trim()) {
    slide.addText(settings.title, {
      x: toInX(frame.titleX),
      y: toInY(14),
      w: toInX(frame.svgWidth - frame.titleX * 2),
      h: toInY(34),
      fontFace: 'Calibri',
      fontSize: 18,
      bold: true,
      color: stripHashForPptx(colors.text),
      margin: 0,
    });
  }

  if (settings.subtitle.trim()) {
    slide.addText(settings.subtitle, {
      x: toInX(frame.titleX),
      y: toInY(46),
      w: toInX(frame.svgWidth - frame.titleX * 2),
      h: toInY(24),
      fontFace: 'Calibri',
      fontSize: 11,
      color: stripHashForPptx(colors.mutedText),
      margin: 0,
    });
  }

  if (settings.footnote.trim()) {
    slide.addText(settings.footnote, {
      x: toInX(frame.titleX),
      y: toInY(frame.footnoteY - 14),
      w: toInX(frame.svgWidth - frame.titleX * 2),
      h: toInY(20),
      fontFace: 'Calibri',
      fontSize: 8.5,
      color: stripHashForPptx(colors.mutedText),
      margin: 0,
    });
  }
}

export interface ExportPptxParams<K extends ChartType = ChartType> {
  chartType: K;
  datasets: ChartDatasetMap;
  aspectRatio: AspectRatio;
  settings: ChartSettings;
  colors: PaletteColors;
}

export function buildPptxPresentation({
  chartType,
  datasets,
  aspectRatio,
  settings,
  colors,
}: ExportPptxParams): PptxGenJS {
  const pptx = new PptxGenJS();
  const dims = getSlideDimensions(aspectRatio);
  pptx.layout = dims.pptxLayout;
  pptx.author = 'Executive Chart Studio';
  pptx.title = settings.title || 'Executive Chart';

  const slide = pptx.addSlide();
  const scaleX = dims.pptxWidthIn / dims.svgWidth;
  const scaleY = dims.pptxHeightIn / dims.svgHeight;
  const toInX = (px: number) => Number((px * scaleX).toFixed(4));
  const toInY = (px: number) => Number((px * scaleY).toFixed(4));
  const toPt = (px: number) => Number((px * 0.75).toFixed(2));
  const rIn = toInX(settings.dotRadius);
  const linePt = Math.max(0.75, settings.lineThickness * 0.75);
  const labelPt = Math.max(8, Math.round(settings.fontSize * 0.75));

  switch (chartType) {
    case ChartType.BARBELL: {
      const rows = datasets[ChartType.BARBELL] as BarbellRow[];
      const geom = computeBarbellGeometry(rows, aspectRatio, settings, colors);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      if (settings.showLegend) {
        addVectorCircle(slide, pptx, toInX(48 + 6), toInY(geom.frame.legendY), toInX(5), colors.neutral);
        slide.addText(settings.barbellStartLabel || 'Start', {
          x: toInX(60),
          y: toInY(geom.frame.legendY - 10),
          w: toInX(110),
          h: toInY(20),
          fontFace: 'Calibri',
          fontSize: 9.5,
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
        addVectorCircle(
          slide,
          pptx,
          toInX(160),
          toInY(geom.frame.legendY),
          toInX(5),
          settings.barbellColorMode === 'directional' ? colors.positive : colors.primary
        );
        slide.addText(
          settings.barbellColorMode === 'directional'
            ? `${settings.barbellEndLabel || 'End'} (Gain / Loss)`
            : settings.barbellEndLabel || 'End',
          {
            x: toInX(172),
            y: toInY(geom.frame.legendY - 10),
            w: toInX(180),
            h: toInY(20),
            fontFace: 'Calibri',
            fontSize: 9.5,
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          }
        );
      }

      geom.ticks.forEach((tick) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(tick.pos),
            toInY(geom.frame.plot.top),
            toInX(tick.pos),
            toInY(geom.frame.plot.bottom),
            colors.gridline,
            0.75
          );
        }
        slide.addText(tick.label, {
          x: toInX(tick.pos - 36),
          y: toInY(geom.frame.plot.bottom + 4),
          w: toInX(72),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 8.5,
          align: 'center',
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
      });

      geom.items.forEach((item) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(geom.frame.plot.left),
            toInY(item.y),
            toInX(geom.frame.plot.right),
            toInY(item.y),
            colors.gridline,
            0.5,
            'sysDot'
          );
        }
        slide.addText(item.category, {
          x: toInX(44),
          y: toInY(item.y - 10),
          w: toInX(geom.frame.plot.left - 56),
          h: toInY(20),
          fontFace: 'Calibri',
          fontSize: labelPt,
          align: 'right',
          valign: 'middle',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });
        addVectorLine(
          slide,
          pptx,
          toInX(item.x1),
          toInY(item.y),
          toInX(item.x2),
          toInY(item.y),
          item.lineColor,
          linePt
        );
        addVectorCircle(slide, pptx, toInX(item.x1), toInY(item.y), rIn, item.startColor, '#FFFFFF', 0.75);
        addVectorCircle(slide, pptx, toInX(item.x2), toInY(item.y), rIn, item.endColor, '#FFFFFF', 0.75);

        if (settings.showValues) {
          const startLeft = item.x1 <= item.x2;
          slide.addText(item.startLabel, {
            x: toInX(startLeft ? item.x1 - 54 : item.x1 + settings.dotRadius + 4),
            y: toInY(item.y - 9),
            w: toInX(46),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: Math.max(8, labelPt - 1),
            align: startLeft ? 'right' : 'left',
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
          slide.addText(item.endLabel, {
            x: toInX(startLeft ? item.x2 + settings.dotRadius + 4 : item.x2 - 54),
            y: toInY(item.y - 9),
            w: toInX(46),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: Math.max(8, labelPt - 1),
            bold: true,
            align: startLeft ? 'left' : 'right',
            color: stripHashForPptx(item.endColor),
            margin: 0,
          });
        }
      });
      break;
    }

    case ChartType.LOLLIPOP: {
      const rows = datasets[ChartType.LOLLIPOP] as LollipopRow[];
      const geom = computeLollipopGeometry(rows, aspectRatio, settings, colors);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      if (geom.orientation === 'horizontal') {
        geom.ticks.forEach((tick) => {
          if (settings.showGridlines) {
            addVectorLine(
              slide,
              pptx,
              toInX(tick.pos),
              toInY(geom.frame.plot.top),
              toInX(tick.pos),
              toInY(geom.frame.plot.bottom),
              tick.value === 0 ? colors.neutral : colors.gridline,
              tick.value === 0 ? 1.1 : 0.75
            );
          }
          slide.addText(tick.label, {
            x: toInX(tick.pos - 36),
            y: toInY(geom.frame.plot.bottom + 4),
            w: toInX(72),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: 8.5,
            align: 'center',
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
        });

        geom.items.forEach((item) => {
          slide.addText(item.category, {
            x: toInX(44),
            y: toInY(item.y1 - 10),
            w: toInX(geom.frame.plot.left - 56),
            h: toInY(20),
            fontFace: 'Calibri',
            fontSize: labelPt,
            align: 'right',
            valign: 'middle',
            color: stripHashForPptx(colors.text),
            margin: 0,
          });
          addVectorLine(
            slide,
            pptx,
            toInX(item.x1),
            toInY(item.y1),
            toInX(item.x2),
            toInY(item.y2),
            item.color,
            linePt
          );
          addVectorCircle(slide, pptx, toInX(item.x2), toInY(item.y2), rIn, item.color, '#FFFFFF', 0.75);
          if (settings.showValues) {
            const isPos = item.value >= 0;
            slide.addText(item.label, {
              x: toInX(isPos ? item.x2 + settings.dotRadius + 6 : item.x2 - 58),
              y: toInY(item.y2 - 9),
              w: toInX(50),
              h: toInY(18),
              fontFace: 'Calibri',
              fontSize: Math.max(8, labelPt - 1),
              bold: true,
              align: isPos ? 'left' : 'right',
              color: stripHashForPptx(colors.text),
              margin: 0,
            });
          }
        });
      } else {
        geom.ticks.forEach((tick) => {
          if (settings.showGridlines) {
            addVectorLine(
              slide,
              pptx,
              toInX(geom.frame.plot.left),
              toInY(tick.pos),
              toInX(geom.frame.plot.right),
              toInY(tick.pos),
              tick.value === 0 ? colors.neutral : colors.gridline,
              tick.value === 0 ? 1.1 : 0.75
            );
          }
          slide.addText(tick.label, {
            x: toInX(18),
            y: toInY(tick.pos - 9),
            w: toInX(geom.frame.plot.left - 24),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: 8.5,
            align: 'right',
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
        });

        geom.items.forEach((item) => {
          addVectorLine(
            slide,
            pptx,
            toInX(item.x1),
            toInY(item.y1),
            toInX(item.x2),
            toInY(item.y2),
            item.color,
            linePt
          );
          addVectorCircle(slide, pptx, toInX(item.x2), toInY(item.y2), rIn, item.color, '#FFFFFF', 0.75);
          slide.addText(item.category, {
            x: toInX(item.x1 - 54),
            y: toInY(geom.frame.plot.bottom + 8),
            w: toInX(108),
            h: toInY(24),
            fontFace: 'Calibri',
            fontSize: Math.max(8, labelPt - 1),
            align: 'center',
            color: stripHashForPptx(colors.text),
            margin: 0,
          });
          if (settings.showValues) {
            slide.addText(item.label, {
              x: toInX(item.x2 - 32),
              y: toInY(item.y2 - settings.dotRadius - 18),
              w: toInX(64),
              h: toInY(16),
              fontFace: 'Calibri',
              fontSize: Math.max(8, labelPt - 1),
              bold: true,
              align: 'center',
              color: stripHashForPptx(colors.text),
              margin: 0,
            });
          }
        });
      }
      break;
    }

    case ChartType.CLEVELAND: {
      const rows = datasets[ChartType.CLEVELAND] as ClevelandRow[];
      const geom = computeClevelandGeometry(rows, aspectRatio, settings, colors);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      if (settings.showLegend) {
        const legendItems = [
          { name: settings.clevelandSeriesNames[0] || 'Series A', color: colors.primary, x: 48 },
          { name: settings.clevelandSeriesNames[1] || 'Series B', color: colors.secondary, x: 188 },
          { name: settings.clevelandSeriesNames[2] || 'Series C', color: colors.tertiary, x: 328 },
        ];
        legendItems.forEach((lg) => {
          addVectorCircle(slide, pptx, toInX(lg.x + 5), toInY(geom.frame.legendY), toInX(5), lg.color);
          slide.addText(lg.name, {
            x: toInX(lg.x + 15),
            y: toInY(geom.frame.legendY - 10),
            w: toInX(120),
            h: toInY(20),
            fontFace: 'Calibri',
            fontSize: 9.5,
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
        });
      }

      geom.ticks.forEach((tick) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(tick.pos),
            toInY(geom.frame.plot.top),
            toInX(tick.pos),
            toInY(geom.frame.plot.bottom),
            colors.gridline,
            0.75
          );
        }
        slide.addText(tick.label, {
          x: toInX(tick.pos - 36),
          y: toInY(geom.frame.plot.bottom + 4),
          w: toInX(72),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 8.5,
          align: 'center',
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
      });

      geom.rows.forEach((row) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(geom.frame.plot.left),
            toInY(row.y),
            toInX(geom.frame.plot.right),
            toInY(row.y),
            colors.gridline,
            0.75
          );
        }
        slide.addText(row.category, {
          x: toInX(44),
          y: toInY(row.y - 10),
          w: toInX(geom.frame.plot.left - 56),
          h: toInY(20),
          fontFace: 'Calibri',
          fontSize: labelPt,
          align: 'right',
          valign: 'middle',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });
        row.points.forEach((pt) => {
          addVectorCircle(slide, pptx, toInX(pt.x), toInY(row.y), rIn, pt.color, '#FFFFFF', 0.75);
          if (settings.showValues) {
            slide.addText(pt.label, {
              x: toInX(pt.x - 24),
              y: toInY(row.y - settings.dotRadius - 15),
              w: toInX(48),
              h: toInY(14),
              fontFace: 'Calibri',
              fontSize: 8,
              align: 'center',
              color: stripHashForPptx(colors.mutedText),
              margin: 0,
            });
          }
        });
      });
      break;
    }

    case ChartType.SLOPEGRAPH: {
      const rows = datasets[ChartType.SLOPEGRAPH] as SlopegraphRow[];
      const geom = computeSlopegraphGeometry(rows, aspectRatio, settings, colors);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      // Period column vertical guides + headers
      addVectorLine(
        slide,
        pptx,
        toInX(geom.x1),
        toInY(geom.frame.plot.top),
        toInX(geom.x1),
        toInY(geom.frame.plot.bottom),
        colors.gridline,
        1
      );
      addVectorLine(
        slide,
        pptx,
        toInX(geom.x2),
        toInY(geom.frame.plot.top),
        toInX(geom.x2),
        toInY(geom.frame.plot.bottom),
        colors.gridline,
        1
      );
      slide.addText(settings.period1Label || 'Period 1', {
        x: toInX(geom.x1 - 50),
        y: toInY(geom.frame.plot.top - 22),
        w: toInX(100),
        h: toInY(18),
        fontFace: 'Calibri',
        fontSize: 10,
        bold: true,
        align: 'center',
        color: stripHashForPptx(colors.text),
        margin: 0,
      });
      slide.addText(settings.period2Label || 'Period 2', {
        x: toInX(geom.x2 - 50),
        y: toInY(geom.frame.plot.top - 22),
        w: toInX(100),
        h: toInY(18),
        fontFace: 'Calibri',
        fontSize: 10,
        bold: true,
        align: 'center',
        color: stripHashForPptx(colors.text),
        margin: 0,
      });

      geom.items.forEach((item) => {
        addVectorLine(
          slide,
          pptx,
          toInX(geom.x1),
          toInY(item.y1),
          toInX(geom.x2),
          toInY(item.y2),
          item.color,
          linePt
        );
        addVectorCircle(slide, pptx, toInX(geom.x1), toInY(item.y1), rIn, item.color, '#FFFFFF', 0.75);
        addVectorCircle(slide, pptx, toInX(geom.x2), toInY(item.y2), rIn, item.color, '#FFFFFF', 0.75);

        const leftText = settings.showValues ? `${item.category}  ${item.p1Label}` : item.category;
        slide.addText(leftText, {
          x: toInX(36),
          y: toInY(item.leftLabelY - 9),
          w: toInX(geom.x1 - 50),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: Math.max(8, labelPt - 1),
          align: 'right',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });
        const rightText = settings.showValues ? `${item.p2Label}  ${item.category}` : item.category;
        slide.addText(rightText, {
          x: toInX(geom.x2 + 12),
          y: toInY(item.rightLabelY - 9),
          w: toInX(geom.frame.svgWidth - geom.x2 - 32),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: Math.max(8, labelPt - 1),
          bold: true,
          align: 'left',
          color: stripHashForPptx(item.color),
          margin: 0,
        });
      });
      break;
    }

    case ChartType.BUMP: {
      const rows = datasets[ChartType.BUMP] as BumpRow[];
      const geom = computeBumpGeometry(rows, aspectRatio, settings, colors);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      geom.rankTicks.forEach((tick) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(geom.frame.plot.left),
            toInY(tick.y),
            toInX(geom.frame.plot.right),
            toInY(tick.y),
            colors.gridline,
            0.6
          );
        }
        slide.addText(`#${tick.rank}`, {
          x: toInX(36),
          y: toInY(tick.y - 9),
          w: toInX(58),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 9,
          align: 'right',
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
      });

      geom.periods.forEach((period) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(period.x),
            toInY(geom.frame.plot.top),
            toInX(period.x),
            toInY(geom.frame.plot.bottom),
            colors.gridline,
            0.75
          );
        }
        slide.addText(period.label, {
          x: toInX(period.x - 32),
          y: toInY(geom.frame.plot.bottom + 8),
          w: toInX(64),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 9.5,
          bold: true,
          align: 'center',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });
      });

      geom.series.forEach((series) => {
        for (let i = 0; i < series.points.length - 1; i++) {
          const p1 = series.points[i];
          const p2 = series.points[i + 1];
          addVectorLine(
            slide,
            pptx,
            toInX(p1.x),
            toInY(p1.y),
            toInX(p2.x),
            toInY(p2.y),
            series.color,
            linePt
          );
        }
        series.points.forEach((pt, idx) => {
          addVectorCircle(slide, pptx, toInX(pt.x), toInY(pt.y), rIn, series.color, '#FFFFFF', 0.9);
          if (settings.showValues) {
            slide.addText(String(pt.rank), {
              x: toInX(pt.x - 10),
              y: toInY(pt.y - 8),
              w: toInX(20),
              h: toInY(16),
              fontFace: 'Calibri',
              fontSize: 7.5,
              bold: true,
              align: 'center',
              valign: 'middle',
              color: 'FFFFFF',
              margin: 0,
            });
          }
          if (idx === series.points.length - 1) {
            slide.addText(series.entity, {
              x: toInX(pt.x + settings.dotRadius + 8),
              y: toInY(pt.y - 9),
              w: toInX(150),
              h: toInY(18),
              fontFace: 'Calibri',
              fontSize: Math.max(8, labelPt - 1),
              bold: true,
              color: stripHashForPptx(series.color),
              margin: 0,
            });
          }
        });
      });
      break;
    }

    case ChartType.BULLET: {
      const rows = datasets[ChartType.BULLET] as BulletRow[];
      const geom = computeBulletGeometry(rows, aspectRatio, settings);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      if (settings.showLegend) {
        const swatches = [
          { label: 'Poor', color: '#E2E8F0', x: 48 },
          { label: 'Satisfactory', color: '#CBD5E1', x: 120 },
          { label: 'Good', color: '#F1F5F9', x: 222 },
          { label: 'Actual', color: colors.primary, x: 298 },
          { label: 'Target', color: colors.negative, x: 378 },
        ];
        swatches.forEach((sw) => {
          slide.addShape(pptx.ShapeType.rect, {
            x: toInX(sw.x),
            y: toInY(geom.frame.legendY - 5),
            w: toInX(12),
            h: toInY(10),
            fill: { color: stripHashForPptx(sw.color) },
            line: { color: stripHashForPptx(sw.color), width: 0 },
          });
          slide.addText(sw.label, {
            x: toInX(sw.x + 16),
            y: toInY(geom.frame.legendY - 9),
            w: toInX(68),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: 9,
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
        });
      }

      geom.items.forEach((item) => {
        slide.addText(item.metric, {
          x: toInX(44),
          y: toInY(item.y),
          w: toInX(geom.frame.plot.left - 56),
          h: toInY(item.bandHeight),
          fontFace: 'Calibri',
          fontSize: labelPt,
          align: 'right',
          valign: 'middle',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });

        // Background qualitative bands: Good (full), Satisfactory, Poor
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(geom.frame.plot.left),
          y: toInY(item.y),
          w: toInX(item.goodWidth),
          h: toInY(item.bandHeight),
          fill: { color: 'F1F5F9' },
          line: { color: 'E2E8F0', width: 0.5 },
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(geom.frame.plot.left),
          y: toInY(item.y),
          w: toInX(item.satisfactoryWidth),
          h: toInY(item.bandHeight),
          fill: { color: 'CBD5E1' },
          line: { color: 'CBD5E1', width: 0 },
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(geom.frame.plot.left),
          y: toInY(item.y),
          w: toInX(item.poorWidth),
          h: toInY(item.bandHeight),
          fill: { color: '94A3B8' },
          line: { color: '94A3B8', width: 0 },
        });

        // Actual performance bar
        const actualTop = item.y + (item.bandHeight - item.actualHeight) / 2;
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(geom.frame.plot.left),
          y: toInY(actualTop),
          w: Math.max(0.02, toInX(item.actualWidth)),
          h: toInY(item.actualHeight),
          fill: { color: stripHashForPptx(colors.primary) },
          line: { color: stripHashForPptx(colors.primary), width: 0 },
        });

        // Target tick line
        addVectorLine(
          slide,
          pptx,
          toInX(item.targetX),
          toInY(item.y - 3),
          toInX(item.targetX),
          toInY(item.y + item.bandHeight + 3),
          colors.negative,
          2.25
        );

        if (settings.showValues) {
          slide.addText(`${item.actualLabel} / ${item.targetLabel}`, {
            x: toInX(geom.frame.plot.right + 10),
            y: toInY(item.y),
            w: toInX(76),
            h: toInY(item.bandHeight),
            fontFace: 'Calibri',
            fontSize: 8.5,
            valign: 'middle',
            color: stripHashForPptx(colors.text),
            margin: 0,
          });
        }
      });
      break;
    }

    case ChartType.SPAN: {
      const rows = datasets[ChartType.SPAN] as SpanRow[];
      const geom = computeSpanGeometry(rows, aspectRatio, settings);
      addSlideChrome(slide, geom.frame, toInX, toInY, settings, colors);

      if (settings.showLegend) {
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(48),
          y: toInY(geom.frame.legendY - 5),
          w: toInX(18),
          h: toInY(10),
          fill: { color: stripHashForPptx(colors.secondary) },
          line: { color: stripHashForPptx(colors.secondary), width: 0 },
        });
        slide.addText('Min–Max Range', {
          x: toInX(72),
          y: toInY(geom.frame.legendY - 9),
          w: toInX(110),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 9.5,
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
        addVectorCircle(slide, pptx, toInX(198), toInY(geom.frame.legendY), toInX(5), colors.primary);
        slide.addText('Average / Median', {
          x: toInX(209),
          y: toInY(geom.frame.legendY - 9),
          w: toInX(130),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 9.5,
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
      }

      geom.ticks.forEach((tick) => {
        if (settings.showGridlines) {
          addVectorLine(
            slide,
            pptx,
            toInX(tick.pos),
            toInY(geom.frame.plot.top),
            toInX(tick.pos),
            toInY(geom.frame.plot.bottom),
            colors.gridline,
            0.75
          );
        }
        slide.addText(tick.label, {
          x: toInX(tick.pos - 36),
          y: toInY(geom.frame.plot.bottom + 4),
          w: toInX(72),
          h: toInY(18),
          fontFace: 'Calibri',
          fontSize: 8.5,
          align: 'center',
          color: stripHashForPptx(colors.mutedText),
          margin: 0,
        });
      });

      geom.items.forEach((item) => {
        slide.addText(item.category, {
          x: toInX(44),
          y: toInY(item.y - 10),
          w: toInX(geom.frame.plot.left - 56),
          h: toInY(20),
          fontFace: 'Calibri',
          fontSize: labelPt,
          align: 'right',
          valign: 'middle',
          color: stripHashForPptx(colors.text),
          margin: 0,
        });

        const barW = Math.max(4, item.xMax - item.xMin);
        slide.addShape(pptx.ShapeType.rect, {
          x: toInX(item.xMin),
          y: toInY(item.y - item.barHeight / 2),
          w: toInX(barW),
          h: toInY(item.barHeight),
          fill: { color: stripHashForPptx(colors.secondary) },
          line: { color: stripHashForPptx(colors.primary), width: 0.5 },
        });

        if (item.xAvg !== null) {
          addVectorCircle(
            slide,
            pptx,
            toInX(item.xAvg),
            toInY(item.y),
            Math.max(rIn * 0.85, toInX(5)),
            colors.primary,
            '#FFFFFF',
            1
          );
        }

        if (settings.showValues) {
          slide.addText(item.minLabel, {
            x: toInX(item.xMin - 54),
            y: toInY(item.y - 9),
            w: toInX(48),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: Math.max(8, labelPt - 1),
            align: 'right',
            color: stripHashForPptx(colors.mutedText),
            margin: 0,
          });
          slide.addText(item.maxLabel, {
            x: toInX(item.xMax + 6),
            y: toInY(item.y - 9),
            w: toInX(48),
            h: toInY(18),
            fontFace: 'Calibri',
            fontSize: Math.max(8, labelPt - 1),
            bold: true,
            align: 'left',
            color: stripHashForPptx(colors.text),
            margin: 0,
          });
        }
      });
      break;
    }
  }

  void toPt;
  return pptx;
}

export async function downloadNativePptx(params: ExportPptxParams): Promise<string> {
  const pptx = buildPptxPresentation(params);
  const slug = (params.settings.title || params.chartType)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const fileName = `${slug || 'executive-chart'}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
