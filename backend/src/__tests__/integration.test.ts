import request from 'supertest';
import app from '../index';
import { prisma } from './setup';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

let adminToken: string;
let inspector1Token: string;
let inspector2Token: string;
let maintenanceToken: string;
let userToken: string;

beforeEach(async () => {
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  const inspector1 = await prisma.user.findUnique({ where: { username: 'inspector1' } });
  const inspector2 = await prisma.user.findUnique({ where: { username: 'inspector2' } });
  const maintenance = await prisma.user.findUnique({ where: { username: 'maintenance' } });
  const user = await prisma.user.findUnique({ where: { username: 'user' } });

  if (admin) adminToken = generateToken({ userId: admin.id, username: admin.username, role: admin.role as any });
  if (inspector1) inspector1Token = generateToken({ userId: inspector1.id, username: inspector1.username, role: inspector1.role as any });
  if (inspector2) inspector2Token = generateToken({ userId: inspector2.id, username: inspector2.username, role: inspector2.role as any });
  if (maintenance) maintenanceToken = generateToken({ userId: maintenance.id, username: maintenance.username, role: maintenance.role as any });
  if (user) userToken = generateToken({ userId: user.id, username: user.username, role: user.role as any });
});

describe('设备管理测试', () => {
  it('设备编号重复时新增失败', async () => {
    await prisma.device.create({
      data: {
        code: 'TEST-001',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
        status: 'NORMAL',
      },
    });

    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'TEST-001',
        name: '测试设备2',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('设备编号已存在');
  });

  it('删除存在未完成任务的设备会失败', async () => {
    const device = await prisma.device.create({
      data: {
        code: 'TEST-002',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
        status: 'NORMAL',
      },
    });

    const inspector = await prisma.user.findUnique({ where: { username: 'inspector1' } });
    if (!inspector) throw new Error('巡检员不存在');

    const plan = await prisma.inspectionPlan.create({
      data: {
        name: '测试计划',
        cycle: 'DAILY',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
        ownerId: inspector.id,
        devices: {
          create: [{ deviceId: device.id }],
        },
      },
    });

    await prisma.inspectionTask.create({
      data: {
        code: 'TASK-001',
        planId: plan.id,
        deviceId: device.id,
        assigneeId: inspector.id,
        scheduledAt: new Date(),
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .delete(`/api/devices/${device.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('未完成的巡检任务');
  });

  it('普通用户不能创建设备', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'TEST-003',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
      });

    expect(res.status).toBe(403);
  });
});

describe('巡检任务测试', () => {
  it('巡检员无法查看其他人的巡检任务', async () => {
    const device = await prisma.device.create({
      data: {
        code: 'TASK-TEST-001',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
        status: 'NORMAL',
      },
    });

    const inspector1 = await prisma.user.findUnique({ where: { username: 'inspector1' } });
    const inspector2 = await prisma.user.findUnique({ where: { username: 'inspector2' } });
    if (!inspector1 || !inspector2) throw new Error('巡检员不存在');

    const plan = await prisma.inspectionPlan.create({
      data: {
        name: '测试计划',
        cycle: 'DAILY',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
        ownerId: inspector1.id,
      },
    });

    const task = await prisma.inspectionTask.create({
      data: {
        code: 'TASK-002',
        planId: plan.id,
        deviceId: device.id,
        assigneeId: inspector1.id,
        scheduledAt: new Date(),
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .get(`/api/inspection-tasks/${task.id}`)
      .set('Authorization', `Bearer ${inspector2Token}`);

    expect(res.status).toBe(403);
  });

  it('异常巡检会自动生成维修工单', async () => {
    const device = await prisma.device.create({
      data: {
        code: 'WO-TEST-001',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
        status: 'NORMAL',
      },
    });

    const inspector = await prisma.user.findUnique({ where: { username: 'inspector1' } });
    if (!inspector) throw new Error('巡检员不存在');

    const plan = await prisma.inspectionPlan.create({
      data: {
        name: '测试计划',
        cycle: 'DAILY',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
        ownerId: inspector.id,
      },
    });

    const task = await prisma.inspectionTask.create({
      data: {
        code: 'TASK-003',
        planId: plan.id,
        deviceId: device.id,
        assigneeId: inspector.id,
        scheduledAt: new Date(),
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .post(`/api/inspection-tasks/${task.id}/submit`)
      .set('Authorization', `Bearer ${inspector1Token}`)
      .send({
        checkItems: [
          { name: '外观检查', result: 'NORMAL' },
          { name: '运行状态', result: 'ABNORMAL', remark: '运行异响' },
          { name: '温度状态', result: 'NORMAL' },
          { name: '噪音状态', result: 'NORMAL' },
          { name: '安全隐患', result: 'NORMAL' },
        ],
        remark: '测试异常',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ABNORMAL');

    const workOrder = await prisma.workOrder.findUnique({ where: { taskId: task.id } });
    expect(workOrder).not.toBeNull();
    expect(workOrder?.status).toBe('PENDING');
  });
});

describe('维修工单测试', () => {
  it('维修人员无法查看非本人负责的工单', async () => {
    const device = await prisma.device.create({
      data: {
        code: 'WO-PERM-001',
        name: '测试设备',
        park: 'A园',
        building: '1号楼',
        floor: '1楼',
        type: '电气设备',
        status: 'NORMAL',
      },
    });

    const inspector = await prisma.user.findUnique({ where: { username: 'inspector1' } });
    const maintenance = await prisma.user.findUnique({ where: { username: 'maintenance' } });
    if (!inspector || !maintenance) throw new Error('用户不存在');

    const plan = await prisma.inspectionPlan.create({
      data: {
        name: '测试计划',
        cycle: 'DAILY',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
        ownerId: inspector.id,
      },
    });

    const task = await prisma.inspectionTask.create({
      data: {
        code: 'TASK-005',
        planId: plan.id,
        deviceId: device.id,
        assigneeId: inspector.id,
        scheduledAt: new Date(),
        status: 'ABNORMAL',
        completedAt: new Date(),
      },
    });

    const otherMaintenance = await prisma.user.create({
      data: {
        username: 'other-maintenance',
        password: await bcrypt.hash('123456', 10),
        name: '其他维修员',
        role: 'MAINTENANCE',
      },
    });

    const order = await prisma.workOrder.create({
      data: {
        code: 'WO-001',
        deviceId: device.id,
        taskId: task.id,
        description: '测试工单',
        status: 'PENDING',
        assigneeId: maintenance.id,
      },
    });

    const otherToken = generateToken({
      userId: otherMaintenance.id,
      username: otherMaintenance.username,
      role: otherMaintenance.role as any,
    });

    const res = await request(app)
      .get(`/api/work-orders/${order.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
