export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatarUrl: string | null;
  authProvider: 'local' | 'google';
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}
