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

export default function TerminalCapacityReportPreviewPage() {
  const mockRows = [
    { terminal: 'Kontenerowy', utilization: '78%', throughput: '1 240 TEU' },
    { terminal: 'Masowy', utilization: '64%', throughput: '86 300 t' },
    { terminal: 'Paliwowy', utilization: '71%', throughput: '52 100 t' },
  ];

  return (
    <main className="max-w-6xl m-auto mt-6 px-4 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Typy raportów</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Raport wykorzystania terminali</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Raport wykorzystania terminali</h2>
          <p className="text-sm text-muted-foreground">
            Podgląd mockowany — raport nie generuje pliku.
          </p>
        </div>
        <Badge variant="secondary">W przygotowaniu</Badge>
      </section>

      <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Wskaźniki operacyjne</CardTitle>
          <CardDescription>Dane przykładowe do celów prezentacyjnych.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Terminal</th>
                  <th className="text-left p-3 font-medium">Wykorzystanie</th>
                  <th className="text-left p-3 font-medium">Przeładunek</th>
                </tr>
              </thead>
              <tbody>
                {mockRows.map(row => (
                  <tr key={row.terminal} className="border-t border-border">
                    <td className="p-3">{row.terminal}</td>
                    <td className="p-3">{row.utilization}</td>
                    <td className="p-3">{row.throughput}</td>
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
