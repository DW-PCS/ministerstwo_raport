'use client';

import ReportDownloadButton from '@/components/ReportDownloadButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useRaportContext from '@/contexts/RaportContext';
import { COLORS } from '@/lib/constants';
import { generateChartData } from '@/lib/helpers';
import { formatNumber } from '@/lib/helpers/format-helpers';
import { Tooltip as AntdTooltip } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
interface ReportResultsProps {
  data: { port: string; kod: string; ilosc: number }[];
}

export default function ReportResults({ data }: ReportResultsProps) {
  const { submittedCommodities, submittedPorts, isReportGenerated, startDate, endDate } =
    useRaportContext();

  const chartData = generateChartData({
    ports: submittedPorts,
    commodities: submittedCommodities,
    data,
    selectedCommodities: submittedCommodities,
  });
  const commodityKeys =
    chartData.length >= 1 ? Object.keys(chartData[0]).filter(key => key !== 'name') : [];

  if (!isReportGenerated || !data || data.length === 0) {
    return (
      <Card className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white">
        <CardContent className="p-6">
          <div className="text-center py-10 text-muted-foreground">
            Wybierz co najmniej jeden port i jedną grupę towarową, aby wygenerować raport
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl overflow-hidden border-0">
      <CardHeader className="border-b bg-white flex flex-col sm:flex-row justify-between items-center border-black/20">
        <div>
          <CardTitle className="text-xl font-semibold">Szczegółowe dane</CardTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Okres: {startDate.toLocaleDateString('pl-PL')} – {endDate.toLocaleDateString('pl-PL')}
            </p>
          )}
        </div>
        <ReportDownloadButton data={chartData} startDate={startDate} endDate={endDate} />
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <div>
          {chartData.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                      <TableHead className="font-bold text-white border-r border-white/20">
                        Port
                      </TableHead>
                      {commodityKeys.map(key => (
                        <TableHead
                          key={key}
                          className="text-right font-bold text-white border-r border-white/20 last:border-r-0"
                        >
                          <AntdTooltip title={key}>
                            <span className="inline-block max-w-30 truncate align-bottom">
                              {key} [t]
                            </span>
                          </AntdTooltip>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((port, rowIndex) => (
                      <TableRow
                        key={String(port.name)}
                        className={`hover:bg-purple-50 border-black/20 ${rowIndex % 2 === 0 ? 'bg-[#f5f3ff]' : 'bg-white'}`}
                      >
                        <TableCell className="font-medium border-r border-black/20">
                          {String(port.name)}
                        </TableCell>
                        {commodityKeys.map(key => (
                          <TableCell
                            key={key}
                            className="text-right tabular-nums border-r border-black/20 last:border-r-0"
                          >
                            {formatNumber(Number(port[key] || 0))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="bg-[#e8e4f5] hover:bg-[#e8e4f5] border-black/20 font-bold">
                      <TableCell className="font-bold border-r border-black/20">SUMA</TableCell>
                      {commodityKeys.map(key => (
                        <TableCell
                          key={key}
                          className="text-right tabular-nums font-bold border-r border-black/20 last:border-r-0"
                        >
                          {formatNumber(
                            chartData.reduce((sum, port) => sum + Number(port[key] || 0), 0)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="my-10 border-b border border-black/20"> </div>
              <div className="h-80 sm:p-6 bg-white border-b border-black/20 text-xs sm:text-base">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    {commodityKeys
                      .filter(key => chartData[0][key] !== undefined)
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
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Brak danych do wyświetlenia. Spróbuj zmienić kryteria wyszukiwania.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
