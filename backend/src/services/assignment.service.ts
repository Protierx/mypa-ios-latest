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
import { emitAssignmentCreated, emitAssignmentUpdated, emitNewPost } from './socket.service.js';

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'EXPIRED';

export interface CreateAssignmentInput {
  assigneeId: string;
  title: string;
  description?: string;
  dueDate?: string;
  xpReward?: number;
  repeatEnabled?: boolean;
  repeatFrequency?: string;  // 'daily', 'weekly', 'monthly'
  requireProof?: boolean;
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
      repeatEnabled: input.repeatEnabled || false,
      repeatFrequency: input.repeatFrequency,
      requireProof: input.requireProof || false,
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

  // Create a system post in the circle feed
  const systemPost = await prisma.post.create({
    data: {
      circleId,
      authorId: creatorId,
      type: 'SYSTEM',
      content: JSON.stringify({
        action: 'assignment_created',
        assignmentId: assignment.id,
        assignerId: creatorId,
        assigneeId: input.assigneeId,
        assigneeName: assignment.assignee.name || assignment.assignee.username,
        title: assignment.title,
        dueDate: input.dueDate,
      }),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          level: true,
          currentStreak: true,
        },
      },
    },
  });

  const formattedAssignment = formatAssignment(assignment);

  // Emit socket events for real-time updates
  emitAssignmentCreated(circleId, input.assigneeId, formattedAssignment);
  
  // Emit new post event
  emitNewPost(circleId, {
    id: systemPost.id,
    type: 'SYSTEM',
    content: systemPost.content,
    author: systemPost.author,
    createdAt: systemPost.createdAt.toISOString(),
  });

  return formattedAssignment;
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

  // Allow accepting both PENDING and DECLINED assignments
  if (assignment.status !== 'PENDING' && assignment.status !== 'DECLINED') {
    throw new AppError(
      `Cannot accept assignment with status ${assignment.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  // Create a task from the assignment (only if not already created)
  let taskId = assignment.taskId;
  let createdTask = null;
  if (!taskId) {
    // Extract time from dueDate if available, or default to 9:00 AM
    let taskTime = '9:00 AM';
    if (assignment.dueDate) {
      const hours = assignment.dueDate.getHours();
      const minutes = assignment.dueDate.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        // Format time as "H:MM AM/PM"
        const isPM = hours >= 12;
        const displayHour = hours % 12 || 12;
        taskTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
      }
    }
    
    createdTask = await prisma.task.create({
      data: {
        userId,
        title: assignment.title,
        description: assignment.description,
        date: assignment.dueDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        time: taskTime,
        category: 'Circle',
        priority: 'HIGH',
        durationMin: 30,
      },
    });
    taskId = createdTask.id;
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      taskId: taskId,
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

  const formattedAssignment = formatAssignment(updated);
  
  // Emit socket event for real-time updates
  emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, creatorId: assignment.creatorId }, 'accepted');

  // Create system post for feed
  const systemPost = await prisma.post.create({
    data: {
      circleId: assignment.circleId,
      authorId: userId,
      type: 'SYSTEM',
      content: JSON.stringify({
        action: 'assignment_accepted',
        assignmentId: assignment.id,
        assignerId: assignment.creatorId,
        assigneeId: assignment.assigneeId,
        title: assignment.title,
      }),
    },
  });

  emitNewPost(assignment.circleId, {
    id: systemPost.id,
    type: 'SYSTEM',
    content: systemPost.content,
    createdAt: systemPost.createdAt.toISOString(),
  });

  return formattedAssignment;
}

export async function declineAssignment(userId: string, assignmentId: string, reason?: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  if (assignment.assigneeId !== userId) {
    throw new AppError('Only the assignee can decline', 403, 'UNAUTHORIZED');
  }

  // Allow declining both PENDING and ACCEPTED assignments
  if (assignment.status !== 'PENDING' && assignment.status !== 'ACCEPTED') {
    throw new AppError(
      `Cannot decline assignment with status ${assignment.status}`,
      400,
      'INVALID_STATUS'
    );
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { 
      status: 'DECLINED',
      declineReason: reason?.trim() || null,
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
    },
  });

  // Notify creator with reason if provided
  const notificationBody = reason 
    ? `${updated.assignee.name || 'Someone'} declined: ${assignment.title}\nReason: "${reason}"`
    : `${updated.assignee.name || 'Someone'} declined: ${assignment.title}`;
    
  await prisma.notification.create({
    data: {
      userId: assignment.creatorId,
      type: 'ASSIGNMENT',
      title: '❌ Assignment Declined',
      body: notificationBody,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId: assignment.circleId,
        declineReason: reason || null,
      }),
    },
  });

  const formattedAssignment = formatAssignment(updated);
  
  // Emit socket event for real-time updates
  emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, creatorId: assignment.creatorId, declineReason: reason || null }, 'declined');

  // Create system post for feed showing the decline with reason
  const systemPost = await prisma.post.create({
    data: {
      circleId: assignment.circleId,
      authorId: userId,
      type: 'SYSTEM',
      content: JSON.stringify({
        action: 'assignment_declined',
        assignmentId: assignment.id,
        assignerId: assignment.creatorId,
        assigneeId: assignment.assigneeId,
        title: assignment.title,
        reason: reason || null,
      }),
    },
  });

  emitNewPost(assignment.circleId, {
    id: systemPost.id,
    type: 'SYSTEM',
    content: systemPost.content,
    createdAt: systemPost.createdAt.toISOString(),
  });

  return formattedAssignment;
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

  const formattedAssignment = formatAssignment(updated);
  
  // Emit socket event for real-time updates
  emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, creatorId: assignment.creatorId }, 'completed');

  // Create system post for feed celebrating completion
  const systemPost = await prisma.post.create({
    data: {
      circleId: assignment.circleId,
      authorId: userId,
      type: 'SYSTEM',
      content: JSON.stringify({
        action: 'assignment_completed',
        assignmentId: assignment.id,
        assignerId: assignment.creatorId,
        assigneeId: assignment.assigneeId,
        title: assignment.title,
        xpAwarded,
        proofUrl: proof?.url,
      }),
    },
  });

  emitNewPost(assignment.circleId, {
    id: systemPost.id,
    type: 'SYSTEM',
    content: systemPost.content,
    createdAt: systemPost.createdAt.toISOString(),
  });

  return {
    ...formattedAssignment,
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
// UPDATE FUNCTIONS
// ==========================================

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  xpReward?: number;
  repeatEnabled?: boolean;
  repeatFrequency?: string | null;
  requireProof?: boolean;
}

/**
 * Update assignment details - CREATOR ONLY
 * Can update title, description, dueDate, xpReward, repeat settings, proof requirement
 */
export async function updateAssignment(
  userId: string,
  assignmentId: string,
  input: UpdateAssignmentInput
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      assignee: { select: { id: true, name: true, username: true } },
      circle: { select: { id: true, name: true, emoji: true } },
    },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  // Only creator can update assignment details
  if (assignment.creatorId !== userId) {
    throw new AppError('Only the mission sender can edit details', 403, 'UNAUTHORIZED');
  }

  // Can only update pending or declined assignments
  if (!['PENDING', 'DECLINED'].includes(assignment.status)) {
    throw new AppError(
      'Cannot edit assignment that has been accepted or completed',
      400,
      'INVALID_STATUS'
    );
  }

  // Track what was changed for the recipient to see
  const changes: string[] = [];
  const previousStatus = assignment.status;
  
  const updateData: any = {};
  if (input.title !== undefined && input.title.trim() !== assignment.title) {
    updateData.title = input.title.trim();
    changes.push(`Title changed to "${input.title.trim()}"`);
  }
  if (input.description !== undefined && input.description?.trim() !== assignment.description) {
    updateData.description = input.description?.trim() || null;
    changes.push(input.description ? 'Note updated' : 'Note removed');
  }
  if (input.dueDate !== undefined) {
    const newDate = input.dueDate ? new Date(input.dueDate) : null;
    const oldDate = assignment.dueDate;
    if (newDate?.toISOString() !== oldDate?.toISOString()) {
      updateData.dueDate = newDate;
      changes.push(newDate ? `Due date changed to ${newDate.toLocaleDateString()}` : 'Due date removed');
    }
  }
  if (input.xpReward !== undefined && input.xpReward !== assignment.xpReward) {
    updateData.xpReward = input.xpReward;
    changes.push(`XP reward changed to ${input.xpReward}`);
  }
  if (input.repeatEnabled !== undefined && input.repeatEnabled !== assignment.repeatEnabled) {
    updateData.repeatEnabled = input.repeatEnabled;
    changes.push(input.repeatEnabled ? 'Repeat enabled' : 'Repeat disabled');
  }
  if (input.repeatFrequency !== undefined && input.repeatFrequency !== assignment.repeatFrequency) {
    updateData.repeatFrequency = input.repeatFrequency;
    if (input.repeatFrequency) changes.push(`Repeat frequency set to ${input.repeatFrequency}`);
  }
  if (input.requireProof !== undefined && input.requireProof !== assignment.requireProof) {
    updateData.requireProof = input.requireProof;
    changes.push(input.requireProof ? 'Proof now required' : 'Proof no longer required');
  }
  
  // Always mark as edited and reset to pending so recipient can respond again
  updateData.isEdited = true;
  updateData.editedAt = new Date();
  updateData.status = 'PENDING'; // Reset to pending so recipient can accept/decline again
  updateData.declineReason = null; // Clear previous decline reason
  updateData.editedChanges = JSON.stringify(changes); // Store what changed

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: updateData,
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

  // Create notification with details about what changed
  const changesText = changes.length > 0 ? changes.join(', ') : 'Mission details updated';
  const wasDeclined = previousStatus === 'DECLINED';
  
  await prisma.notification.create({
    data: {
      userId: assignment.assigneeId,
      type: 'ASSIGNMENT',
      title: wasDeclined ? '🔄 Mission Re-sent (Edited)' : '✏️ Mission Updated',
      body: `${updated.creator.name || 'Someone'} ${wasDeclined ? 're-sent' : 'updated'} the mission: ${updated.title}. Changes: ${changesText}`,
      data: JSON.stringify({
        assignmentId: assignment.id,
        circleId: assignment.circleId,
        action: 'edited',
        changes: changes,
        wasDeclined: wasDeclined,
      }),
    },
  });

  const formattedAssignment = formatAssignment(updated);
  
  // Emit socket event
  emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, assigneeId: assignment.assigneeId }, 'edited');

  return formattedAssignment;
}

/**
 * Update decline reason or accept after declining - ASSIGNEE ONLY
 * If status is 'declined', assignee can either:
 * - Update their decline reason
 * - Change their mind and accept
 */
export async function updateDeclineOrAccept(
  userId: string,
  assignmentId: string,
  action: 'update-reason' | 'accept',
  newReason?: string
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: { select: { id: true, name: true, username: true } },
      assignee: { select: { id: true, name: true, username: true } },
      circle: { select: { id: true, name: true, emoji: true } },
    },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  // Only assignee can update their response
  if (assignment.assigneeId !== userId) {
    throw new AppError('Only the mission recipient can change their response', 403, 'UNAUTHORIZED');
  }

  // Must be in declined status to use this
  if (assignment.status !== 'DECLINED') {
    throw new AppError(
      'Can only update response for declined missions',
      400,
      'INVALID_STATUS'
    );
  }

  if (action === 'accept') {
    // Create a task from the assignment (same as regular accept)
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
        declineReason: null, // Clear the decline reason
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

    // Notify creator that they changed their mind
    await prisma.notification.create({
      data: {
        userId: assignment.creatorId,
        type: 'ASSIGNMENT',
        title: '🔄 Mind Changed!',
        body: `${updated.assignee.name || 'Someone'} accepted: ${assignment.title} (previously declined)`,
        data: JSON.stringify({
          assignmentId: assignment.id,
          circleId: assignment.circleId,
          action: 'reconsidered',
        }),
      },
    });

    const formattedAssignment = formatAssignment(updated);
    emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, creatorId: assignment.creatorId }, 'accepted');

    // Create system post
    const systemPost = await prisma.post.create({
      data: {
        circleId: assignment.circleId,
        authorId: userId,
        type: 'SYSTEM',
        content: JSON.stringify({
          action: 'assignment_reconsidered',
          assignmentId: assignment.id,
          title: assignment.title,
        }),
      },
    });

    emitNewPost(assignment.circleId, {
      id: systemPost.id,
      type: 'SYSTEM',
      content: systemPost.content,
      createdAt: systemPost.createdAt.toISOString(),
    });

    return formattedAssignment;
  } else {
    // Update the decline reason
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        declineReason: newReason?.trim() || null,
        isEdited: true,
        editedAt: new Date(),
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
      },
    });

    // Notify creator about the updated reason
    await prisma.notification.create({
      data: {
        userId: assignment.creatorId,
        type: 'ASSIGNMENT',
        title: '✏️ Decline Reason Updated',
        body: `${updated.assignee.name || 'Someone'} updated their reason for declining: ${assignment.title}`,
        data: JSON.stringify({
          assignmentId: assignment.id,
          circleId: assignment.circleId,
          newReason: newReason || null,
        }),
      },
    });

    const formattedAssignment = formatAssignment(updated);
    emitAssignmentUpdated(assignment.circleId, { ...formattedAssignment, creatorId: assignment.creatorId }, 'reason-updated');

    return formattedAssignment;
  }
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
    repeatEnabled: assignment.repeatEnabled,
    repeatFrequency: assignment.repeatFrequency,
    requireProof: assignment.requireProof,
    declineReason: assignment.declineReason,
    isEdited: assignment.isEdited,
    editedAt: assignment.editedAt,
    editedChanges: assignment.editedChanges ? JSON.parse(assignment.editedChanges) : null,
    // Include raw IDs for easy frontend access
    creatorId: assignment.creatorId,
    assigneeId: assignment.assigneeId,
    // Also include full objects
    creator: assignment.creator,
    assignee: assignment.assignee,
    assigner: assignment.creator, // Alias for compatibility
    task: assignment.task,
    proofUrl: assignment.proofUrl,
    proofNote: assignment.proofNote,
    acceptedAt: assignment.acceptedAt,
    completedAt: assignment.completedAt,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
