import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import http from 'http';

const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`  RuScholar TMA Server Running`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Port:        ${config.port}`);
    console.log(`  API Base:    http://localhost:${config.port}/api`);
    console.log(`===============================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      console.log('[Server] Graceful shutdown completed.');
      process.exit(0);
    });

    // Force exit after 10s timeout if connections remain open
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('[Bootstrap] Fatal startup error:', error);
  process.exit(1);
});
