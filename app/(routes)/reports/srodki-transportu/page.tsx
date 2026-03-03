import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransportModesReportPreviewPage() {
  const mockRows = [
    { mode: 'Kolej', delivered: '142 500 t', pickedUp: '96 200 t' },
    { mode: 'Transport drogowy', delivered: '88 300 t', pickedUp: '74 900 t' },
    { mode: 'Żegluga śródlądowa', delivered: '24 100 t', pickedUp: '31 400 t' },
    { mode: 'Rurociąg', delivered: '51 700 t', pickedUp: '47 800 t' },
  ];

  return (
    <main className="max-w-5xl m-auto mt-14 px-4 space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Raport środków transportu ładunków
          </h2>
          <p className="text-sm text-muted-foreground">
            Podgląd mockowany — raport nie generuje pliku.
          </p>
        </div>
        <Badge variant="secondary">W przygotowaniu</Badge>
      </section>

      <Card className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Przepływ ładunków według transportu</CardTitle>
          <CardDescription>Dane przykładowe do celów prezentacyjnych.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Środek transportu</th>
                  <th className="text-left p-3 font-medium">Dostarczono do portu</th>
                  <th className="text-left p-3 font-medium">Odebrano z portu</th>
                </tr>
              </thead>
              <tbody>
                {mockRows.map(row => (
                  <tr key={row.mode} className="border-t border-border">
                    <td className="p-3">{row.mode}</td>
                    <td className="p-3">{row.delivered}</td>
                    <td className="p-3">{row.pickedUp}</td>
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
