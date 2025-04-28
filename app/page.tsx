import RaportGenerator from '@/components/RaportGenerator';

export default async function Home() {
  // const ports = await getApplicationClients();
  // const commodityGroups = await getDspCargoType();

  return (
    <div className="max-w-5xl m-auto mt-14">
      {/* <Login /> */}
      <RaportGenerator />
    </div>
  );
}
