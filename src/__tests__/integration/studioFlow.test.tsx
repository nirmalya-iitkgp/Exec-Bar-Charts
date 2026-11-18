import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';
import * as pptxExporter from '../../utils/pptxExporter';

describe('Integration: Executive Chart Studio Workflows', () => {
  it('switches across all 10 chart types and updates live SVG slide preview', () => {
    render(<App />);

    const select = screen.getByLabelText('Chart Type') as HTMLSelectElement;
    expect(screen.getByRole('img', { name: /Operating Margin Shift/i })).toBeInTheDocument();

    const expectedCharts = [
      { value: 'lollipop', titlePattern: /Net Promoter Score/i },
      { value: 'cleveland', titlePattern: /Regional Cloud Edge Latency/i },
      { value: 'slopegraph', titlePattern: /Enterprise Platform Adoption/i },
      { value: 'bump', titlePattern: /Competitive Market Share Rank/i },
      { value: 'bullet', titlePattern: /Q4 Strategic KPI Performance/i },
      { value: 'span', titlePattern: /Executive Compensation Band/i },
      { value: 'diverging', titlePattern: /Q4 Employee Engagement/i },
      { value: 'ternary', titlePattern: /Portfolio Resource Allocation Trade-Offs/i },
      { value: 'voronoi', titlePattern: /FY25 Global Revenue Architecture/i },
      { value: 'barbell', titlePattern: /Operating Margin Shift/i },
    ];

    expectedCharts.forEach(({ value, titlePattern }) => {
      fireEvent.change(select, { target: { value } });
      expect(screen.getByRole('img', { name: titlePattern })).toBeInTheDocument();
    });
  });

  it('edits data cell in interactive table and reflects changes immediately in SVG', () => {
    render(<App />);
    const categoryInput = screen.getByLabelText('Category for North America') as HTMLInputElement;
    fireEvent.change(categoryInput, { target: { value: 'DACH Region' } });

    expect(screen.getByText('DACH Region')).toBeInTheDocument();
  });

  it('applies CSV bulk paste and updates slide rows', () => {
    render(<App />);
    const csvArea = screen.getByLabelText('Paste CSV or TSV data');
    fireEvent.change(csvArea, {
      target: { value: 'Category,StartValue,EndValue\nJapan,12,19\nNordics,20,28' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply CSV Data/i }));

    expect(screen.getByText(/Imported 2 rows successfully/i)).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Nordics')).toBeInTheDocument();
  });

  it('toggles slide aspect ratio between 16:9 and 4:3', () => {
    render(<App />);
    const frame = screen.getByTestId('slide-canvas-frame');
    expect(frame.getAttribute('data-aspect-ratio')).toBe('16:9');

    fireEvent.click(screen.getByRole('button', { name: /4:3 Standard/i }));
    expect(frame.getAttribute('data-aspect-ratio')).toBe('4:3');
  });

  it('switches executive palette and updates custom colors', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: /Palette/i }));
    fireEvent.click(screen.getByRole('button', { name: /Warm Terracotta/i }));

    const primaryHexInput = screen.getByLabelText('Primary Series hex code') as HTMLInputElement;
    expect(primaryHexInput.value.toUpperCase()).toBe('#9A3412');
  });

  it('invokes native PPTX download handler on primary CTA click', async () => {
    const spy = vi.spyOn(pptxExporter, 'downloadNativePptx').mockResolvedValue('operating-margin-shift.pptx');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Download Native PPTX/i }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/Exported operating-margin-shift\.pptx/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
