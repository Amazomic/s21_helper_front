
export interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  not_before_policy: number;
  session_state: string;
  scope: string;
  error?: string;
  error_description?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface UserState {
  username: string;
  token: string | null;
}

export type TelegramVisibility = 'public' | 'request_only' | 'private';

export interface TelegramConfig {
  isLinked: boolean;
  telegramId?: number;
  telegramUsername?: string;
  schoolLogin?: string;
  visibility: TelegramVisibility;
  linkedAt?: string;
}
