import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ 
      port: env.PORT, 
      host: '0.0.0.0' 
    });
    
    app.log.info(`
🚀 Broker API started successfully!
📍 Server: http://localhost:${env.PORT}
📚 Docs: http://localhost:${env.PORT}/docs
🔧 Environment: ${env.NODE_ENV}
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  const app = await buildApp();
  await app.close();
  process.exit(0);
});

start();