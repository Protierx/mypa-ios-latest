/**
 * Assignment Service
 * Handles circle assignments lifecycle
 */

import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { addXp } from './user.service.js';
import { addCircleXp, incrementMemberTasks, verifyCircleMembership } from './circle.service.js';
import { XP_REWARDS } from '../utils/xp.js';
import { checkAndUpdateStreak } from '../utils/streaks.js';

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'EXPIRED';

export interface CreateAssignmentInput {
  assigneeId: string;
  title: string;
  description?: string;
  dueDate?: string;
  xpReward?: number;
}

// ==========================================
// ASSIGNMENT CRUD
// ==========================================

export async function createAssignment(
  creatorId: string,
  circleId: string,
  input: CreateAssignmentInput
) {
  // Verify creator is a member
  await verifyCircleMembership(creatorId, circleId);

  // Verify assignee is a member
  await verifyCircleMembership(input.assigneeId, circleId);

  // Cannot assign to self
  if (creatorId === input.assigneeId) {
    throw new AppError('Cannot assign tasks to yourself', 400, 'CANNOT_SELF_ASSIGN');
  }

  const assignment = await prisma.assignment.create({
    data: {
      circleId,
      creatorId,
      assigneeId: input.assigneeId,
      title: input.title.trim(),
      description: input.description?.trim(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      xpReward: input.xpReward || 50,
      status: 'PENDING',
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      circle: {
        select: {
          id: true,
          name: true,
          emoji: true,
        },
      },
    },
  });

  // Create notification for assignee
  await prisma.notification.create({
    data: {
      userId: input.assigneeId,
      type: 'ASSIGNMENT',
      title: '📋 New Assignment',
      body: `${assignment.creator.name || 'Someone'} assigned you: ${assignment.title}`,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId,
        circleName: assignment.circle.name,
      }),
    },
  });

  return formatAssignment(assignment);
}

export async function getAssignmentById(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      circle: {
        select: {
          id: true,
          name: true,
          emoji: true,
        },
      },
      task: true,
    },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  // Verify user has access (is creator, assignee, or circle member)
  const isMember = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId: assignment.circleId, userId },
    },
  });

  if (!isMember) {
    throw new AppError('Not authorized to view this assignment', 403, 'UNAUTHORIZED');
  }

  return formatAssignment(assignment);
}

export async function getCircleAssignments(
  userId: string,
  circleId: string,
  options: {
    status?: AssignmentStatus;
    limit?: number;
    offset?: number;
  } = {}
) {
  // Verify membership
  await verifyCircleMembership(userId, circleId);

  const { status, limit = 50, offset = 0 } = options;

  const where: any = { circleId };
  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    assignments: assignments.map(formatAssignment),
    total,
  };
}

export async function getMyAssignments(
  userId: string,
  options: {
    role?: 'assignee' | 'creator';
    status?: AssignmentStatus;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { role, status, limit = 50, offset = 0 } = options;

  const where: any = {};
  
  if (role === 'assignee') {
    where.assigneeId = userId;
  } else if (role === 'creator') {
    where.creatorId = userId;
  } else {
    where.OR = [{ assigneeId: userId }, { creatorId: userId }];
  }

  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    assignments: assignments.map(formatAssignment),
    total,
  };
}

// ==========================================
// ASSIGNMENT ACTIONS
// ==========================================

export async function acceptAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.assigneeId !== userId) {
    throw new AppError('Only the assignee can accept', 403, 'UNAUTHORIZED');
  }

  if (assignment.status !== 'PENDING') {
    throw new AppError(
      `Cannot accept assignment with status ${assignment.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  // Create a task from the assignment
  const task = await prisma.task.create({
    data: {
      userId,
      title: assignment.title,
      description: assignment.description,
      date: assignment.dueDate?.toISOString().split('T')[0],
      category: 'Circle',
      priority: 'HIGH',
    },
  });

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      taskId: task.id,
    },
    include: {
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      circle: {
        select: { id: true, name: true, emoji: true },
      },
      task: true,
    },
  });

  // Notify creator
  await prisma.notification.create({
    data: {
      userId: assignment.creatorId,
      type: 'ASSIGNMENT',
      title: '✅ Assignment Accepted',
      body: `${updated.assignee.name || 'Someone'} accepted: ${assignment.title}`,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId: assignment.circleId,
      }),
    },
  });

  return formatAssignment(updated);
}

export async function declineAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.assigneeId !== userId) {
    throw new AppError('Only the assignee can decline', 403, 'UNAUTHORIZED');
  }

  if (assignment.status !== 'PENDING') {
    throw new AppError(
      `Cannot decline assignment with status ${assignment.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'DECLINED' },
    include: {
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      circle: {
        select: { id: true, name: true, emoji: true },
      },
    },
  });

  // Notify creator
  await prisma.notification.create({
    data: {
      userId: assignment.creatorId,
      type: 'ASSIGNMENT',
      title: '❌ Assignment Declined',
      body: `${updated.assignee.name || 'Someone'} declined: ${assignment.title}`,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId: assignment.circleId,
      }),
    },
  });

  return formatAssignment(updated);
}

export async function completeAssignment(
  userId: string,
  assignmentId: string,
  proof?: { url?: string; note?: string }
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      assignee: {
        select: { id: true, name: true, currentStreak: true },
      },
    },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.assigneeId !== userId) {
    throw new AppError('Only the assignee can complete', 403, 'UNAUTHORIZED');
  }

  if (assignment.status !== 'ACCEPTED') {
    throw new AppError(
      'Assignment must be accepted before completing',
      400,
      'INVALID_STATUS'
    );
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      proofUrl: proof?.url,
      proofNote: proof?.note,
    },
    include: {
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      circle: {
        select: { id: true, name: true, emoji: true },
      },
      task: true,
    },
  });

  // Mark linked task as complete if exists
  if (assignment.taskId) {
    await prisma.task.update({
      where: { id: assignment.taskId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  // Award XP
  const xpAwarded = assignment.xpReward;
  await addXp(userId, xpAwarded, 'Assignment completed');
  
  // Update circle XP
  await addCircleXp(userId, assignment.circleId, xpAwarded);
  await incrementMemberTasks(userId, assignment.circleId);

  // Update streak
  await checkAndUpdateStreak(userId);

  // Notify creator
  await prisma.notification.create({
    data: {
      userId: assignment.creatorId,
      type: 'ASSIGNMENT',
      title: '🎉 Assignment Completed!',
      body: `${updated.assignee.name || 'Someone'} completed: ${assignment.title}`,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId: assignment.circleId,
        proofUrl: proof?.url,
      }),
    },
  });

  return {
    ...formatAssignment(updated),
    xpAwarded,
  };
}

export async function deleteAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  // Only creator can delete, and only if pending
  if (assignment.creatorId !== userId) {
    throw new AppError('Only the creator can delete', 403, 'UNAUTHORIZED');
  }

  if (assignment.status !== 'PENDING') {
    throw new AppError(
      'Can only delete pending assignments',
      400,
      'INVALID_STATUS'
    );
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });
}

// ==========================================
// HELPERS
// ==========================================

function formatAssignment(assignment: any) {
  return {
    id: assignment.id,
    circleId: assignment.circleId,
    circle: assignment.circle,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    status: assignment.status,
    xpReward: assignment.xpReward,
    creator: assignment.creator,
    assignee: assignment.assignee,
    task: assignment.task,
    proofUrl: assignment.proofUrl,
    proofNote: assignment.proofNote,
    acceptedAt: assignment.acceptedAt,
    completedAt: assignment.completedAt,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
