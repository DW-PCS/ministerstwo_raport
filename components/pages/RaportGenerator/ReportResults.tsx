'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { selectedCommodities, selectedPorts } = useRaportContext();

  const mappedCommodities = selectedCommodities.map(commodity => allCommoditiesMap[commodity]);

  const chartData = generateChartData({
    ports: selectedPorts,
    commodities: mappedCommodities,
    data,
    selectedCommodities,
  });
  const commodityKeys =
    chartData.length >= 1 ? Object.keys(chartData[0]).filter(key => key !== 'name') : [];

  return (
    <Card className="shadow-lg rounded-2xl overflow-hidden border-0">
      <CardHeader className="border-b bg-white flex flex-col sm:flex-row justify-between items-center">
        <CardTitle className="text-xl font-semibold">Szczegółowe dane</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {chartData.length > 0 ? (
            <>
              <div className="h-80 sm:p-6 bg-white border-b text-xs sm:text-base">
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
              Wybierz co najmniej jeden port i jedną grupę towarową, aby wygenerować raport
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
