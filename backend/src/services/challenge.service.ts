/**
 * Challenge Service
 * Handles challenge creation, participation, and progress tracking
 */

import prisma from '../config/database.js';
import { addXp } from './user.service.js';

// ==========================================
// GET CHALLENGES
// ==========================================

export async function getChallenges(userId: string, options?: { 
  active?: boolean; 
  joined?: boolean;
  circleId?: string;
}) {
  const now = new Date();
  const where: any = {};

  // Filter by active status
  if (options?.active === true) {
    where.isActive = true;
    where.startsAt = { lte: now };
    where.endsAt = { gte: now };
  } else if (options?.active === false) {
    where.OR = [
      { isActive: false },
      { endsAt: { lt: now } },
    ];
  }

  // Filter by circle
  if (options?.circleId) {
    where.circleId = options.circleId;
  }

  // Get challenges with participation info
  const challenges = await prisma.challenge.findMany({
    where,
    include: {
      circle: {
        select: { id: true, name: true, emoji: true },
      },
      participants: {
        where: options?.joined ? { userId } : undefined,
        select: {
          id: true,
          userId: true,
          progress: true,
          rank: true,
          completedAt: true,
        },
      },
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { startsAt: 'desc' },
  });

  // Add user's participation status
  return challenges.map(challenge => {
    const userParticipation = challenge.participants.find(p => p.userId === userId);
    return {
      ...challenge,
      isJoined: !!userParticipation,
      myProgress: userParticipation?.progress || 0,
      myRank: userParticipation?.rank,
      isCompleted: !!userParticipation?.completedAt,
      participantCount: challenge._count.participants,
    };
  });
}

// ==========================================
// GET CHALLENGE BY ID
// ==========================================

export async function getChallengeById(challengeId: string, userId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      circle: {
        select: { id: true, name: true, emoji: true },
      },
      participants: {
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
        orderBy: [{ progress: 'desc' }, { joinedAt: 'asc' }],
      },
    },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const userParticipation = challenge.participants.find(p => p.userId === userId);
  
  // Calculate ranks
  const rankedParticipants = challenge.participants.map((p, index) => ({
    ...p,
    rank: index + 1,
    percentComplete: Math.min(100, Math.round((p.progress / challenge.targetValue) * 100)),
  }));

  return {
    ...challenge,
    participants: rankedParticipants,
    isJoined: !!userParticipation,
    myProgress: userParticipation?.progress || 0,
    myRank: rankedParticipants.find(p => p.userId === userId)?.rank,
    isCompleted: !!userParticipation?.completedAt,
    participantCount: challenge.participants.length,
  };
}

// ==========================================
// CREATE CHALLENGE
// ==========================================

export async function createChallenge(userId: string, data: {
  title: string;
  description?: string;
  emoji?: string;
  type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM';
  targetValue: number;
  startsAt: Date;
  endsAt: Date;
  xpReward?: number;
  circleId?: string;
}) {
  // If circle challenge, verify user is member
  if (data.circleId) {
    const membership = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: data.circleId, userId } },
    });
    if (!membership) {
      throw new Error('You must be a member of the circle to create a challenge');
    }
  }

  const challenge = await prisma.challenge.create({
    data: {
      title: data.title,
      description: data.description,
      emoji: data.emoji || '🏆',
      type: data.type,
      targetValue: data.targetValue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      xpReward: data.xpReward || 100,
      circleId: data.circleId,
      isActive: true,
    },
    include: {
      circle: {
        select: { id: true, name: true, emoji: true },
      },
    },
  });

  // Auto-join creator
  await prisma.challengeParticipant.create({
    data: {
      challengeId: challenge.id,
      userId,
      progress: 0,
    },
  });

  // If circle challenge, post to feed
  if (data.circleId) {
    // Create feed post announcing the challenge
    await prisma.post.create({
      data: {
        circleId: data.circleId,
        authorId: userId,
        type: 'challenge',
        content: JSON.stringify({
          challengeId: challenge.id,
          title: challenge.title,
          emoji: challenge.emoji,
          type: data.type,
          targetValue: data.targetValue,
          xpReward: challenge.xpReward,
          endsAt: challenge.endsAt,
          description: challenge.description,
        }),
      },
    });
  }

  return challenge;
}

// ==========================================
// UPDATE CHALLENGE
// ==========================================

export async function updateChallenge(challengeId: string, userId: string, data: {
  title?: string;
  description?: string;
  emoji?: string;
  targetValue?: number;
  endsAt?: Date;
  xpReward?: number;
}) {
  // Check if challenge exists and user is creator (first participant)
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: {
        orderBy: { joinedAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Only the creator (first participant) can edit
  if (challenge.participants[0]?.userId !== userId) {
    throw new Error('Only the challenge creator can edit this challenge');
  }

  const updated = await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.emoji && { emoji: data.emoji }),
      ...(data.targetValue && { targetValue: data.targetValue }),
      ...(data.endsAt && { endsAt: data.endsAt }),
      ...(data.xpReward && { xpReward: data.xpReward }),
    },
    include: {
      circle: {
        select: { id: true, name: true, emoji: true },
      },
    },
  });

  return updated;
}

// ==========================================
// DELETE CHALLENGE
// ==========================================

