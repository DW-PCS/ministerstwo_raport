'use server';

import {
  getApplicationClients,
  getDspCargoType,
  getProductGroups,
  ReportRequestData,
} from '@/lib/api/reportApiService';
import { AppClientsTypes } from '@/lib/types';

export interface ReportRow {
  port: string;
  kod: string;
  ilosc: number;
  reportDate?: string;
}

export async function fetchPortsAction(): Promise<AppClientsTypes[]> {
  const data = await getApplicationClients();
  if (!Array.isArray(data)) return [];
  return data.map(
    (item: { Id: number; Enabled: boolean; Name: string; City: string; OrgName: string }) => ({
      id: item.Id,
      enabled: item.Enabled,
      name: item.Name,
      city: item.City,
      orgName: item.OrgName,
    })
  );
}

export async function fetchCargoTypesAction(): Promise<string[]> {
  const data = await getDspCargoType();
  if (!Array.isArray(data)) return [];
  const unique = new Set<string>(
    (data as { CargoGroupCode: string }[]).map(item => item.CargoGroupCode)
  );
  return Array.from(unique);
}

export async function fetchReportDataAction(
  appClients: AppClientsTypes[],
  cargoTypes: string[],
  startDate: string,
  endDate: string
): Promise<ReportRow[]> {
  const requestData: ReportRequestData = {
    AppClients: appClients.map(c => ({ Id: c.id, Name: c.name })),
    CargoTypes: cargoTypes.map(code => ({ CargoGroupCode: code })),
    Period: { StartDate: startDate, EndDate: endDate },
  };

  const data = await getProductGroups(requestData);

  if (!Array.isArray(data)) return [];

  return data.map(
    (item: {
      Port: string;
      Kod?: string;
      Grupa?: string;
      Ilosc: number;
      TransshipmentReportDate?: string;
    }) => ({
      port: item.Port,
      kod: item.Kod ?? item.Grupa ?? '',
      ilosc: Number(item.Ilosc),
      reportDate: item.TransshipmentReportDate,
    })
  );
}
