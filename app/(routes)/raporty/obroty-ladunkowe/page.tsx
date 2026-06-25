import { fetchCargoTypesAction, fetchPortsAction } from '@/actions/report';
import MainPage from '@/components/pages/MainPage';
import { Suspense } from 'react';
import BreadcrumbNav from './BreadcrumbNav';

export default async function CargoTurnoverReportPage() {
  const [ports, cargoTypes] = await Promise.all([
    fetchPortsAction(),
    fetchCargoTypesAction(),
  ]);

  return (
    <>
      <div className="max-w-6xl m-auto mt-6 px-4">
        <Suspense>
          <BreadcrumbNav />
        </Suspense>
      </div>
      <MainPage ports={ports} cargoTypes={cargoTypes} />
    </>
  );
}
