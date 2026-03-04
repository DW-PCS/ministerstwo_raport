import { periodType } from '@/components/selectors';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const getPeriodInfo = ({
  startDate,
  endDate,
  periodType,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  periodType: periodType;
}) => {
  if (startDate && endDate) {
    return `${format(startDate, 'yyyy-MM-dd', { locale: pl })} / ${format(endDate, 'yyyy-MM-dd', {
      locale: pl,
    })}`;
  }
  return periodType.charAt(0).toUpperCase() + periodType.slice(1);
};

export function formatDate(dateString: string, label?: string): string {
  const actualDateStr = dateString.replace(/\s+'[^']+'$/, '').trim();

  const date = new Date(actualDateStr);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

  return label ? `${label}: '${formattedDate}'` : formattedDate;
}

export function normalizePolishText(value: string): string {
  const looksMojibake = /[ÃÅÂÄ]/.test(value);
  if (!looksMojibake) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}
