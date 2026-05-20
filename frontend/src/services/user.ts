import api from './api';
import { User, ApiResponse, Role } from '../types';

export const userApi = {
  getList: () => api.get<any, ApiResponse<User[]>>('/users'),
  getByRole: (role: Role) =>
    api.get<any, ApiResponse<User[]>>(`/users/by-role/${role}`),
};
