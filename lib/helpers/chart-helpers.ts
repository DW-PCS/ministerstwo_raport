export const processRawData = (rawData: Array<{ port: string; kod: string; ilosc: number }>) => {
  const result: Record<string, { [key: string]: number }> = {};

  rawData.forEach(item => {
    const portName = item.port;
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
    const portEntry: { name: string; [key: string]: unknown } = { name: port };

    selectedCommodities?.forEach(commodity => {
      portEntry[commodity] = processedData[port]?.[commodity] ?? 0;
    });

    return portEntry;
  });
};
