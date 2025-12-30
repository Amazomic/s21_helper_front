
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

export const fetchData = async (endpoint: string, token: string): Promise<any> => {
  const makeRequest = async (currentToken: string) => {
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
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

// --- Telegram Specific Endpoints ---

export const fetchTelegramSettings = async (token: string): Promise<TelegramConfig> => {
  // Try to fetch real data from your backend
  try {
    const data = await fetchData('/v1/telegram/settings', token);
    return data;
  } catch (e) {
    // Fallback/Mock for UI development if backend endpoint isn't ready
    console.warn("Telegram settings endpoint not reachable, using mock data or cache");
    const cached = localStorage.getItem('s21_telegram_config');
    if (cached) return JSON.parse(cached);
    
    return {
      isLinked: false,
      visibility: 'private'
    };
  }
};

export const linkTelegramAccount = async (token: string, initData: string): Promise<TelegramConfig> => {
  // Send the Telegram WebApp initData string to backend to verify signature and link user
  // This simulates the POST request
  /*
  const response = await fetch(`${API_BASE}/v1/telegram/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }) 
  });
  return await response.json();
  */
  
  // MOCK simulation for UI
  return new Promise((resolve) => {
    setTimeout(() => {
        const mockConfig: TelegramConfig = {
            isLinked: true,
            telegramId: 12345678,
            telegramUsername: 'student_21',
            visibility: 'public'
        };
        localStorage.setItem('s21_telegram_config', JSON.stringify(mockConfig));
        resolve(mockConfig);
    }, 1000);
  });
};

export const updateTelegramVisibility = async (token: string, visibility: TelegramVisibility): Promise<TelegramConfig> => {
  // Simulates PUT request
  /*
  const response = await fetch(`${API_BASE}/v1/telegram/settings`, {
      method: 'PUT',
      headers: { ... },
      body: JSON.stringify({ visibility }) 
  });
  */

  // MOCK
  const current = JSON.parse(localStorage.getItem('s21_telegram_config') || '{}');
  const updated = { ...current, visibility };
  localStorage.setItem('s21_telegram_config', JSON.stringify(updated));
  return updated;
};

export const unlinkTelegramAccount = async (token: string): Promise<void> => {
   // Simulates DELETE
   localStorage.removeItem('s21_telegram_config');
};
