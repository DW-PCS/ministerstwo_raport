'use client';

import { fetchMultiplePeriodsAction } from '@/actions/report';
import useRaportContext from '@/contexts/RaportContext';
import {
  aggregateReportRowsForPresentation,
  expandSelectedPortsToBackendNames,
} from '@/lib/helpers/port-filters';
import type { AppClientsTypes, CargoTypeItem, PeriodRequest, SelectedComparisonPeriod } from '@/types';
import { useState } from 'react';

export interface ChainRow {
  port: string;
  group: string;
  periodLabel: string;
  periodIndex: number;
  tonnage: number;
  change: number | null;
}

function buildPeriodRequest(p: SelectedComparisonPeriod): PeriodRequest {
  let start: string;
  let end: string;

  if (p.type === 'YEAR') {
    start = `${p.year}-01-01`;
    end = `${p.year + 1}-01-01`;
  } else if (p.type === 'HALF_YEAR') {
    if (p.halfYear === 1) {
      start = `${p.year}-01-01`;
      end = `${p.year}-07-01`;
    } else {
      start = `${p.year}-07-01`;
      end = `${p.year + 1}-01-01`;
    }
  } else if (p.type === 'QUARTER') {
    const starts = [`${p.year}-01-01`, `${p.year}-04-01`, `${p.year}-07-01`, `${p.year}-10-01`];
    const ends = [`${p.year}-04-01`, `${p.year}-07-01`, `${p.year}-10-01`, `${p.year + 1}-01-01`];
    const q = (p.quarter ?? 1) - 1;
    start = starts[q];
    end = ends[q];
  } else {
    const m = p.month ?? 1;
    start = `${p.year}-${String(m).padStart(2, '0')}-01`;
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? p.year + 1 : p.year;
    end = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
  }

  return {
    Id: p.id,
    PeriodType: p.type,
    Year: p.year,
    HalfYear: p.halfYear,
    Quarter: p.quarter,
    Month: p.month,
    StartDate: start,
    EndDate: end,
  };
}

const useComparisonData = (allPorts: AppClientsTypes[], allCargoTypes: CargoTypeItem[]) => {
  const { selectedPorts, selectedCommodities } = useRaportContext();

  const [selectedPeriods, setSelectedPeriods] = useState<SelectedComparisonPeriod[]>([]);
  const [submittedPeriods, setSubmittedPeriods] = useState<SelectedComparisonPeriod[]>([]);
  const [chainRows, setChainRows] = useState<ChainRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  function addPeriod(period: SelectedComparisonPeriod) {
    setSelectedPeriods(prev => [...prev, period]);
  }

  function removePeriod(id: string) {
    setSelectedPeriods(prev => prev.filter(p => p.id !== id));
  }

  function clearPeriods() {
    setSelectedPeriods([]);
  }

  async function fetchComparisonData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendPortNames = expandSelectedPortsToBackendNames(selectedPorts, allPorts);
      const appClients = allPorts.filter(p => backendPortNames.includes(p.name));
      const cargoTypes = allCargoTypes.filter(ct => selectedCommodities.includes(ct.cargoGroupCode));
      const periods = selectedPeriods.map(buildPeriodRequest);

      const results = await fetchMultiplePeriodsAction(appClients, cargoTypes, periods);

      const aggregatedResults = results.map(r => ({
        ...r,
        rows: aggregateReportRowsForPresentation(r.rows),
      }));

      const portGroupSet = new Set<string>();
      aggregatedResults.forEach(({ rows }) => {
        rows.forEach(row => portGroupSet.add(`${row.port}|||${row.kod}`));
      });

      const rows: ChainRow[] = [];

      portGroupSet.forEach(key => {
        const sep = key.indexOf('|||');
        const port = key.slice(0, sep);
        const group = key.slice(sep + 3);
        let prevTonnage: number | null = null;

        aggregatedResults.forEach(({ rows: periodRows }, idx) => {
          const tonnage = periodRows
            .filter(r => r.port === port && r.kod === group)
            .reduce((sum, r) => sum + r.ilosc, 0);

          const change =
            prevTonnage !== null && prevTonnage !== 0
              ? ((tonnage - prevTonnage) / prevTonnage) * 100
              : null;

          rows.push({
            port,
            group,
            periodLabel: selectedPeriods[idx].label,
            periodIndex: idx,
            tonnage,
            change,
          });
          prevTonnage = tonnage;
        });
      });

      rows.sort((a, b) => {
        if (a.port !== b.port) return a.port.localeCompare(b.port, 'pl');
        if (a.group !== b.group) return a.group.localeCompare(b.group, 'pl');
        return a.periodIndex - b.periodIndex;
      });

      setChainRows(rows);
      setSubmittedPeriods([...selectedPeriods]);
      setIsGenerated(true);
    } finally {
      setIsLoading(false);
    }
  }

  function resetComparison() {
    setSelectedPeriods([]);
    setSubmittedPeriods([]);
    setChainRows([]);
    setIsGenerated(false);
  }

  return {
    selectedPeriods,
    submittedPeriods,
    addPeriod,
    removePeriod,
    clearPeriods,
    chainRows,
    isLoading,
    isGenerated,
    fetchComparisonData,
    resetComparison,
  };
};

export default useComparisonData;
export type UseComparisonDataReturn = ReturnType<typeof useComparisonData>;
