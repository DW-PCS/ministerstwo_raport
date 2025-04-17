import { portData } from "@/lib/constants"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { periodType } from "./types"
export const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}



  export const getPeriodInfo = ({startDate, endDate, periodType}: {startDate: Date | undefined, endDate:Date | undefined, periodType: periodType }) => {
    if (startDate && endDate) {
      return `${format(startDate, "yyyy-MM-dd", { locale: pl })} / ${format(endDate, "yyyy-MM-dd", { locale: pl })}`
    }
    return periodType.charAt(0).toUpperCase() + periodType.slice(1)
  }

  export const generateChartData = (ports: string[], commodities: string[]) => {
  if (ports.length === 0 || commodities.length === 0) {
    return []
  }
  return ports.map((port) => {
    const data: Record<string, unknown> = { name: port }
    commodities.forEach((commodity) => {
      if (portData[port] && portData[port][commodity]) {
        data[commodity] = portData[port][commodity].value
      } else {
        data[commodity] = Math.floor(Math.random() * 1000) + 100
      }
    })

    return data
  })
}
