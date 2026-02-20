export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  token: string;
}

export interface DecodedToken {
  email: string;
  full_name: string;
  role_id: number;
  exp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  token: string | null;
}
