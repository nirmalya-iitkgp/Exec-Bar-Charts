import { useMemo, useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { SlideCanvas } from './components/SlideCanvas';
import {
  CHART_METADATA,
  createDefaultSettings,
  createInitialDatasets,
} from './constants/mockData';
import { EXECUTIVE_PALETTES, normalizeHexColor } from './constants/palettes';
import {
  AspectRatio,
  ChartDatasetMap,
  ChartSettings,
  ChartType,
  PaletteColors,
  SidebarTab,
} from './types/chart';
import { downloadNativePptx } from './utils/pptxExporter';

function createInitialSettingsMap(): Record<ChartType, ChartSettings> {
  return {
    [ChartType.BARBELL]: createDefaultSettings(ChartType.BARBELL),
    [ChartType.LOLLIPOP]: createDefaultSettings(ChartType.LOLLIPOP),
    [ChartType.CLEVELAND]: createDefaultSettings(ChartType.CLEVELAND),
    [ChartType.SLOPEGRAPH]: createDefaultSettings(ChartType.SLOPEGRAPH),
    [ChartType.BUMP]: createDefaultSettings(ChartType.BUMP),
    [ChartType.BULLET]: createDefaultSettings(ChartType.BULLET),
    [ChartType.SPAN]: createDefaultSettings(ChartType.SPAN),
  };
}

export default function App() {
  const [chartType, setChartType] = useState<ChartType>(ChartType.BARBELL);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [activeTab, setActiveTab] = useState<SidebarTab>('data');
  const [datasets, setDatasets] = useState<ChartDatasetMap>(createInitialDatasets);
  const [settingsMap, setSettingsMap] = useState<Record<ChartType, ChartSettings>>(createInitialSettingsMap);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(EXECUTIVE_PALETTES[0].id);
  const [colors, setColors] = useState<PaletteColors>(() => ({ ...EXECUTIVE_PALETTES[0].colors }));
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeSettings = settingsMap[chartType];
  const activeMeta = useMemo(
    () => CHART_METADATA.find((m) => m.type === chartType) ?? CHART_METADATA[0],
    [chartType]
  );

  const handleUpdateRows = <K extends ChartType>(type: K, rows: ChartDatasetMap[K]) => {
    setDatasets((prev) => ({ ...prev, [type]: rows }));
  };

  const handleUpdateSettings = (patch: Partial<ChartSettings>) => {
    setSettingsMap((prev) => ({
      ...prev,
      [chartType]: { ...prev[chartType], ...patch },
    }));
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = EXECUTIVE_PALETTES.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPaletteId(preset.id);
    setColors({ ...preset.colors });
  };

  const handleUpdateColor = (key: keyof PaletteColors, hex: string) => {
    setColors((prev) => ({
      ...prev,
      [key]: hex.startsWith('#') && hex.length <= 7 ? hex : normalizeHexColor(hex, prev[key]),
    }));
  };

  const handleResetSample = () => {
    const fresh = createInitialDatasets();
    setDatasets((prev) => ({ ...prev, [chartType]: fresh[chartType] }));
    setSettingsMap((prev) => ({ ...prev, [chartType]: createDefaultSettings(chartType) }));
  };

  const handleDownloadPptx = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportMessage(null);
    try {
      const fileName = await downloadNativePptx({
        chartType,
        datasets,
        aspectRatio,
        settings: activeSettings,
        colors,
      });
      setExportMessage(`Exported ${fileName}`);
      window.setTimeout(() => {
        setExportMessage(null);
      }, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PPTX file.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#F3F4F6] text-slate-900">
      <TopBar
        chartType={chartType}
        onChartTypeChange={(next) => {
          setChartType(next);
          setExportError(null);
        }}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        onDownloadPptx={handleDownloadPptx}
        isExporting={isExporting}
        exportMessage={exportMessage}
      />

      {exportError && (
        <div
          role="alert"
          className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between"
        >
          <span>Export error: {exportError}</span>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chartType={chartType}
          datasets={datasets}
          settings={activeSettings}
          selectedPaletteId={selectedPaletteId}
          colors={colors}
          onUpdateRows={handleUpdateRows}
          onUpdateSettings={handleUpdateSettings}
          onSelectPreset={handleSelectPreset}
          onUpdateColor={handleUpdateColor}
          onResetSample={handleResetSample}
        />

        <SlideCanvas
          chartType={chartType}
          chartMeta={activeMeta}
          datasets={datasets}
          aspectRatio={aspectRatio}
          settings={activeSettings}
          colors={colors}
          onResetSample={handleResetSample}
        />
      </div>
    </div>
  );
}
