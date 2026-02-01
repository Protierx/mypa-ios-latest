import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';
import { initializeSocket } from './services/socket.service.js';
import { startScheduler, stopScheduler } from './services/scheduler.service.js';

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
  
  // Create HTTP server and initialize Socket.io
  const server = createServer(app);
  initializeSocket(server);
  
  // Start notification scheduler
  startScheduler();

  // Bind to 0.0.0.0 to allow connections from other devices on the network
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`
🚀 MYPA Backend v2.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server:     http://0.0.0.0:${env.PORT}
🔧 Environment: ${env.NODE_ENV}
📊 Database:   PostgreSQL
🔌 WebSocket:  Enabled
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

  GET    /circles
  POST   /circles
  GET    /circles/:id
  PATCH  /circles/:id
  DELETE /circles/:id
  POST   /circles/:id/join
  POST   /circles/:id/leave
  GET    /circles/:id/members
  GET    /circles/:id/feed
  POST   /circles/:id/posts
  GET    /circles/:id/assignments
  POST   /circles/:id/assignments

  GET    /assignments/mine
  GET    /assignments/:id
  POST   /assignments/:id/accept
  POST   /assignments/:id/decline
  POST   /assignments/:id/complete

  GET    /posts/:id
  DELETE /posts/:id
  POST   /posts/:id/react
  DELETE /posts/:id/react

  GET    /health
`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  stopScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  stopScheduler();
  await prisma.$disconnect();
  process.exit(0);
});

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
