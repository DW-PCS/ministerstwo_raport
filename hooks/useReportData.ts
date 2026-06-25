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
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

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

  async function triggerFetch() {
    if (!startDate || !endDate) return;
    setIsLoading(true);

    try {
      const backendPortNames = expandSelectedPortsToBackendNames(selectedPorts, allPorts);
      const appClients = allPorts.filter(p => backendPortNames.includes(p.name));
      const selectedCargoTypes = allCargoTypes.filter(ct =>
        selectedCommodities.includes(ct.cargoGroupCode)
      );

      if (breakdownByPeriod) {
        const periods = generateMonthPeriods(startDate, endDate);
        const results = await fetchMultiplePeriodsAction(appClients, selectedCargoTypes, periods);

        const allRows: ReportRow[] = results.flatMap(({ periodId, rows }) =>
          rows.map(row => ({ ...row, reportDate: `${periodId}-01` }))
        );

        const aggregatedResult = aggregateReportRowsForPresentation(allRows);
        setData(aggregatedResult);
        return aggregatedResult;
      }

      const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

      const period: PeriodRequest = {
        Id: Date.now().toString(),
        PeriodType: 'PERIOD',
        Year: null,
        HalfYear: null,
        Quarter: null,
        Month: null,
        StartDate: format(normalizedStart, 'yyyy-MM-dd'),
        EndDate: format(normalizedEnd, 'yyyy-MM-dd'),
      };

      const result = await fetchReportDataAction(appClients, selectedCargoTypes, period);
      const aggregatedResult = aggregateReportRowsForPresentation(result);
      setData(aggregatedResult);
      return aggregatedResult;
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductGroupData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    return triggerFetch();
  }

  function resetData() {
    setData([]);
  }

  return {
    data,
    isLoading,
    fetchProductGroupData,
    triggerFetch,
    resetData,
  };
};

export default useReportData;