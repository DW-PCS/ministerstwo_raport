import { cookies } from 'next/headers';

const BASE_URL = 'http://74.248.33.80:8080';

export interface LoginResponse {
  access_token: string;
}

export interface ReportRequestData {
  AppClients: { Id: number; Name: string }[];
  CargoTypes: { CargoGroupCode: string }[];
  Period: {
    StartDate: string;
    EndDate: string;
  };
}

async function fetchApi(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    cache?: 'force-cache' | 'no-store' | 'default' | 'only-if-cached';
  } = {}
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'default',
  });

  if (response.status === 401) {
    return { status: 401, message: 'Unauthorized access. Please log in again.' };
  }
  if (response.status === 403) {
    return { status: 403, message: 'Forbidden access.' };
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const url = `${BASE_URL}/users/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Nieprawidłowe dane logowania');
  }
  return response.json();
}

export async function getApplicationClients() {
  const data = await fetchApi('ReportMI/GetApplicationClients');
  return data;
}

export async function getProductGroups(data: ReportRequestData) {
  const res = await fetchApi('ReportMI/VproductGroup', {
    method: 'POST',
    body: data,
    cache: 'no-store',
  });
  return res;
}

export async function getDspCargoType() {
  const data = await fetchApi('ReportMI/GetDspCargoType');
  return data;
}
