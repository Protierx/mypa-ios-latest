import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as taskService from '../services/task.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm').optional(),
  durationMin: z.number().min(1).max(480).optional(),
  isFixed: z.boolean().optional(),
  category: z.string().max(50).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const batchCreateSchema = z.object({
  tasks: z.array(createTaskSchema).min(1).max(50),
});

// GET /tasks - List tasks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, completed, category, priority, limit, offset } = req.query;

    const result = await taskService.getTasks(req.user!.id, {
      date: date as string | undefined,
      completed: completed === 'true' ? true : completed === 'false' ? false : undefined,
      category: category as string | undefined,
      priority: priority as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.tasks,
      meta: { total: result.total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /tasks/today - Get today's tasks
router.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await taskService.getTasksForDate(req.user!.id, today);

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /tasks/open - Get all open (incomplete) tasks
router.get('/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getOpenTasks(req.user!.id);

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /tasks/stats - Get task statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await taskService.getTaskStats(req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /tasks/date/:date - Get tasks for specific date
router.get('/date/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getTasksForDate(req.user!.id, req.params.date);

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// POST /tasks - Create a task
router.post(
  '/',
  validateBody(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /tasks/batch - Create multiple tasks
router.post(
  '/batch',
  validateBody(batchCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await taskService.createManyTasks(req.user!.id, req.body.tasks);

      res.status(201).json({
        success: true,
        data: result,
        message: `Created ${result.count} tasks`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /tasks/:id - Get a specific task
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTaskById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /tasks/:id - Update a task
router.patch(
  '/:id',
  validateBody(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateTask(req.user!.id, req.params.id, req.body);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /tasks/:id/complete - Mark task as complete
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await taskService.completeTask(req.user!.id, req.params.id, true);

    res.json({
      success: true,
      data: result,
      message: result.xpAwarded ? `Task completed! +${result.xpAwarded} XP` : 'Task completed',
    });
  } catch (error) {
    next(error);
  }
});

// POST /tasks/:id/uncomplete - Mark task as incomplete
router.post('/:id/uncomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.completeTask(req.user!.id, req.params.id, false);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /tasks/:id - Delete a task
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taskService.deleteTask(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
