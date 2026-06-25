'use server';

import {
  getApplicationClients,
  getDspCargoType,
  getProductGroups,
  ReportRequestData,
} from '@/lib/api/reportApiService';
import type { AppClientsTypes, CargoTypeItem, PeriodRequest } from '@/types';

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

export async function fetchCargoTypesAction(): Promise<CargoTypeItem[]> {
  const data = await getDspCargoType();
  if (!Array.isArray(data)) return [];
  return (
    data as {
      Id: number;
      AppClientId: number;
      CargoGroupCode: string;
      CargoSubGroupCode: string | null;
      Code: string;
      Description: string | null;
    }[]
  ).map(item => ({
    id: item.Id,
    appClientId: item.AppClientId,
    cargoGroupCode: item.CargoGroupCode,
    cargoSubGroupCode: item.CargoSubGroupCode,
    code: item.Code,
    description: item.Description,
  }));
}

export async function fetchReportDataAction(
  appClients: AppClientsTypes[],
  cargoTypes: CargoTypeItem[],
  period: PeriodRequest
): Promise<ReportRow[]> {
  const requestData: ReportRequestData = {
    AppClients: appClients.map(c => ({
      Id: c.id,
      Enabled: c.enabled,
      Name: c.name,
      City: c.city,
      OrgName: c.orgName,
    })),
    CargoTypes: cargoTypes.map(c => ({
      Id: c.id,
      AppClientId: c.appClientId,
      CargoGroupCode: c.cargoGroupCode,
      CargoSubGroupCode: c.cargoSubGroupCode,
      Code: c.code,
      Description: c.description,
    })),
    Periods: [period],
  };

  const data = await getProductGroups(requestData);

  if (!Array.isArray(data) || data.length === 0) return [];

  const rows: {
    Port: string;
    Kod?: string;
    Grupa?: string;
    Ilosc: number;
    TransshipmentReportDate?: string;
  }[] = data[0].productGroupReportRows ?? [];

  return rows.map(item => ({
    port: item.Port,
    kod: item.Kod ?? item.Grupa ?? '',
    ilosc: Number(item.Ilosc),
    reportDate: item.TransshipmentReportDate,
  }));
}