export async function deleteChallenge(challengeId: string, userId: string) {
  // Check if challenge exists and user is creator (first participant)
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      participants: {
        orderBy: { joinedAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Only the creator (first participant) can delete
  if (challenge.participants[0]?.userId !== userId) {
    throw new Error('Only the challenge creator can delete this challenge');
  }

  // Delete all participants first, then the challenge
  await prisma.challengeParticipant.deleteMany({
    where: { challengeId },
  });

  await prisma.challenge.delete({
    where: { id: challengeId },
  });

  return { deleted: true };
}

// ==========================================
// JOIN CHALLENGE
// ==========================================

export async function joinChallenge(challengeId: string, userId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { circle: true },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Check if challenge is active
  const now = new Date();
  if (!challenge.isActive || challenge.endsAt < now) {
    throw new Error('This challenge has ended');
  }

  // If circle challenge, verify membership
  if (challenge.circleId) {
    const membership = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: challenge.circleId, userId } },
    });
    if (!membership) {
      throw new Error('You must be a member of the circle to join this challenge');
    }
  }

  // Check if already joined
  const existing = await prisma.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });

  if (existing) {
    throw new Error('You have already joined this challenge');
  }

  const participant = await prisma.challengeParticipant.create({
    data: {
      challengeId,
      userId,
      progress: 0,
    },
    include: {
      challenge: {
        select: { title: true, emoji: true, targetValue: true, circleId: true },
      },
    },
  });

  return participant;
}

// ==========================================
// LEAVE CHALLENGE
// ==========================================

export async function leaveChallenge(challengeId: string, userId: string) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });

  if (!participant) {
    throw new Error('You are not participating in this challenge');
  }

  if (participant.completedAt) {
    throw new Error('Cannot leave a completed challenge');
  }

  await prisma.challengeParticipant.delete({
    where: { challengeId_userId: { challengeId, userId } },
  });

  return { success: true };
}

// ==========================================
// UPDATE PROGRESS
// ==========================================

export async function updateProgress(
  challengeId: string, 
  userId: string, 
  incrementBy: number
) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
    include: {
      challenge: true,
    },
  });

  if (!participant) {
    throw new Error('You are not participating in this challenge');
  }

  if (participant.completedAt) {
    return participant; // Already completed
  }

  const challenge = participant.challenge;
  const now = new Date();

  // Check if challenge is still active
  if (!challenge.isActive || challenge.endsAt < now) {
    throw new Error('This challenge has ended');
  }

  const newProgress = participant.progress + incrementBy;
  const isCompleted = newProgress >= challenge.targetValue;

  const updated = await prisma.challengeParticipant.update({
    where: { challengeId_userId: { challengeId, userId } },
    data: {
      progress: newProgress,
      completedAt: isCompleted ? now : null,
    },
    include: {
      challenge: {
        select: { title: true, emoji: true, targetValue: true, xpReward: true, circleId: true },
      },
    },
  });

  // Award XP if completed
  let xpAwarded = 0;
  if (isCompleted && challenge.xpReward > 0) {
    const xpResult = await addXp(userId, challenge.xpReward, 'Challenge completed');
    xpAwarded = challenge.xpReward;
    
    // Update user's challengesWon count
    await prisma.user.update({
      where: { id: userId },
      data: { challengesWon: { increment: 1 } },
    });
  }

  return {
    ...updated,
    isCompleted,
    xpAwarded,
  };
}

// ==========================================
// GET LEADERBOARD
// ==========================================

export async function getLeaderboard(challengeId: string, limit = 10) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const participants = await prisma.challengeParticipant.findMany({
    where: { challengeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          level: true,
        },
      },
    },
    orderBy: [{ progress: 'desc' }, { joinedAt: 'asc' }],
    take: limit,
  });

  return participants.map((p, index) => ({
    rank: index + 1,
    user: p.user,
    progress: p.progress,
    percentComplete: Math.min(100, Math.round((p.progress / challenge.targetValue) * 100)),
    isCompleted: !!p.completedAt,
    completedAt: p.completedAt,
  }));
}

// ==========================================
// AUTO-UPDATE CHALLENGE PROGRESS
// Called when user completes tasks/focus sessions
// ==========================================

export async function autoUpdateChallengeProgress(
  userId: string,
  type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS',
  amount: number
) {
  const now = new Date();

  // Find all active challenges of this type that user has joined
  const participations = await prisma.challengeParticipant.findMany({
    where: {
      userId,
      completedAt: null,
      challenge: {
        type,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    },
    include: {
      challenge: true,
    },
  });

  const results = [];
  for (const participation of participations) {
    const result = await updateProgress(participation.challengeId, userId, amount);
    results.push(result);
  }

  return results;
}

// ==========================================
// GET AVAILABLE CHALLENGES (Global + Circle)
// ==========================================

export async function getAvailableChallenges(userId: string) {
  const now = new Date();

  // Get user's circle memberships
  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    select: { circleId: true },
  });
  const circleIds = memberships.map(m => m.circleId);

  // Get global challenges + user's circle challenges
  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        { circleId: null }, // Global challenges
        { circleId: { in: circleIds } }, // User's circle challenges
      ],
    },
    include: {
      circle: {
        select: { id: true, name: true, emoji: true },
      },
      participants: {
        where: { userId },
        select: { id: true, progress: true, completedAt: true },
      },
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { startsAt: 'desc' },
  });

  return challenges.map(challenge => {
    const userParticipation = challenge.participants[0];
    return {
      ...challenge,
      isJoined: !!userParticipation,
      myProgress: userParticipation?.progress || 0,
      isCompleted: !!userParticipation?.completedAt,
      participantCount: challenge._count.participants,
    };
  });
}
