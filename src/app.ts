import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.middleware';
import { logger } from './config/logger';

// Import routes
import authRoutes from './routes/v1/auth.routes';
import projectRoutes from './routes/v1/project.routes';
import taskRoutes from './routes/v1/task.routes';
import githubRoutes from './routes/v1/github.routes';
import commentRoutes from './routes/v1/comment.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes — public info endpoint (before auth middleware)
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Task Tracker API v1',
    status: 'running',
    endpoints: {
      auth: '/api/v1/auth',
      projects: '/api/v1/projects',
      tasks: '/api/v1/tasks',
      github: '/api/v1/github',
      comments: '/api/v1/task/:taskId/comments',
    },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/github', githubRoutes);
app.use('/api/v1', commentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;