import MainPage from '@/components/pages/MainPage';
import { commodityGroups } from '@/lib/constants';
import { AppClientsTypes, DspCargoTypeTypes } from '@/lib/types';

export default function Home() {
  const ports: AppClientsTypes[] = [
    { id: 1, enabled: true, name: 'Port Szczecin', city: 'Szczecin', orgName: 'ZPS' },
    { id: 2, enabled: true, name: 'Port Gdańsk', city: 'Gdańsk', orgName: 'Port Gdańsk' },
    { id: 3, enabled: true, name: 'Port Gdynia', city: 'Gdynia', orgName: 'Port Gdynia' },
  ];

  const commodityGroupsData: DspCargoTypeTypes[] = commodityGroups.map((group, index) => ({
    id: index,
    appClientId: 0,
    cargoGroupCode: group,
    cargoSubGroupCode: '',
    code: '',
    description: group,
  }));

  return <MainPage ports={ports} commodityGroups={commodityGroupsData} groups={commodityGroups} />;
}
