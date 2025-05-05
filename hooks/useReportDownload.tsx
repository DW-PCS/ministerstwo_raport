import useRaportContext from '@/contexts/RaportContext';
import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export interface ReportDataItem {
  [key: string]: unknown;
  name: string;
}

export interface ProcessedData {
  portData: Record<string, Record<string, number>>;
  commodityNames: string[];
}

export type FileFormat = 'csv' | 'xlsx';

export interface UseReportDownloadReturn {
  isDownloadEnabled: boolean;
  downloadReport: (format: FileFormat, startDate?: Date, endDate?: Date) => void;
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

    return { portData, commodityNames: commodityKeys };
  }, [data]);

  const getFilename = useCallback(
    (format: FileFormat, startDate?: Date, endDate?: Date): string => {
      const date = new Date().toISOString().split('T')[0];

      if (startDate && endDate) {
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

        return `raport-portowy-${formattedStartDate}-do-${formattedEndDate}.${format}`;
      }

      return `raport-portowy-${date}.${format}`;
    },
    []
  );

  const downloadCSV = useCallback(
    (startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;

      try {
        setIsDownloading(true);
        const { portData, commodityNames } = processData();

        let csvContent = 'Port,' + commodityNames.join(',') + '\n';

        Object.keys(portData).forEach(port => {
          let row = port;
          commodityNames.forEach(commodity => {
            row += ',' + (portData[port][commodity] || 0);
          });
          csvContent += row + '\n';
        });

        let totalRow = 'SUMA';
        commodityNames.forEach(commodity => {
          let total = 0;
          Object.keys(portData).forEach(port => {
            total += portData[port][commodity] || 0;
          });
          totalRow += ',' + total;
        });
        csvContent += totalRow + '\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', getFilename('csv', startDate, endDate));

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating CSV:', error);
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloadEnabled, processData, getFilename]
  );

  const downloadExcel = useCallback(
    (startDate?: Date, endDate?: Date) => {
      if (!isDownloadEnabled) return;

      try {
        setIsDownloading(true);
        const { portData, commodityNames } = processData();

        const worksheetData = [['Port', ...commodityNames]];

        Object.keys(portData).forEach(port => {
          const row = [port];
          commodityNames.forEach(commodity => {
            row.push((portData[port][commodity] || 0).toString());
          });
          worksheetData.push(row);
        });

        const totalRow = ['SUMA'];
        for (let i = 0; i < commodityNames.length; i++) {
          let columnTotal = 0;
          for (let j = 1; j < worksheetData.length; j++) {
            columnTotal += Number(worksheetData[j][i + 1]);
          }
          totalRow.push(columnTotal.toString());
        }
        worksheetData.push(totalRow);

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        if (startDate && endDate) {
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

          const dateRange = `Okres: ${formattedStartDate} - ${formattedEndDate}`;
          XLSX.utils.sheet_add_aoa(ws, [[dateRange]], {
            origin: { r: worksheetData.length + 1, c: 0 },
          });
        }

        const colWidths = [{ wch: 20 }, ...commodityNames.map(() => ({ wch: 15 }))];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Raport Portowy');

        XLSX.writeFile(wb, getFilename('xlsx', startDate, endDate));
      } catch (error) {
        console.error('Error generating Excel:', error);
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloadEnabled, processData, getFilename]
  );

  const downloadReport = useCallback(
    (format: FileFormat, startDate?: Date, endDate?: Date) => {
      if (format === 'csv') {
        downloadCSV(startDate, endDate);
      } else if (format === 'xlsx') {
        downloadExcel(startDate, endDate);
      }
    },
    [downloadCSV, downloadExcel]
  );

  return {
    isDownloadEnabled,
    downloadReport,
    isDownloading,
  };
};

export default useReportDownload;
