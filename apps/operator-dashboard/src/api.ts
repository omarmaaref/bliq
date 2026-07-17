import { ApiError, type ApiErrorBody, type Operator, type Vehicle } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = await res.json();
    } catch {
      // non-JSON response
    }
    throw new ApiError(
      body.message ?? `Request failed with status ${res.status}`,
      body.code ?? 'UNKNOWN_ERROR',
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listOperators: () => request<Operator[]>('/operators'),
  getOperator: (id: string) => request<Operator>(`/operators/${id}`),
  listVehicles: () => request<Vehicle[]>('/vehicles'),
  takeover: (operatorId: string, vehicleId: string) =>
    request<Vehicle>('/fleet-management/takeover', {
      method: 'POST',
      headers: { 'X-Operator-Id': operatorId },
      body: JSON.stringify({ vehicleId }),
    }),
  release: (operatorId: string, vehicleId: string) =>
    request<Vehicle>('/fleet-management/release', {
      method: 'POST',
      headers: { 'X-Operator-Id': operatorId },
      body: JSON.stringify({ vehicleId }),
    }),
};
