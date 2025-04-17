"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import useRaportContext from "@/contexts/useRaportContext"
import { allCommodities, portData } from "@/lib/constants"
import { formatNumber, generateChartData, getPeriodInfo } from "@/lib/helpers"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"



export default function ReportResults() {

  const { periodType, startDate, endDate, selectedCommodities,selectedPorts} = useRaportContext()


  const commodities = selectedCommodities.length > 0 ? selectedCommodities : ["Węgiel", "Ruda", "Zboże"]
  const chartData = generateChartData(selectedPorts, commodities)
  const COLORS = ["#1a0069", "#00edc2", "#ffc658", "#ff8042", "#0088fe", "#00C49F"]



  return (
    <Card className="shadow-lg rounded-2xl overflow-hidden border-0">
      <CardHeader className="border-b bg-white flex flex-col sm:flex-row justify-between items-center">
          <CardTitle className="text-xl font-semibold">Szczegółowe dane</CardTitle>
          <span className="text-gray-500">{getPeriodInfo({ startDate, endDate, periodType })}</span>
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
                    {commodities.map((commodity, index) => (
                      <Bar key={commodity} dataKey={commodity} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                {selectedPorts.map((port) => (
                  <div key={port} className="border-b last:border-b-0">
                    <div className="p-4 bg-gray-50">
                      <h4 className="text-lg font-medium">{port}</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white hover:bg-white">
                          <TableHead className="w-[60%] font-medium text-gray-600">Grupa towarowa</TableHead>
                          <TableHead className="text-right font-medium text-gray-600">Wartość</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allCommodities.map((commodity) => {

                          const hasData = portData[port] && portData[port][commodity]

                          if (
                            !hasData ||
                            (!commodities.includes(commodity) &&
                              !["SUMA (TONY)", "KONTENERY (TEU)"].includes(commodity))
                          ) {
                            return null
                          }

                          return (
                            <TableRow key={`${port}-${commodity}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{commodity}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatNumber(portData[port][commodity].value)}
                                {portData[port][commodity].secondary && (
                                  <span className="text-gray-500 ml-2">
                                    ({formatNumber(portData[port][commodity].secondary)})
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
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
  )
}
