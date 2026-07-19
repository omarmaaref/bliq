import {
  ApiError,
  type ApiErrorBody,
  type Operator,
  type Vehicle,
} from './types';

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
      body.error ?? 'UNKNOWN_ERROR',
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listVehicles: () => request<Vehicle[]>('/vehicles'),
  listOperators: () => request<Operator[]>('/operators'),
  createVehicle: (name: string) =>
    request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  setConnectivity: (vehicleId: string, status: 'online' | 'offline') =>
    request<Vehicle>(`/vehicles/${vehicleId}/connectivity`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteVehicle: (vehicleId: string) =>
    request<void>(`/vehicles/${vehicleId}`, { method: 'DELETE' }),
};
