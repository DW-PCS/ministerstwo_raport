import useRaportContext from '@/contexts/RaportContext';
import { AppClientsTypes, DspCargoTypeTypes } from '@/lib/types';
import { redirect } from 'next/navigation';
import { useState } from 'react';

interface UseReportDataProps {
  ports: AppClientsTypes[];
  commodityGroups: DspCargoTypeTypes[];
}

const useReportData = ({ ports, commodityGroups }: UseReportDataProps) => {
  const { selectedCommodities, selectedPorts } = useRaportContext();

  const [data, setData] = useState([]);

  const dataPorts = ports.filter(
    (port: AppClientsTypes) => selectedPorts.includes(port.city) && port.enabled
  );

  const dataCommodities = commodityGroups.filter((commodity: DspCargoTypeTypes) => {
    return selectedCommodities.includes(commodity.cargoGroupCode);
  });

  const getTokenFromSession = () => {
    try {
      const token = sessionStorage.getItem('azure_token');
      return token;
    } catch (error) {
      console.error('Error retrieving token from session storage:', error);
      return null;
    }
  };

  async function fetchProductGroupData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const apiUrl = 'ReportMI/VproductGroup';
    const token = getTokenFromSession();

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appClients: dataPorts.map(element => ({
            id: element.id,
            enabled: element.enabled,
            name: element.name,
            city: element.city,
            orgName: element.orgName,
          })),

          cargoTypes: dataCommodities.map(element => ({
            id: 0,
            appClientId: 0,
            cargoGroupCode: 'string',
            cargoSubGroupCode: 'string',
            code: 'string',
            description: element.description,
          })),
          periodType: 'string',
          period: {
            year: 0,
            halfYear: 0,
            quarter: 0,
            month: 0,
            // startDate: startDate ? formatDate(startDate.toISOString()) : '',
            startDate: '2023-01-01T00:00:00',
            // endDate: endDate ? formatDate(endDate.toISOString()) : '',
            endDate: '2023-09-15T00:00:00',
          },
        }),
      });

      if (response.status === 401 || response.status === 403) {
        return redirect('/login');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const res = await response.json();
      const data = await res;
      setData(data);
      return data;
    } catch (error) {
      console.error('Error fetching product group data:', error);
      throw error;
    }
  }
  return { data, fetchProductGroupData, getTokenFromSession };
};

export default useReportData;
