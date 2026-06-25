export interface AppClientsTypes {
  id: number;
  enabled: boolean;
  name: string;
  city: string;
  orgName: string;
}

export interface CargoTypeItem {
  id: number;
  appClientId: number;
  cargoGroupCode: string;
  cargoSubGroupCode: string | null;
  code: string;
  description: string | null;
}

export type PeriodType = 'YEAR' | 'HALF_YEAR' | 'QUARTER' | 'MONTH' | 'PERIOD';

export interface PeriodRequest {
  Id: string;
  PeriodType: PeriodType;
  Year: number | null;
  HalfYear: number | null;
  Quarter: number | null;
  Month: number | null;
  StartDate: string | null;
  EndDate: string | null;
}

export type ChartType = 'bar_port' | 'bar_commodity' | 'pie' | 'bar_timeseries';

export type ReportTab = 'standard' | 'comparison';

export interface SelectedComparisonPeriod {
  id: string;
  type: 'YEAR' | 'HALF_YEAR' | 'QUARTER' | 'MONTH';
  year: number;
  halfYear: 1 | 2 | null;
  quarter: 1 | 2 | 3 | 4 | null;
  month: number | null;
  label: string;
}

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
