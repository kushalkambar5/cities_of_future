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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
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
