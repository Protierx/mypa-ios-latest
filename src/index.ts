import { createApp } from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`
🚀 MYPA Backend v2.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:     http://localhost:${env.PORT}
🔧 Environment: ${env.NODE_ENV}
📊 Database:   PostgreSQL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available endpoints:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  
  GET    /users/me
  PATCH  /users/me
  GET    /users/me/stats
  GET    /users/me/settings
  PATCH  /users/me/settings
  
  GET    /tasks
  POST   /tasks
  GET    /tasks/today
  GET    /tasks/open
  GET    /tasks/stats
  GET    /tasks/:id
  PATCH  /tasks/:id
  POST   /tasks/:id/complete
  DELETE /tasks/:id

  GET    /health
`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
