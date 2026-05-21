import api from './api';
import { InspectionTask, ApiResponse, PaginatedResponse, CheckItemResult } from '../types';

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  planId?: number;
}

export interface CheckItem {
  name: string;
  result: CheckItemResult;
  remark?: string;
}

export interface SubmitTaskParams {
  checkItems: CheckItem[];
  remark?: string;
  images?: string[];
}

export const inspectionTaskApi = {
  getList: (params: TaskListParams) =>
    api.get<any, ApiResponse<PaginatedResponse<InspectionTask>>>('/inspection-tasks', { params }),
  getDetail: (id: number) =>
    api.get<any, ApiResponse<InspectionTask>>(`/inspection-tasks/${id}`),
  submit: (id: number, data: SubmitTaskParams) =>
    api.post<any, ApiResponse<InspectionTask>>(`/inspection-tasks/${id}/submit`, data),
};
