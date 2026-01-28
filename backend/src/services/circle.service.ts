/**
 * Circle Service
 * Handles circle CRUD, membership, and invite codes
 */

import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { addXp } from './user.service.js';
import { XP_REWARDS } from '../utils/xp.js';
import { v4 as uuidv4 } from 'uuid';

export type CircleRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CreateCircleInput {
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface UpdateCircleInput {
  name?: string;
  description?: string;
  emoji?: string;
  color?: string;
  isPrivate?: boolean;
  maxMembers?: number;
}

// ==========================================
// CIRCLE CRUD
// ==========================================

export async function createCircle(userId: string, input: CreateCircleInput) {
  const circle = await prisma.circle.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim(),
      emoji: input.emoji || '👥',
      color: input.color || '#8B5CF6',
      isPrivate: input.isPrivate ?? false,
      maxMembers: input.maxMembers || 20,
      ownerId: userId,
      inviteCode: generateInviteCode(),
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
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
      },
      _count: {
        select: { members: true },
      },
    },
  });

  // Creator is always a member, so include inviteCode
  return formatCircle(circle, true);
}

export async function getCircleById(circleId: string, userId?: string) {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              level: true,
              currentStreak: true,
              xp: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
          { xpContributed: 'desc' },
        ],
      },
      _count: {
        select: { members: true, posts: true, assignments: true },
      },
    },
  });

  if (!circle) {
    throw new AppError('Circle not found', 404, 'CIRCLE_NOT_FOUND');
  }

  // Check if user is a member (for private circles)
  const isMember = userId
    ? circle.members.some((m) => m.userId === userId)
    : false;

  if (circle.isPrivate && !isMember) {
    throw new AppError('This circle is private', 403, 'CIRCLE_PRIVATE');
  }

  return formatCircle(circle, isMember);
}

export async function getUserCircles(userId: string) {
  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    include: {
      circle: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...formatCircleBasic(m.circle, true), // Include inviteCode since user is a member
    role: m.role,
    xpContributed: m.xpContributed,
    tasksCompleted: m.tasksCompleted,
    joinedAt: m.joinedAt,
  }));
}

export async function updateCircle(
  userId: string,
  circleId: string,
  input: UpdateCircleInput
) {
  // Check ownership or admin
  await verifyCirclePermission(userId, circleId, ['OWNER', 'ADMIN']);

  const circle = await prisma.circle.update({
    where: { id: circleId },
    data: {
      ...(input.name && { name: input.name.trim() }),
      ...(input.description !== undefined && {
        description: input.description?.trim(),
      }),
      ...(input.emoji && { emoji: input.emoji }),
      ...(input.color && { color: input.color }),
      ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
      ...(input.maxMembers && { maxMembers: input.maxMembers }),
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  return formatCircleBasic(circle);
}

export async function deleteCircle(userId: string, circleId: string) {
  // Only owner can delete
  await verifyCirclePermission(userId, circleId, ['OWNER']);

  await prisma.circle.delete({
    where: { id: circleId },
  });
}

// ==========================================
// MEMBERSHIP
// ==========================================

export async function joinCircle(userId: string, circleId: string) {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!circle) {
    throw new AppError('Circle not found', 404, 'CIRCLE_NOT_FOUND');
  }

  // Check if already a member
  const existingMember = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId },
    },
  });

  if (existingMember) {
    throw new AppError('Already a member of this circle', 400, 'ALREADY_MEMBER');
  }

  // Check max members
  if (circle._count.members >= circle.maxMembers) {
    throw new AppError('Circle is full', 400, 'CIRCLE_FULL');
  }

  // Join the circle
  const membership = await prisma.circleMember.create({
    data: {
      circleId,
      userId,
      role: 'MEMBER',
    },
    include: {
      circle: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  // Award XP for joining
  await addXp(userId, XP_REWARDS.CIRCLE_JOIN, 'Joined a circle');

  return {
    ...formatCircleBasic(membership.circle, true), // Include inviteCode since user is now a member
    role: membership.role,
    joinedAt: membership.joinedAt,
  };
}

export async function joinCircleByCode(userId: string, inviteCode: string) {
  const circle = await prisma.circle.findUnique({
    where: { inviteCode },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!circle) {
    throw new AppError('Invalid invite code', 404, 'INVALID_INVITE_CODE');
  }

  return joinCircle(userId, circle.id);
}

export async function leaveCircle(userId: string, circleId: string) {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this circle', 400, 'NOT_MEMBER');
  }

  // Owner cannot leave (must transfer or delete)
  if (membership.role === 'OWNER') {
    throw new AppError(
      'Owner cannot leave. Transfer ownership or delete the circle.',
      400,
      'OWNER_CANNOT_LEAVE'
    );
  }

  await prisma.circleMember.delete({
    where: { id: membership.id },
  });
}

export async function kickMember(
  userId: string,
  circleId: string,
  targetUserId: string
) {
  // Verify kicker has permission
  const kickerMembership = await verifyCirclePermission(userId, circleId, [
    'OWNER',
    'ADMIN',
  ]);

  // Get target membership
  const targetMembership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId: targetUserId },
    },
  });

  if (!targetMembership) {
    throw new AppError('User is not a member', 404, 'NOT_MEMBER');
  }

  // Admins cannot kick owner or other admins
  if (kickerMembership.role === 'ADMIN') {
    if (targetMembership.role === 'OWNER' || targetMembership.role === 'ADMIN') {
      throw new AppError('Cannot kick owner or admin', 403, 'INSUFFICIENT_PERMISSION');
    }
  }

  // Owner can kick anyone except themselves
  if (targetUserId === userId) {
    throw new AppError('Cannot kick yourself', 400, 'CANNOT_KICK_SELF');
  }

  await prisma.circleMember.delete({
    where: { id: targetMembership.id },
  });
}

