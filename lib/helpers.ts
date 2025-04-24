import { periodType } from '@/components/selectors';
import { portData } from '@/lib/constants';
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

export const generateChartData = (ports: string[], commodities: string[]) => {
  if (ports.length === 0 || commodities.length === 0) {
    return [];
  }
  return ports.map(port => {
    const data: Record<string, unknown> = { name: port };
    commodities.forEach(commodity => {
      if (portData[port] && portData[port][commodity]) {
        data[commodity] = portData[port][commodity].value;
      } else {
        data[commodity] = Math.floor(Math.random() * 1000) + 100;
      }
    });

    return data;
  });
};


export function getAppOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export function base64UrlEncode(buffer: ArrayBufferLike | Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, [...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
