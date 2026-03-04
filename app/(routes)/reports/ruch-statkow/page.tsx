import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShipTrafficReportPreviewPage() {
  const mockRows = [
    { port: 'Szczecin', arrivals: 142, departures: 139 },
    { port: 'Gdańsk', arrivals: 198, departures: 201 },
    { port: 'Gdynia', arrivals: 167, departures: 165 },
  ];

  return (
    <main className="max-w-5xl m-auto mt-6 px-4 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Typy raportów</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Raport ruchu statków</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Raport ruchu statków</h2>
          <p className="text-sm text-muted-foreground">
            Podgląd mockowany — raport nie generuje pliku.
          </p>
        </div>
        <Badge variant="secondary">W przygotowaniu</Badge>
      </section>

      <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Zestawienie portowe</CardTitle>
          <CardDescription>Dane przykładowe do celów prezentacyjnych.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Port</th>
                  <th className="text-left p-3 font-medium">Zawinięcia</th>
                  <th className="text-left p-3 font-medium">Wyjścia</th>
                </tr>
              </thead>
              <tbody>
                {mockRows.map(row => (
                  <tr key={row.port} className="border-t border-border">
                    <td className="p-3">{row.port}</td>
                    <td className="p-3">{row.arrivals}</td>
                    <td className="p-3">{row.departures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
