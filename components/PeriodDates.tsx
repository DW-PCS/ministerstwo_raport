import { CustomDatePicker } from "@/components/DatePicker";
import { Label } from "@/components/ui/label";
import useRaportContext from '@/contexts/useRaportContext';
const PeriodDates = () => {
  const { startDate, setEndDate, setStartDate, endDate, periodType } = useRaportContext()

    const handleEndDateChange = (date?: Date) => {
    if (date && startDate && date < startDate) {
      return;
    }
    setEndDate(date);
  }

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);
    if (date && endDate && date > endDate) {
      setEndDate(undefined);
    }
  }

  if (periodType !== 'konkretne') {
    return
  }

  return (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="start-date" className="text-base">
        Data początkowa:
      </Label>
      <CustomDatePicker
        date={startDate}
        setDate={handleStartDateChange}
        placeholder="Data początkowa"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="end-date" className="text-base">
        Data końcowa:
      </Label>
      <CustomDatePicker
        date={endDate}
        setDate={handleEndDateChange}
        placeholder="Data końcowa"
        minDate={startDate}
      />
    </div>
  </div>
  )
}

export default PeriodDates
