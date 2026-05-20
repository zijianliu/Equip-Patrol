import api from './api';
import { Device, ApiResponse, PaginatedResponse } from '../types';

export interface DeviceListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  status?: string;
  park?: string;
}

export interface DeviceFormData {
  code: string;
  name: string;
  park: string;
  building: string;
  floor: string;
  type: string;
  status: string;
}

export const deviceApi = {
  getList: (params: DeviceListParams) =>
    api.get<any, ApiResponse<PaginatedResponse<Device>>>('/devices', { params }),
  getDetail: (id: number) =>
    api.get<any, ApiResponse<Device>>(`/devices/${id}`),
  create: (data: DeviceFormData) =>
    api.post<any, ApiResponse<Device>>('/devices', data),
  update: (id: number, data: DeviceFormData) =>
    api.put<any, ApiResponse<Device>>(`/devices/${id}`, data),
  delete: (id: number) =>
    api.delete<any, ApiResponse>(`/devices/${id}`),
};
