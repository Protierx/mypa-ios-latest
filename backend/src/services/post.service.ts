/**
 * Post Service
 * Handles circle feed posts and reactions
 */

import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { addXp } from './user.service.js';
import { addCircleXp, verifyCircleMembership } from './circle.service.js';
import { XP_REWARDS } from '../utils/xp.js';

export type PostType = 'DAILY_CARD' | 'ACHIEVEMENT' | 'MILESTONE' | 'SYSTEM' | 'TEXT';

export interface CreatePostInput {
  type?: PostType;
  content?: string;
  imageUrl?: string;
  // For DAILY_CARD type
  tasksCompleted?: number;
  focusMinutes?: number;
  streakDay?: number;
}

// ==========================================
// POST CRUD
// ==========================================

export async function createPost(
  userId: string,
  circleId: string,
  input: CreatePostInput
) {
  // Verify membership
  await verifyCircleMembership(userId, circleId);

  const post = await prisma.post.create({
    data: {
      circleId,
      authorId: userId,
      type: input.type || 'TEXT',
      content: input.content?.trim(),
      imageUrl: input.imageUrl,
      tasksCompleted: input.tasksCompleted,
      focusMinutes: input.focusMinutes,
      streakDay: input.streakDay,
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
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { reactions: true },
      },
    },
  });

  // Award XP for daily card posts
  if (input.type === 'DAILY_CARD') {
    await addXp(userId, XP_REWARDS.DAILY_CARD_POST, 'Posted daily card');
    await addCircleXp(userId, circleId, XP_REWARDS.DAILY_CARD_POST);
  }

  return formatPost(post, userId);
}

export async function getPostById(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
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
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      circle: {
        select: {
          id: true,
          name: true,
          emoji: true,
        },
      },
      _count: {
        select: { reactions: true },
      },
    },
  });

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Verify user is a member of the circle
  await verifyCircleMembership(userId, post.circleId);

  return formatPost(post, userId);
}

export async function getCircleFeed(
  userId: string,
  circleId: string,
  options: {
    type?: PostType;
    limit?: number;
    offset?: number;
    before?: string; // cursor-based pagination
  } = {}
) {
  // Verify membership
  await verifyCircleMembership(userId, circleId);

  const { type, limit = 20, offset = 0, before } = options;

  const where: any = { circleId };
  if (type) where.type = type;
  if (before) where.createdAt = { lt: new Date(before) };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: before ? 0 : offset,
      take: limit,
    }),
    prisma.post.count({ where: { circleId, ...(type && { type }) } }),
  ]);

  return {
    posts: posts.map((p) => formatPost(p, userId)),
    total,
    hasMore: offset + posts.length < total,
  };
}

export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      circle: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Check permission: author, circle owner, or admin
  const membership = post.circle.members[0];
  const canDelete =
    post.authorId === userId ||
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN';

  if (!canDelete) {
    throw new AppError('Not authorized to delete this post', 403, 'UNAUTHORIZED');
  }

  await prisma.post.delete({
    where: { id: postId },
  });
}

// ==========================================
// REACTIONS
// ==========================================

const ALLOWED_EMOJIS = ['🔥', '💪', '👏', '❤️', '🎉', '👀', '😂', '🙌'];

export async function addReaction(
  userId: string,
  postId: string,
  emoji: string
) {
  // Validate emoji
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    throw new AppError(
      `Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(' ')}`,
      400,
      'INVALID_EMOJI'
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Verify membership
  await verifyCircleMembership(userId, post.circleId);

  // Check if already reacted
  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId: { postId, userId },
    },
  });

  if (existing) {
    // Update emoji if different
    if (existing.emoji !== emoji) {
      const updated = await prisma.reaction.update({
        where: { id: existing.id },
        data: { emoji },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
      return formatReaction(updated);
    }
    return formatReaction(existing);
  }

  // Create new reaction
  const reaction = await prisma.reaction.create({
    data: {
      postId,
      userId,
      emoji,
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  // Notify post author (if not self)
  if (post.authorId !== userId) {
    const reactor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: 'SYSTEM',
        title: `${emoji} New Reaction`,
        body: `${reactor?.name || 'Someone'} reacted to your post`,
        data: JSON.stringify({ postId, circleId: post.circleId }),
      },
    });
  }

  return formatReaction(reaction);
}

export async function removeReaction(userId: string, postId: string) {
  const reaction = await prisma.reaction.findUnique({
    where: {
      postId_userId: { postId, userId },
    },
  });

  if (!reaction) {
    throw new AppError('Reaction not found', 404, 'REACTION_NOT_FOUND');
  }

  await prisma.reaction.delete({
    where: { id: reaction.id },
  });
}

export async function getPostReactions(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Verify membership
  await verifyCircleMembership(userId, post.circleId);

  const reactions = await prisma.reaction.findMany({
    where: { postId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by emoji
  const grouped: Record<string, any[]> = {};
  reactions.forEach((r) => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(formatReaction(r));
  });

  return {
    reactions: reactions.map(formatReaction),
    grouped,
    total: reactions.length,
  };
}

// ==========================================
// DAILY CARD HELPERS
// ==========================================

export async function createDailyCard(userId: string, circleId: string) {
  // Get user's stats for today
  const today = new Date().toISOString().split('T')[0];

  const [tasksCompleted, focusMinutes, user] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        completed: true,
        completedAt: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.focusSession.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: new Date(today),
        },
      },
      _sum: { actualMinutes: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    }),
  ]);

  return createPost(userId, circleId, {
    type: 'DAILY_CARD',
    tasksCompleted,
    focusMinutes: focusMinutes._sum.actualMinutes || 0,
    streakDay: user?.currentStreak || 0,
  });
}

// Check if user already posted daily card today
export async function hasDailyCardToday(userId: string, circleId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.post.findFirst({
    where: {
      authorId: userId,
      circleId,
      type: 'DAILY_CARD',
      createdAt: { gte: today },
    },
  });

  return !!existing;
}

// ==========================================
// HELPERS
// ==========================================

function formatPost(post: any, currentUserId?: string) {
  const userReaction = currentUserId
    ? post.reactions?.find((r: any) => r.userId === currentUserId)
    : null;

  // Group reactions by emoji
  const reactionSummary: Record<string, number> = {};
  post.reactions?.forEach((r: any) => {
    reactionSummary[r.emoji] = (reactionSummary[r.emoji] || 0) + 1;
  });

  return {
    id: post.id,
    circleId: post.circleId,
    circle: post.circle,
    type: post.type,
    content: post.content,
    imageUrl: post.imageUrl,
    tasksCompleted: post.tasksCompleted,
    focusMinutes: post.focusMinutes,
    streakDay: post.streakDay,
    author: post.author,
    reactionCount: post._count?.reactions || 0,
    reactionSummary,
    userReaction: userReaction ? userReaction.emoji : null,
    createdAt: post.createdAt,
  };
}

function formatReaction(reaction: any) {
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    user: reaction.user,
    createdAt: reaction.createdAt,
  };
}
