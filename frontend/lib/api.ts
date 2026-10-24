const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'CITIZEN' | 'POLICE' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface TrafficLight {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speedLimit: number;
  trafficLightId?: string | null;
  trafficLightName?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt?: string;
  updatedAt?: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('navanagar_token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('navanagar_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('navanagar_token', token);
  localStorage.setItem('navanagar_user', JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('navanagar_token');
  localStorage.removeItem('navanagar_user');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText || 'Not Found'}`);
    }
    data = rawText;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function signUpApi(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'CITIZEN' | 'POLICE' | 'ADMIN';
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signInApi(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfileApi(): Promise<{ success: boolean; data: { user: User } }> {
  return apiRequest<{ success: boolean; data: { user: User } }>('/auth/me', {
    method: 'GET',
  });
}

export async function updateProfileApi(payload: {
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; data: { user: User } }> {
  return apiRequest<{ success: boolean; data: { user: User } }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Traffic Lights API
// ---------------------------------------------------------------------------

export async function getTrafficLightsApi(): Promise<{
  success: boolean;
  count: number;
  data: TrafficLight[];
}> {
  return apiRequest<{ success: boolean; count: number; data: TrafficLight[] }>(
    '/traffic-lights',
    { method: 'GET' }
  );
}

export async function createTrafficLightApi(payload: {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
}): Promise<{ success: boolean; message: string; data: TrafficLight }> {
  return apiRequest<{ success: boolean; message: string; data: TrafficLight }>(
    '/traffic-lights',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteTrafficLightApi(
  id: string
): Promise<{ success: boolean; message: string; data: TrafficLight }> {
  return apiRequest<{ success: boolean; message: string; data: TrafficLight }>(
    `/traffic-lights/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

// ---------------------------------------------------------------------------
// Cameras API
// ---------------------------------------------------------------------------

export async function getCamerasApi(): Promise<{
  success: boolean;
  count: number;
  data: Camera[];
}> {
  return apiRequest<{ success: boolean; count: number; data: Camera[] }>(
    '/cameras',
    { method: 'GET' }
  );
}

export async function createCameraApi(payload: {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  speedLimit?: number;
  trafficLightId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}): Promise<{ success: boolean; message: string; data: Camera }> {
  return apiRequest<{ success: boolean; message: string; data: Camera }>(
    '/cameras',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteCameraApi(
  id: string
): Promise<{ success: boolean; message: string; data: Camera }> {
  return apiRequest<{ success: boolean; message: string; data: Camera }>(
    `/cameras/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}
