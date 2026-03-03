import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const reportTypes = [
    {
      id: 'cargo-turnover',
      title: 'Raport obrotów ładunkowych',
      description:
        'Raport miesięczny, kwartalny, półroczny i roczny dla grup towarowych oraz portów.',
      href: '/reports/obroty-ladunkowe',
      status: 'Dostępny',
      available: true,
    },
    {
      id: 'ship-traffic',
      title: 'Raport ruchu statków',
      description: 'Zestawienie zawinięć i wyjść statków według wybranych okresów.',
      href: '/reports/ruch-statkow',
      status: 'W przygotowaniu',
      available: false,
    },
    {
      id: 'terminal-capacity',
      title: 'Raport wykorzystania terminali',
      description: 'Raport operacyjny wykorzystania infrastruktury przeładunkowej.',
      href: '/reports/wykorzystanie-terminali',
      status: 'W przygotowaniu',
      available: false,
    },
    {
      id: 'transport-modes',
      title: 'Raport środków transportu ładunków',
      description:
        'Podział ładunków według środków transportu dostarczających do portu i odbierających z portu.',
      href: '/reports/srodki-transportu',
      status: 'W przygotowaniu',
      available: false,
    },
  ];

  return (
    <main className="max-w-5xl m-auto mt-14 px-4">
      <section className="space-y-2 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Typy raportów</h2>
        <p className="text-sm text-muted-foreground">
          Wybierz raport do wygenerowania. System jest przygotowany do obsługi wielu typów raportów.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map(report => (
          <Card
            key={report.id}
            className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
          >
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{report.title}</CardTitle>
                <Badge variant={report.available ? 'default' : 'secondary'}>{report.status}</Badge>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant={report.available ? 'default' : 'secondary'}>
                <Link href={report.href}>
                  {report.available ? 'Otwórz raport' : 'Otwórz podgląd'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
