import React from 'react';
import { Table2, Palette, SlidersHorizontal } from 'lucide-react';
import {
  ChartDatasetMap,
  ChartSettings,
  ChartType,
  PaletteColors,
  SidebarTab,
} from '../../types/chart';
import { DataTab } from './DataTab';
import { PaletteTab } from './PaletteTab';
import { SettingsTab } from './SettingsTab';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  chartType: ChartType;
  datasets: ChartDatasetMap;
  settings: ChartSettings;
  selectedPaletteId: string;
  colors: PaletteColors;
  onUpdateRows: <K extends ChartType>(type: K, rows: ChartDatasetMap[K]) => void;
  onUpdateSettings: (patch: Partial<ChartSettings>) => void;
  onSelectPreset: (presetId: string) => void;
  onUpdateColor: (key: keyof PaletteColors, hex: string) => void;
  onResetSample: () => void;
}

const TABS: Array<{ id: SidebarTab; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'data', label: 'Data', Icon: Table2 },
  { id: 'palette', label: 'Palette', Icon: Palette },
  { id: 'settings', label: 'Settings', Icon: SlidersHorizontal },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  chartType,
  datasets,
  settings,
  selectedPaletteId,
  colors,
  onUpdateRows,
  onUpdateSettings,
  onSelectPreset,
  onUpdateColor,
  onResetSample,
}) => {
  return (
    <aside className="w-full lg:w-[400px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col min-h-0">
      {/* Segmented Tab Switcher */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 shrink-0">
        <div role="tablist" aria-label="Studio Controls" className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-md">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onTabChange(id)}
                className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 studio-scroll">
        {activeTab === 'data' && (
          <DataTab
            chartType={chartType}
            datasets={datasets}
            settings={settings}
            onUpdateRows={onUpdateRows}
            onUpdateSettings={onUpdateSettings}
            onResetSample={onResetSample}
          />
        )}
        {activeTab === 'palette' && (
          <PaletteTab
            selectedPaletteId={selectedPaletteId}
            colors={colors}
            onSelectPreset={onSelectPreset}
            onUpdateColor={onUpdateColor}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            chartType={chartType}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        )}
      </div>
    </aside>
  );
};
