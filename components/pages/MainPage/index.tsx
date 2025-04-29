'use client';
import RaportGenerator from '@/components/pages/RaportGenerator';
import useReportData from '@/hooks/useReportData';
import { AppClientsTypes, DspCargoTypeTypes } from '@/lib/types';

interface MainPageProps {
  ports: AppClientsTypes[];
  groups: string[];
  commodityGroups: DspCargoTypeTypes[];
}
const MainPage = ({ ports, groups, commodityGroups }: MainPageProps) => {
  const { fetchProductGroupData, data } = useReportData({ ports, commodityGroups });

  return (
    <form onSubmit={fetchProductGroupData} className="max-w-5xl m-auto mt-14">
      <RaportGenerator data={data} ports={ports} groups={groups} />
    </form>
  );
};

export default MainPage;
