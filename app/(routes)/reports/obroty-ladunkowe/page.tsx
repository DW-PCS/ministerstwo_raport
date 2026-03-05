import MainPage from '@/components/pages/MainPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { fetchCargoTypesAction, fetchPortsAction } from '@/actions/report';

export default async function CargoTurnoverReportPage() {
  const [ports, groups] = await Promise.all([
    fetchPortsAction(),
    fetchCargoTypesAction(),
  ]);

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
      <MainPage ports={ports} groups={groups} />
    </>
  );
}
