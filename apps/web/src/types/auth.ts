export interface User {
  id: string;
  studentId?: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  profile: {
    id: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    major?: string;
    grade?: string;
    class?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterRequest {
  studentId: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface LoginRequest {
  username: string; // Supports username, email, or studentId
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}