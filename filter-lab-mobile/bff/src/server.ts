import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { logger } from './utils/logger';
import analyzeRoutes from './routes/analyze';
import lutRoutes from './routes/lut';
import presetRoutes from './routes/presets';

// 加载环境变量
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://filterlab.app', 'capacitor://localhost'] 
    : '*'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流
app.use(rateLimitMiddleware);

// 路由
app.use('/api/v1/analyze', analyzeRoutes);
app.use('/api/v1/lut', lutRoutes);
app.use('/api/v1/presets', presetRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'FilterLab BFF',
    version: '1.0.0',
    status: 'running'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  logger.info(`FilterLab BFF running on port ${PORT}`);
});

export default app;
