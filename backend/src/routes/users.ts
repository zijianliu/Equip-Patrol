import { Router, Response } from 'express';
import { Role } from '../types/enums';
import prisma from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles([Role.ADMIN, Role.INSPECTOR, Role.MAINTENANCE]));

router.get('/', async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: users });
});

router.get('/by-role/:role', async (req: AuthRequest, res: Response) => {
  const { role } = req.params;
  const users = await prisma.user.findMany({
    where: { role: role as Role },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
  });

  res.json({ success: true, data: users });
});

export default router;
