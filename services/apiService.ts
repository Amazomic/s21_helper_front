
import { AuthResponse, TelegramConfig, TelegramVisibility } from '../types';

const AUTH_ENDPOINT = '/auth-proxy/auth/realms/EduPowerKeycloak/protocol/openid-connect/token';
const API_BASE = '/api-proxy';

export const loginUser = async (username: string, password: string): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('client_id', 's21-open-api');
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const response = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Authentication failed');
  }
  return data;
};

export const refreshUserToken = async (refreshToken: string): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('client_id', 's21-open-api');
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Token refresh failed');
  }
  return data;
};

export const fetchData = async (endpoint: string, token: string, options: RequestInit = {}): Promise<any> => {
  const makeRequest = async (currentToken: string) => {
    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('s21_refresh_token');
    
    if (refreshToken) {
      try {
        const newAuthData = await refreshUserToken(refreshToken);
        
        localStorage.setItem('s21_auth_token', newAuthData.access_token);
        localStorage.setItem('s21_refresh_token', newAuthData.refresh_token);
        localStorage.setItem('s21_auth_token_timestamp', new Date().toISOString());

        window.dispatchEvent(new CustomEvent('s21:token_updated', { 
          detail: newAuthData.access_token 
        }));

        response = await makeRequest(newAuthData.access_token);
      } catch (refreshError) {
        console.error("Session refresh failed (Token Expired):", refreshError);
        window.dispatchEvent(new CustomEvent('s21:session_expired'));
        throw new Error('Session expired. Please login again.');
      }
    } else {
      window.dispatchEvent(new CustomEvent('s21:session_expired'));
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === '') return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

// --- Telegram Specific Endpoints (REAL IMPLEMENTATION) ---

const getTelegramInitData = () => {
  return window.Telegram?.WebApp?.initData || '';
};

export const fetchTelegramSettings = async (token: string): Promise<TelegramConfig> => {
  try {
    const initData = getTelegramInitData();
    // Pass initData in header for the backend to validate/identify the TG user
    const data = await fetchData('/v1/telegram/settings', token, {
      headers: {
        'x-telegram-init-data': initData
      }
    });
    
    // Backend returns: { linked: boolean, school_login?: string, visibility?: string }
    return {
      isLinked: data.linked,
      visibility: (data.visibility as TelegramVisibility) || 'private',
      // Since backend might not return telegram username, we try to grab it from WebApp if available
      telegramUsername: data.linked 
        ? (window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Linked') 
        : undefined,
      telegramId: data.linked
        ? window.Telegram?.WebApp?.initDataUnsafe?.user?.id
        : undefined
    };
  } catch (e: any) {
    // If endpoint returns 404, it likely means no config exists yet, return default "not linked"
    if (e.message && e.message.includes('404')) {
        return { isLinked: false, visibility: 'private' };
    }
    console.error("Failed to fetch telegram settings:", e);
    return { isLinked: false, visibility: 'private' };
  }
};

export const linkTelegramAccount = async (token: string, username?: string, password?: string): Promise<void> => {
  const initData = getTelegramInitData();
  
  // POST /link with body { username, password, initData }
  // Use explicit username/password if provided (during login flow)
  // Otherwise rely on the Bearer token (authenticated session) + initData if backend supports it
  const body: any = { initData };
  if (username) body.username = username;
  if (password) body.password = password;

  await fetchData('/v1/telegram/link', token, {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

export const updateTelegramVisibility = async (token: string, visibility: TelegramVisibility): Promise<TelegramConfig> => {
  const initData = getTelegramInitData();
  await fetchData('/v1/telegram/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ visibility, initData })
  });
  
  // Optimistically return updated config
  return { 
    isLinked: true, 
    visibility,
    telegramUsername: window.Telegram?.WebApp?.initDataUnsafe?.user?.username
  };
};

export const unlinkTelegramAccount = async (token: string): Promise<void> => {
  const initData = getTelegramInitData();
  await fetchData('/v1/telegram/link', token, {
    method: 'DELETE',
    body: JSON.stringify({ initData })
  });
};
