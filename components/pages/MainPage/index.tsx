"use client";
import RaportGenerator from "@/components/pages/RaportGenerator";
import useRaportContext from "@/contexts/RaportContext";
import useComparisonData from "@/hooks/useComparisonData";
import useReportData from "@/hooks/useReportData";
import type { AppClientsTypes, CargoTypeItem } from "@/types";
import { toast } from "sonner";

interface MainPageProps {
  ports: AppClientsTypes[];
  cargoTypes: CargoTypeItem[];
}

const MainPage = ({ ports, cargoTypes }: MainPageProps) => {
  const {
    reportTab,
    generateReport,
    resetFilters,
    selectedPorts,
    selectedCommodities,
    startDate,
    endDate,
  } = useRaportContext();

  const { fetchProductGroupData, data, isLoading, resetData } = useReportData(ports, cargoTypes);
  const comparisonHook = useComparisonData(ports, cargoTypes);

  const groups = [...new Set(cargoTypes.map(c => c.cargoGroupCode))];

  const validateShared = () => {
    if (selectedPorts.length === 0) {
      toast.error("Wybierz co najmniej jeden port");
      return false;
    }
    if (selectedCommodities.length === 0) {
      toast.error("Wybierz co najmniej jedną grupę towarową");
      return false;
    }
    return true;
  };

  const handleStandardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!validateShared()) return;
    if (!startDate || !endDate) {
      toast.error("Wybierz datę początkową i końcową");
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
      toast.error("Błąd podczas generowania raportu", {
        description: error instanceof Error ? error.message : "Nieznany błąd",
      });
    }
  };

  const handleComparisonSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!validateShared()) return;

    if (comparisonHook.selectedPeriods.length === 0) {
      toast.error("Dodaj co najmniej jeden okres do porównania");
      return;
    }

    try {
      await comparisonHook.fetchComparisonData(e);
      toast.success("Raport porównawczy wygenerowany", {
        description: "Dane zostały załadowane pomyślnie.",
      });
      setTimeout(() => {
        document.getElementById("report-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      toast.error("Błąd podczas generowania raportu porównawczego", {
        description: error instanceof Error ? error.message : "Nieznany błąd",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (reportTab === 'standard') {
      await handleStandardSubmit(e);
    } else {
      await handleComparisonSubmit(e);
    }
  };

  const handleReset = () => {
    resetFilters();
    resetData();
    comparisonHook.resetComparison();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl m-auto mt-6 mb-4">
      <RaportGenerator
        data={data}
        ports={ports}
        groups={groups}
        isLoading={reportTab === 'standard' ? isLoading : comparisonHook.isLoading}
        onReset={handleReset}
        comparisonHook={comparisonHook}
      />
    </form>
  );
};

export default MainPage;
