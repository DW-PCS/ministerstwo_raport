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
import { allCommoditiesMap, COLORS } from '@/lib/constants';
import { generateChartData } from '@/lib/helpers';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
interface ReportResultsProps {
  data: { port: string; kod: string; ilosc: number }[];
}

export default function ReportResults({ data }: ReportResultsProps) {
  const { submittedCommodities, submittedPorts, isReportGenerated, startDate, endDate } =
    useRaportContext();

  const mappedCommodities = submittedCommodities.map(commodity => allCommoditiesMap[commodity]);

  const chartData = generateChartData({
    ports: submittedPorts,
    commodities: mappedCommodities,
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
      <CardHeader className="border-b bg-white flex flex-col sm:flex-row justify-between items-center border-black/10">
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
              <div>
                {chartData.map(port => {
                  return (
                    <div key={port.name} className="border-b last:border-b-0 border-black/10">
                      <div className="p-4 bg-gray-50">
                        <h4 className="text-lg font-medium">{port.name}</h4>
                      </div>
                      <Table>
                        <TableBody>
                          {submittedCommodities.map(commodity => {
                            return (
                              <TableRow
                                key={`${port.name}-${commodity}`}
                                className="hover:bg-gray-50 border-black/10"
                              >
                                <TableCell className="font-medium">{commodity}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {String(port[commodity] || 0) + ' T'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableHeader>
                          <TableRow className="bg-white hover:bg-white border-black/10">
                            <TableHead className="w-[60%] font-bold text-gray-600">
                              Grupa towarowa
                            </TableHead>
                            <TableHead className="text-right font-bold text-gray-600">
                              Wartość
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      </Table>
                    </div>
                  );
                })}
              </div>
              <div className="my-10 border-b border border-black/10"> </div>
              <div className="h-80 sm:p-6 bg-white border-b border-black/10 text-xs sm:text-base">
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
                    <Tooltip />
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
