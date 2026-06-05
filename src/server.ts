import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables early
config({ path: resolve(__dirname, '../.env') });

import app from './app';
import { testDatabaseConnection } from './config/database';
import { logger } from './config/logger';

const PORT = process.env.PORT || 3000;

function validateRequiredEnv() {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function startServer() {
  validateRequiredEnv();

  // Test database connection
  const isDbConnected = await testDatabaseConnection();
  if (!isDbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    // TODO: Add Swagger/OpenAPI documentation
    // logger.info(`📝 API Docs: http://localhost:${PORT}/api-docs`);
    logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});