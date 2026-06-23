"use client";
import RaportGenerator from "@/components/pages/RaportGenerator";
import useRaportContext from "@/contexts/RaportContext";
import useReportData from "@/hooks/useReportData";
import type { AppClientsTypes } from "@/types";
import { toast } from "sonner";

interface MainPageProps {
  ports: AppClientsTypes[];
  groups: string[];
}

const MainPage = ({ ports, groups }: MainPageProps) => {
  const {
    generateReport,
    resetFilters,
    selectedPorts,
    selectedCommodities,
    startDate,
    endDate,
  } = useRaportContext();
  const { fetchProductGroupData, data, isLoading, resetData } =
    useReportData(ports);

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
    if (!startDate || !endDate) {
      toast.error("Wybierz datę początkową i końcową");
      return;
    }
    await fetchProductGroupData(e);
    generateReport();
    toast.success("Raport wygenerowany", {
      description: "Dane zostały załadowane pomyślnie.",
    });
    setTimeout(() => {
      document.getElementById("report-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
