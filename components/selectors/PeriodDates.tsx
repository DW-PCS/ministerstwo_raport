'use client';

import TestDataBanner from '@/components/ui/TestDataBanner';
import { TEST_DATA_END, TEST_DATA_START } from '@/constants';
import useRaportContext from '@/contexts/RaportContext';
import { Label } from '@/components/ui/label';
import { CustomDatePicker } from './DatePicker';

const PeriodDates = () => {
  const { startDate, setStartDate, endDate, setEndDate } = useRaportContext();

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);
    if (date && endDate && date > endDate) setEndDate(undefined);
  };

  const handleEndDateChange = (date?: Date) => {
    if (date && startDate && date < startDate) return;
    setEndDate(date);
  };

  const showBanner =
    (startDate !== undefined && (startDate < TEST_DATA_START || startDate > TEST_DATA_END)) ||
    (endDate !== undefined && (endDate > TEST_DATA_END || endDate < TEST_DATA_START));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Data początkowa:</Label>
        <CustomDatePicker
          date={startDate}
          setDate={handleStartDateChange}
          placeholder="Data początkowa"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-base">Data końcowa:</Label>
        <CustomDatePicker
          date={endDate}
          setDate={handleEndDateChange}
          placeholder="Data końcowa"
          minDate={startDate}
        />
      </div>
      {showBanner && <TestDataBanner />}
    </div>
  );
};

export default PeriodDates;
