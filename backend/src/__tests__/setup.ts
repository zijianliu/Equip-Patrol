import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.workOrder.deleteMany();
  await prisma.inspectionCheckItem.deleteMany();
  await prisma.inspectionTask.deleteMany();
  await prisma.inspectionPlanDevice.deleteMany();
  await prisma.inspectionPlan.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.createMany({
    data: [
      { username: 'admin', password: hashedPassword, name: '管理员', role: 'ADMIN' },
      { username: 'inspector1', password: hashedPassword, name: '巡检员1', role: 'INSPECTOR' },
      { username: 'inspector2', password: hashedPassword, name: '巡检员2', role: 'INSPECTOR' },
      { username: 'maintenance', password: hashedPassword, name: '维修员', role: 'MAINTENANCE' },
      { username: 'user', password: hashedPassword, name: '普通用户', role: 'USER' },
    ],
  });
});

export { prisma };
