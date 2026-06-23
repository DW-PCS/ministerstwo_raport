import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'default',
  });

  if (response.status === 401) {
    cookieStore.delete('access_token');
    redirect('/?auth=required');
  }

  if (response.status === 403) {
    throw new Error('Brak dostępu do zasobu.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/users/login`, {
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
  return fetchApi('ReportMI/GetApplicationClients');
}

export async function getProductGroups(data: ReportRequestData) {
  return fetchApi('ReportMI/VproductGroup', {
    method: 'POST',
    body: data,
    cache: 'no-store',
  });
}

export async function getDspCargoType() {
  return fetchApi('ReportMI/GetDspCargoType');
}
