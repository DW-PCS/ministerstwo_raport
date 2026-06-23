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
import { REPORT_TYPES } from "@/constants";
import { toast } from "sonner";

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
      {REPORT_TYPES.map((report) => (
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
