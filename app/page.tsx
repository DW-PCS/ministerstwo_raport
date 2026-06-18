import AuthRequiredToast from "@/components/auth/AuthRequiredToast";
import ReportList from "./report-list";

export default function Home() {
  return (
    <main className="max-w-5xl m-auto mt-14 px-4">
      <AuthRequiredToast />
      <section className="space-y-2 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Typy raportów</h2>
        <p className="text-sm text-muted-foreground">
          Wybierz raport do wygenerowania. System jest przygotowany do obsługi
          wielu typów raportów.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportList />
      </section>
    </main>
  );
}
