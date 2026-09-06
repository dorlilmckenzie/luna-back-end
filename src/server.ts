import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';

async function start(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('Connected to PostgreSQL');
  } catch (err) {
    logger.error('Failed to connect to the database', {
      message: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}/api`);
    logger.info(`API docs at http://localhost:${env.PORT}/api/docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void start();
