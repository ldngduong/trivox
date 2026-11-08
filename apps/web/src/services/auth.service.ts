import type {
  AuthMeResponse,
  GoogleConfigResponse,
} from '../types/auth.types';
import type {
  LoginFormValues,
  RegisterFormValues,
} from '../schemas/auth.schema';
import { apiRequest } from './http.client';

export function getGoogleAuthConfig(): Promise<GoogleConfigResponse> {
  return apiRequest<GoogleConfigResponse>('/api/auth/google-config', {
    method: 'GET',
  });
}

export function loginWithCredentials(
  payload: LoginFormValues,
): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerWithCredentials(
  payload: RegisterFormValues,
): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginWithGoogleToken(
  credential: string,
): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export function fetchCurrentUser(): Promise<AuthMeResponse> {
  return apiRequest<AuthMeResponse>('/api/auth/me', {
    method: 'GET',
  });
}

export function logoutSession(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
}

export const authService = {
  getGoogleConfig: getGoogleAuthConfig,
  login: loginWithCredentials,
  register: registerWithCredentials,
  googleLogin: loginWithGoogleToken,
  getMe: fetchCurrentUser,
  logout: logoutSession,
};
