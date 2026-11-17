<div align="center">
  <img src="public/icon.svg" alt="Executive Chart Studio Icon" width="72" height="72" />
  <h1>📊 Executive Chart Studio</h1>
  <p>
    <strong>Zero-Backend Client-Side Data Visualization &amp; Native PowerPoint Vector Studio</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PPTXGenJS-Native_Vectors-D24726?style=for-the-badge" alt="PPTXGenJS" />
    <img src="https://img.shields.io/badge/100%25_Client--Side-Zero_AI_&_Zero_Backend-10B981?style=for-the-badge" alt="Zero Backend" />
  </p>
</div>

---

## ✨ Overview

**Executive Chart Studio** is a fast, privacy-first, 100% browser-based charting workbench built for strategy consultants, analysts, and executives. Design publication-grade charts in real time using crisp SVG geometry powered by `d3-scale`, then export directly to **PowerPoint (`.pptx`)** with **native, ungroupable vector shapes** (ovals, lines, rectangles, and editable text boxes) — never flattened screenshots.

---

## 📈 Supported Chart Types (7 Executive Schemas)

| # | Chart Type | Data Schema | Best Used For |
|---|---|---|---|
| 1 | **Barbell (Dumbbell) Chart** | `Category`, `StartValue`, `EndValue` | Before/after gaps, period shifts, directional delta |
| 2 | **Lollipop Chart** | `Category`, `Value` | Ranked comparisons with reduced ink-to-data ratio |
| 3 | **Cleveland Dot Plot** | `Category`, `SeriesA`, `SeriesB`, `SeriesC` | Multi-series comparison without bar clutter |
| 4 | **Slopegraph** | `Category`, `Period1Value`, `Period2Value` | Two-period rank & magnitude trajectory |
| 5 | **Bump Chart** | `Entity`, `Q1`, `Q2`, `Q3`, `Q4` | Competitive rank tracking over time (Rank 1 at top) |
| 6 | **Bullet Chart** | `Metric`, `Actual`, `Target`, `PoorThreshold`, `GoodThreshold` | KPI actuals vs. targets & qualitative bands |
| 7 | **Span (Range) Chart** | `Category`, `MinValue`, `MaxValue`, `AverageValue?` | Min–max spread, salary bands, volatility with optional mean |

---

## 🎨 Studio Features

- **Live Slide Canvas (`16:9 Widescreen` & `4:3 Standard`)**: Real-time 60fps SVG preview inside a clean slide frame with interactive hover inspection.
- **Dynamic Interactive Data Grid**: Automatically adapts table columns to the selected chart type, with tabular numerals, row addition/deletion, and sample reset.
- **CSV / TSV Bulk Paste & File Import**: Powered by `papaparse` with resilient schema mapping and clear validation feedback.
- **5 Executive Colour Palettes + Custom Hex Overrides**:
  - 🔵 **Consulting Blues**
  - 🟢 **Emerald & Slate**
  - 🟠 **Warm Terracotta**
  - ⚫ **Monochrome Graphite**
  - 🟣 **Vibrant Tech**
- **Native PPTX Vector Export**: Powered by `pptxgenjs` — every dot is an editable `oval`, every connector is an editable `line`, every range/actual bar is an editable `rect`, and all titles/labels export as editable `Arial`/`Calibri` text boxes.

---

## 🧱 Modular Architecture

```text
src/
├── types/chart.ts              # Strict TypeScript enums, schemas, and studio state types
├── constants/
│   ├── palettes.ts             # 5 executive palettes + hex normalization helpers
│   └── mockData.ts             # Realistic boardroom datasets for all 7 chart variants
├── utils/
│   ├── formatters.ts           # Numeric formatting, clamping, and slide dimension math
│   ├── csvParser.ts            # PapaParse CSV/TSV parser & schema-aware validator
│   ├── chartGeometry.ts        # Shared D3-scale coordinate engine for SVG & PPTX
│   └── pptxExporter.ts         # Native vector PPTX slide builder (ovals, lines, rects, text)
├── components/
│   ├── TopBar.tsx              # Branding, chart switcher, aspect toggle, PPTX export CTA
│   ├── Sidebar/                # Data table, CSV importer, Palette picker, Settings panel
│   ├── SlideCanvas.tsx         # Scaled slide frame & interactive readout layer
│   └── charts/                 # Dedicated modular SVG renderers for all 7 chart types
└── __tests__/                  # Unit, integration, and Red Pill / Blue Pill test suites
```

---

## 🧪 Testing Suite (Unit, Integration, Red Pill & Blue Pill)

Run the full Vitest suite:

```bash
npm test
```

- **Unit Tests**: Validate `chartGeometry`, `csvParser`, `formatters`, and `pptxExporter` vector math (`flipH`/`flipV` angled lines, inverted Bump Y-axis, Bullet thresholds).
- **Integration Tests**: Verify end-to-end UI workflows (chart switching, live table editing, CSV import, palette overrides, aspect ratio toggling, and PPTX export).
- **Blue Pill Tests**: Verify nominal executive workflows produce accurate SVG coordinates and valid PowerPoint shapes.
- **Red Pill Tests**: Stress-test malformed CSVs, `NaN`/`Infinity`, empty datasets, inverted `min > max` spans, invalid hex inputs, and untrusted text escaping.

---

## 🚀 Development & GitHub Pages Deployment

```bash
npm install
npm run dev      # Start local studio at http://localhost:3000
npm run lint     # Run TypeScript type check
npm run build    # Production build into dist/
```

Deployment metadata for GitHub Pages is configured in [`deploy.xml`](deploy.xml) with relative asset resolution in [`vite.config.ts`](vite.config.ts).
