'use client';

import { fetchReportDataAction } from '@/actions/report';
import useRaportContext from '@/contexts/RaportContext';
import { AppClientsTypes } from '@/lib/types';
import { format } from 'date-fns';
import { useState } from 'react';

type ReportRow = {
  port: string;
  kod: string;
  ilosc: number;
};

const useReportData = (allPorts: AppClientsTypes[]) => {
  const { selectedPorts, selectedCommodities, startDate, endDate } = useRaportContext();

  const [data, setData] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchProductGroupData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const appClients = allPorts.filter(p => selectedPorts.includes(p.name));
      const result = await fetchReportDataAction(
        appClients,
        selectedCommodities,
        format(startDate!, 'yyyy-MM-dd'),
        format(endDate!, 'yyyy-MM-dd')
      );
      setData(result);
      return result;
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
