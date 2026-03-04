import { Tooltip } from 'antd';
import { CustomDatePicker } from '@/components/selectors/DatePicker';
import { Label } from '@/components/ui/label';
import useRaportContext from '@/contexts/RaportContext';
const PeriodDates = () => {
  const { startDate, setEndDate, setStartDate, endDate } = useRaportContext();

  const handleEndDateChange = (date?: Date) => {
    if (date && startDate && date < startDate) {
      return;
    }
    setEndDate(date);
  };

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);
    if (date && endDate && date > endDate) {
      setEndDate(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Tooltip title="Wybierz początek analizowanego okresu">
          <Label htmlFor="start-date" className="text-base">
            Data początkowa:
          </Label>
        </Tooltip>
        <Tooltip title="Data od">
          <div>
            <CustomDatePicker
              date={startDate}
              setDate={handleStartDateChange}
              placeholder="Data początkowa"
            />
          </div>
        </Tooltip>
      </div>
      <div className="space-y-2">
        <Tooltip title="Wybierz koniec analizowanego okresu">
          <Label htmlFor="end-date" className="text-base">
            Data końcowa:
          </Label>
        </Tooltip>
        <Tooltip title="Data do">
          <div>
            <CustomDatePicker
              date={endDate}
              setDate={handleEndDateChange}
              placeholder="Data końcowa"
              minDate={startDate}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default PeriodDates;
