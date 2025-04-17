'use client'
import { periodType } from "@/lib/types";
import { createContext, ReactNode, useContext, useState } from "react";


type RaportContextType = {
    selectedPorts: string[];
    selectedCommodities: string[];
    periodType: periodType;
    startDate: Date | undefined;
    endDate: Date | undefined;
    isReportGenerated: boolean;
    handlePortChange: (port: string, checked: boolean) => void;
    handleCommodityChange: (commodity: string, checked: boolean) => void;
    setPeriodType: (type: periodType) => void;
    setStartDate: (date: Date | undefined) => void;
    setEndDate: (date: Date | undefined) => void;
    resetFilters: () => void;
    generateReport: () => void;
};


const RaportContext = createContext<RaportContextType | undefined>(undefined);

export const RaportProvider = ({ children }: { children: ReactNode }) => {
    const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
    const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);
    const [periodType, setPeriodType] = useState<periodType>("konkretne");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [isReportGenerated, setIsReportGenerated] = useState(false);

    const handlePortChange = (port: string, checked: boolean) => {
        if (checked) {
            setSelectedPorts([...selectedPorts, port]);
        } else {
            setSelectedPorts(selectedPorts.filter((p) => p !== port));
        }
    };

    const handleCommodityChange = (commodity: string, checked: boolean) => {
        if (checked) {
            setSelectedCommodities([...selectedCommodities, commodity]);
        } else {
            setSelectedCommodities(selectedCommodities.filter((c) => c !== commodity));
        }
    };

    const resetFilters = () => {
        setSelectedPorts([]);
        setSelectedCommodities([]);
        setPeriodType("konkretne");
        setStartDate(undefined);
        setEndDate(undefined);
        setIsReportGenerated(false);
    };

    const generateReport = () => {
        setIsReportGenerated(true);
    };

    const value = {
        selectedPorts,
        selectedCommodities,
        periodType,
        startDate,
        endDate,
        isReportGenerated,
        handlePortChange,
        handleCommodityChange,
        setPeriodType,
        setStartDate,
        setEndDate,
        resetFilters,
        generateReport
    };

    return <RaportContext.Provider value={value}>{children}</RaportContext.Provider>;
};


export const useRaportContext = () => {
    const context = useContext(RaportContext);
    if (context === undefined) {
        throw new Error("useRaportContext must be used within a RaportProvider");
    }
    return context;
};


export default useRaportContext;
