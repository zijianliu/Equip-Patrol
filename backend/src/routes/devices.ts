import { Router, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { TaskStatus, WorkOrderStatus, Role } from '../types/enums';
import prisma from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间'),
    query('keyword').optional().isString(),
    query('type').optional().isString(),
    query('status').optional().isString(),
    query('park').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { page = 1, pageSize = 10, keyword, type, status, park } = req.query;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);

    const where: any = {};
    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string } },
        { name: { contains: keyword as string } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (park) where.park = park;

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip: (pageNum - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.device.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: devices,
        total,
        page: pageNum,
        pageSize: size,
      },
    });
  }
);

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const device = await prisma.device.findUnique({
    where: { id: parseInt(id) },
    include: {
      inspectionTasks: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          checkItems: true,
          assignee: { select: { id: true, name: true } },
        },
      },
      workOrders: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!device) {
    return res.status(404).json({ success: false, message: '设备不存在' });
  }

  res.json({ success: true, data: device });
});

router.post(
  '/',
  requireRoles([Role.ADMIN]),
  [
    body('code').notEmpty().withMessage('设备编号不能为空'),
    body('name').notEmpty().withMessage('设备名称不能为空'),
    body('park').notEmpty().withMessage('所属园区不能为空'),
    body('building').notEmpty().withMessage('楼栋不能为空'),
    body('floor').notEmpty().withMessage('楼层不能为空'),
    body('type').notEmpty().withMessage('设备类型不能为空'),
    body('status').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code, name, park, building, floor, type, status } = req.body;

    const existing = await prisma.device.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: '设备编号已存在' });
    }

    const device = await prisma.device.create({
      data: { code, name, park, building, floor, type, status: status || 'NORMAL' },
    });

    res.json({ success: true, data: device });
  }
);

router.put(
  '/:id',
  requireRoles([Role.ADMIN]),
  [
    body('code').notEmpty().withMessage('设备编号不能为空'),
    body('name').notEmpty().withMessage('设备名称不能为空'),
    body('park').notEmpty().withMessage('所属园区不能为空'),
    body('building').notEmpty().withMessage('楼栋不能为空'),
    body('floor').notEmpty().withMessage('楼层不能为空'),
    body('type').notEmpty().withMessage('设备类型不能为空'),
    body('status').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { code, name, park, building, floor, type, status } = req.body;

    const device = await prisma.device.findUnique({ where: { id: parseInt(id) } });
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    if (code !== device.code) {
      const existing = await prisma.device.findUnique({ where: { code } });
      if (existing) {
        return res.status(400).json({ success: false, message: '设备编号已存在' });
      }
    }

    const updated = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { code, name, park, building, floor, type, status },
    });

    res.json({ success: true, data: updated });
  }
);

router.delete(
  '/:id',
  requireRoles([Role.ADMIN]),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const deviceId = parseInt(id);

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const pendingTasks = await prisma.inspectionTask.count({
      where: { deviceId, status: TaskStatus.PENDING },
    });
    if (pendingTasks > 0) {
      return res.status(400).json({ success: false, message: '该设备存在未完成的巡检任务，无法删除' });
    }

    const openOrders = await prisma.workOrder.count({
      where: { deviceId, status: { not: WorkOrderStatus.CLOSED } },
    });
    if (openOrders > 0) {
      return res.status(400).json({ success: false, message: '该设备存在未关闭的维修工单，无法删除' });
    }

    await prisma.$transaction([
      prisma.inspectionPlanDevice.deleteMany({ where: { deviceId } }),
      prisma.inspectionCheckItem.deleteMany({ where: { task: { deviceId } } }),
      prisma.workOrder.deleteMany({ where: { deviceId } }),
      prisma.inspectionTask.deleteMany({ where: { deviceId } }),
      prisma.device.delete({ where: { id: deviceId } }),
    ]);

    res.json({ success: true, message: '删除成功' });
  }
);

export default router;
