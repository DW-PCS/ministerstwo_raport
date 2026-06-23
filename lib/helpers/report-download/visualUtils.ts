import { ChartType, TrendType } from '@/contexts/RaportContext';
import { COLORS } from '@/lib/constants';
import { MONTH_NAMES } from '@/lib/helpers/report-download/constants';
import { ProcessedData } from '@/lib/helpers/report-download/types';
import { calculateTrend } from '@/lib/helpers/trend-helpers';
import Chart from 'chart.js/auto';

export interface ChartBuildOptions {
  rawData?: { reportDate?: string; ilosc: number }[];
  showTrendLine?: boolean;
  trendType?: TrendType;
}

export async function fetchImageAsDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchImageAsUint8Array(path: string): Promise<Uint8Array> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export function dataUrlToUint8ArrayFn(dataUrl: string): Uint8Array {
  const base64Data = dataUrl.split(',')[1];
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function renderChartAsImage(
  config: Record<string, unknown>,
  width = 1200,
  height = 640
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Nie udało się utworzyć kontekstu canvas dla wykresu.');
  const chart = new Chart(context, {
    ...config,
    options: {
      responsive: false,
      animation: false,
      ...((config.options as Record<string, unknown>) || {}),
    },
  } as never);
  await new Promise(resolve =>
    requestAnimationFrame(() => {
      chart.update();
      resolve(true);
    })
  );
  const image = canvas.toDataURL('image/png');
  chart.destroy();
  return image;
}

export async function buildChartImages(
  processedData: ProcessedData,
  chartTypes: ChartType[],
  options: ChartBuildOptions = {}
): Promise<Array<{ title: string; image: string }>> {
  const ports = Object.keys(processedData.portData);
  const commodityTotals = processedData.commodityNames.map(commodity =>
    ports.reduce((sum, port) => sum + (processedData.portData[port][commodity] || 0), 0)
  );

  const palette = COLORS;
  const chartFontSize = 14;
  const chartLegendFontSize = 18;

  const timeSeriesChartEntry: { type: ChartType; title: string; config: Record<string, unknown> } | null = (() => {
    if (!chartTypes.includes('bar_timeseries') || !options.rawData?.length) return null;

    const monthly: Record<string, number> = {};
    options.rawData.forEach(row => {
      if (!row.reportDate) return;
      const ym = row.reportDate.slice(0, 7);
      monthly[ym] = (monthly[ym] || 0) + row.ilosc;
    });
    const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
    const labels = sorted.map(([date]) => {
      const parts = date.split('-');
      return `${MONTH_NAMES[parseInt(parts[1] ?? '1', 10) - 1] ?? parts[1]} ${parts[0]}`;
    });
    const totals = sorted.map(([, v]) => v);

    const datasets: Record<string, unknown>[] = [
      {
        type: 'bar',
        label: 'Obroty [t]',
        data: totals,
        backgroundColor: palette[0],
        borderRadius: 4,
      },
    ];

    if (options.showTrendLine && totals.length >= 2) {
      const trendResult = calculateTrend(totals, options.trendType ?? 'linear');
      datasets.push({
        type: 'line',
        label: 'Linia trendu',
        data: trendResult.trendPoints,
        borderColor: '#e63946',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      });
    }

    return {
      type: 'bar_timeseries' as ChartType,
      title: `Wykres ${chartTypes.indexOf('bar_timeseries') + 1}: Obroty łącznie wg miesiąca [t]`,
      config: {
        type: 'bar',
        data: { labels, datasets },
        options: {
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } },
          },
          scales: {
            x: { ticks: { font: { size: chartFontSize } } },
            y: { beginAtZero: true, ticks: { font: { size: chartFontSize } } },
          },
        },
      },
    };
  })();

  const allCharts: { type: ChartType; title: string; config: Record<string, unknown> }[] = [
    {
      type: 'bar_port',
      title: 'Wykres 1: Struktura ładunków wg portu',
      config: {
        type: 'bar',
        data: {
          labels: ports,
          datasets: processedData.commodityNames.map((commodity, index) => ({
            label: commodity,
            data: ports.map(port => processedData.portData[port][commodity] || 0),
            backgroundColor: palette[index % palette.length],
            borderRadius: 4,
          })),
        },
        options: {
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } },
          },
          scales: {
            x: { ticks: { font: { size: chartFontSize } } },
            y: { beginAtZero: true, ticks: { font: { size: chartFontSize } } },
          },
        },
      },
    },
    {
      type: 'bar_commodity',
      title: 'Wykres 2: Wolumen wg grupy towarowej i portu',
      config: {
        type: 'bar',
        data: {
          labels: processedData.commodityNames,
          datasets: ports.map((port, index) => ({
            label: port,
            data: processedData.commodityNames.map(
              commodity => processedData.portData[port][commodity] || 0
            ),
            backgroundColor: palette[index % palette.length],
            borderRadius: 4,
          })),
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } },
          },
          scales: {
            x: { beginAtZero: true, ticks: { font: { size: chartFontSize } } },
            y: { ticks: { font: { size: chartFontSize } } },
          },
        },
      },
    },
    {
      type: 'pie',
      title: 'Wykres 3: Udział grup towarowych',
      config: {
        type: 'pie',
        data: {
          labels: processedData.commodityNames,
          datasets: [
            {
              data: commodityTotals,
              backgroundColor: processedData.commodityNames.map(
                (_, i) => palette[i % palette.length]
              ),
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } },
          },
        },
      },
    },
  ];

  const allChartsWithTimeSeries = [
    ...allCharts,
    ...(timeSeriesChartEntry ? [timeSeriesChartEntry] : []),
  ];
  const filtered = chartTypes
    .map(type => allChartsWithTimeSeries.find(c => c.type === type))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return Promise.all(
    filtered.map(async chartDef => ({
      title: chartDef.title,
      image: await renderChartAsImage(chartDef.config),
    }))
  );
}
