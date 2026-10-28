const API_BASE = '/api';

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${url.startsWith('/') ? '' : '/'}${url}`;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('syswind_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('syswind_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('syswind_token');
  localStorage.removeItem('syswind_user');
};

export const getStoredUser = () => {
  const user = localStorage.getItem('syswind_user');
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: any) => {
  localStorage.setItem('syswind_user', JSON.stringify(user));
};

export const hasPermission = (permissionCode: string, user?: any): boolean => {
  const currentUser = user || getStoredUser();
  if (!currentUser) return false;

  // Super sysadmin has global superuser privileges across all organizations
  if (currentUser.role === 'SYSADMIN') return true;

  // Organization creation is strictly restricted to SYSADMIN only
  if (permissionCode === 'org:create' || permissionCode === 'organization:create') {
    return false;
  }

  // Organization admin has operational privileges within their organization
  if (currentUser.role === 'ADMIN') return true;

  // For all other roles / custom roles, strictly check the permissions list assigned to this role
  if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
    return currentUser.permissions.includes(permissionCode);
  }

  return false;
};

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
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
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export function formatMMK(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 Ks';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 Ks';
  return num.toLocaleString('en-US') + ' Ks';
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
