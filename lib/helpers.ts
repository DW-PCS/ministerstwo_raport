import { periodType } from '@/components/selectors';
import { DspCargoTypeTypes } from '@/lib/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { allCommoditiesMap } from './constants';

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
export const processRawData = (rawData: Array<{ port: string; kod: string; ilosc: number }>) => {
  const result: Record<string, { [key: string]: number }> = {};

  const portMapping = {
    'Port Morski Gdańsk': 'Gdańsk',
    'Port Morski Szczecin': 'Szczecin',
    'Port Morski Świnoujście': 'Świnoujście',
    'Port Morski Gdynia': 'Gdynia',
  };

  Object.values(portMapping).forEach(shortPortName => {
    result[shortPortName] = {};
  });

  rawData.forEach(item => {
    const portName = portMapping[item.port as keyof typeof portMapping] || item.port;
    const commodity = item.kod;
    const quantity = item.ilosc;
    if (!result[portName]) {
      result[portName] = {};
    }

    if (!result[portName][commodity]) {
      result[portName][commodity] = 0;
    }

    result[portName][commodity] += quantity;
  });

  return result;
};

export const generateChartData = ({
  ports,
  commodities,
  data,
  selectedCommodities,
}: {
  ports: string[];
  commodities: string[];
  data: { port: string; kod: string; ilosc: number }[];
  selectedCommodities: string[];
}) => {
  if (ports.length === 0 || commodities.length === 0 || !data || data.length === 0) {
    return [];
  }

  const processedData = processRawData(data);

  return ports.map(port => {
    const portData: { name: string; [key: string]: unknown } = { name: port };

    if (!processedData[port]) {
      console.warn(`Port ${port} not found in processed data`);
      return portData;
    }

    selectedCommodities?.forEach(commodity => {
      const commodityDisplayName = allCommoditiesMap[commodity] || commodity;
      if (processedData[port] && processedData[port][commodity] !== undefined) {
        portData[commodityDisplayName] = processedData[port][commodity];
      } else {
        portData[commodityDisplayName] = 0;
      }
    });

    return portData;
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
  return btoa(
    String.fromCharCode.apply(null, [
      ...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)),
    ])
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const extractUniqueCargoGroupCodes = (cargoData: DspCargoTypeTypes[]): string[] => {
  if (!Array.isArray(cargoData)) {
    return [];
  }

  const uniqueCargoGroupCodes = new Set<string>();

  cargoData.forEach(item => {
    if (item && item.cargoGroupCode) {
      uniqueCargoGroupCodes.add(item.cargoGroupCode);
    }
  });

  return [...uniqueCargoGroupCodes].sort();
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
