
import { AuthResponse, TelegramConfig, TelegramVisibility, PeerTelegramInfo } from '../types';

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

export const fetchData = async (endpoint: string, token: string | null, options: RequestInit = {}): Promise<any> => {
  const initData = window.Telegram?.WebApp?.initData || '';
  
  const makeRequest = async (currentToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    // Always attach Telegram Init Data if available for backend validation/proxying
    if (initData) {
      headers['x-telegram-init-data'] = initData;
    }

    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(token);

  // Global Interceptor Logic for 401
  if (response.status === 401) {
    // If we are relying solely on Telegram Init Data (no token), 401 means backend rejected InitData or session
    if (!token && initData) {
       console.log("Backend rejected Telegram Session (401)");
       throw new Error('Telegram Session Expired');
    }

    console.log("Token expired (401), trying refresh...");
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

        // Retry with new token
        response = await makeRequest(newAuthData.access_token);
      } catch (refreshError) {
        console.error("Refresh failed", refreshError);
        window.dispatchEvent(new CustomEvent('s21:session_expired'));
        throw new Error('Session expired');
      }
    } else {
      window.dispatchEvent(new CustomEvent('s21:session_expired'));
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error on ${endpoint}:`, response.status, errorText);
    throw new Error(`${response.status}: ${errorText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === '') return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

// --- Telegram Specific Endpoints ---

const getTelegramInitData = () => {
  return window.Telegram?.WebApp?.initData || '';
};

// Optional token, because we might call this with just InitData at app start
export const fetchTelegramSettings = async (token?: string | null): Promise<TelegramConfig> => {
  try {
    // Headers are handled in fetchData, including x-telegram-init-data
    const data = await fetchData('/v1/telegram/settings', token || null);
    
    return {
      isLinked: data.linked,
      schoolLogin: data.school_login,
      visibility: (data.visibility as TelegramVisibility) || 'private',
      telegramUsername: data.username, 
      telegramId: data.telegram_id,    
      linkedAt: data.created_at        
    };
  } catch (e: any) {
    // 404 means not linked
    if (e.message && e.message.includes('404')) {
        return { isLinked: false, visibility: 'private' };
    }
    console.error("Failed to fetch telegram settings:", e);
    return { isLinked: false, visibility: 'private' };
  }
};

// We pass schoolToken in body, but keep Auth header NULL to prevent conflict.
// fetchData will attach x-telegram-init-data automatically.
export const linkTelegramAccount = async (schoolToken: string): Promise<void> => {
  await fetchData('/v1/telegram/link', null, {
    method: 'POST',
    body: JSON.stringify({ 
      school_token: schoolToken 
    })
  });
};

export const updateTelegramVisibility = async (token: string, visibility: TelegramVisibility): Promise<TelegramConfig> => {
  await fetchData('/v1/telegram/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ visibility })
  });
  
  return { 
    isLinked: true, 
    visibility,
    telegramUsername: window.Telegram?.WebApp?.initDataUnsafe?.user?.username
  };
};

export const unlinkTelegramAccount = async (token: string): Promise<void> => {
  await fetchData('/v1/telegram/link', token, {
    method: 'DELETE'
  });
};

// --- Peer Interaction ---

export const getPeerTelegramInfo = async (login: string, token: string | null): Promise<PeerTelegramInfo> => {
  try {
    return await fetchData(`/v1/telegram/peer/${login}`, token);
  } catch (e) {
    console.error(`Failed to fetch peer info for ${login}`, e);
    return { found: false };
  }
};

export const notifyPeer = async (targetLogin: string, token: string | null): Promise<void> => {
  await fetchData('/v1/telegram/notify', token, {
    method: 'POST',
    body: JSON.stringify({ target_login: targetLogin })
  });
};
