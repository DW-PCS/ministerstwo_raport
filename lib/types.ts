export interface AppClientsTypes {
  id: number;
  enabled: boolean;
  name: string;
  city: string;
  orgName: string;
}

export interface DspCargoTypeTypes {
  id: number;
  appClientId: number;
  cargoGroupCode: string;
  cargoSubGroupCode: string;
  code: string;
  description: string;
}

export interface DspPeriodTypes {
  year: number;
  halfYear?: number;
  quarter?: number;
  month?: number;
  startDate: Date | string;
  endDate: Date | string;
}

export interface DspRequestData {
  appClients: AppClientsTypes[];
  cargoTypes: DspCargoTypeTypes[];
  periodType: string;
  period: DspPeriodTypes;
}

export interface AuthUserPayload {
  name?: string;
  preferred_username?: string;
  [key: string]: unknown;
}
