import { cookies } from 'next/headers';
import { DspRequestData } from '../types';
const BASE_URL = 'https://pcscoreapi-h5hvg0dkdxcme7gh.polandcentral-01.azurewebsites.net';

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
    cache: options.cache ? options.cache : 'default',
  });
  if (response.status === 401) {
    return {
      status: 401,
      message: 'Unauthorized access. Please log in again.',
    };
  }
  if (response.status === 403) {
    return {
      status: 403,
      message: 'Forbidden access. You do not have permission to access this resource.',
    };
  }

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
    cache: 'no-store',
  });
}

export async function getDspCargoType() {
  return fetchApi('ReportMI/GetDspCargoType');
}
