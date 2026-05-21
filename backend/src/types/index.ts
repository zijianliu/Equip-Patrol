import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
