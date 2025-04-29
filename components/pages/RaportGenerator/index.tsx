'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AppClientsTypes } from '@/lib/types';
import CommodityGroupSelects from './CommodityGroupSelects';
import PeriodSelects from './PeriodSelects';
import PortSelects from './PortSelects';
import ReportResults from './ReportResults';
interface ReportGeneratorProps {
  ports: AppClientsTypes[];
  groups: string[];
  data: unknown[];
}

export default function ReportGenerator({ ports, groups, data }: ReportGeneratorProps) {
  return (
    <div className="space-y-8 max-w-96 m-auto sm:max-w-5xl w-full ">
      <Card className="shadow-lg rounded-2xl border-0 overflow-visible">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[433px]">
          <PortSelects ports={ports} />
          <CommodityGroupSelects groups={groups} />
          <PeriodSelects />
        </CardContent>
      </Card>
      <ReportResults data={data} groups={groups} />
    </div>
  );
}
