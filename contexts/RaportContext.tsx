'use client';

import { halfYearType, monthTypes, periodType, quarterTypes } from '@/components/selectors';
import { createContext, ReactNode, useContext, useState } from 'react';

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
  handlePortChange: (port: string, checked: boolean) => void;
  handleCommodityChange: (commodity: string, checked: boolean) => void;
  setPeriodType: (type: periodType) => void;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setMonth: (month: monthTypes) => void;
  setQuarter: (quater: quarterTypes) => void;
  setHalfYear: (half: halfYearType) => void;
  setYear: (year: string) => void;
  resetFilters: () => void;
  generateReport: () => void;
};

const RaportContext = createContext<RaportContextType | undefined>(undefined);

export const RaportProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<periodType>('konkretne');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<monthTypes>('styczeń');
  const [quarter, setQuarter] = useState<quarterTypes>('I_kwrtał');
  const [halfYear, setHalfYear] = useState<halfYearType>('I półrocze');
  const [year, setYear] = useState<string>('2024');
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  const handlePortChange = (port: string, checked: boolean) => {
    if (checked) {
      setSelectedPorts([...selectedPorts, port]);
    } else {
      setSelectedPorts(selectedPorts.filter(p => p !== port));
    }
  };

  const handleCommodityChange = (commodity: string, checked: boolean) => {
    if (checked) {
      setSelectedCommodities([...selectedCommodities, commodity]);
    } else {
      setSelectedCommodities(selectedCommodities.filter(c => c !== commodity));
    }
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setIsReportGenerated(false);
  };

  const generateReport = () => {
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
