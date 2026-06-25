'use client';

import { fetchMultiplePeriodsAction, fetchReportDataAction, ReportRow } from '@/actions/report';
import useRaportContext from '@/contexts/RaportContext';
import {
  aggregateReportRowsForPresentation,
  expandSelectedPortsToBackendNames,
} from '@/lib/helpers/port-filters';
import type { AppClientsTypes, CargoTypeItem, PeriodRequest } from '@/types';
import { format } from 'date-fns';
import { useState } from 'react';


function generateMonthPeriods(start: Date, end: Date): PeriodRequest[] {
  const periods: PeriodRequest[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const id = `${year}-${String(month + 1).padStart(2, '0')}`;

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonth = month === 11 ? 1 : month + 2;
    const nextYear = month === 11 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    periods.push({
      Id: id,
      PeriodType: 'PERIOD',
      Year: null,
      HalfYear: null,
      Quarter: null,
      Month: null,
      StartDate: startDate,
      EndDate: endDate,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return periods;
}

const useReportData = (allPorts: AppClientsTypes[], allCargoTypes: CargoTypeItem[]) => {
  const { selectedPorts, selectedCommodities, startDate, endDate, breakdownByPeriod } =
    useRaportContext();

  const [data, setData] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchProductGroupData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const backendPortNames = expandSelectedPortsToBackendNames(selectedPorts, allPorts);
      const appClients = allPorts.filter(p => backendPortNames.includes(p.name));
      const selectedCargoTypes = allCargoTypes.filter(ct =>
        selectedCommodities.includes(ct.cargoGroupCode)
      );

      if (breakdownByPeriod && startDate && endDate) {
        const periods = generateMonthPeriods(startDate, endDate);
        const results = await fetchMultiplePeriodsAction(appClients, selectedCargoTypes, periods);

   
        const allRows: ReportRow[] = results.flatMap(({ periodId, rows }) =>
          rows.map(row => ({ ...row, reportDate: `${periodId}-01` }))
        );

        const aggregatedResult = aggregateReportRowsForPresentation(allRows);
        setData(aggregatedResult);
        return aggregatedResult;
      }

      const period: PeriodRequest = {
        Id: Date.now().toString(),
        PeriodType: 'PERIOD',
        Year: null,
        HalfYear: null,
        Quarter: null,
        Month: null,
        StartDate: format(startDate!, 'yyyy-MM-dd'),
        EndDate: format(endDate!, 'yyyy-MM-dd'),
      };

      const result = await fetchReportDataAction(appClients, selectedCargoTypes, period);
      const aggregatedResult = aggregateReportRowsForPresentation(result);
      setData(aggregatedResult);
      return aggregatedResult;
    } finally {
      setIsLoading(false);
    }
  }

  function resetData() {
    setData([]);
  }

  return {
    data,
    isLoading,
    fetchProductGroupData,
    resetData,
  };
};

export default useReportData;