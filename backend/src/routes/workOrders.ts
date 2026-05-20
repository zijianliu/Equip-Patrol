import { Router, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { WorkOrderStatus, Role } from '../types/enums';
import prisma from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticateToken);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 10, status } = req.query;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);

    const where: any = {};
    if (status) where.status = status;

    if (req.user?.role === Role.MAINTENANCE) {
      where.assigneeId = req.user.userId;
    }

    const [orders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          device: true,
          task: {
            include: {
              assignee: { select: { id: true, name: true } },
            },
          },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: { list: orders, total, page: pageNum, pageSize: size },
    });
  }
);

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const order = await prisma.workOrder.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      device: true,
      task: {
        include: {
          checkItems: true,
          assignee: { select: { id: true, name: true } },
        },
      },
      assignee: { select: { id: true, name: true } },
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, message: '维修工单不存在' });
  }

  if (req.user?.role === Role.MAINTENANCE && order.assigneeId !== req.user.userId) {
    return res.status(403).json({ success: false, message: '无权查看此工单' });
  }

  res.json({ success: true, data: order });
});

router.put(
  '/:id',
  requireRoles([Role.ADMIN, Role.MAINTENANCE]),
  [
    body('status').notEmpty().withMessage('工单状态不能为空'),
    body('handleRemark').optional().isString(),
    body('assigneeId').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status, handleRemark, assigneeId } = req.body;

    const order = await prisma.workOrder.findUnique({ where: { id: parseInt(id) } });
    if (!order) {
      return res.status(404).json({ success: false, message: '维修工单不存在' });
    }

    if (req.user?.role === Role.MAINTENANCE && order.assigneeId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权处理此工单' });
    }

    if (!Object.values(WorkOrderStatus).includes(status)) {
      return res.status(400).json({ success: false, message: '无效的工单状态' });
    }

    const updateData: any = { status };
    if (handleRemark) updateData.handleRemark = handleRemark;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (status === WorkOrderStatus.CLOSED) updateData.closedAt = new Date();

    const updated = await prisma.workOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  }
);

export default router;
