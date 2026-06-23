export interface AppClientsTypes {
  id: number;
  enabled: boolean;
  name: string;
  city: string;
  orgName: string;
}

export type ChartType = 'bar_port' | 'bar_commodity' | 'pie' | 'bar_timeseries';

export type { TrendType, TrendResult, MathDetails } from '@/lib/helpers/trend-helpers';
export type { PortOption } from '@/lib/helpers/port-filters';
export type {
  ReportDataItem,
  RawReportRow,
  FileFormat,
  UseReportDownloadReturn,
  ProcessedData,
  ExportBaseOptions,
  PdfDocxBaseOptions,
} from '@/lib/helpers/report-download/types';
