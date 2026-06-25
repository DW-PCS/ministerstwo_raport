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
import { COLORS, TREND_OPTIONS } from "@/constants";
import { formatNumber } from "@/lib/helpers/format-helpers";
import { useReportCharts } from "@/hooks/useReportCharts";
import type { ReportRow } from "@/actions/report";
import { Tooltip as AntdTooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
import type { TrendType } from "@/types";

interface ReportResultsProps {
  data: ReportRow[];
}

export default function ReportResults({ data }: ReportResultsProps) {
  const {
    isReportGenerated,
    startDate,
    endDate,
    includeCharts,
    selectedChartTypes,
    showTrendLine,
    trendType,
    submittedPorts,
    setShowTrendLine,
    setTrendType,
    breakdownByPeriod,
  } = useRaportContext();

  const [showMathDetails, setShowMathDetails] = useState(false);

  const {
    chartData,
    commodityKeys,
    barByCommodityData,
    pieData,
    timeSeriesData,
    trendResult,
    timeSeriesChartData,
    mathTableRows,
    mathSummary,
    breakdownData,
    formatCompactTick,
    formatMassTooltip,
  } = useReportCharts(data);

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
          rawData={data}
          breakdownData={breakdownData}
          startDate={startDate}
          endDate={endDate}
        />
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <div>
          {chartData.length > 0 ? (
            <>
              <div className="overflow-x-auto px-6 py-4">
                {breakdownByPeriod ? (
                  <Table className="w-auto">
                    <TableHeader>
                      <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                        <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">
                          Port
                        </TableHead>
                        <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">
                          Okres
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
                      {(() => {
                        let groupIndex = -1;
                        let lastPort = "";
                        return breakdownData.map((row, i) => {
                          const isNewGroup = row.port !== lastPort;
                          if (isNewGroup) { groupIndex++; lastPort = row.port; }
                          const isEven = groupIndex % 2 === 0;
                          return (
                            <TableRow
                              key={`${row.port}::${row.period}::${i}`}
                              className={`hover:bg-purple-50 border-black/20 ${isNewGroup ? "border-t-2 border-t-[#1a0069]/20" : ""} ${isEven ? "bg-[#f5f3ff]" : "bg-white"}`}
                            >
                              <TableCell className="font-medium border-r border-black/20 whitespace-nowrap">
                                {isNewGroup ? String(row.port) : ""}
                              </TableCell>
                              <TableCell className="border-r border-black/20 whitespace-nowrap text-muted-foreground">
                                {String(row.period)}
                              </TableCell>
                              {commodityKeys.map((key) => (
                                <TableCell
                                  key={key}
                                  className="text-right tabular-nums border-r border-black/20 last:border-r-0 whitespace-nowrap"
                                >
                                  {formatNumber(Number(row[key] || 0))}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                ) : (
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
                                0
                              )
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>

              {includeCharts && !breakdownByPeriod && selectedChartTypes.includes("bar_port") && (
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

              {includeCharts && !breakdownByPeriod &&
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

              {includeCharts && !breakdownByPeriod && selectedChartTypes.includes("pie") && (
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

              {includeCharts && breakdownByPeriod &&
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
                                        Math.round((value as number) * 100) / 100
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
                                        {trendResult.mathDetails.methodDescription}
                                      </p>
                                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                                        {trendResult.mathDetails.steps.map(
                                          (step, i) => (
                                            <li key={i} className="leading-relaxed">
                                              {step}
                                            </li>
                                          )
                                        )}
                                      </ol>

                                      <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-right text-[11px]">
                                          <thead>
                                            <tr className="bg-[#f0eeff] text-[#1a0069]">
                                              <th className="border border-black/10 px-2 py-1 text-left">Nr</th>
                                              <th className="border border-black/10 px-2 py-1 text-left">Miesiąc</th>
                                              <th className="border border-black/10 px-2 py-1">y (dane)</th>
                                              <th className="border border-black/10 px-2 py-1">ŷ (trend)</th>
                                              <th className="border border-black/10 px-2 py-1">y − ŷ</th>
                                              <th className="border border-black/10 px-2 py-1">(y − ŷ)²</th>
                                              <th className="border border-black/10 px-2 py-1">(y − ȳ)²</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {mathTableRows.map((row) => (
                                              <tr
                                                key={row.period}
                                                className="even:bg-gray-50"
                                              >
                                                <td className="border border-black/10 px-2 py-0.5 text-left tabular-nums">{row.period}</td>
                                                <td className="border border-black/10 px-2 py-0.5 text-left">{row.month}</td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">{row.y.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">{row.yHat.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">{row.residual.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">{row.residual2.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-0.5 tabular-nums">{row.devFromMean2.toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          {mathSummary && (
                                            <tfoot>
                                              <tr className="bg-[#f5f3ff] font-semibold">
                                                <td colSpan={2} className="border border-black/10 px-2 py-1 text-left">Σ / podsumowanie</td>
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">ȳ = {mathSummary.yMean.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-1" />
                                                <td className="border border-black/10 px-2 py-1" />
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">SSE = {mathSummary.sse.toFixed(2)}</td>
                                                <td className="border border-black/10 px-2 py-1 tabular-nums">SST = {mathSummary.sst.toFixed(2)}</td>
                                              </tr>
                                              {mathSummary.r2 !== null && (
                                                <tr className="bg-[#f5f3ff]">
                                                  <td colSpan={7} className="border border-black/10 px-2 py-1 text-left">
                                                    R² = 1 − SSE/SST = 1 − {mathSummary.sse.toFixed(2)} / {mathSummary.sst.toFixed(2)} ={" "}
                                                    <span className="font-semibold text-[#1a0069]">{mathSummary.r2.toFixed(4)}</span>
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
