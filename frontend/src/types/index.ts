export enum Role {
  ADMIN = 'ADMIN',
  INSPECTOR = 'INSPECTOR',
  MAINTENANCE = 'MAINTENANCE',
  USER = 'USER',
}

export enum DeviceStatus {
  NORMAL = 'NORMAL',
  FAULT = 'FAULT',
  MAINTENANCE = 'MAINTENANCE',
  STOPPED = 'STOPPED',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CycleType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ABNORMAL = 'ABNORMAL',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CLOSED = 'CLOSED',
}

export enum CheckItemResult {
  NORMAL = 'NORMAL',
  ABNORMAL = 'ABNORMAL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Device {
  id: number;
  code: string;
  name: string;
  park: string;
  building: string;
  floor: string;
  type: string;
  status: DeviceStatus;
  lastInspectedAt?: string;
  createdAt: string;
  updatedAt: string;
  inspectionTasks?: InspectionTask[];
  workOrders?: WorkOrder[];
}

export interface InspectionPlan {
  id: number;
  name: string;
  cycle: CycleType;
  startTime: string;
  endTime: string;
  status: PlanStatus;
  ownerId: number;
  owner: User;
  createdAt: string;
  updatedAt: string;
  devices: { device: Device }[];
  tasks?: InspectionTask[];
  _count?: { tasks: number };
}

export interface InspectionTask {
  id: number;
  code: string;
  planId: number;
  plan: { id: number; name: string };
  deviceId: number;
  device: Device;
  assigneeId: number;
  assignee: User;
  scheduledAt: string;
  completedAt?: string;
  status: TaskStatus;
  remark?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  checkItems?: InspectionCheckItem[];
  workOrder?: WorkOrder;
}

export interface InspectionCheckItem {
  id: number;
  taskId: number;
  name: string;
  result: CheckItemResult;
  remark?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: number;
  code: string;
  deviceId: number;
  device: Device;
  taskId: number;
  task: InspectionTask;
  description: string;
  status: WorkOrderStatus;
  assigneeId?: number;
  assignee?: User;
  handleRemark?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
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
