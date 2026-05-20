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
