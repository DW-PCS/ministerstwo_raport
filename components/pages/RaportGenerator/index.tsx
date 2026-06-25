'use client';

import type { ReportRow } from '@/actions/report';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useRaportContext from '@/contexts/RaportContext';
import type { UseComparisonDataReturn } from '@/hooks/useComparisonData';
import type { AppClientsTypes, ReportTab } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CommodityGroupSelects from './CommodityGroupSelects';
import ComparisonPeriodSelects from './ComparisonPeriodSelects';
import ComparisonResults from './ComparisonResults';
import PeriodSelects from './PeriodSelects';
import PortSelects from './PortSelects';
import ReportResults from './ReportResults';

interface ReportGeneratorProps {
  ports: AppClientsTypes[];
  groups: string[];
  data: ReportRow[];
  isLoading: boolean;
  onReset: () => void;
  comparisonHook: UseComparisonDataReturn;
}

export default function RaportGenerator({
  ports,
  groups,
  data,
  isLoading,
  onReset,
  comparisonHook,
}: ReportGeneratorProps) {
  const { reportTab, setReportTab } = useRaportContext();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ReportTab;
    if (tab === 'comparison' || tab === 'standard') {
      setReportTab(tab);
    }
  }, [setReportTab]);

  const handleTabChange = (val: string) => {
    const tab = val as ReportTab;
    setReportTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-8 m-auto  w-full">
      <Card className="shadow-lg rounded-2xl border-0 overflow-visible bg-white">
        <CardHeader className="pb-0 pt-4 px-4">
          <Tabs value={reportTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full bg-gray-100">
              <TabsTrigger
                value="standard"
                className="flex-1 data-[state=active]:bg-[#1a0069] data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Raport standardowy
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex-1 data-[state=active]:bg-[#1a0069] data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                Raport porównawczy
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[433px]">
          <PortSelects ports={ports} />
          <CommodityGroupSelects groups={groups} />
          {reportTab === 'standard' ? (
            <PeriodSelects isLoading={isLoading} onReset={onReset} />
          ) : (
            <ComparisonPeriodSelects hook={comparisonHook} onReset={onReset} />
          )}
        </CardContent>
      </Card>

      {reportTab === 'standard' ? (
        <ReportResults data={data} />
      ) : (
        <ComparisonResults hook={comparisonHook} />
      )}
    </div>
  );
}
