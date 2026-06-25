'use client';

import { fetchReportDataAction, ReportRow } from '@/actions/report';
import useRaportContext from '@/contexts/RaportContext';
import {
  aggregateReportRowsForPresentation,
  expandSelectedPortsToBackendNames,
} from '@/lib/helpers/port-filters';
import type { AppClientsTypes, CargoTypeItem, PeriodRequest } from '@/types';
import { format } from 'date-fns';
import { useState } from 'react';

function buildPeriodDates(
  year: number,
  halfYear: 1 | 2 | null,
  quarter: 1 | 2 | 3 | 4 | null,
  month: number | null
): { startDate: string; endDate: string } {
  if (halfYear !== null) {
    const start = halfYear === 1 ? `${year}-01-01` : `${year}-07-01`;
    const end = halfYear === 1 ? `${year}-07-01` : `${year + 1}-01-01`;
    return { startDate: start, endDate: end };
  }
  if (quarter !== null) {
    const starts = [`${year}-01-01`, `${year}-04-01`, `${year}-07-01`, `${year}-10-01`];
    const ends = [`${year}-04-01`, `${year}-07-01`, `${year}-10-01`, `${year + 1}-01-01`];
    return { startDate: starts[quarter - 1], endDate: ends[quarter - 1] };
  }
  if (month !== null) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    return { startDate: start, endDate: end };
  }
  return { startDate: `${year}-01-01`, endDate: `${year + 1}-01-01` };
}

const useReportData = (allPorts: AppClientsTypes[], allCargoTypes: CargoTypeItem[]) => {
  const {
    selectedPorts,
    selectedCommodities,
    periodType,
    periodYear,
    periodHalfYear,
    periodQuarter,
    periodMonth,
    startDate,
    endDate,
  } = useRaportContext();

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

      let period: PeriodRequest;

      if (periodType === 'PERIOD') {
        period = {
          Id: Date.now().toString(),
          PeriodType: 'PERIOD',
          Year: null,
          HalfYear: null,
          Quarter: null,
          Month: null,
          StartDate: format(startDate!, 'yyyy-MM-dd'),
          EndDate: format(endDate!, 'yyyy-MM-dd'),
        };
      } else {
        const { startDate: calcStart, endDate: calcEnd } = buildPeriodDates(
          periodYear,
          periodType === 'HALF_YEAR' ? periodHalfYear : null,
          periodType === 'QUARTER' ? periodQuarter : null,
          periodType === 'MONTH' ? periodMonth : null
        );
        period = {
          Id: Date.now().toString(),
          PeriodType: periodType,
          Year: periodYear,
          HalfYear: periodType === 'HALF_YEAR' ? periodHalfYear : null,
          Quarter: periodType === 'QUARTER' ? periodQuarter : null,
          Month: periodType === 'MONTH' ? periodMonth : null,
          StartDate: calcStart,
          EndDate: calcEnd,
        };
      }

      console.log('[useReportData] appClients:', appClients);
      console.log('[useReportData] selectedCargoTypes:', selectedCargoTypes);
      console.log('[useReportData] period:', period);

      const result = await fetchReportDataAction(appClients, selectedCargoTypes, period);

      console.log('[useReportData] raw result:', result);

      const aggregatedResult = aggregateReportRowsForPresentation(result);

      console.log('[useReportData] aggregated:', aggregatedResult);

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
