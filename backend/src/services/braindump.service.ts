import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { categorizeBrainDump, isAIConfigured, CategorizedItem } from './ai.service.js';
import { createTask } from './task.service.js';
import { addXp } from './user.service.js';
import { XP_REWARDS } from '../utils/xp.js';

export interface CreateBrainDumpInput {
  content: string;
  autoProcess?: boolean;
}

/**
 * Create a new brain dump item
 */
export async function createBrainDumpItem(userId: string, input: CreateBrainDumpInput) {
  const content = input.content.trim();
  
  if (!content) {
    throw new AppError('Content is required', 400, 'CONTENT_REQUIRED');
  }

  // Create the brain dump item
  const item = await prisma.brainDumpItem.create({
    data: {
      userId,
      content,
      processed: false,
    },
  });

  // Auto-process with AI if requested and available
  if (input.autoProcess && isAIConfigured()) {
    try {
      const categorized = await categorizeBrainDump(content);
      
      await prisma.brainDumpItem.update({
        where: { id: item.id },
        data: {
          processed: true,
          aiCategory: categorized.category,
          aiPriority: categorized.priority,
          aiSuggestion: JSON.stringify(categorized),
        },
      });

      return {
        ...item,
        processed: true,
        aiCategory: categorized.category,
        aiPriority: categorized.priority,
        suggestion: categorized,
      };
    } catch (error) {
      // If AI fails, just return the unprocessed item
      console.error('Auto-process failed:', error);
    }
  }

  return item;
}

/**
 * Get all brain dump items for a user
 */
export async function getBrainDumpItems(
  userId: string,
  options: {
    processed?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { processed, limit = 50, offset = 0 } = options;

  const where: any = { userId };
  if (processed !== undefined) {
    where.processed = processed;
  }

  const [items, total] = await Promise.all([
    prisma.brainDumpItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.brainDumpItem.count({ where }),
  ]);

  // Parse AI suggestions
  const parsedItems = items.map(item => ({
    ...item,
    suggestion: item.aiSuggestion ? JSON.parse(item.aiSuggestion) : null,
  }));

  return { items: parsedItems, total };
}

/**
 * Get a single brain dump item
 */
export async function getBrainDumpItem(userId: string, itemId: string) {
  const item = await prisma.brainDumpItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new AppError('Brain dump item not found', 404, 'ITEM_NOT_FOUND');
  }

  return {
    ...item,
    suggestion: item.aiSuggestion ? JSON.parse(item.aiSuggestion) : null,
  };
}

/**
 * Process a brain dump item with AI
 */
export async function processBrainDumpItem(userId: string, itemId: string) {
  if (!isAIConfigured()) {
    throw new AppError('AI is not configured', 503, 'AI_NOT_CONFIGURED');
  }

  const item = await prisma.brainDumpItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new AppError('Brain dump item not found', 404, 'ITEM_NOT_FOUND');
  }

  const categorized = await categorizeBrainDump(item.content);

  const updated = await prisma.brainDumpItem.update({
    where: { id: itemId },
    data: {
      processed: true,
      aiCategory: categorized.category,
      aiPriority: categorized.priority,
      aiSuggestion: JSON.stringify(categorized),
    },
  });

  // Award XP for processing
  await addXp(userId, XP_REWARDS.BRAIN_DUMP_PROCESS, 'Processed brain dump');

  return {
    ...updated,
    suggestion: categorized,
  };
}

/**
 * Convert a brain dump item to a task
 */
export async function convertToTask(
  userId: string,
  itemId: string,
  overrides?: {
    title?: string;
    category?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    durationMin?: number;
    date?: string;
  }
) {
  const item = await prisma.brainDumpItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new AppError('Brain dump item not found', 404, 'ITEM_NOT_FOUND');
  }

  if (item.convertedToTaskId) {
    throw new AppError('Item already converted to a task', 400, 'ALREADY_CONVERTED');
  }

  // Get AI suggestion if available
  const suggestion: CategorizedItem | null = item.aiSuggestion 
    ? JSON.parse(item.aiSuggestion) 
    : null;

  // Create the task
  const task = await createTask(userId, {
    title: overrides?.title || suggestion?.suggestedTitle || item.content.slice(0, 100),
    category: overrides?.category || suggestion?.category || item.aiCategory || 'Personal',
    priority: overrides?.priority || suggestion?.priority || (item.aiPriority as any) || 'NORMAL',
    durationMin: overrides?.durationMin || suggestion?.suggestedDuration || 30,
    date: overrides?.date,
  });

  // Update the brain dump item
  await prisma.brainDumpItem.update({
    where: { id: itemId },
    data: {
      convertedToTaskId: task.id,
      processed: true,
    },
  });

  return {
    task,
    brainDumpItem: item,
  };
}

/**
 * Delete a brain dump item
 */
export async function deleteBrainDumpItem(userId: string, itemId: string) {
  const item = await prisma.brainDumpItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new AppError('Brain dump item not found', 404, 'ITEM_NOT_FOUND');
  }

  await prisma.brainDumpItem.delete({
    where: { id: itemId },
  });

  return { success: true };
}

/**
 * Batch create brain dump items (quick capture mode)
 */
export async function batchCreateBrainDump(userId: string, items: string[]) {
  const created = await prisma.brainDumpItem.createMany({
    data: items
      .filter(content => content.trim())
      .map(content => ({
        userId,
        content: content.trim(),
        processed: false,
      })),
  });

  return { count: created.count };
}

/**
 * Get brain dump statistics
 */
export async function getBrainDumpStats(userId: string) {
  const [total, unprocessed, converted] = await Promise.all([
    prisma.brainDumpItem.count({ where: { userId } }),
    prisma.brainDumpItem.count({ where: { userId, processed: false } }),
    prisma.brainDumpItem.count({ 
      where: { userId, convertedToTaskId: { not: null } } 
    }),
  ]);

  return {
    total,
    unprocessed,
    processed: total - unprocessed,
    converted,
    pendingReview: total - converted,
  };
}
