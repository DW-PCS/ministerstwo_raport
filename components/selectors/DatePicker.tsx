'use client';
import { pl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function CustomDatePicker({
  date,
  setDate,
  placeholder = 'Wybierz datę',
  minDate,
  maxDate,
}: CustomDatePickerProps) {
  return (
    <div className="relative w-full">
      <DatePicker
        selected={date}
        onChange={(date: Date | null) => setDate(date ?? undefined)}
        locale={pl}
        dateFormat="dd.MM.yyyy"
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  );
}
