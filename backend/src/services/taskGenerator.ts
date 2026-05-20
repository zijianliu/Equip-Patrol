import { CycleType, TaskStatus } from '../types/enums';
import prisma from '../lib/prisma';

function generateTaskCode(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TASK-${timestamp}-${random}`;
}

function getNextScheduledTime(cycle: CycleType, baseDate: Date = new Date()): Date {
  const next = new Date(baseDate);
  switch (cycle) {
    case CycleType.DAILY:
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      break;
    case CycleType.WEEKLY:
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      break;
    case CycleType.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      next.setHours(9, 0, 0, 0);
      break;
  }
  return next;
}

export async function generateTasksForPlan(plan: any): Promise<void> {
  if (!plan.devices || plan.devices.length === 0) return;

  const existingTasks = await prisma.inspectionTask.findMany({
    where: {
      planId: plan.id,
      status: TaskStatus.PENDING,
    },
    select: { deviceId: true },
  });

  const existingDeviceIds = new Set(existingTasks.map(t => t.deviceId));
  const scheduledAt = getNextScheduledTime(plan.cycle as CycleType);

  const tasksToCreate = plan.devices
    .filter((pd: any) => !existingDeviceIds.has(pd.deviceId))
    .map((pd: any) => ({
      code: generateTaskCode(),
      planId: plan.id,
      deviceId: pd.deviceId,
      assigneeId: plan.ownerId,
      scheduledAt,
      status: TaskStatus.PENDING,
    }));

  if (tasksToCreate.length > 0) {
    await prisma.inspectionTask.createMany({ data: tasksToCreate });
  }
}

export async function generateAllDueTasks(): Promise<number> {
  const activePlans = await prisma.inspectionPlan.findMany({
    where: {
      status: 'ACTIVE',
      startTime: { lte: new Date() },
      endTime: { gte: new Date() },
    },
    include: {
      devices: {
        include: { device: true },
      },
    },
  });

  let count = 0;
  for (const plan of activePlans) {
    await generateTasksForPlan(plan);
    count += plan.devices.length;
  }

  return count;
}
