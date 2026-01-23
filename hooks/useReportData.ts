'use client';

import useRaportContext from '@/contexts/RaportContext';
import { portData } from '@/lib/constants';
import { useState } from 'react';

type ReportRow = {
  port: string;
  kod: string;
  ilosc: number;
};

const useReportData = () => {
  const { selectedPorts, selectedCommodities } = useRaportContext();

  const [data, setData] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const buildMockReportData = (): ReportRow[] => {
    const rows: ReportRow[] = [];

    selectedPorts.forEach(port => {
      const portEntry = portData[port];
      if (!portEntry) return;

      selectedCommodities.forEach(commodity => {
        const commodityEntry = portEntry[commodity];
        if (!commodityEntry) return;

        rows.push({
          port,
          kod: commodity,
          ilosc: commodityEntry.value,
        });
      });
    });

    return rows;
  };

  async function fetchProductGroupData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // simulate backend latency
      await new Promise(resolve => setTimeout(resolve, 700));

      const result = buildMockReportData();
      setData(result);

      return result;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    data,
    isLoading,
    fetchProductGroupData,
  };
};

export default useReportData;
