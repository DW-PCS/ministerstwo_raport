import MainPage from '@/components/pages/MainPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { commodityGroups } from '@/lib/constants';
import { AppClientsTypes } from '@/lib/types';

export default function CargoTurnoverReportPage() {
  const ports: AppClientsTypes[] = [
    { id: 1, enabled: true, name: 'Port Szczecin', city: 'Szczecin', orgName: 'ZPS' },
    { id: 2, enabled: true, name: 'Port Gdańsk', city: 'Gdańsk', orgName: 'Port Gdańsk' },
    { id: 3, enabled: true, name: 'Port Gdynia', city: 'Gdynia', orgName: 'Port Gdynia' },
  ];

  return (
    <>
      <div className="max-w-5xl m-auto mt-6 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Typy raportów</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Raport obrotów ładunkowych</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <MainPage ports={ports} groups={commodityGroups} />
    </>
  );
}
