import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { addXp } from './user.service.js';
import { checkAndUpdateStreak } from '../utils/streaks.js';
import { XP_REWARDS, calculateXpWithStreak, estimateTimeSaved } from '../utils/xp.js';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface CreateTaskInput {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  durationMin?: number;
  isFixed?: boolean;
  category?: string;
  priority?: TaskPriority;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  durationMin?: number;
  isFixed?: boolean;
  category?: string;
  priority?: TaskPriority;
  tags?: string[];
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description?.trim(),
      date: input.date,
      time: input.time,
      durationMin: input.durationMin ?? 30,
      isFixed: input.isFixed ?? false,
      category: input.category ?? 'Personal',
      priority: input.priority ?? 'NORMAL',
      tags: JSON.stringify(input.tags ?? []),
    },
  });

  // Check if this is user's first task
  const taskCount = await prisma.task.count({ where: { userId } });
  if (taskCount === 1) {
    await addXp(userId, XP_REWARDS.FIRST_TASK, 'First task created');
  }

  return task;
}

export async function createManyTasks(userId: string, tasks: CreateTaskInput[]) {
  const created = await prisma.task.createMany({
    data: tasks.map((t) => ({
      userId,
      title: t.title.trim(),
      description: t.description?.trim(),
      date: t.date,
      time: t.time,
      durationMin: t.durationMin ?? 30,
      isFixed: t.isFixed ?? false,
      category: t.category ?? 'Personal',
      priority: t.priority ?? 'NORMAL',
      tags: JSON.stringify(t.tags ?? []),
    })),
  });

  return { count: created.count };
}

export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  return task;
}

export async function getTasks(
  userId: string,
  options: {
    date?: string;
    completed?: boolean;
    category?: string;
    priority?: TaskPriority;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { date, completed, category, priority, limit = 50, offset = 0 } = options;

  const where: any = { userId };
  
  if (date) where.date = date;
  if (completed !== undefined) where.completed = completed;
  if (category) where.category = category;
  if (priority) where.priority = priority;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

export async function getTasksForDate(userId: string, date: string) {
  return prisma.task.findMany({
    where: { userId, date },
    orderBy: [
      { isFixed: 'desc' },
      { time: 'asc' },
    ],
  });
}

export async function getOpenTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId, completed: false },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  // Verify ownership
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.time !== undefined && { time: input.time }),
      ...(input.durationMin !== undefined && { durationMin: input.durationMin }),
      ...(input.isFixed !== undefined && { isFixed: input.isFixed }),
      ...(input.category && { category: input.category }),
      ...(input.priority && { priority: input.priority }),
      ...(input.tags && { tags: JSON.stringify(input.tags) }),
    },
  });
}

export async function completeTask(userId: string, taskId: string, completed: boolean = true) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  // Update task
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  // Award XP if completing (not uncompleting)
  if (completed && !task.completed) {
    // Get user's current streak for multiplier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });

    // Calculate XP based on priority
    let baseXp = XP_REWARDS.TASK_COMPLETE;
    if (task.priority === 'HIGH') {
      baseXp = XP_REWARDS.TASK_COMPLETE_HIGH_PRIORITY;
    }

    const xpAwarded = calculateXpWithStreak(baseXp, user?.currentStreak ?? 0);

    // Update task with XP awarded
    await prisma.task.update({
      where: { id: taskId },
      data: { xpAwarded },
    });

    // Add XP to user
    await addXp(userId, xpAwarded, 'Task completed');

    // Update user stats
    const timeSaved = estimateTimeSaved(task.durationMin, task.category);
    await prisma.user.update({
      where: { id: userId },
      data: {
        tasksCompleted: { increment: 1 },
        totalTimeSaved: { increment: timeSaved },
      },
    });

    // Update streak
    await checkAndUpdateStreak(userId);

    return { ...updatedTask, xpAwarded, timeSaved };
  }

  // If uncompleting, decrement stats
  if (!completed && task.completed) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tasksCompleted: { decrement: 1 },
      },
    });
  }

  return updatedTask;
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return { success: true };
}

export async function getTaskStats(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const [total, completed, todayTasks, todayCompleted] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.task.count({ where: { userId, date: today } }),
    prisma.task.count({ where: { userId, date: today, completed: true } }),
  ]);

  return {
    total,
    completed,
    pending: total - completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    today: {
      total: todayTasks,
      completed: todayCompleted,
      pending: todayTasks - todayCompleted,
    },
  };
}
