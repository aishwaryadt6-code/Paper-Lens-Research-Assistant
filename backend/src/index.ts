import { connectDatabase } from './config/database';
import { initGridFS } from './config/gridfs';
import { logger } from './utils/logger';
import { config } from './config/env';
import app from './app';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    initGridFS();

    const server = app.listen(config.port, () => {
      logger.info(`Paper Lens API running`, {
        port: config.port,
        env: config.env,
        url: `http://localhost:${config.port}`,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', { reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
