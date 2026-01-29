/**
 * Circle Invitation Service
 * Handles sending, accepting, and declining circle invitations
 */

import prisma from '../config/database.js';
import { emitToUser } from './socket.service.js';

// ==========================================
// SEND INVITATION
// ==========================================

export async function sendInvitation(
  circleId: string,
  inviterId: string,
  inviteeId: string,
  message?: string
) {
  // Check if inviter is a member of the circle
  const inviterMembership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId: inviterId } },
  });

  if (!inviterMembership) {
    throw new Error('You are not a member of this circle');
  }

  // Check if invitee is already a member
  const existingMembership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId: inviteeId } },
  });

  if (existingMembership) {
    throw new Error('User is already a member of this circle');
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.circleInvitation.findUnique({
    where: { circleId_inviteeId: { circleId, inviteeId } },
  });

  if (existingInvite && existingInvite.status === 'PENDING') {
    throw new Error('User already has a pending invitation to this circle');
  }

  // Create or update invitation
  const invitation = await prisma.circleInvitation.upsert({
    where: { circleId_inviteeId: { circleId, inviteeId } },
    create: {
      circleId,
      inviterId,
      inviteeId,
      message,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    update: {
      inviterId,
      message,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    include: {
      circle: { select: { id: true, name: true, emoji: true } },
      inviter: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  // Emit real-time notification to invitee
  emitToUser(inviteeId, 'invitation:new', {
    invitation: {
      id: invitation.id,
      circle: invitation.circle,
      inviter: invitation.inviter,
      message: invitation.message,
      createdAt: invitation.createdAt,
    },
    timestamp: new Date().toISOString(),
  });

  return invitation;
}

// ==========================================
// GET MY INVITATIONS
// ==========================================

export async function getMyInvitations(userId: string, status?: string) {
  const where: any = { inviteeId: userId };
  
  if (status) {
    where.status = status.toUpperCase();
  } else {
    // Default to pending only
    where.status = 'PENDING';
  }

  const invitations = await prisma.circleInvitation.findMany({
    where,
    include: {
      circle: {
        select: {
          id: true,
          name: true,
          emoji: true,
          description: true,
          _count: { select: { members: true } },
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations;
}

// ==========================================
// ACCEPT INVITATION
// ==========================================

export async function acceptInvitation(invitationId: string, userId: string) {
  const invitation = await prisma.circleInvitation.findUnique({
    where: { id: invitationId },
    include: {
      circle: { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.inviteeId !== userId) {
    throw new Error('This invitation is not for you');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error(`Invitation has already been ${invitation.status.toLowerCase()}`);
  }

  // Check if expired
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.circleInvitation.update({
      where: { id: invitationId },
      data: { status: 'EXPIRED' },
    });
    throw new Error('Invitation has expired');
  }

  // Use transaction to update invitation and add member
  const result = await prisma.$transaction(async (tx) => {
    // Update invitation status
    const updatedInvitation = await tx.circleInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    // Add user as circle member
    const membership = await tx.circleMember.create({
      data: {
        circleId: invitation.circleId,
        userId,
        role: 'MEMBER',
      },
    });

    return { invitation: updatedInvitation, membership };
  });

  // Notify circle members about new member
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, avatarUrl: true },
  });

  // Import socket function and emit
  const { emitMemberJoined } = await import('./socket.service.js');
  emitMemberJoined(invitation.circleId, {
    userId: user!.id,
    name: user!.name,
    username: user!.username,
    avatarUrl: user!.avatarUrl,
  });

  // Notify inviter that invitation was accepted
  emitToUser(invitation.inviterId, 'invitation:accepted', {
    invitation: {
      id: invitation.id,
      circle: invitation.circle,
    },
    acceptedBy: user,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    circle: invitation.circle,
    membership: result.membership,
  };
}

// ==========================================
// DECLINE INVITATION
// ==========================================

export async function declineInvitation(invitationId: string, userId: string) {
  const invitation = await prisma.circleInvitation.findUnique({
    where: { id: invitationId },
    include: {
      circle: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.inviteeId !== userId) {
    throw new Error('This invitation is not for you');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error(`Invitation has already been ${invitation.status.toLowerCase()}`);
  }

  // Update invitation status
  await prisma.circleInvitation.update({
    where: { id: invitationId },
    data: { status: 'DECLINED' },
  });

  // Notify inviter that invitation was declined
  emitToUser(invitation.inviterId, 'invitation:declined', {
    invitationId: invitation.id,
    circleName: invitation.circle.name,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}

// ==========================================
// SEARCH USERS TO INVITE
// ==========================================

export async function searchUsersToInvite(
  circleId: string,
  query: string,
  currentUserId: string
) {
  // Get existing members and pending invitees
  const [members, pendingInvites] = await Promise.all([
    prisma.circleMember.findMany({
      where: { circleId },
      select: { userId: true },
    }),
    prisma.circleInvitation.findMany({
      where: { circleId, status: 'PENDING' },
      select: { inviteeId: true },
    }),
  ]);

  const excludeIds = [
    ...members.map((m) => m.userId),
    ...pendingInvites.map((i) => i.inviteeId),
  ];

  // Search users
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { notIn: excludeIds } },
        {
          OR: [
            { name: { contains: query } },
            { username: { contains: query } },
            { email: { contains: query } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
    take: 10,
  });

  return users;
}
