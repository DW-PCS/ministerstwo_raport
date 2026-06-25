"use client";
import RaportGenerator from "@/components/pages/RaportGenerator";
import useRaportContext from "@/contexts/RaportContext";
import useReportData from "@/hooks/useReportData";
import type { AppClientsTypes, CargoTypeItem } from "@/types";
import { toast } from "sonner";

interface MainPageProps {
  ports: AppClientsTypes[];
  cargoTypes: CargoTypeItem[];
}

const MainPage = ({ ports, cargoTypes }: MainPageProps) => {
  const {
    generateReport,
    resetFilters,
    selectedPorts,
    selectedCommodities,
    periodType,
    periodYear,
    periodHalfYear,
    periodQuarter,
    periodMonth,
    startDate,
    endDate,
  } = useRaportContext();
  const { fetchProductGroupData, data, isLoading, resetData } =
    useReportData(ports, cargoTypes);

  const groups = [...new Set(cargoTypes.map(c => c.cargoGroupCode))];

  const isPeriodValid = () => {
    if (periodType === 'PERIOD') return !!startDate && !!endDate;
    if (periodType === 'HALF_YEAR') return !!periodYear && periodHalfYear !== null;
    if (periodType === 'QUARTER') return !!periodYear && periodQuarter !== null;
    if (periodType === 'MONTH') return !!periodYear && periodMonth !== null;
    return !!periodYear;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedPorts.length === 0) {
      toast.error("Wybierz co najmniej jeden port");
      return;
    }
    if (selectedCommodities.length === 0) {
      toast.error("Wybierz co najmniej jedną grupę towarową");
      return;
    }
    if (!isPeriodValid()) {
      toast.error("Uzupełnij wszystkie pola okresu");
      return;
    }
    try {
      await fetchProductGroupData(e);
      generateReport();
      toast.success("Raport wygenerowany", {
        description: "Dane zostały załadowane pomyślnie.",
      });
      setTimeout(() => {
        document.getElementById("report-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error('[MainPage] fetchProductGroupData error:', error);
      toast.error("Błąd podczas generowania raportu", {
        description: error instanceof Error ? error.message : "Nieznany błąd",
      });
    }
  };

  const handleReset = () => {
    resetFilters();
    resetData();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl m-auto my-14 mb-4">
      <RaportGenerator
        data={data}
        ports={ports}
        groups={groups}
        isLoading={isLoading}
        onReset={handleReset}
      />
    </form>
  );
};

export default MainPage;
