import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import planRoutes from './routes/inspectionPlans';
import taskRoutes from './routes/inspectionTasks';
import orderRoutes from './routes/workOrders';
import userRoutes from './routes/users';
import { errorHandler, notFoundHandler } from './middleware/error';
import { generateAllDueTasks } from './services/taskGenerator';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', UPLOAD_DIR)));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '设备巡检管理系统 API 运行正常' });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/inspection-plans', planRoutes);
app.use('/api/inspection-tasks', taskRoutes);
app.use('/api/work-orders', orderRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

cron.schedule('0 0 1 * *', async () => {
  console.log('开始生成巡检任务...');
  try {
    const count = await generateAllDueTasks();
    console.log(`生成了 ${count} 个巡检任务`);
  } catch (error) {
    console.error('生成巡检任务失败:', error);
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
