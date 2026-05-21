import { Router, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { TaskStatus, CheckItemResult, Role } from '../types/enums';
import prisma from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';
import { createWorkOrderIfNeeded } from '../services/workOrderService';

const router = Router();

router.use(authenticateToken);

const CHECK_ITEMS = ['外观检查', '运行状态', '温度状态', '噪音状态', '安全隐患'];

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('keyword').optional().isString(),
    query('planId').optional().isInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 10, status, keyword, planId } = req.query;
    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);

    const where: any = {};
    if (status) where.status = status;
    if (planId) where.planId = parseInt(planId as string);
    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string } },
        { device: { name: { contains: keyword as string } } },
        { device: { code: { contains: keyword as string } } },
      ];
    }

    if (req.user?.role === Role.INSPECTOR) {
      where.assigneeId = req.user.userId;
    }

    const [tasks, total] = await Promise.all([
      prisma.inspectionTask.findMany({
        where,
        skip: (pageNum - 1) * size,
        take: size,
        include: {
          device: true,
          plan: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inspectionTask.count({ where }),
    ]);

    res.json({
      success: true,
      data: { list: tasks, total, page: pageNum, pageSize: size },
    });
  }
);

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const task = await prisma.inspectionTask.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      device: true,
      plan: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      checkItems: true,
      workOrder: true,
    },
  });

  if (!task) {
    return res.status(404).json({ success: false, message: '巡检任务不存在' });
  }

  if (req.user?.role === Role.INSPECTOR && task.assigneeId !== req.user.userId) {
    return res.status(403).json({ success: false, message: '无权查看此任务' });
  }

  res.json({ success: true, data: task });
});

router.post(
  '/:id/submit',
  requireRoles([Role.ADMIN, Role.INSPECTOR]),
  [
    body('checkItems').isArray({ min: 5 }).withMessage('检查项结果不能为空'),
    body('remark').optional().isString(),
    body('images').optional().isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { id } = req.params;
    const { checkItems, remark, images = [] } = req.body;

    const task = await prisma.inspectionTask.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: '巡检任务不存在' });
    }

    if (task.status !== TaskStatus.PENDING) {
      return res.status(400).json({ success: false, message: '任务已提交，不能重复提交' });
    }

    if (req.user?.role === Role.INSPECTOR && task.assigneeId !== req.user.userId) {
      return res.status(403).json({ success: false, message: '无权处理此任务' });
    }

    for (const item of checkItems) {
      if (!CHECK_ITEMS.includes(item.name)) {
        return res.status(400).json({ success: false, message: `无效的检查项: ${item.name}` });
      }
      if (!Object.values(CheckItemResult).includes(item.result)) {
        return res.status(400).json({ success: false, message: `无效的检查结果: ${item.result}` });
      }
    }

    const hasAbnormal = checkItems.some(
      (item: any) => item.result === CheckItemResult.ABNORMAL
    );
    const taskStatus = hasAbnormal ? TaskStatus.ABNORMAL : TaskStatus.COMPLETED;

    await prisma.$transaction(async (tx) => {
      await tx.inspectionTask.update({
        where: { id: parseInt(id) },
        data: {
          status: taskStatus,
          completedAt: new Date(),
          remark,
        },
      });

      await tx.inspectionCheckItem.createMany({
        data: checkItems.map((item: any) => ({
          taskId: parseInt(id),
          name: item.name,
          result: item.result,
          remark: item.remark,
        })),
      });

      if (images && images.length > 0) {
        await tx.taskImage.createMany({
          data: images.map((url: string) => ({
            taskId: parseInt(id),
            url,
          })),
        });
      }

      await tx.device.update({
        where: { id: task.deviceId },
        data: { lastInspectedAt: new Date() },
      });
    });

    if (hasAbnormal) {
      const taskWithDetails = await prisma.inspectionTask.findUnique({
        where: { id: parseInt(id) },
        include: { device: true, checkItems: true },
      });
      if (taskWithDetails) {
        await createWorkOrderIfNeeded(taskWithDetails);
      }
    }

    const updatedTask = await prisma.inspectionTask.findUnique({
      where: { id: parseInt(id) },
      include: { checkItems: true, workOrder: true },
    });

    res.json({ success: true, data: updatedTask });
  }
);

export default router;
