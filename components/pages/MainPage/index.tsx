'use client';
import RaportGenerator from '@/components/pages/RaportGenerator';
import useRaportContext from '@/contexts/RaportContext';
import useReportData from '@/hooks/useReportData';
import { AppClientsTypes, DspCargoTypeTypes } from '@/lib/types';

interface MainPageProps {
  ports: AppClientsTypes[];
  groups: string[];
  commodityGroups: DspCargoTypeTypes[];
}
const MainPage = ({ ports, groups, commodityGroups }: MainPageProps) => {
  const { generateReport } = useRaportContext();
  const { fetchProductGroupData, data, isLoading } = useReportData({ ports, commodityGroups });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    await fetchProductGroupData(e); // 🔥 THIS WAS MISSING
    generateReport();
  };
console.log(data, 'data');
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl m-auto mt-14">
      <RaportGenerator data={data} ports={ports} groups={groups} isLoading={isLoading} />
    </form>
  );
};

export default MainPage;
