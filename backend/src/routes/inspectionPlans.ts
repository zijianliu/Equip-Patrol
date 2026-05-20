import { Router, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { PlanStatus, Role } from '../types/enums';
import prisma from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';
import { generateTasksForPlan } from '../services/taskGenerator';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  requireRoles([Role.ADMIN]),
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('keyword').optional().isString(),
    query('status').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);

    const where: any = {};
    if (keyword) where.name = { contains: keyword as string };
    if (status) where.status = status;

    const [plans, total] = await Promise.all([
      prisma.inspectionPlan.findMany({
        where,
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          owner: { select: { id: true, name: true } },
          devices: { include: { device: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inspectionPlan.count({ where }),
    ]);

    res.json({
      success: true,
      data: { list: plans, total, page: pageNum, pageSize: size },
    });
  }
);

router.get('/:id', requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  const plan = await prisma.inspectionPlan.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      owner: { select: { id: true, name: true } },
      devices: { include: { device: true } },
      tasks: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!plan) {
    return res.status(404).json({ success: false, message: '巡检计划不存在' });
  }

  res.json({ success: true, data: plan });
});

router.post(
  '/',
  requireRoles([Role.ADMIN]),
  [
    body('name').notEmpty().withMessage('计划名称不能为空'),
    body('cycle').notEmpty().withMessage('巡检周期不能为空'),
    body('startTime').notEmpty().withMessage('开始时间不能为空'),
    body('endTime').notEmpty().withMessage('结束时间不能为空'),
    body('deviceIds').isArray({ min: 1 }).withMessage('至少选择一个设备'),
    body('ownerId').notEmpty().withMessage('负责人不能为空'),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, cycle, startTime, endTime, deviceIds, ownerId, status } = req.body;

    const plan = await prisma.inspectionPlan.create({
      data: {
        name,
        cycle,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || PlanStatus.ACTIVE,
        ownerId,
        devices: {
          create: deviceIds.map((deviceId: number) => ({ deviceId })),
        },
      },
      include: { devices: { include: { device: true } } },
    });

    if (plan.status === PlanStatus.ACTIVE) {
      await generateTasksForPlan(plan);
    }

    res.json({ success: true, data: plan });
  }
);

router.put(
  '/:id',
  requireRoles([Role.ADMIN]),
  [
    body('name').notEmpty().withMessage('计划名称不能为空'),
    body('cycle').notEmpty().withMessage('巡检周期不能为空'),
    body('startTime').notEmpty().withMessage('开始时间不能为空'),
    body('endTime').notEmpty().withMessage('结束时间不能为空'),
    body('deviceIds').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { name, cycle, startTime, endTime, deviceIds, ownerId, status } = req.body;

    const plan = await prisma.inspectionPlan.findUnique({ where: { id: parseInt(id) } });
    if (!plan) {
      return res.status(404).json({ success: false, message: '巡检计划不存在' });
    }

    const existingTaskCount = await prisma.inspectionTask.count({ where: { planId: parseInt(id) } });

    const updateData: any = {
      name,
      cycle,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
    if (ownerId) updateData.ownerId = ownerId;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.inspectionPlan.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { devices: { include: { device: true } } },
    });

    if (deviceIds && existingTaskCount === 0) {
      await prisma.inspectionPlanDevice.deleteMany({ where: { planId: parseInt(id) } });
      await prisma.inspectionPlanDevice.createMany({
        data: deviceIds.map((deviceId: number) => ({ planId: parseInt(id), deviceId })),
      });
    }

    if (status === PlanStatus.ACTIVE && plan.status !== PlanStatus.ACTIVE) {
      const planWithDevices = await prisma.inspectionPlan.findUnique({
        where: { id: parseInt(id) },
        include: { devices: { include: { device: true } } },
      });
      if (planWithDevices) {
        await generateTasksForPlan(planWithDevices);
      }
    }

    res.json({ success: true, data: updated });
  }
);

router.post('/:id/toggle-status', requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const plan = await prisma.inspectionPlan.findUnique({ where: { id: parseInt(id) } });

  if (!plan) {
    return res.status(404).json({ success: false, message: '巡检计划不存在' });
  }

  const newStatus = plan.status === PlanStatus.ACTIVE ? PlanStatus.INACTIVE : PlanStatus.ACTIVE;
  const updated = await prisma.inspectionPlan.update({
    where: { id: parseInt(id) },
    data: { status: newStatus },
  });

  if (newStatus === PlanStatus.ACTIVE) {
    const planWithDevices = await prisma.inspectionPlan.findUnique({
      where: { id: parseInt(id) },
      include: { devices: { include: { device: true } } },
    });
    if (planWithDevices) {
      await generateTasksForPlan(planWithDevices);
    }
  }

  res.json({ success: true, data: updated });
});

router.delete('/:id', requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const plan = await prisma.inspectionPlan.findUnique({ where: { id: parseInt(id) } });
  if (!plan) {
    return res.status(404).json({ success: false, message: '巡检计划不存在' });
  }

  await prisma.$transaction([
    prisma.inspectionPlanDevice.deleteMany({ where: { planId: parseInt(id) } }),
    prisma.inspectionTask.deleteMany({ where: { planId: parseInt(id) } }),
    prisma.inspectionPlan.delete({ where: { id: parseInt(id) } }),
  ]);

  res.json({ success: true, message: '删除成功' });
});

export default router;
