'use client';

import { useAuth } from "@/contexts/AuthContext";


export const useApiService = () => {
  const { token, refreshToken }: { token: string | null; refreshToken: () => Promise<boolean> } = useAuth();

  const fetchWithToken = async (url: string, options: { headers?: Record<string, string>; method?: string; body?: string } = {}) => {

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }


    let response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await refreshToken();

      if (refreshed) {

        const newToken = sessionStorage.getItem('azure_token');
        headers['Authorization'] = `Bearer ${newToken}`;


        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  };

  interface FetchOptions {
    headers?: Record<string, string>;
    method?: string;
    body?: string;
  }

  interface ApiService {
    get: (url: string, options?: FetchOptions) => Promise<Response>;
    post: (url: string, data: unknown, options?: FetchOptions) => Promise<Response>;
    put: (url: string, data: unknown, options?: FetchOptions) => Promise<Response>;
    delete: (url: string, options?: FetchOptions) => Promise<Response>;
  }

  return {
    get: (url: string, options: FetchOptions = {}): Promise<Response> =>
      fetchWithToken(url, { ...options, method: 'GET' }),

    post: (url: string, data: unknown, options: FetchOptions = {}): Promise<Response> =>
      fetchWithToken(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),

    put: (url: string, data: unknown, options: FetchOptions = {}): Promise<Response> =>
      fetchWithToken(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (url: string, options: FetchOptions = {}): Promise<Response> =>
      fetchWithToken(url, {
        ...options,
        method: 'DELETE',
      }),
  } as ApiService;
};