export async function updateMemberRole(
  userId: string,
  circleId: string,
  targetUserId: string,
  newRole: CircleRole
) {
  // Only owner can change roles
  await verifyCirclePermission(userId, circleId, ['OWNER']);

  if (newRole === 'OWNER') {
    throw new AppError(
      'Use transfer ownership endpoint to transfer ownership',
      400,
      'USE_TRANSFER_OWNERSHIP'
    );
  }

  const targetMembership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId: targetUserId },
    },
  });

  if (!targetMembership) {
    throw new AppError('User is not a member', 404, 'NOT_MEMBER');
  }

  if (targetMembership.role === 'OWNER') {
    throw new AppError('Cannot change owner role', 400, 'CANNOT_CHANGE_OWNER');
  }

  const updated = await prisma.circleMember.update({
    where: { id: targetMembership.id },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  return {
    userId: updated.userId,
    role: updated.role,
    user: updated.user,
  };
}

export async function getCircleMembers(circleId: string, userId: string) {
  // Verify user is a member
  await verifyCircleMembership(userId, circleId);

  const members = await prisma.circleMember.findMany({
    where: { circleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          level: true,
          xp: true,
          currentStreak: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { xpContributed: 'desc' }],
  });

  return members.map((m) => ({
    userId: m.userId,
    role: m.role,
    xpContributed: m.xpContributed,
    tasksCompleted: m.tasksCompleted,
    joinedAt: m.joinedAt,
    user: m.user,
  }));
}

// ==========================================
// INVITE CODE
// ==========================================

export async function regenerateInviteCode(userId: string, circleId: string) {
  await verifyCirclePermission(userId, circleId, ['OWNER', 'ADMIN']);

  const newCode = generateInviteCode();

  const circle = await prisma.circle.update({
    where: { id: circleId },
    data: { inviteCode: newCode },
  });

  return { inviteCode: circle.inviteCode };
}

export async function getCircleByInviteCode(inviteCode: string) {
  const circle = await prisma.circle.findUnique({
    where: { inviteCode },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      _count: { select: { members: true } },
    },
  });

  if (!circle) {
    throw new AppError('Invalid invite code', 404, 'INVALID_INVITE_CODE');
  }

  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    emoji: circle.emoji,
    color: circle.color,
    memberCount: circle._count.members,
    maxMembers: circle.maxMembers,
    owner: circle.owner,
  };
}

// ==========================================
// XP TRACKING
// ==========================================

export async function addCircleXp(
  userId: string,
  circleId: string,
  xp: number
) {
  // Update member's contribution
  await prisma.circleMember.updateMany({
    where: { circleId, userId },
    data: {
      xpContributed: { increment: xp },
    },
  });

  // Update circle total
  await prisma.circle.update({
    where: { id: circleId },
    data: {
      totalXp: { increment: xp },
    },
  });
}

export async function incrementMemberTasks(userId: string, circleId: string) {
  await prisma.circleMember.updateMany({
    where: { circleId, userId },
    data: {
      tasksCompleted: { increment: 1 },
    },
  });
}

// ==========================================
// HELPERS
// ==========================================

function generateInviteCode(): string {
  // Generate a readable 8-character code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function verifyCirclePermission(
  userId: string,
  circleId: string,
  allowedRoles: CircleRole[]
) {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this circle', 403, 'NOT_MEMBER');
  }

  if (!allowedRoles.includes(membership.role as CircleRole)) {
    throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSION');
  }

  return membership;
}

async function verifyCircleMembership(userId: string, circleId: string) {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId },
    },
  });

  if (!membership) {
    throw new AppError('Not a member of this circle', 403, 'NOT_MEMBER');
  }

  return membership;
}

function formatCircle(circle: any, isMember?: boolean) {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    emoji: circle.emoji,
    color: circle.color,
    isPrivate: circle.isPrivate,
    inviteCode: isMember ? circle.inviteCode : undefined,
    maxMembers: circle.maxMembers,
    totalXp: circle.totalXp,
    owner: circle.owner,
    members: circle.members?.map((m: any) => ({
      userId: m.userId,
      role: m.role,
      xpContributed: m.xpContributed,
      tasksCompleted: m.tasksCompleted,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
    memberCount: circle._count?.members,
    postCount: circle._count?.posts,
    assignmentCount: circle._count?.assignments,
    createdAt: circle.createdAt,
    updatedAt: circle.updatedAt,
  };
}

function formatCircleBasic(circle: any, includeSensitive: boolean = false) {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    emoji: circle.emoji,
    color: circle.color,
    isPrivate: circle.isPrivate,
    inviteCode: includeSensitive ? circle.inviteCode : undefined,
    maxMembers: circle.maxMembers,
    totalXp: circle.totalXp,
    memberCount: circle._count?.members,
    owner: circle.owner,
    createdAt: circle.createdAt,
  };
}

export { verifyCircleMembership, verifyCirclePermission };
