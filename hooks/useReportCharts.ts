'use client';

import { MONTH_ABBR } from '@/constants';
import useRaportContext from '@/contexts/RaportContext';
import { generateChartData } from '@/lib/helpers';
import { formatNumber } from '@/lib/helpers/format-helpers';
import { MONTH_NAMES } from '@/lib/helpers/report-download/constants';
import { calculateTrend } from '@/lib/helpers/trend-helpers';
import type { ReportRow } from '@/actions/report';
import { useMemo } from 'react';

export const useReportCharts = (data: ReportRow[]) => {
  const { submittedPorts, submittedCommodities, showTrendLine, trendType } = useRaportContext();

  const chartData = useMemo(
    () =>
      generateChartData({
        ports: submittedPorts,
        commodities: submittedCommodities,
        data,
        selectedCommodities: submittedCommodities,
      }),
    [submittedPorts, submittedCommodities, data]
  );

  const commodityKeys = useMemo(
    () => (chartData.length >= 1 ? Object.keys(chartData[0]).filter(key => key !== 'name') : []),
    [chartData]
  );

  const barByCommodityData = useMemo(
    () =>
      commodityKeys.map(commodity => {
        const entry: { name: string; [key: string]: unknown } = { name: commodity };
        submittedPorts.forEach(port => {
          const portRow = chartData.find(r => r.name === port);
          entry[port] = portRow ? Number(portRow[commodity] || 0) : 0;
        });
        return entry;
      }),
    [commodityKeys, submittedPorts, chartData]
  );

  const pieData = useMemo(
    () =>
      commodityKeys.map(commodity => ({
        name: commodity,
        value: chartData.reduce((sum, port) => sum + Number(port[commodity] || 0), 0),
      })),
    [commodityKeys, chartData]
  );

  const timeSeriesData = useMemo(() => {
    const monthly: Record<string, number> = {};
    data.forEach(row => {
      if (!row.reportDate) return;
      const yearMonth = row.reportDate.slice(0, 7);
      monthly[yearMonth] = (monthly[yearMonth] || 0) + row.ilosc;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        const parts = date.split('-');
        const monthIndex = parseInt(parts[1] ?? '1', 10) - 1;
        const year = parts[0] ?? '';
        return {
          month: `${MONTH_ABBR[monthIndex] ?? MONTH_NAMES[monthIndex] ?? parts[1]} ${year}`,
          total,
        };
      });
  }, [data]);

  const trendResult = useMemo(() => {
    if (!showTrendLine || timeSeriesData.length < 2) return null;
    return calculateTrend(
      timeSeriesData.map(d => d.total),
      trendType
    );
  }, [showTrendLine, timeSeriesData, trendType]);

  const timeSeriesChartData = useMemo(
    () =>
      timeSeriesData.map((d, i) => ({
        ...d,
        trendValue: trendResult ? trendResult.trendPoints[i] : undefined,
      })),
    [timeSeriesData, trendResult]
  );

  const mathTableRows = useMemo(() => {
    if (!trendResult) return [];
    const yMean = timeSeriesData.reduce((s, d) => s + d.total, 0) / timeSeriesData.length;
    return timeSeriesData.map((d, i) => {
      const yHat = trendResult.trendPoints[i] ?? 0;
      const residual = d.total - yHat;
      return {
        period: i + 1,
        month: d.month,
        y: d.total,
        yHat,
        residual,
        residual2: residual ** 2,
        devFromMean2: (d.total - yMean) ** 2,
      };
    });
  }, [trendResult, timeSeriesData]);

  const mathSummary = useMemo(() => {
    if (!mathTableRows.length) return null;
    const sse = mathTableRows.reduce((s, r) => s + r.residual2, 0);
    const sst = mathTableRows.reduce((s, r) => s + r.devFromMean2, 0);
    const yMean = timeSeriesData.reduce((s, d) => s + d.total, 0) / timeSeriesData.length;
    return { sse, sst, r2: sst > 0 ? 1 - sse / sst : null, yMean };
  }, [mathTableRows, timeSeriesData]);

  const breakdownData = useMemo(() => {
    if (!data || data.length === 0) return [];

    type BreakdownEntry = { port: string; period: string; periodSort: string; [key: string]: unknown };
    const grouped = new Map<string, BreakdownEntry>();

    data.forEach(row => {
      if (!row.reportDate) return;
      const yearMonth = row.reportDate.slice(0, 7);
      const key = `${row.port}::${yearMonth}`;

      if (!grouped.has(key)) {
        const [year, monthStr] = yearMonth.split('-');
        const monthIndex = parseInt(monthStr ?? '1', 10) - 1;
        const periodLabel = `${MONTH_NAMES[monthIndex] ?? monthStr} ${year}`;
        grouped.set(key, { port: row.port, period: periodLabel, periodSort: yearMonth });
      }

      const entry = grouped.get(key)!;
      entry[row.kod] = Number(entry[row.kod] || 0) + row.ilosc;
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.port !== b.port) return a.port.localeCompare(b.port, 'pl');
      return a.periodSort.localeCompare(b.periodSort);
    });
  }, [data]);

  const formatCompactTick = (value: number | string) => {
    const num = Number(value || 0);
    if (num >= 1_000_000) return `${+(num / 1_000_000).toFixed(1)} mln`;
    if (num >= 1_000) return `${+(num / 1_000).toFixed(0)} tys`;
    return String(num);
  };

  const formatMassTooltip = (value: number | string) =>
    `${formatNumber(Number(value || 0))} t`;

  return {
    chartData,
    commodityKeys,
    barByCommodityData,
    pieData,
    timeSeriesData,
    trendResult,
    timeSeriesChartData,
    mathTableRows,
    mathSummary,
    breakdownData,
    formatCompactTick,
    formatMassTooltip,
  };
};
