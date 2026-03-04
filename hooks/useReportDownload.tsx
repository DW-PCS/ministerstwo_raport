import { toast } from '@/components/ui/use-toast';
import useRaportContext from '@/contexts/RaportContext';
import Chart from 'chart.js/auto';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
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

      if (!portData[portName]) {
        portData[portName] = {};
      }

      commodityKeys.forEach(key => {
        const value = Number(item[key]) || 0;
        portData[portName][key] = value;
      });
    });

    const headers = ['Port', ...commodityKeys];
    const rows: Array<Array<string | number>> = Object.keys(portData).map(port => {
      return [port, ...commodityKeys.map(commodity => portData[port][commodity] || 0)];
    });

    const totalsRow: Array<string | number> = [
      'SUMA',
      ...commodityKeys.map(commodity => {
        return Object.keys(portData).reduce(
          (sum, port) => sum + (portData[port][commodity] || 0),
          0
        );
      }),
    ];

    return { portData, commodityNames: commodityKeys, headers, rows, totalsRow };
  }, [data]);

  const formatPeriodText = useCallback((startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) {
      return 'Okres: brak szczegółowego zakresu dat';
    }

    const formattedStartDate = startDate
      .toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '.');

    const formattedEndDate = endDate
      .toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '.');

    return `Okres: ${formattedStartDate} - ${formattedEndDate}`;
  }, []);

  const getFilename = useCallback(
    (format: FileFormat, startDate?: Date, endDate?: Date): string => {
      const date = new Date().toISOString().split('T')[0];

      if (startDate && endDate) {
        const [formattedStartDate, formattedEndDate] = formatPeriodText(startDate, endDate)
          .replace('Okres: ', '')
          .split(' - ');

        return `raport-portowy-${formattedStartDate}-do-${formattedEndDate}.${format}`;
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
      if (!context) {
        throw new Error('Nie udało się utworzyć kontekstu canvas dla wykresu.');
      }

      const chart = new Chart(context, {
        ...config,
        options: {
          responsive: false,
          animation: false,
          ...((config.options as Record<string, unknown>) || {}),
        },
      } as never);

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          chart.update();
          resolve(true);
        });
      });

      const image = canvas.toDataURL('image/png');
      chart.destroy();

      return image;
    },
    []
  );

  const buildChartImages = useCallback(
    async (processedData: ProcessedData): Promise<Array<{ title: string; image: string }>> => {
      const ports = Object.keys(processedData.portData);

      const commodityTotals = processedData.commodityNames.map(commodity => {
        return ports.reduce((sum, port) => sum + (processedData.portData[port][commodity] || 0), 0);
      });

      const portTotals = ports.map(port => {
        return processedData.commodityNames.reduce(
          (sum, commodity) => sum + (processedData.portData[port][commodity] || 0),
          0
        );
      });

      const palette = ['#0f172a', '#1d4ed8', '#0f766e', '#7c3aed', '#b45309', '#be185d'];
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
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: chartLegendFontSize },
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    font: { size: chartFontSize },
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    font: { size: chartFontSize },
                  },
                },
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
              datasets: [
                {
                  label: 'Łączny wolumen [T]',
                  data: portTotals,
                  borderColor: '#1d4ed8',
                  backgroundColor: 'rgba(29, 78, 216, 0.2)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  tension: 0.35,
                  fill: true,
                },
              ],
            },
            options: {
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: chartLegendFontSize },
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    font: { size: chartFontSize },
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    font: { size: chartFontSize },
                  },
                },
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
              datasets: [
                {
                  data: commodityTotals,
                  backgroundColor: processedData.commodityNames.map(
                    (_, index) => palette[index % palette.length]
                  ),
                  borderWidth: 1,
                },
              ],
            },
            options: {
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: chartLegendFontSize },
                  },
                },
              },
            },
          },
        },
      ];

      const renderedCharts = await Promise.all(
        charts.map(async chartDefinition => {
          const image = await renderChartAsImage(chartDefinition.config);
          return { title: chartDefinition.title, image };
        })
      );

      return renderedCharts;
    },
    [renderChartAsImage]
  );

  const dataUrlToUint8Array = useCallback((dataUrl: string): Uint8Array => {
    const base64Data = dataUrl.split(',')[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let index = 0; index < binaryString.length; index += 1) {
      bytes[index] = binaryString.charCodeAt(index);
    }

    return bytes;
  }, []);

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
        toast({
          title: 'Błąd pobierania',
          description: 'Nie udało się wygenerować pliku CSV.',
          variant: 'destructive',
        });
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

        const pdfMakeClient = pdfMake as unknown as {
          vfs: Record<string, string>;
          createPdf: (definition: Record<string, unknown>) => {
            download: (fileName: string) => void;
          };
        };

        const pdfFontsClient = pdfFonts as unknown as { vfs: Record<string, string> };
        pdfMakeClient.vfs = pdfFontsClient.vfs;

        const compactChartLayout = processedData.rows.length <= 8;
        const pdfChartWidth = 540;

        const compactChartsContent = compactChartLayout
          ? [
              {
                text: chartImages[0].title,
                style: 'chartTitle',
                margin: [0, 20, 0, 8],
              },
              {
                image: chartImages[0].image,
                fit: [pdfChartWidth, 205],
                alignment: 'center',
              },
              {
                text: chartImages[1].title,
                style: 'chartTitle',
                margin: [0, 18, 0, 8],
              },
              {
                image: chartImages[1].image,
                fit: [pdfChartWidth, 205],
                alignment: 'center',
              },
              {
                text: chartImages[2].title,
                style: 'chartTitle',
                pageBreak: 'before',
                margin: [0, 20, 0, 8],
              },
              {
                image: chartImages[2].image,
                fit: [pdfChartWidth, 320],
                alignment: 'center',
              },
            ]
          : chartImages.flatMap((chart, index) => {
              return [
                {
                  text: chart.title,
                  style: 'chartTitle',
                  pageBreak: index === 0 ? 'before' : undefined,
                  margin: [0, 20, 0, 8],
                },
                {
                  image: chart.image,
                  fit: [pdfChartWidth, 320],
                  alignment: 'center',
                },
              ];
            });

        const definition = {
          pageSize: 'A4',
          pageMargins: [24, 32, 24, 32],
          content: [
            { text: 'Raport Portowy', style: 'title' },
            { text: periodText, style: 'period', margin: [0, 0, 0, 12] },
            {
              table: {
                headerRows: 1,
                widths: ['*', ...processedData.commodityNames.map(() => 'auto')],
                body: [
                  processedData.headers.map(header => ({
                    text: String(header),
                    color: '#ffffff',
                    bold: true,
                  })),
                  ...processedData.rows,
                  processedData.totalsRow,
                ],
              },
              layout: {
                fillColor: (rowIndex: number) => {
                  if (rowIndex === 0) return '#0f172a';
                  if (rowIndex === processedData.rows.length + 1) return '#e2e8f0';
                  return rowIndex % 2 === 0 ? '#f8fafc' : undefined;
                },
                hLineColor: () => '#cbd5e1',
                vLineColor: () => '#cbd5e1',
              },
            },
            ...compactChartsContent,
          ],
          defaultStyle: {
            font: 'Roboto',
            fontSize: 10,
          },
          styles: {
            title: {
              fontSize: 18,
              bold: true,
            },
            period: {
              fontSize: 11,
            },
            chartTitle: {
              fontSize: 13,
              bold: true,
            },
          },
        };

        pdfMakeClient.createPdf(definition).download(getFilename('pdf', startDate, endDate));
        toast({ title: 'Pobrano raport PDF' });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Błąd pobierania',
          description: 'Nie udało się wygenerować pliku PDF.',
          variant: 'destructive',
        });
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

        const tableRows = [
          new TableRow({
            children: processedData.headers.map(header => {
              return new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: header, bold: true })] }),
                ],
              });
            }),
          }),
          ...processedData.rows.map(row => {
            return new TableRow({
              children: row.map(cell => {
                return new TableCell({
                  children: [new Paragraph(String(cell))],
                });
              }),
            });
          }),
          new TableRow({
            children: processedData.totalsRow.map(cell => {
              return new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: String(cell), bold: true })],
                  }),
                ],
              });
            }),
          }),
        ];

        const reportTable = new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.AUTOFIT,
        });

        const children = [
          new Paragraph({
            text: 'Raport Portowy',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({ text: periodText, spacing: { after: 200 } }),
          new Paragraph({
            text: 'Tabela danych',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120 },
          }),
        ];

        const doc = new Document({
          sections: [
            {
              children: [
                ...children,
                reportTable,
                ...chartImages.flatMap(chart => {
                  return [
                    new Paragraph({
                      text: chart.title,
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 260, after: 120 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: dataUrlToUint8Array(chart.image),
                          type: 'png',
                          transformation: { width: 640, height: 350 },
                        }),
                      ],
                    }),
                  ];
                }),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, getFilename('docx', startDate, endDate));
        toast({ title: 'Pobrano raport Word' });
      } catch (error) {
        console.error('Error generating Word document:', error);
        toast({
          title: 'Błąd pobierania',
          description: 'Nie udało się wygenerować pliku Word.',
          variant: 'destructive',
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [
      buildChartImages,
      dataUrlToUint8Array,
      formatPeriodText,
      getFilename,
      isDownloadEnabled,
      processData,
    ]
  );

  const downloadReport = useCallback(
    async (format: FileFormat, startDate?: Date, endDate?: Date) => {
      if (format === 'csv') {
        downloadCSV(startDate, endDate);
      } else if (format === 'pdf') {
        await downloadPDF(startDate, endDate);
      } else if (format === 'docx') {
        await downloadWord(startDate, endDate);
      }
    },
    [downloadCSV, downloadPDF, downloadWord]
  );

  return {
    isDownloadEnabled,
    downloadReport,
    isDownloading,
  };
};

export default useReportDownload;
