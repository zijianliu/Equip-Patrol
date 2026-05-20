import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800000001',
      email: 'admin@equip.com',
    },
  });

  const inspector = await prisma.user.upsert({
    where: { username: 'inspector' },
    update: {},
    create: {
      username: 'inspector',
      password: hashedPassword,
      name: '巡检员张三',
      role: 'INSPECTOR',
      phone: '13800000002',
      email: 'inspector@equip.com',
    },
  });

  const maintenance = await prisma.user.upsert({
    where: { username: 'maintenance' },
    update: {},
    create: {
      username: 'maintenance',
      password: hashedPassword,
      name: '维修员李四',
      role: 'MAINTENANCE',
      phone: '13800000003',
      email: 'maintenance@equip.com',
    },
  });

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: hashedPassword,
      name: '普通用户王五',
      role: 'USER',
      phone: '13800000004',
      email: 'user@equip.com',
    },
  });

  const devices = [];
  for (let i = 1; i <= 10; i++) {
    const device = await prisma.device.upsert({
      where: { code: `EQ-${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        code: `EQ-${String(i).padStart(4, '0')}`,
        name: `设备${i}`,
        park: `园区${i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'}`,
        building: `楼栋${Math.ceil(i / 3)}`,
        floor: `楼层${(i % 5) + 1}`,
        type: i % 3 === 0 ? '电气设备' : i % 3 === 1 ? '机械设备' : '仪器仪表',
        status: i % 5 === 0 ? 'FAULT' : 'NORMAL',
      },
    });
    devices.push(device);
  }

  const plan = await prisma.inspectionPlan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '月度设备巡检计划',
      cycle: 'MONTHLY',
      startTime: new Date(),
      endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      ownerId: admin.id,
      devices: {
        create: devices.slice(0, 5).map(d => ({ deviceId: d.id })),
      },
    },
  });

  console.log('种子数据创建完成');
  console.log('管理员账号: admin / 123456');
  console.log('巡检员账号: inspector / 123456');
  console.log('维修员账号: maintenance / 123456');
  console.log('普通用户账号: user / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
