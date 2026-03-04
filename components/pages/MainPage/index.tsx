'use client';
import RaportGenerator from '@/components/pages/RaportGenerator';
import { toast } from '@/components/ui/use-toast';
import useRaportContext from '@/contexts/RaportContext';
import useReportData from '@/hooks/useReportData';
import { AppClientsTypes } from '@/lib/types';

interface MainPageProps {
  ports: AppClientsTypes[];
  groups: string[];
}

const MainPage = ({ ports, groups }: MainPageProps) => {
  const { generateReport } = useRaportContext();
  const { fetchProductGroupData, data, isLoading } = useReportData();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    await fetchProductGroupData(e);
    generateReport();
    toast({ title: 'Raport wygenerowany', description: 'Dane zostały załadowane pomyślnie.' });
  };
  console.log(data, 'data');
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl m-auto mt-14">
      <RaportGenerator data={data} ports={ports} groups={groups} isLoading={isLoading} />
    </form>
  );
};

export default MainPage;
