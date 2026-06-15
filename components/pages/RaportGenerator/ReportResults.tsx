"use client";

import ReportDownloadButton from "@/components/ReportDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useRaportContext from "@/contexts/RaportContext";
import { COLORS } from "@/lib/constants";
import { generateChartData } from "@/lib/helpers";
import { formatNumber } from "@/lib/helpers/format-helpers";
import { Tooltip as AntdTooltip } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface ReportResultsProps {
  data: { port: string; kod: string; ilosc: number }[];
}

export default function ReportResults({ data }: ReportResultsProps) {
  const {
    submittedCommodities,
    submittedPorts,
    isReportGenerated,
    startDate,
    endDate,
    includeCharts,
    selectedChartTypes,
  } = useRaportContext();

  const chartData = generateChartData({
    ports: submittedPorts,
    commodities: submittedCommodities,
    data,
    selectedCommodities: submittedCommodities,
  });
  const commodityKeys =
    chartData.length >= 1
      ? Object.keys(chartData[0]).filter((key) => key !== "name")
      : [];

  const barByCommodityData = commodityKeys.map((commodity) => {
    const entry: { name: string; [key: string]: unknown } = { name: commodity };
    submittedPorts.forEach((port) => {
      const portRow = chartData.find((r) => r.name === port);
      entry[port] = portRow ? Number(portRow[commodity] || 0) : 0;
    });
    return entry;
  });

  const pieData = commodityKeys.map((commodity) => ({
    name: commodity,
    value: chartData.reduce(
      (sum, port) => sum + Number(port[commodity] || 0),
      0,
    ),
  }));

  const formatCompactTick = (value: number | string) => {
    const num = Number(value || 0);
    if (num >= 1_000_000) return `${+(num / 1_000_000).toFixed(1)} mln`;
    if (num >= 1_000) return `${+(num / 1_000).toFixed(0)} tys`;
    return String(num);
  };
  const formatMassTooltip = (value: number | string) =>
    `${formatNumber(Number(value || 0))} t`;

  if (!isReportGenerated || !data || data.length === 0) {
    return (
      <Card id="report-results" className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white">
        <CardContent className="p-6">
          <div className="text-center py-10 text-muted-foreground">
            Wybierz co najmniej jeden port i jedną grupę towarową, aby
            wygenerować raport
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="report-results" className="shadow-lg rounded-2xl overflow-hidden border-0">
      <CardHeader className="border-b bg-white flex flex-col sm:flex-row justify-between items-center border-black/20">
        <div>
          <CardTitle className="text-xl font-semibold">
            Szczegółowe dane
          </CardTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Okres: {startDate.toLocaleDateString("pl-PL")} –{" "}
              {endDate.toLocaleDateString("pl-PL")}
            </p>
          )}
        </div>
        <ReportDownloadButton
          data={chartData}
          startDate={startDate}
          endDate={endDate}
        />
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <div>
          {chartData.length > 0 ? (
            <>
              <div className="overflow-x-auto px-6 py-4">
                <Table className="w-auto">
                  <TableHeader>
                    <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                      <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">
                        Port
                      </TableHead>
                      {commodityKeys.map((key) => (
                        <TableHead
                          key={key}
                          className="text-right font-bold text-white border-r border-white/20 last:border-r-0 whitespace-nowrap"
                        >
                          <AntdTooltip title={key}>
                            <span>{key} [t]</span>
                          </AntdTooltip>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((port, rowIndex) => (
                      <TableRow
                        key={String(port.name)}
                        className={`hover:bg-purple-50 border-black/20 ${rowIndex % 2 === 0 ? "bg-[#f5f3ff]" : "bg-white"}`}
                      >
                        <TableCell className="font-medium border-r border-black/20 whitespace-nowrap">
                          {String(port.name)}
                        </TableCell>
                        {commodityKeys.map((key) => (
                          <TableCell
                            key={key}
                            className="text-right tabular-nums border-r border-black/20 last:border-r-0 whitespace-nowrap"
                          >
                            {formatNumber(Number(port[key] || 0))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="bg-[#e8e4f5] hover:bg-[#e8e4f5] border-black/20 font-bold">
                      <TableCell className="font-bold border-r border-black/20 whitespace-nowrap">
                        SUMA
                      </TableCell>
                      {commodityKeys.map((key) => (
                        <TableCell
                          key={key}
                          className="text-right tabular-nums font-bold border-r border-black/20 last:border-r-0 whitespace-nowrap"
                        >
                          {formatNumber(
                            chartData.reduce(
                              (sum, port) => sum + Number(port[key] || 0),
                              0,
                            ),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {includeCharts && selectedChartTypes.includes("bar_port") && (
                <>
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-sm font-semibold text-[#1a0069]">
                      Wykres {selectedChartTypes.indexOf("bar_port") + 1}:
                      Struktura ładunków wg portu [t]
                    </p>
                  </div>
                  <div className="h-80 sm:p-6 bg-white border-b border-black/20 text-xs sm:text-base">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatCompactTick} tick={{ fontSize: 12 }} width={60} />
                        <RechartsTooltip
                          formatter={(value) =>
                            formatMassTooltip(value as number)
                          }
                        />
                        <Legend />
                        {commodityKeys
                          .filter((key) => chartData[0][key] !== undefined)
                          .map((commodityKey, index) => (
                            <Bar
                              key={commodityKey}
                              dataKey={commodityKey}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {includeCharts && selectedChartTypes.includes("bar_commodity") && (
                <>
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-sm font-semibold text-[#1a0069]">
                      Wykres {selectedChartTypes.indexOf("bar_commodity") + 1}:
                      Wolumen wg grupy towarowej i portu [t]
                    </p>
                  </div>
                  <div
                    className="sm:px-6 bg-white border-b border-black/20 text-xs sm:text-base"
                    style={{
                      height: `${barByCommodityData.length * 60 + 80}px`,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={barByCommodityData}
                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={formatCompactTick} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                          formatter={(value) =>
                            formatMassTooltip(value as number)
                          }
                        />
                        <Legend />
                        {submittedPorts.map((port, index) => (
                          <Bar
                            key={port}
                            dataKey={port}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {includeCharts && selectedChartTypes.includes("pie") && (
                <>
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-sm font-semibold text-[#1a0069]">
                      Wykres {selectedChartTypes.indexOf("pie") + 1}: Udział
                      grup towarowych [t]
                    </p>
                  </div>
                  <div className="h-[480px] sm:p-6 bg-white border-b border-black/20 text-xs sm:text-base">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={160}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value) =>
                            formatMassTooltip(value as number)
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Brak danych do wyświetlenia. Spróbuj zmienić kryteria
              wyszukiwania.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
