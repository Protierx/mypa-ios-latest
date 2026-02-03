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
import challengesRoutes from './routes/challenges.routes.js';
// Phase 3 imports
import circlesRoutes from './routes/circles.routes.js';
import assignmentsRoutes, { circleAssignmentsRouter } from './routes/assignments.routes.js';
import postsRoutes, { circleFeedRouter, circlePostsRouter } from './routes/posts.routes.js';
import invitationsRoutes from './routes/invitations.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
// Mylo v2 - AI Learning & Productivity
import eventsRoutes from './routes/events.routes.js';
import unlocksRoutes from './routes/unlocks.routes.js';
import recurringRoutes from './routes/recurring.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import briefRoutes from './routes/brief.routes.js';

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

  // API Routes - Phase 1 & 2 (Core)
  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/tasks', tasksRoutes);
  app.use('/focus', focusRoutes);
  app.use('/brain-dump', brainDumpRoutes);
  app.use('/ai', aiRoutes);
  app.use('/tts', ttsRoutes);
  app.use('/challenges', challengesRoutes);

  // Phase 3: Social
  app.use('/circles', circlesRoutes);
  app.use('/circles/:circleId/assignments', circleAssignmentsRouter);
  app.use('/circles/:circleId/feed', circleFeedRouter);
  app.use('/circles/:circleId/posts', circlePostsRouter);
  app.use('/assignments', assignmentsRoutes);
  app.use('/posts', postsRoutes);
  app.use('/invitations', invitationsRoutes);

  // Phase 5: AI & Polish
  app.use('/analytics', analyticsRoutes);
  app.use('/notifications', notificationsRoutes);

  // Mylo v2 - AI Learning & Productivity System
  app.use('/events', eventsRoutes);
  app.use('/unlocks', unlocksRoutes);
  app.use('/recurring', recurringRoutes);
  app.use('/calendar', calendarRoutes);
  app.use('/brief', briefRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
