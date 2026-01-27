import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import focusRoutes from './routes/focus.routes.js';
import brainDumpRoutes from './routes/braindump.routes.js';
import aiRoutes from './routes/ai.routes.js';
import ttsRoutes from './routes/tts.routes.js';

export function createApp(): Application {
  const app = express();

  // Trust proxy (for reverse proxies like nginx)
  app.set('trust proxy', true);

  // Middleware
  app.use(cors({
    origin: env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] // Add your production domains
      : '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  });

  // API Routes
  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/tasks', tasksRoutes);
  app.use('/focus', focusRoutes);
  app.use('/brain-dump', brainDumpRoutes);
  app.use('/ai', aiRoutes);
  app.use('/tts', ttsRoutes);

  // TODO: Add more routes as we implement them
  // app.use('/circles', circlesRoutes);
  // app.use('/assignments', assignmentsRoutes);
  // app.use('/challenges', challengesRoutes);
  // app.use('/notifications', notificationsRoutes);
  // app.use('/places', placesRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
