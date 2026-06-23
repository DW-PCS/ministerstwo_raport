'use client';

import { halfYearType, monthTypes, periodType, quarterTypes } from '@/components/selectors';
import { TrendType } from '@/lib/helpers/trend-helpers';
import { createContext, ReactNode, useContext, useState } from 'react';

export type ChartType = 'bar_port' | 'bar_commodity' | 'pie' | 'bar_timeseries';
export type { TrendType };

type RaportContextType = {
  selectedPorts: string[];
  selectedCommodities: string[];
  periodType: periodType;
  startDate: Date | undefined;
  endDate: Date | undefined;
  month: string;
  quarter: quarterTypes;
  halfYear: halfYearType;
  year: string;
  isReportGenerated: boolean;
  submittedPorts: string[];
  submittedCommodities: string[];
  includeCharts: boolean;
  selectedChartTypes: ChartType[];
  showTrendLine: boolean;
  trendType: TrendType;
  handlePortChange: (port: string, checked: boolean) => void;
  handleCommodityChange: (commodity: string, checked: boolean) => void;
  setPeriodType: (type: periodType) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setMonth: (month: monthTypes) => void;
  setQuarter: (quater: quarterTypes) => void;
  setHalfYear: (half: halfYearType) => void;
  setYear: (year: string) => void;
  setIncludeCharts: (value: boolean) => void;
  toggleChartType: (type: ChartType) => void;
  setShowTrendLine: (value: boolean) => void;
  setTrendType: (type: TrendType) => void;
  resetFilters: () => void;
  generateReport: () => void;
};

const RaportContext = createContext<RaportContextType | undefined>(undefined);

export const RaportProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<periodType>('konkretne');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2025, 11, 31));
  const [month, setMonth] = useState<monthTypes>('styczeń');
  const [quarter, setQuarter] = useState<quarterTypes>('I_kwrtał');
  const [halfYear, setHalfYear] = useState<halfYearType>('I półrocze');
  const [year, setYear] = useState<string>('2024');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [selectedChartTypes, setSelectedChartTypes] = useState<ChartType[]>([]);
  const [showTrendLine, setShowTrendLine] = useState(false);
  const [trendType, setTrendType] = useState<TrendType>('linear');

  const [submittedPorts, setSubmittedPorts] = useState<string[]>([]);
  const [submittedCommodities, setSubmittedCommodities] = useState<string[]>([]);

  const handlePortChange = (port: string, checked: boolean) => {
    if (checked) {
      setSelectedPorts(previous => (previous.includes(port) ? previous : [...previous, port]));
    } else {
      setSelectedPorts(previous => previous.filter(p => p !== port));
    }
  };

  const handleCommodityChange = (commodity: string, checked: boolean) => {
    if (checked) {
      setSelectedCommodities(previous =>
        previous.includes(commodity) ? previous : [...previous, commodity]
      );
    } else {
      setSelectedCommodities(previous => previous.filter(c => c !== commodity));
    }
  };

  const toggleChartType = (type: ChartType) => {
    setSelectedChartTypes(prev => {
      const isAdding = !prev.includes(type);
      if (type === 'bar_timeseries' && isAdding) {
        setShowTrendLine(true);
        setTrendType('linear');
      }
      return isAdding ? [...prev, type] : prev.filter(t => t !== type);
    });
  };

  const resetFilters = () => {
    setSelectedPorts([]);
    setSelectedCommodities([]);
    setPeriodType('konkretne');
    setStartDate(new Date(2025, 0, 1));
    setEndDate(new Date(2025, 11, 31));
    setMonth('styczeń');
    setQuarter('I_kwrtał');
    setHalfYear('I półrocze');
    setYear('2024');
    setSubmittedPorts([]);
    setSubmittedCommodities([]);
    setIsReportGenerated(false);
    setIncludeCharts(false);
    setSelectedChartTypes([]);
    setShowTrendLine(false);
    setTrendType('linear');
  };

  const generateReport = () => {
    setSubmittedPorts([...selectedPorts]);
    setSubmittedCommodities([...selectedCommodities]);
    setIsReportGenerated(true);
  };

  const value = {
    selectedPorts,
    selectedCommodities,
    periodType,
    startDate,
    endDate,
    month,
    quarter,
    halfYear,
    year,
    isReportGenerated,
    submittedPorts,
    submittedCommodities,
    includeCharts,
    selectedChartTypes,
    showTrendLine,
    trendType,
    handlePortChange,
    handleCommodityChange,
    setPeriodType,
    setStartDate,
    setEndDate,
    resetFilters,
    generateReport,
    setMonth,
    setQuarter,
    setHalfYear,
    setYear,
    setIncludeCharts,
    toggleChartType,
    setShowTrendLine,
    setTrendType,
  };

  return <RaportContext.Provider value={value}>{children}</RaportContext.Provider>;
};

export const useRaportContext = () => {
  const context = useContext(RaportContext);
  if (context === undefined) {
    throw new Error('useRaportContext must be used within a RaportProvider');
  }
  return context;
};

export default useRaportContext;
