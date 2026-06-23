import type { ChartType } from '@/types';
import type { TrendType } from '@/lib/helpers/trend-helpers';

export interface ReportDataItem {
  [key: string]: unknown;
  name: string;
}

export interface RawReportRow {
  reportDate?: string;
  ilosc: number;
}

export interface ProcessedData {
  portData: Record<string, Record<string, number>>;
  commodityNames: string[];
  headers: string[];
  rows: Array<Array<string | number>>;
  totalsRow: Array<string | number>;
}

export type FileFormat = 'csv' | 'pdf' | 'docx' | 'xlsx';

export interface UseReportDownloadReturn {
  isDownloadEnabled: boolean;
  downloadReport: (format: FileFormat, startDate?: Date, endDate?: Date) => Promise<void>;
  isDownloading: boolean;
}

export interface ExportBaseOptions {
  isDownloadEnabled: boolean;
  getFilename: (format: FileFormat, startDate?: Date, endDate?: Date) => string;
  startDate?: Date;
  endDate?: Date;
}

export interface PdfDocxBaseOptions extends ExportBaseOptions {
  includeCharts: boolean;
  selectedChartTypes: ChartType[];
  processData: () => ProcessedData;
  formatPeriodText: (startDate?: Date, endDate?: Date) => string;
  submittedPorts: string[];
  submittedCommodities: string[];
  rawData?: RawReportRow[];
  showTrendLine?: boolean;
  trendType?: TrendType;
}
