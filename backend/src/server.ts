import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

let server: ReturnType<typeof app.listen> | null = null;

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received.');
  if (!server) {
    process.exit(0);
  }

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Error while closing HTTP server.');
      process.exit(1);
      return;
    }

    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception.');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection.');
  process.exit(1);
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

async function bootstrap() {
  await connectDb(env.mongodbUri);

  server = app.listen(env.port, '0.0.0.0', () => {
    logger.info(
      {
        port: env.port,
        nodeEnv: env.nodeEnv,
        corsOrigins: env.corsOrigins
      },
      'Server listening.'
    );
  });
}

void bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server.');
  process.exit(1);
});
