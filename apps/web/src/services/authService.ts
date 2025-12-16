import { apiService } from './api';

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

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface TokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AuthService {
  // Register a new user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>('/auth/register', userData);
      return response;
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data) {
        const apiError: ApiError = error.response.data;
        throw new Error(apiError.error.message || '注册失败');
      }
      throw new Error(error.message || '网络错误，请稍后重试');
    }
  }

  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      return response;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError: ApiError = error.response.data;
        throw new Error(apiError.error.message || '登录失败');
      }
      throw new Error(error.message || '网络错误，请稍后重试');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await apiService.post<TokenResponse>('/auth/refresh', { refreshToken });
      return response;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError: ApiError = error.response.data;
        throw new Error(apiError.error.message || '令牌刷新失败');
      }
      throw new Error(error.message || '网络错误，请稍后重试');
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await apiService.get<UserResponse>('/auth/me');
      return response;
    } catch (error: any) {
      if (error.response?.data) {
        const apiError: ApiError = error.response.data;
        throw new Error(apiError.error.message || '获取用户信息失败');
      }
      throw new Error(error.message || '网络错误，请稍后重试');
    }
  }

  // Helper method to get stored tokens
  getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  }

  // Helper method to store tokens
  storeTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  // Helper method to clear tokens
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
export default authService;