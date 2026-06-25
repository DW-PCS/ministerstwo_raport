'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PERIOD_TYPE_OPTIONS } from '@/constants';
import useRaportContext from '@/contexts/RaportContext';
import type { PeriodType } from '@/types';
import { CustomDatePicker } from './DatePicker';

const PeriodDates = () => {
  const {
    periodType,
    setPeriodType,
    periodYear,
    setPeriodYear,
    periodHalfYear,
    setPeriodHalfYear,
    periodQuarter,
    setPeriodQuarter,
    periodMonth,
    setPeriodMonth,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useRaportContext();

  const handleEndDateChange = (date?: Date) => {
    if (date && startDate && date < startDate) return;
    setEndDate(date);
  };

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date);
    if (date && endDate && date > endDate) setEndDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Typ okresu:</Label>
        <Select
          value={periodType}
          onValueChange={val => setPeriodType(val as PeriodType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz typ okresu" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodType !== 'PERIOD' && (
        <div className="space-y-2">
          <Label className="text-base">Rok:</Label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={periodYear}
            onChange={e => setPeriodYear(Number(e.target.value))}
          />
        </div>
      )}

      {periodType === 'HALF_YEAR' && (
        <div className="space-y-2">
          <Label className="text-base">Półrocze:</Label>
          <Select
            value={periodHalfYear?.toString() ?? ''}
            onValueChange={val => setPeriodHalfYear(Number(val) as 1 | 2)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz półrocze" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">I półrocze</SelectItem>
              <SelectItem value="2">II półrocze</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {periodType === 'QUARTER' && (
        <div className="space-y-2">
          <Label className="text-base">Kwartał:</Label>
          <Select
            value={periodQuarter?.toString() ?? ''}
            onValueChange={val => setPeriodQuarter(Number(val) as 1 | 2 | 3 | 4)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz kwartał" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">I kwartał</SelectItem>
              <SelectItem value="2">II kwartał</SelectItem>
              <SelectItem value="3">III kwartał</SelectItem>
              <SelectItem value="4">IV kwartał</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {periodType === 'MONTH' && (
        <div className="space-y-2">
          <Label className="text-base">Miesiąc:</Label>
          <Select
            value={periodMonth?.toString() ?? ''}
            onValueChange={val => setPeriodMonth(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz miesiąc" />
            </SelectTrigger>
            <SelectContent>
              {[
                'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
              ].map((name, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {periodType === 'PERIOD' && (
        <>
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
        </>
      )}
    </div>
  );
};

export default PeriodDates;
