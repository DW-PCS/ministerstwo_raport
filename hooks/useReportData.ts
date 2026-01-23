'use client';

import useRaportContext from '@/contexts/RaportContext';
import { portData } from '@/lib/constants';
import { AppClientsTypes, DspCargoTypeTypes } from '@/lib/types';
import { useState } from 'react';

interface UseReportDataProps {
  ports: AppClientsTypes[];
  commodityGroups: DspCargoTypeTypes[];
}

type ReportRow = {
  port: string;
  kod: string;
  ilosc: number;
};

const useReportData = ({ ports, commodityGroups }: UseReportDataProps) => {
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
