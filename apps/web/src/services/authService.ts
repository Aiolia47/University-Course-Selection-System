import { apiService } from './api';

export interface RegisterRequest {
  studentId: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      studentId: string;
      username: string;
      email: string;
      role: string;
      status: string;
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
    };
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

  // TODO: Add more auth methods
  // async login(credentials: LoginRequest): Promise<LoginResponse> { ... }
  // async logout(): Promise<void> { ... }
  // async refreshToken(): Promise<TokenResponse> { ... }
  // async getCurrentUser(): Promise<UserResponse> { ... }
}

export const authService = new AuthService();
export default authService;