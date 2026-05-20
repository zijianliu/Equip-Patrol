import api from './api';
import { User, ApiResponse } from '../types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (params: LoginParams) =>
    api.post<any, ApiResponse<LoginResponse>>('/auth/login', params),
  getProfile: () => api.get<any, ApiResponse<User>>('/auth/profile'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
