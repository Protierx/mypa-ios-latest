import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as brainDumpService from '../services/braindump.service.js';
import { isAIConfigured } from '../services/ai.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createItemSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
  autoProcess: z.boolean().optional(),
});

const batchCreateSchema = z.object({
  items: z.array(z.string().min(1).max(2000)).min(1).max(50),
});

const convertToTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  category: z.string().max(50).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
  durationMin: z.number().min(1).max(480).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /brain-dump - List brain dump items
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { processed, limit, offset } = req.query;

    const result = await brainDumpService.getBrainDumpItems(req.user!.id, {
      processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      meta: { 
        total: result.total,
        aiEnabled: isAIConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /brain-dump/stats - Get brain dump statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await brainDumpService.getBrainDumpStats(req.user!.id);

    res.json({
      success: true,
      data: {
        ...stats,
        aiEnabled: isAIConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /brain-dump - Create a brain dump item
router.post(
  '/',
  validateBody(createItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await brainDumpService.createBrainDumpItem(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: item,
        message: item.processed ? 'Item captured and categorized!' : 'Item captured!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /brain-dump/batch - Batch create brain dump items
router.post(
  '/batch',
  validateBody(batchCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await brainDumpService.batchCreateBrainDump(req.user!.id, req.body.items);

      res.status(201).json({
        success: true,
        data: result,
        message: `Captured ${result.count} items!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /brain-dump/:id - Get a single brain dump item
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await brainDumpService.getBrainDumpItem(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
});

// POST /brain-dump/:id/process - Process item with AI
router.post('/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await brainDumpService.processBrainDumpItem(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: item,
      message: `Categorized as ${item.aiCategory} (${item.aiPriority} priority)`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /brain-dump/:id/convert - Convert to task
router.post(
  '/:id/convert',
  validateBody(convertToTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await brainDumpService.convertToTask(
        req.user!.id,
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: result,
        message: 'Converted to task!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /brain-dump/:id - Delete a brain dump item
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await brainDumpService.deleteBrainDumpItem(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Item deleted',
    });
  } catch (error) {
    next(error);
  }
});

// POST /brain-dump/smart-schedule - AI smart schedule items
const smartScheduleSchema = z.object({
  itemIds: z.array(z.string()).min(1, 'At least one item required'),
  autoCreate: z.boolean().optional().default(true),
});

router.post(
  '/smart-schedule',
  validateBody(smartScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await brainDumpService.smartScheduleItems(
        req.user!.id,
        req.body.itemIds,
        { autoCreate: req.body.autoCreate }
      );

      res.json({
        success: true,
        data: result,
        message: `Intelligently scheduled ${result.itemsProcessed} items!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /brain-dump/quick-schedule - Quick AI schedule for text input (no saved items)
const quickScheduleSchema = z.object({
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
  autoCreate: z.boolean().optional().default(true),
});

router.post(
  '/quick-schedule',
  validateBody(quickScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First create brain dump items
      const createdItems = await Promise.all(
        req.body.items.map((content: string) =>
          brainDumpService.createBrainDumpItem(req.user!.id, { content, autoProcess: false })
        )
      );

      // Then smart schedule them
      const result = await brainDumpService.smartScheduleItems(
        req.user!.id,
        createdItems.map(item => item.id),
        { autoCreate: req.body.autoCreate }
      );

      res.json({
        success: true,
        data: result,
        message: `Intelligently scheduled ${result.itemsProcessed} items!`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
