
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Authentication failed');
  return data;
};

export const refreshUserToken = async (refreshToken: string): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('client_id', 's21-open-api');
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const response = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Token refresh failed');
  return data;
};

// Generic fetch wrapper with Token Handling
export const fetchData = async (endpoint: string, token: string | null, options: RequestInit = {}): Promise<any> => {
  const makeRequest = async (currentToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  };

  let response = await makeRequest(token);

  if (response.status === 401) {
    // Attempt refresh logic
    const refreshToken = localStorage.getItem('s21_refresh_token');
    if (refreshToken) {
      try {
        const newAuthData = await refreshUserToken(refreshToken);
        localStorage.setItem('s21_auth_token', newAuthData.access_token);
        localStorage.setItem('s21_refresh_token', newAuthData.refresh_token);
        window.dispatchEvent(new CustomEvent('s21:token_updated', { detail: newAuthData.access_token }));
        response = await makeRequest(newAuthData.access_token);
      } catch (e) {
        window.dispatchEvent(new CustomEvent('s21:session_expired'));
        throw new Error('Session expired');
      }
    } else {
      window.dispatchEvent(new CustomEvent('s21:session_expired'));
      throw new Error('Session expired');
    }
  }

  // Backend returns 404 for "User not found in Redis" (Not Linked)
  if (response.status === 404 && endpoint.includes('/telegram/settings')) {
      return { linked: false }; 
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// --- Telegram Logic ---

export const fetchTelegramSettings = async (token: string | null): Promise<TelegramConfig> => {
  if (!token) return { isLinked: false, visibility: 'private' };

  try {
    // Only Token is needed to identify the user
    const data = await fetchData('/v1/telegram/settings', token);
    
    if (!data || !data.linked) {
        return { isLinked: false, visibility: 'private' };
    }

    return {
      isLinked: true,
      schoolLogin: data.school_login,
      visibility: (data.visibility as TelegramVisibility) || 'public',
      telegramUsername: data.telegram_username, 
      telegramId: data.telegram_id,    
      linkedAt: data.linked_at        
    };
  } catch (e) {
    console.warn("Fetch settings failed", e);
    return { isLinked: false, visibility: 'private' };
  }
};

export const linkTelegramAccount = async (schoolToken: string): Promise<void> => {
  // We send initData in the BODY so backend can extract telegram_id safely
  const initData = window.Telegram?.WebApp?.initData;
  if (!initData) return;

  await fetchData('/v1/telegram/link', schoolToken, {
    method: 'POST',
    body: JSON.stringify({ initData })
  });
};

export const updateTelegramVisibility = async (token: string, visibility: TelegramVisibility): Promise<TelegramConfig> => {
  await fetchData('/v1/telegram/settings', token, {
    method: 'PUT',
    body: JSON.stringify({ visibility })
  });
  
  return { isLinked: true, visibility };
};

export const unlinkTelegramAccount = async (token: string): Promise<void> => {
  await fetchData('/v1/telegram/link', token, { method: 'DELETE' });
};

export const getPeerTelegramInfo = async (login: string, token: string | null): Promise<PeerTelegramInfo> => {
  try {
    return await fetchData(`/v1/telegram/peer/${login}`, token);
  } catch (e) {
    return { found: false };
  }
};

export const fetchPeersList = async (token: string): Promise<{ school_login: string, visibility: string }[]> => {
  try {
    const data = await fetchData('/v1/telegram/peers', token);
    return data.peers || [];
  } catch (e) {
    console.error("Failed to fetch peers list", e);
    return [];
  }
};

export const notifyPeer = async (targetLogin: string, token: string | null): Promise<void> => {
  await fetchData('/v1/telegram/notify', token, {
    method: 'POST',
    body: JSON.stringify({ target_login: targetLogin })
  });
};
