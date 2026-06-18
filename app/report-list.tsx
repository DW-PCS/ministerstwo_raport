"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const reportTypes = [
  {
    id: "cargo-turnover",
    title: "Raport obrotów ładunkowych",
    description:
      "Zestawienie obrotów ładunkowych w podziale na porty i grupy towarowe w wybranym okresie",
    href: "/raporty/obroty-ladunkowe",
    status: "Dostępny",
    available: true,
  },
  {
    id: "ship-traffic",
    title: "Raport ruchu statków",
    description:
      "Zestawienie zawinięć statków w podziale na porty w wybranym okresie",
    href: "/raporty/ruch-statkow",
    status: "W przygotowaniu",
    available: false,
  },
  {
    id: "ship-traffic-flags",
    title: "Raport ruchu statków (bandery)",
    description:
      "Zestawienie zawinięć statków w podziale na państwa bandery w wybranym okresie",
    href: "/raporty/wykorzystanie-terminali",
    status: "W przygotowaniu",
    available: false,
  },
  {
    id: "ship-capacity",
    title: "Raport pojemności statków netto",
    description:
      "Zestawienie pojemności netto statków zawijających do portów w wybranym okresie",
    href: "/raporty/srodki-transportu",
    status: "W przygotowaniu",
    available: false,
  },
];
function ReportList() {
  const { isAuthenticated } = useAuth();

  const handleOpen = (href: string) => {
    if (!isAuthenticated) {
      toast.error("Wymagane logowanie", {
        description: "Musisz się najpierw uwierzytelnić, aby wejść do raportów.",
      });
      return;
    }
    window.open(href);
  };

  return (
    <>
      {reportTypes.map((report) => (
        <Card
          key={report.id}
          className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        >
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-base">{report.title}</CardTitle>
              <Badge variant={report.available ? "default" : "secondary"}>
                {report.status}
              </Badge>
            </div>
            <CardDescription>{report.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={!report.available}
              onClick={() => handleOpen(report.href)}
              variant={report.available ? "default" : "secondary"}
            >
              {report.available ? "Otwórz raport" : "Otwórz podgląd"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default ReportList;
