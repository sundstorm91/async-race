import { ApiError } from "../types";

export abstract class BaseApi {
  constructor(
    protected baseUrl: string,
    protected defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    }
  ) {}

  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return '';

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const queryString = params ? this.buildQueryString(params) : '';
    return `${this.baseUrl}${endpoint}${queryString}`;
  }

  private createError(message: string, status: number, url: string): ApiError {
    return new ApiError(message, status, url);
  }

  private async handleResponse<T>(
  response: Response,
  readHeaders?: boolean
): Promise<T> {


  if (!response.ok) {
    throw this.createError('Request failed', response.status, response.url);
  }

  const data = await response.json();


  if (readHeaders) {
    const total = response.headers.get('X-Total-Count');


    const result = {
      cars: data,           // предполагаем что data массив
      total: Number(total)
    };
    return result as T;
  }

  console.log('📤 Returning raw data:', data);
  return data as T;
}

  private async request<T>(
    url: string,
    options: RequestInit & { readHeaders?: boolean } = {}
  ): Promise<T> {
    const { readHeaders, ...fetchOptions } = options;

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions.headers
      }
    });

    return this.handleResponse<T>(response, readHeaders);
  }

  protected async get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, {
      method: 'GET',
      readHeaders: true // ← ВАЖНО!
    });
  }

  protected async post<T>(
    endpoint: string,
    data: unknown,
    params?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
  }

  protected async put<T>(
    endpoint: string,
    data: Record<string, unknown>,
    params?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
  }

  protected async patch<T>(
    endpoint: string,
    params?: Record<string, unknown>,  // ← ПЕРВЫЙ!
    data?: Record<string, unknown>,    // ← ВТОРОЙ!
    headers?: Record<string, string>   // ← ТРЕТИЙ
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const options: RequestInit = { method: 'PATCH', headers };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(url, options);
  }

  protected async delete(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<void> {
    const url = this.buildUrl(endpoint, params);
    return this.request<void>(url, { method: 'DELETE' });
  }
}
