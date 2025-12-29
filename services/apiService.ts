
import { AuthResponse } from '../types';

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

  // Handle 401 Unauthorized by attempting to refresh the token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('s21_refresh_token');
    
    if (refreshToken) {
      try {
        // Attempt to get a new token
        const newAuthData = await refreshUserToken(refreshToken);
        
        // Update local storage
        localStorage.setItem('s21_auth_token', newAuthData.access_token);
        localStorage.setItem('s21_refresh_token', newAuthData.refresh_token);
        localStorage.setItem('s21_auth_token_timestamp', new Date().toISOString());

        // Dispatch event so App.tsx can update its state
        window.dispatchEvent(new CustomEvent('s21:token_updated', { 
          detail: newAuthData.access_token 
        }));

        // Retry the original request with the new token
        response = await makeRequest(newAuthData.access_token);
      } catch (refreshError) {
        console.error("Session refresh failed (Token Expired):", refreshError);
        
        // CRITICAL FIX: If refresh fails, the session is dead. Force logout.
        window.dispatchEvent(new CustomEvent('s21:session_expired'));
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // No refresh token available, session is dead
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
