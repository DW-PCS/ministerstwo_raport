import MainPage from '@/components/pages/MainPage';
import { getApplicationClients, getDspCargoType } from '@/lib/api/reportApiService';
import { extractUniqueCargoGroupCodes } from '@/lib/helpers';

export default async function Home() {
  const ports = (await getApplicationClients()) || [];
  const commodityGroups = (await getDspCargoType()) || [];
  const groups = extractUniqueCargoGroupCodes(commodityGroups) || [];

  if (!ports || !commodityGroups || !groups) {
    return <div>Error loading data</div>;
  }

  return <MainPage ports={ports} commodityGroups={commodityGroups} groups={groups} />;
}
