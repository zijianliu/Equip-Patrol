import api from './api';
import { WorkOrder, ApiResponse, PaginatedResponse } from '../types';

export interface WorkOrderListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface UpdateWorkOrderParams {
  status: string;
  handleRemark?: string;
  assigneeId?: number;
}

export const workOrderApi = {
  getList: (params: WorkOrderListParams) =>
    api.get<any, ApiResponse<PaginatedResponse<WorkOrder>>>('/work-orders', { params }),
  getDetail: (id: number) =>
    api.get<any, ApiResponse<WorkOrder>>(`/work-orders/${id}`),
  update: (id: number, data: UpdateWorkOrderParams) =>
    api.put<any, ApiResponse<WorkOrder>>(`/work-orders/${id}`, data),
};
