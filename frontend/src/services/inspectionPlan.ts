import api from './api';
import { InspectionPlan, ApiResponse, PaginatedResponse } from '../types';

export interface PlanListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface PlanFormData {
  name: string;
  cycle: string;
  startTime: string;
  endTime: string;
  deviceIds: number[];
  ownerId: number;
  status?: string;
}

export const inspectionPlanApi = {
  getList: (params: PlanListParams) =>
    api.get<any, ApiResponse<PaginatedResponse<InspectionPlan>>>('/inspection-plans', { params }),
  getDetail: (id: number) =>
    api.get<any, ApiResponse<InspectionPlan>>(`/inspection-plans/${id}`),
  create: (data: PlanFormData) =>
    api.post<any, ApiResponse<InspectionPlan>>('/inspection-plans', data),
  update: (id: number, data: PlanFormData) =>
    api.put<any, ApiResponse<InspectionPlan>>(`/inspection-plans/${id}`, data),
  toggleStatus: (id: number) =>
    api.post<any, ApiResponse<InspectionPlan>>(`/inspection-plans/${id}/toggle-status`),
  delete: (id: number) =>
    api.delete<any, ApiResponse>(`/inspection-plans/${id}`),
};
