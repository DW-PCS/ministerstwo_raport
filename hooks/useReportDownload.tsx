import { toast } from '@/components/ui/use-toast';
import useRaportContext from '@/contexts/RaportContext';
import Chart from 'chart.js/auto';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { useCallback, useEffect, useState } from 'react';

export interface ReportDataItem {
  [key: string]: unknown;
  name: string;
}

export interface ProcessedData {
  portData: Record<string, Record<string, number>>;
  commodityNames: string[];
  headers: string[];
  rows: Array<Array<string | number>>;
  totalsRow: Array<string | number>;
}

export type FileFormat = 'csv' | 'pdf' | 'docx';

export interface UseReportDownloadReturn {
  isDownloadEnabled: boolean;
  downloadReport: (format: FileFormat, startDate?: Date, endDate?: Date) => Promise<void>;
  isDownloading: boolean;
}

const BRAND_PRIMARY = '#1a0069';
const BRAND_DARK = '#0f172a';
const BRAND_LIGHT = '#e8e4f5';
const BRAND_ACCENT = '#4f46e5';

async function fetchImageAsDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsUint8Array(path: string): Promise<Uint8Array> {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

function dataUrlToUint8ArrayFn(dataUrl: string): Uint8Array {
  const base64Data = dataUrl.split(',')[1];
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const useReportDownload = (data: ReportDataItem[]): UseReportDownloadReturn => {
  const { isReportGenerated } = useRaportContext();
  const [isDownloadEnabled, setIsDownloadEnabled] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    setIsDownloadEnabled(Boolean(isReportGenerated && data && data.length > 0));
  }, [isReportGenerated, data]);

  const processData = useCallback((): ProcessedData => {
    const portData: Record<string, Record<string, number>> = {};
    const commodityKeys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name') : [];

    data.forEach(item => {
      const portName = item.name as string;
      if (!portData[portName]) portData[portName] = {};
      commodityKeys.forEach(key => {
        portData[portName][key] = Number(item[key]) || 0;
      });
    });

    const headers = ['Port', ...commodityKeys];
    const rows: Array<Array<string | number>> = Object.keys(portData).map(port => [
      port,
      ...commodityKeys.map(commodity => portData[port][commodity] || 0),
    ]);
    const totalsRow: Array<string | number> = [
      'SUMA',
      ...commodityKeys.map(commodity =>
        Object.keys(portData).reduce((sum, port) => sum + (portData[port][commodity] || 0), 0)
      ),
    ];

    return { portData, commodityNames: commodityKeys, headers, rows, totalsRow };
  }, [data]);

  const formatPeriodText = useCallback((startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return 'Okres: brak szczegółowego zakresu dat';
    const fmt = (d: Date) =>
      d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    return `Okres: ${fmt(startDate)} - ${fmt(endDate)}`;
  }, []);

  const getFilename = useCallback(
    (format: FileFormat, startDate?: Date, endDate?: Date): string => {
      const date = new Date().toISOString().split('T')[0];
      if (startDate && endDate) {
        const [s, e] = formatPeriodText(startDate, endDate).replace('Okres: ', '').split(' - ');
        return `raport-portowy-${s}-do-${e}.${format}`;
      }
      return `raport-portowy-${date}.${format}`;
    },
    [formatPeriodText]
  );

  const renderChartAsImage = useCallback(
    async (config: Record<string, unknown>, width = 1200, height = 640): Promise<string> => {
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
      await new Promise(resolve => requestAnimationFrame(() => { chart.update(); resolve(true); }));
      const image = canvas.toDataURL('image/png');
      chart.destroy();
      return image;
    },
    []
  );

  const buildChartImages = useCallback(
    async (processedData: ProcessedData): Promise<Array<{ title: string; image: string }>> => {
      const ports = Object.keys(processedData.portData);
      const commodityTotals = processedData.commodityNames.map(commodity =>
        ports.reduce((sum, port) => sum + (processedData.portData[port][commodity] || 0), 0)
      );
      const portTotals = ports.map(port =>
        processedData.commodityNames.reduce((sum, commodity) => sum + (processedData.portData[port][commodity] || 0), 0)
      );

      const palette = [BRAND_PRIMARY, BRAND_ACCENT, '#0f766e', '#7c3aed', '#b45309', '#be185d'];
      const chartFontSize = 14;
      const chartLegendFontSize = 18;

      const charts = [
        {
          title: 'Wykres 1: Struktura ładunków wg portu (grupowany słupkowy)',
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
              plugins: { legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } } },
              scales: {
                x: { ticks: { font: { size: chartFontSize } } },
                y: { beginAtZero: true, ticks: { font: { size: chartFontSize } } },
              },
            },
          },
        },
        {
          title: 'Wykres 2: Łączny wolumen portów (liniowy)',
          config: {
            type: 'line',
            data: {
              labels: ports,
              datasets: [{
                label: 'Łączny wolumen [T]',
                data: portTotals,
                borderColor: BRAND_ACCENT,
                backgroundColor: 'rgba(79,70,229,0.15)',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true,
              }],
            },
            options: {
              plugins: { legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } } },
              scales: {
                x: { ticks: { font: { size: chartFontSize } } },
                y: { beginAtZero: true, ticks: { font: { size: chartFontSize } } },
              },
            },
          },
        },
        {
          title: 'Wykres 3: Udział grup towarowych (kołowy)',
          config: {
            type: 'pie',
            data: {
              labels: processedData.commodityNames,
              datasets: [{
                data: commodityTotals,
                backgroundColor: processedData.commodityNames.map((_, i) => palette[i % palette.length]),
                borderWidth: 1,
              }],
            },
            options: {
              plugins: { legend: { position: 'bottom', labels: { font: { size: chartLegendFontSize } } } },
            },
          },
        },
      ];

      return Promise.all(
        charts.map(async chartDef => ({ title: chartDef.title, image: await renderChartAsImage(chartDef.config) }))
      );
    },
    [renderChartAsImage]
  );

  const downloadCSV = useCallback(
    (startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;
      try {
        setIsDownloading(true);
        const { headers, rows, totalsRow } = processData();
        const csvRows = [headers, ...rows, totalsRow].map(row => row.join(','));
        const csvContent = `\uFEFF${csvRows.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', getFilename('csv', startDate, endDate));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Pobrano raport CSV' });
      } catch (error) {
        console.error('Error generating CSV:', error);
        toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku CSV.', variant: 'destructive' });
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloadEnabled, processData, getFilename]
  );

  const downloadPDF = useCallback(
    async (startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;
      try {
        setIsDownloading(true);
        const processedData = processData();
        const periodText = formatPeriodText(startDate, endDate);
        const chartImages = await buildChartImages(processedData);

        const [logoDataUrl, logoSmallDataUrl, headerLogoDataUrl] = await Promise.all([
          fetchImageAsDataUrl('/05_znak_uproszczony_kolor_biale_tlo.png'),
          fetchImageAsDataUrl('/14_znak_skrot_kolor_ciemne_tlo.png'),
          fetchImageAsDataUrl('/10_znak_bez_orla_kolor_ciemne_tlo.png'),
        ]);

        const pdfMakeClient = pdfMake as unknown as {
          vfs: Record<string, string>;
          createPdf: (definition: Record<string, unknown>) => { download: (fileName: string) => void };
        };
        const pdfFontsClient = pdfFonts as unknown as { vfs: Record<string, string> };
        pdfMakeClient.vfs = pdfFontsClient.vfs;

        const compactChartLayout = processedData.rows.length <= 8;
        const pdfChartWidth = 500;

        const compactChartsContent = compactChartLayout
          ? chartImages.flatMap((chart, index) => [
              { text: chart.title, style: 'chartTitle', margin: [0, index === 0 ? 20 : 18, 0, 8] },
              { image: chart.image, fit: [pdfChartWidth, index === 2 ? 300 : 195], alignment: 'center' },
              ...(index === 1 ? [{ text: '', pageBreak: 'after' }] : []),
            ])
          : chartImages.flatMap((chart, index) => [
              { text: chart.title, style: 'chartTitle', pageBreak: index === 0 ? 'before' : undefined, margin: [0, 20, 0, 8] },
              { image: chart.image, fit: [pdfChartWidth, 300], alignment: 'center' },
            ]);

        const generatedAt = new Date().toLocaleDateString('pl-PL', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        const definition = {
          pageSize: 'A4',
          pageMargins: [32, 90, 32, 64],

          header: () => ({
            margin: [32, 16, 32, 0],
            table: {
              widths: [74, '*', 'auto'],
              body: [[
                {
                  image: headerLogoDataUrl,
                  width: 70,
                  height: 40,
                  margin: [0, 2, 0, 0],
                },
                {
                  stack: [
                    { text: 'Ministerstwo Infrastruktury', style: 'headerOrg', margin: [8, 4, 0, 0] },
                    { text: 'Raport obrotów ładunkowych', style: 'headerSub', margin: [8, 2, 0, 0] },
                  ],
                },
                {
                  text: periodText,
                  style: 'headerPeriod',
                  alignment: 'right',
                  margin: [0, 8, 0, 0],
                },
              ]],
            },
            layout: {
              hLineWidth: (i: number) => (i === 1 ? 1.5 : 0),
              vLineWidth: () => 0,
              hLineColor: () => BRAND_PRIMARY,
              paddingBottom: () => 6,
            },
          }),

          footer: (currentPage: number, pageCount: number) => ({
            margin: [32, 8, 32, 8],
            table: {
              widths: ['*', 'auto', 48],
              body: [[
                {
                  text: 'Dokument wygenerowany automatycznie — dane mają charakter informacyjny.',
                  style: 'footerText',
                  margin: [0, 6, 0, 0],
                },
                {
                  text: `Strona ${currentPage} / ${pageCount}`,
                  style: 'footerPage',
                  alignment: 'center',
                  margin: [0, 6, 0, 0],
                },
                {
                  image: logoSmallDataUrl,
                  width: 24,
                  height: 28,
                  alignment: 'right',
                  margin: [0, 2, 0, 0],
                },
              ]],
            },
            layout: {
              hLineWidth: (i: number) => (i === 0 ? 1 : 0),
              vLineWidth: () => 0,
              hLineColor: () => '#cbd5e1',
              paddingTop: () => 4,
            },
          }),

          content: [
            {
              table: {
                widths: ['*'],
                body: [[{
                  stack: [
                    { image: logoDataUrl, width: 168, height: 72, alignment: 'center', margin: [0, 0, 0, 16] },
                    { text: 'Raport Portowy', style: 'coverTitle', alignment: 'center' },
                    { text: periodText.replace('Okres: ', ''), style: 'coverPeriod', alignment: 'center', margin: [0, 8, 0, 0] },
                    {
                      canvas: [{ type: 'line', x1: 60, y1: 16, x2: 420, y2: 16, lineWidth: 1.5, lineColor: BRAND_PRIMARY }],
                      margin: [0, 8, 0, 8],
                    },
                    { text: `Data wygenerowania: ${generatedAt}`, style: 'coverMeta', alignment: 'center' },
                    { text: 'Ministerstwo Infrastruktury', style: 'coverOrg', alignment: 'center', margin: [0, 4, 0, 0] },
                  ],
                  fillColor: BRAND_LIGHT,
                  margin: [24, 24, 24, 24],
                  border: [false, false, false, false],
                }]],
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 24],
            },

            {
              table: {
                headerRows: 1,
                widths: ['*', ...processedData.commodityNames.map(() => 'auto')],
                body: [
                  processedData.headers.map(header => ({
                    text: String(header),
                    color: '#ffffff',
                    bold: true,
                    fontSize: 9,
                    fillColor: BRAND_PRIMARY,
                    margin: [4, 4, 4, 4],
                  })),
                  ...processedData.rows.map((row, rowIndex) =>
                    row.map(cell => ({
                      text: String(cell),
                      fontSize: 9,
                      fillColor: rowIndex % 2 === 0 ? '#f5f3ff' : undefined,
                      margin: [4, 3, 4, 3],
                    }))
                  ),
                  processedData.totalsRow.map(cell => ({
                    text: String(cell),
                    bold: true,
                    fontSize: 9,
                    fillColor: BRAND_LIGHT,
                    color: BRAND_DARK,
                    margin: [4, 4, 4, 4],
                  })),
                ],
              },
              layout: {
                hLineColor: () => '#c4b5fd',
                vLineColor: () => '#c4b5fd',
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
              },
            },

            ...compactChartsContent,
          ],

          defaultStyle: { font: 'Roboto', fontSize: 10, color: BRAND_DARK },
          styles: {
            coverTitle: { fontSize: 26, bold: true, color: BRAND_PRIMARY },
            coverPeriod: { fontSize: 14, color: '#374151' },
            coverMeta: { fontSize: 10, color: '#6b7280' },
            coverOrg: { fontSize: 11, bold: true, color: BRAND_PRIMARY },
            headerOrg: { fontSize: 11, bold: true, color: BRAND_PRIMARY },
            headerSub: { fontSize: 9, color: '#374151' },
            headerPeriod: { fontSize: 9, color: '#6b7280' },
            footerText: { fontSize: 8, color: '#9ca3af' },
            footerPage: { fontSize: 9, bold: true, color: '#6b7280' },
            chartTitle: { fontSize: 12, bold: true, color: BRAND_PRIMARY },
          },
        };

        pdfMakeClient.createPdf(definition).download(getFilename('pdf', startDate, endDate));
        toast({ title: 'Pobrano raport PDF' });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku PDF.', variant: 'destructive' });
      } finally {
        setIsDownloading(false);
      }
    },
    [buildChartImages, formatPeriodText, getFilename, isDownloadEnabled, processData]
  );

  const downloadWord = useCallback(
    async (startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;
      try {
        setIsDownloading(true);

        const processedData = processData();
        const periodText = formatPeriodText(startDate, endDate);
        const chartImages = await buildChartImages(processedData);

        const [logoBytes, logoSmallBytes, headerLogoBytes] = await Promise.all([
          fetchImageAsUint8Array('/05_znak_uproszczony_kolor_biale_tlo.png'),
          fetchImageAsUint8Array('/14_znak_skrot_kolor_ciemne_tlo.png'),
          fetchImageAsUint8Array('/10_znak_bez_orla_kolor_ciemne_tlo.png'),
        ]);

        const generatedAt = new Date().toLocaleDateString('pl-PL', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

        const brandPrimaryHex = BRAND_PRIMARY.replace('#', '');
        const brandLightHex = 'E8E4F5';
        const slateHex = 'CBD5E1';
        const darkHex = '0F172A';

        const headerRow = new TableRow({
          children: processedData.headers.map(header =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: brandPrimaryHex, fill: brandPrimaryHex },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(header), bold: true, color: 'FFFFFF', size: 18 })],
              })],
            })
          ),
        });

        const dataRows = processedData.rows.map((row, rowIndex) =>
          new TableRow({
            children: row.map((cell, cellIndex) =>
              new TableCell({
                shading: rowIndex % 2 === 0
                  ? { type: ShadingType.SOLID, color: 'F5F3FF', fill: 'F5F3FF' }
                  : undefined,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                  children: [new TextRun({ text: String(cell), size: 18 })],
                })],
              })
            ),
          })
        );

        const totalsRow = new TableRow({
          children: processedData.totalsRow.map((cell, cellIndex) =>
            new TableCell({
              shading: { type: ShadingType.SOLID, color: brandLightHex, fill: brandLightHex },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                children: [new TextRun({ text: String(cell), bold: true, size: 18, color: darkHex })],
              })],
            })
          ),
        });

        const reportTable = new Table({
          rows: [headerRow, ...dataRows, totalsRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
            left: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
            right: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
          },
        });

        const pageHeader = new Header({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: brandPrimaryHex },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          children: [
                            new ImageRun({ data: headerLogoBytes, type: 'png', transformation: { width: 92, height: 52 } }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Ministerstwo Infrastruktury', bold: true, color: brandPrimaryHex, size: 22 })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: 'Raport obrotów ładunkowych', color: '374151', size: 18 })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: periodText, color: '6B7280', size: 16 })],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        const pageFooter = new Footer({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          children: [new TextRun({
                            text: 'Dokument wygenerowany automatycznie — dane mają charakter informacyjny.',
                            color: '9CA3AF', size: 14,
                          })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: `Wygenerowano: ${generatedAt}`, color: '6B7280', size: 14 })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new ImageRun({ data: logoSmallBytes, type: 'png', transformation: { width: 24, height: 28 } }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        const doc = new Document({
          sections: [
            {
              headers: { default: pageHeader },
              footers: { default: pageFooter },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 480, after: 240 },
                  children: [
                    new ImageRun({ data: logoBytes, type: 'png', transformation: { width: 186, height: 80 } }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                  children: [
                    new TextRun({ text: 'Raport Portowy', bold: true, size: 52, color: brandPrimaryHex }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                  children: [
                    new TextRun({ text: periodText, size: 28, color: '374151' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 80 },
                  children: [
                    new TextRun({ text: `Data wygenerowania: ${generatedAt}`, size: 20, color: '6B7280' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 480 },
                  children: [
                    new TextRun({ text: 'Ministerstwo Infrastruktury', bold: true, size: 24, color: brandPrimaryHex }),
                  ],
                }),

                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 240, after: 160 },
                  children: [new TextRun({ text: 'Tabela danych', color: brandPrimaryHex, bold: true, size: 26 })],
                }),

                reportTable,

                ...chartImages.flatMap(chart => [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 480, after: 160 },
                    children: [new TextRun({ text: chart.title, color: brandPrimaryHex, bold: true, size: 26 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 },
                    children: [
                      new ImageRun({
                        data: dataUrlToUint8ArrayFn(chart.image),
                        type: 'png',
                        transformation: { width: 620, height: 340 },
                      }),
                    ],
                  }),
                ]),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, getFilename('docx', startDate, endDate));
        toast({ title: 'Pobrano raport Word' });
      } catch (error) {
        console.error('Error generating Word document:', error);
        toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku Word.', variant: 'destructive' });
      } finally {
        setIsDownloading(false);
      }
    },
    [buildChartImages, formatPeriodText, getFilename, isDownloadEnabled, processData]
  );

  const downloadReport = useCallback(
    async (format: FileFormat, startDate?: Date, endDate?: Date) => {
      if (format === 'csv') downloadCSV(startDate, endDate);
      else if (format === 'pdf') await downloadPDF(startDate, endDate);
      else if (format === 'docx') await downloadWord(startDate, endDate);
    },
    [downloadCSV, downloadPDF, downloadWord]
  );

  return { isDownloadEnabled, downloadReport, isDownloading };
};

export default useReportDownload;
