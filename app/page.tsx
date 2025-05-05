import MainPage from '@/components/pages/MainPage';
import { getApplicationClients, getDspCargoType } from '@/lib/api/reportApiService';
import { extractUniqueCargoGroupCodes } from '@/lib/helpers';

export default async function Home() {
  const ports = await getApplicationClients();
  const commodityGroups = await getDspCargoType();
  const groups = extractUniqueCargoGroupCodes(commodityGroups);

  const status = ports.status || commodityGroups.status;
  const errorMessage = ports.message || commodityGroups.message;

  if (ports.status || commodityGroups.status) {
    return <div className="m-auto w-fit text-2xl text-red-400">{`${status} ${errorMessage}`}</div>;
  }

  return <MainPage ports={ports} commodityGroups={commodityGroups} groups={groups} />;
}
