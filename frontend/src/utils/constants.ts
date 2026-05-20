import { DeviceStatus, PlanStatus, TaskStatus, WorkOrderStatus, CycleType, CheckItemResult, Role } from '../types';

export const STATUS_COLORS: Record<string, string> = {
  [DeviceStatus.NORMAL]: 'green',
  [DeviceStatus.FAULT]: 'red',
  [DeviceStatus.MAINTENANCE]: 'orange',
  [DeviceStatus.STOPPED]: 'default',
  [PlanStatus.ACTIVE]: 'green',
  [PlanStatus.INACTIVE]: 'default',
  [TaskStatus.PENDING]: 'orange',
  [TaskStatus.COMPLETED]: 'green',
  [TaskStatus.ABNORMAL]: 'red',
  [WorkOrderStatus.PENDING]: 'orange',
  [WorkOrderStatus.PROCESSING]: 'blue',
  [WorkOrderStatus.CLOSED]: 'default',
  [CheckItemResult.NORMAL]: 'green',
  [CheckItemResult.ABNORMAL]: 'red',
  [CheckItemResult.NOT_APPLICABLE]: 'default',
};

export const STATUS_LABELS: Record<string, string> = {
  [DeviceStatus.NORMAL]: '正常',
  [DeviceStatus.FAULT]: '故障',
  [DeviceStatus.MAINTENANCE]: '维修中',
  [DeviceStatus.STOPPED]: '停用',
  [PlanStatus.ACTIVE]: '启用',
  [PlanStatus.INACTIVE]: '停用',
  [TaskStatus.PENDING]: '待巡检',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.ABNORMAL]: '异常',
  [WorkOrderStatus.PENDING]: '待处理',
  [WorkOrderStatus.PROCESSING]: '处理中',
  [WorkOrderStatus.CLOSED]: '已关闭',
  [CheckItemResult.NORMAL]: '正常',
  [CheckItemResult.ABNORMAL]: '异常',
  [CheckItemResult.NOT_APPLICABLE]: '不适用',
  [CycleType.DAILY]: '每日',
  [CycleType.WEEKLY]: '每周',
  [CycleType.MONTHLY]: '每月',
  [Role.ADMIN]: '管理员',
  [Role.INSPECTOR]: '巡检员',
  [Role.MAINTENANCE]: '维修员',
  [Role.USER]: '普通用户',
};

export const CHECK_ITEMS = [
  { key: '外观检查', label: '外观检查' },
  { key: '运行状态', label: '运行状态' },
  { key: '温度状态', label: '温度状态' },
  { key: '噪音状态', label: '噪音状态' },
  { key: '安全隐患', label: '安全隐患' },
];
