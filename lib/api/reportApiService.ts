import { cookies } from 'next/headers';
import { DspRequestData } from '../types';

const BASE_URL = 'https://pcscoreapi-h5hvg0dkdxcme7gh.polandcentral-01.azurewebsites.net';

async function fetchApi(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('azure_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}//${endpoint}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getApplicationClients() {
  return fetchApi('ReportMI/GetApplicationClients');
}

export async function getProductGroups(data: DspRequestData) {
  return fetchApi('ReportMI/VproductGroup', {
    method: 'GET',
    body: data,
  });
}

export async function getDspCargoType() {
  return fetchApi('ReportMI/GetDspCargoType');
}
