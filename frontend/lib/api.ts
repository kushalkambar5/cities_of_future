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

export interface SimulationVideoFile {
  id: number;
  fileName: string;
  r2Key: string;
  publicUrl: string;
  cameraId?: string;
  simulationId?: number;
  status: string;
  createdAt: string;
}

export interface SimulationProcessResponse {
  success: boolean;
  message: string;
  mlOutput: {
    totalFrames: number;
    durationSeconds: number;
    outputVideoR2Key: string;
    outputVideoUrl: string;
    annotatedMediaUrl: string;
    accidentOverall: {
      accident_detected: boolean;
      status: string;
      confidence: number;
    };
    totalVehiclesDetected: number;
    vehicles: any[];
    detectedTimestamps: Record<string, number[]>;
  };
  enforcement: {
    totalViolations: number;
    fines: Array<{
      challanNumber: string;
      violationId: number;
      plateNumber: string;
      ownerName: string;
      ownerPhone: string;
      violationType: string;
      fineAmount: number;
      pdfUrl?: string;
      pdfKey?: string;
      whatsappStatus: {
        textMessage: { success: boolean; messageId?: string; error?: string };
        documentMessage: { success: boolean; messageId?: string; error?: string };
      };
    }>;
  };
}

export interface SimulationCameraItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speedLimit: number;
  status: string;
  assignedVideo?: {
    id: number;
    fileName: string;
    filePath: string;
    status: string;
    createdAt?: string;
  } | null;
  suggestedPath?: string;
}

export async function getSimulationCamerasApi(): Promise<{
  success: boolean;
  cameras: SimulationCameraItem[];
}> {
  return apiRequest<{ success: boolean; cameras: SimulationCameraItem[] }>(
    '/simulation/cameras',
    { method: 'GET' }
  );
}

export async function assignCameraVideoApi(payload: {
  cameraId: string;
  filePath: string;
  fileName?: string;
}): Promise<{ success: boolean; message: string; existsOnDisk: boolean; video: any }> {
  return apiRequest<{ success: boolean; message: string; existsOnDisk: boolean; video: any }>(
    '/simulation/assign-video',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function runSimulationApi(payload: {
  cameraId?: string;
  filePath: string;
  speedLimit?: number;
  expectedDirection?: number;
  videoFileId?: number;
}): Promise<SimulationProcessResponse> {
  return apiRequest<SimulationProcessResponse>('/simulation/process', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface ViolationItem {
  id: number;
  challanNumber: string;
  violationType: 'RED_LIGHT' | 'OVERSPEED' | 'WRONG_SIDE' | 'NO_HELMET';
  violationStatus: 'DETECTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'FINE_ISSUED' | string;
  nanoAuditReason?: string;
  description?: string;
  confidence: number;
  simulationTimeMs: number;
  createdAt: string;
  camera: {
    id: string;
    name: string;
    speedLimit: number;
  };
  vehicle: {
    id: number;
    plateNumber: string;
    vehicleType: string;
  };
  owner: {
    id: number | null;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  fine: {
    id: number;
    amount: number;
    status: 'UNPAID' | 'PAID' | 'CANCELLED';
    pdfR2Key?: string;
    pdfUrl?: string | null;
    issuedAt: string;
    paidAt?: string | null;
  } | null;
  evidence: {
    videoR2Key?: string | null;
    videoUrl?: string | null;
  };
  notification: {
    status: string;
    sentAt?: string | null;
  };
}

export async function getViolationsApi(params?: {
  userId?: number;
  status?: string;
  violationStatus?: string;
  type?: string;
  search?: string;
}): Promise<{ success: boolean; count: number; violations: ViolationItem[] }> {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', String(params.userId));
  if (params?.status) query.set('status', params.status);
  if (params?.violationStatus) query.set('violationStatus', params.violationStatus);
  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);

  const qs = query.toString();
  return apiRequest<{ success: boolean; count: number; violations: ViolationItem[] }>(
    `/violations${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  );
}

export async function verifyViolationWithNanoApi(violationId: number): Promise<{
  success: boolean;
  message: string;
  violationId: number;
  status: 'VERIFIED' | 'REJECTED';
  audit: {
    verified: boolean;
    confidence: number;
    reason: string;
    model: string;
  };
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    violationId: number;
    status: 'VERIFIED' | 'REJECTED';
    audit: {
      verified: boolean;
      confidence: number;
      reason: string;
      model: string;
    };
  }>(`/violations/${violationId}/verify-nano`, { method: 'POST' });
}

export async function verifyAllPendingWithNanoApi(): Promise<{
  success: boolean;
  message: string;
  total: number;
  verifiedCount: number;
  rejectedCount: number;
  results: any[];
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    total: number;
    verifiedCount: number;
    rejectedCount: number;
    results: any[];
  }>('/violations/verify-all-nano', { method: 'POST' });
}

export async function payFineApi(fineId: number): Promise<{
  success: boolean;
  message: string;
  fine: { id: number; status: string; paidAt: string };
  violation?: { id: number; status: string };
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    fine: { id: number; status: string; paidAt: string };
    violation?: { id: number; status: string };
  }>(`/fines/${fineId}/pay`, {
    method: 'POST',
  });
}

// ----------------- Chatbot (OpenAI Agent SDK) API -----------------
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  chats: Array<{
    chat_text: string;
    created_at: string;
    created_by: 'user' | 'ai';
  }>;
  chatSummary: string | null;
  agent?: {
    name: string;
    model: string;
  };
}

export interface ChatSendResponse {
  success: boolean;
  message: {
    role: 'assistant';
    content: string;
  };
  agent: {
    name: string;
    model: string;
    role: string;
  };
  chats: Array<{
    chat_text: string;
    created_at: string;
    created_by: 'user' | 'ai';
  }>;
  chatSummary: string | null;
}

export async function getChatStatusApi(): Promise<{
  success: boolean;
  sdk: string;
  model: string;
  provider: string;
}> {
  return apiRequest<{
    success: boolean;
    sdk: string;
    model: string;
    provider: string;
  }>('/chat/status', { method: 'GET' });
}

export async function getChatHistoryApi(userId?: number): Promise<ChatHistoryResponse> {
  const query = userId ? `?userId=${userId}` : '';
  return apiRequest<ChatHistoryResponse>(`/chat/history${query}`, { method: 'GET' });
}

export async function deleteChatHistoryApi(userId?: number): Promise<{ success: boolean; message: string }> {
  const query = userId ? `?userId=${userId}` : '';
  return apiRequest<{ success: boolean; message: string }>(`/chat/history${query}`, { method: 'DELETE' });
}

export async function sendChatMessageApi(payload: {
  message: string;
  history?: Array<{ role: string; content: string }>;
  role?: 'CITIZEN' | 'POLICE' | 'ADMIN';
  userId?: number;
}): Promise<ChatSendResponse> {
  return apiRequest<ChatSendResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

