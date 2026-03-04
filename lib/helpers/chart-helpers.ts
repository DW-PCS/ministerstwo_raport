import { allCommoditiesMap } from '@/lib/constants';

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
