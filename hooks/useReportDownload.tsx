import useRaportContext from '@/contexts/RaportContext';
import { exportCsv } from '@/lib/helpers/report-download/csvExporter';
import { exportDocx } from '@/lib/helpers/report-download/docxExporter';
import { exportPdf } from '@/lib/helpers/report-download/pdfExporter';
import {
  FileFormat,
  ProcessedData,
  ReportDataItem,
  UseReportDownloadReturn,
} from '@/lib/helpers/report-download/types';
import { exportXlsx } from '@/lib/helpers/report-download/xlsxExporter';
import { useCallback, useEffect, useState } from 'react';

export type { FileFormat, ReportDataItem, UseReportDownloadReturn };

export const useReportDownload = (data: ReportDataItem[]): UseReportDownloadReturn => {
  const {
    isReportGenerated,
    includeCharts,
    selectedChartTypes,
    submittedCommodities,
    submittedPorts,
  } = useRaportContext();

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
      d
        .toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .replace(/\//g, '.');
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

  const downloadReport = useCallback(
    async (format: FileFormat, startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;

      setIsDownloading(true);
      try {
        if (format === 'csv') {
          exportCsv({
            isDownloadEnabled,
            processData,
            getFilename,
            startDate,
            endDate,
          });
        } else if (format === 'pdf') {
          await exportPdf({
            isDownloadEnabled,
            processData,
            formatPeriodText,
            getFilename,
            includeCharts,
            selectedChartTypes,
            submittedPorts,
            submittedCommodities,
            startDate,
            endDate,
          });
        } else if (format === 'docx') {
          await exportDocx({
            isDownloadEnabled,
            processData,
            formatPeriodText,
            getFilename,
            includeCharts,
            selectedChartTypes,
            submittedPorts,
            submittedCommodities,
            startDate,
            endDate,
          });
        } else if (format === 'xlsx') {
          await exportXlsx({
            isDownloadEnabled,
            getFilename,
            startDate,
            endDate,
            submittedPorts,
            submittedCommodities,
          });
        }
      } finally {
        setIsDownloading(false);
      }
    },
    [
      formatPeriodText,
      getFilename,
      includeCharts,
      isDownloadEnabled,
      processData,
      selectedChartTypes,
      submittedCommodities,
      submittedPorts,
    ]
  );

  return { isDownloadEnabled, downloadReport, isDownloading };
};

export default useReportDownload;
