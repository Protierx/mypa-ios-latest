/**
 * Recurring Tasks Routes for Mylo
 * 
 * API endpoints for managing recurring task templates.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import recurringTaskService, { RecurrenceRule } from '../services/recurring.service';

const router = Router();

/**
 * POST /api/recurring
 * Create a new recurring task template
 */
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { title, description, category, priority, durationMin, defaultTime, recurrence } = req.body;

    if (!title || !recurrence || !recurrence.frequency) {
      return res.status(400).json({
        success: false,
        message: 'Title and recurrence frequency are required',
      });
    }

    const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    if (!validFrequencies.includes(recurrence.frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, or YEARLY',
      });
    }

    const template = await recurringTaskService.createRecurringTask(userId, {
      title,
      description,
      category,
      priority,
      durationMin,
      defaultTime,
      recurrence: {
        ...recurrence,
        interval: recurrence.interval || 1,
      },
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Recurring task created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recurring
 * Get all recurring task templates for the authenticated user
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const includeInactive = req.query.includeInactive === 'true';

    const templates = await recurringTaskService.getRecurringTasks(userId, includeInactive);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/recurring/:id
 * Update a recurring task template
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const templateId = req.params.id;
    const updates = req.body;

    if (updates.recurrence && updates.recurrence.frequency) {
      const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
      if (!validFrequencies.includes(updates.recurrence.frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, or YEARLY',
        });
      }
    }

    const template = await recurringTaskService.updateRecurringTask(templateId, userId, updates);

    res.json({
      success: true,
      data: template,
      message: 'Recurring task updated successfully',
    });
  } catch (error: any) {
    if (error.message === 'Recurring task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * POST /api/recurring/:id/pause
 * Pause a recurring task
 */
router.post('/:id/pause', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const templateId = req.params.id;

    await recurringTaskService.pauseRecurringTask(templateId, userId);

    res.json({
      success: true,
      message: 'Recurring task paused',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recurring/:id/resume
 * Resume a paused recurring task
 */
router.post('/:id/resume', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const templateId = req.params.id;

    const template = await recurringTaskService.resumeRecurringTask(templateId, userId);

    res.json({
      success: true,
      data: template,
      message: 'Recurring task resumed',
    });
  } catch (error: any) {
    if (error.message === 'Recurring task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/recurring/:id
 * Delete a recurring task template
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const templateId = req.params.id;
    const deleteInstances = req.query.deleteInstances === 'true';

    await recurringTaskService.deleteRecurringTask(templateId, userId, deleteInstances);

    res.json({
      success: true,
      message: deleteInstances
        ? 'Recurring task and all instances deleted'
        : 'Recurring task deleted, instances preserved',
    });
  } catch (error: any) {
    if (error.message === 'Recurring task not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * POST /api/recurring/generate
 * Manually trigger generation of due recurring task instances
 * (Admin/debug endpoint)
 */
router.post('/generate', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const generated = await recurringTaskService.generateDueInstances();

    res.json({
      success: true,
      data: {
        generatedCount: generated.length,
        tasks: generated,
      },
      message: `Generated ${generated.length} recurring task instances`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
