"use client";

import ReportDownloadButton from "@/components/ReportDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MONTH_NAMES } from "@/lib/helpers/report-download/constants";
import { calculateTrend, TrendType } from "@/lib/helpers/trend-helpers";
import { Tooltip as AntdTooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_ABBR = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
];

const TREND_OPTIONS: { value: TrendType; label: string }[] = [
  { value: "linear", label: "Liniowy" },
  { value: "logarithmic", label: "Logarytmiczny" },
  { value: "polynomial", label: "Wielomianowy (st. 2)" },
  { value: "power", label: "Potęgowy" },
  { value: "exponential", label: "Wykładniczy" },
  { value: "movingAverage", label: "Średnia krocząca" },
];

interface ReportResultsProps {
  data: { port: string; kod: string; ilosc: number; reportDate?: string }[];
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
    showTrendLine,
    trendType,
    setShowTrendLine,
    setTrendType,
  } = useRaportContext();

  const [showMathDetails, setShowMathDetails] = useState(false);

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

  const timeSeriesData = useMemo(() => {
    const monthly: Record<string, number> = {};
    data.forEach((row) => {
      if (!row.reportDate) return;
      const yearMonth = row.reportDate.slice(0, 7);
      monthly[yearMonth] = (monthly[yearMonth] || 0) + row.ilosc;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        const parts = date.split("-");
        const monthIndex = parseInt(parts[1] ?? "1", 10) - 1;
        const year = parts[0] ?? "";
        return {
          month: `${MONTH_ABBR[monthIndex] ?? MONTH_NAMES[monthIndex] ?? parts[1]} ${year}`,
          total,
        };
      });
  }, [data]);

  const trendResult = useMemo(() => {
    if (!showTrendLine || timeSeriesData.length < 2) return null;
    return calculateTrend(
      timeSeriesData.map((d) => d.total),
      trendType,
    );
  }, [showTrendLine, timeSeriesData, trendType]);

  const timeSeriesChartData = useMemo(
    () =>
      timeSeriesData.map((d, i) => ({
        ...d,
        trendValue: trendResult ? trendResult.trendPoints[i] : undefined,
      })),
    [timeSeriesData, trendResult],
  );

  const mathTableRows = useMemo(() => {
    if (!trendResult) return [];
    const yMean =
      timeSeriesData.reduce((s, d) => s + d.total, 0) / timeSeriesData.length;
    return timeSeriesData.map((d, i) => {
      const yHat = trendResult.trendPoints[i] ?? 0;
      const residual = d.total - yHat;
      return {
        period: i + 1,
        month: d.month,
        y: d.total,
        yHat,
        residual,
        residual2: residual ** 2,
        devFromMean2: (d.total - yMean) ** 2,
      };
    });
  }, [trendResult, timeSeriesData]);

  const mathSummary = useMemo(() => {
    if (!mathTableRows.length) return null;
    const sse = mathTableRows.reduce((s, r) => s + r.residual2, 0);
    const sst = mathTableRows.reduce((s, r) => s + r.devFromMean2, 0);
    const yMean =
      timeSeriesData.reduce((s, d) => s + d.total, 0) / timeSeriesData.length;
    return { sse, sst, r2: sst > 0 ? 1 - sse / sst : null, yMean };
  }, [mathTableRows, timeSeriesData]);

  const formatCompactTick = (value: number | string) => {
    const num = Number(value || 0);
    if (num >= 1_000_000) return `${+(num / 1_000_000).toFixed(1)} mln`;
    if (num >= 1_000) return `${+(num / 1_000).toFixed(0)} tys`;
    return String(num);
  };
  const formatMassTooltip = (value: number | string) =>
    `${formatNumber(Number(value || 0))} t`;

  if (!isReportGenerated || !data || data.length === 0) {
    return (
      <Card
        id="report-results"
        className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white"
      >
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
    <Card
      id="report-results"
      className="shadow-lg rounded-2xl overflow-hidden border-0"
    >
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
                        <YAxis
                          tickFormatter={formatCompactTick}
                          tick={{ fontSize: 12 }}
                          width={60}
                        />
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

              {includeCharts &&
                selectedChartTypes.includes("bar_commodity") && (
                  <>
                    <div className="px-6 pt-6 pb-2">
                      <p className="text-sm font-semibold text-[#1a0069]">
                        Wykres {selectedChartTypes.indexOf("bar_commodity") + 1}
                        : Wolumen wg grupy towarowej i portu [t]
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
                          <XAxis
                            type="number"
                            tickFormatter={formatCompactTick}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={90}
                            tick={{ fontSize: 12 }}
                          />
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

              {includeCharts &&
                selectedChartTypes.includes("bar_timeseries") && (
                  <>
                    <div className="px-6 pt-6 pb-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#1a0069]">
                        Wykres{" "}
                        {selectedChartTypes.indexOf("bar_timeseries") + 1}:
                        Obroty łącznie wg miesiąca [t]
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="trend-line-toggle"
                            checked={showTrendLine}
                            onCheckedChange={(checked) =>
                              setShowTrendLine(Boolean(checked))
                            }
                          />
                          <Label
                            htmlFor="trend-line-toggle"
                            className="cursor-pointer text-xs font-medium"
                          >
                            Dodaj linię trendu
                          </Label>
                        </div>
                        <AnimatePresence initial={false}>
                          {showTrendLine && (
                            <motion.div
                              key="trend-type-select"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Select
                                value={trendType}
                                onValueChange={(v) =>
                                  setTrendType(v as TrendType)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs w-48 border-[#1a0069]/30">
                                  <SelectValue placeholder="Typ trendu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {TREND_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                      className="text-xs cursor-pointer"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {timeSeriesData.length < 2 ? (
                      <div className="px-6 pb-4 text-xs text-muted-foreground">
                        Za mało danych miesięcznych do wyświetlenia wykresu
                        szeregów czasowych.
                      </div>
                    ) : (
                      <>
                        <div className="h-80 sm:p-6 bg-white border-b border-black/20 text-xs sm:text-base">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={timeSeriesChartData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 10,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                              <YAxis
                                tickFormatter={formatCompactTick}
                                tick={{ fontSize: 12 }}
                                width={60}
                              />
                              <RechartsTooltip
                                formatter={(value, name) => {
                                  if (name === "trendValue")
                                    return [
                                      formatMassTooltip(
                                        Math.round((value as number) * 100) / 100,
                                      ),
                                      "Linia trendu",
                                    ];
                                  return [
                                    formatMassTooltip(value as number),
                                    "Obroty",
                                  ];
                                }}
                              />
                              <Legend
                                formatter={(value) =>
                                  value === "trendValue"
                                    ? "Linia trendu"
                                    : "Obroty [t]"
                                }
                              />
                              <Bar
                                dataKey="total"
                                name="total"
                                fill={COLORS[0]}
                              />
                              {showTrendLine && trendResult && (
                                <Line
                                  type="monotone"
                                  dataKey="trendValue"
                                  stroke="#e63946"
                                  strokeWidth={2}
                                  dot={false}
                                  strokeDasharray="6 3"
                                />
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        <AnimatePresence initial={false}>
                          {showTrendLine && trendResult && (
                            <motion.div
                              key="trend-info"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-3 bg-[#f5f3ff] border-b border-black/10 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs">
                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                  {trendResult.r2 !== null && (
                                    <span>
                                      <span className="font-semibold text-[#1a0069]">
                                        R²
                                      </span>{" "}
                                      ={" "}
                                      <span className="tabular-nums">
                                        {trendResult.r2.toFixed(4)}
                                      </span>
                                    </span>
                                  )}
                                  <span>
                                    <span className="font-semibold text-[#1a0069]">
                                      Równanie:
                                    </span>{" "}
                                    {trendResult.equation}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    setShowMathDetails((v) => !v)
                                  }
                                  className="text-[#1a0069]/60 hover:text-[#1a0069] underline underline-offset-2 cursor-pointer transition-colors shrink-0"
                                >
                                  {showMathDetails
                                    ? "Ukryj obliczenia"
                                    : "Szczegóły obliczeń"}
                                </button>
                              </div>

                              <AnimatePresence initial={false}>
                                {showMathDetails && (
                                  <motion.div
                                    key="math-details"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 py-4 bg-white border-b border-black/10 space-y-4 text-xs font-mono">
                                      <p className="font-sans font-semibold text-[#1a0069] text-xs">
                                        {
                                          trendResult.mathDetails
                                            .methodDescription
                                        }
                                      </p>
                                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                                        {trendResult.mathDetails.steps.map(
                                          (step, i) => (
                                            <li key={i} className="leading-relaxed">
                                              {step}
                                            </li>
                                          ),
                                        )}
                                      </ol>

                                      <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-right text-[11px]">
                                          <thead>
                                            <tr className="bg-[#f0eeff] text-[#1a0069]">
                                              <th className="border border-black/10 px-2 py-1 text-left">
                                                Nr
                                              </th>
                                              <th className="border border-black/10 px-2 py-1 text-left">
                                                Miesiąc
                                              </th>
                                              <th className="border border-black/10 px-2 py-1">
                                                y (dane)
                                              </th>
                                              <th className="border border-black/10 px-2 py-1">
                                                ŷ (trend)
                                              </th>
                                              <th className="border border-black/10 px-2 py-1">
                                                y − ŷ
                                              </th>
                                              <th className="border border-black/10 px-2 py-1">
                                                (y − ŷ)²
                                              </th>
                                              <th className="border border-black/10 px-2 py-1">
                                                (y − ȳ)²
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {mathTableRows.map((row) => (
                                              <tr
                                                key={row.period}
                                                className="even:bg-gray-50"
                                              >
                                                <td className="border border-black/10 px-2 py-0.5 text-left tabular-nums">
                                                  {row.period}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 text-left">
                                                  {row.month}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">
                                                  {row.y.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">
                                                  {row.yHat.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">
                                                  {row.residual.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">
                                                  {row.residual2.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">
                                                  {row.devFromMean2.toFixed(2)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          {mathSummary && (
                                            <tfoot>
                                              <tr className="bg-[#f5f3ff] font-semibold">
                                                <td
                                                  colSpan={2}
                                                  className="border border-black/10 px-2 py-1 text-left"
                                                >
                                                  Σ / podsumowanie
                                                </td>
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">
                                                  ȳ ={" "}
                                                  {mathSummary.yMean.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-1" />
                                                <td className="border border-black/10 px-2 py-1" />
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">
                                                  SSE ={" "}
                                                  {mathSummary.sse.toFixed(2)}
                                                </td>
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">
                                                  SST ={" "}
                                                  {mathSummary.sst.toFixed(2)}
                                                </td>
                                              </tr>
                                              {mathSummary.r2 !== null && (
                                                <tr className="bg-[#f5f3ff]">
                                                  <td
                                                    colSpan={7}
                                                    className="border border-black/10 px-2 py-1 text-left"
                                                  >
                                                    R² = 1 − SSE/SST = 1 −{" "}
                                                    {mathSummary.sse.toFixed(
                                                      2,
                                                    )}{" "}
                                                    /{" "}
                                                    {mathSummary.sst.toFixed(
                                                      2,
                                                    )}{" "}
                                                    ={" "}
                                                    <span className="font-semibold text-[#1a0069]">
                                                      {mathSummary.r2.toFixed(
                                                        4,
                                                      )}
                                                    </span>
                                                  </td>
                                                </tr>
                                              )}
                                            </tfoot>
                                          )}
                                        </table>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
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
