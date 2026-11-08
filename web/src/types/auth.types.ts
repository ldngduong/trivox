export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatarUrl: string | null;
  authProvider: 'local' | 'google';
}

export interface AuthMeResponse {
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setInitialized: (isInitialized: boolean) => void;
}
