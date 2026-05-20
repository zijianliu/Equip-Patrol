import { WorkOrderStatus, Role } from '../types/enums';
import prisma from '../lib/prisma';

function generateWorkOrderCode(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WO-${timestamp}-${random}`;
}

export async function createWorkOrderIfNeeded(task: any): Promise<void> {
  const existingOrder = await prisma.workOrder.findUnique({
    where: { taskId: task.id },
  });

  if (existingOrder) {
    return;
  }

  const abnormalItems = task.checkItems.filter((item: any) => item.result === 'ABNORMAL');
  const description = abnormalItems.map((item: any) => `${item.name}: ${item.remark || '异常'}`).join('; ');

  const maintenanceUser = await prisma.user.findFirst({
    where: { role: Role.MAINTENANCE },
    select: { id: true },
  });

  await prisma.workOrder.create({
    data: {
      code: generateWorkOrderCode(),
      deviceId: task.deviceId,
      taskId: task.id,
      description: description || '巡检发现异常',
      status: WorkOrderStatus.PENDING,
      assigneeId: maintenanceUser?.id || null,
    },
  });
}
