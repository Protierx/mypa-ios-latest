/**
 * Socket Service
 * Real-time events for circles, assignments, and posts
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/database.js';

let io: SocketServer | null = null;

// User socket mapping
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function initializeSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // Configure this for production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      
      if (payload.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      // Attach user to socket
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', handleConnection);

  console.log('🔌 Socket.io initialized');
  return io;
}

function handleConnection(socket: Socket) {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId} (socket: ${socket.id})`);

  // Track user's socket
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socket.id);

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join all user's circles
  joinUserCircles(socket, userId);

  // Handle events
  socket.on('join:circle', (circleId: string) => {
    socket.join(`circle:${circleId}`);
    console.log(`User ${userId} joined circle room: ${circleId}`);
  });

  socket.on('leave:circle', (circleId: string) => {
    socket.leave(`circle:${circleId}`);
    console.log(`User ${userId} left circle room: ${circleId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId} (socket: ${socket.id})`);
    userSockets.get(userId)?.delete(socket.id);
    if (userSockets.get(userId)?.size === 0) {
      userSockets.delete(userId);
    }
  });
}

async function joinUserCircles(socket: Socket, userId: string) {
  try {
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    });

    memberships.forEach((m) => {
      socket.join(`circle:${m.circleId}`);
    });

    console.log(`User ${userId} joined ${memberships.length} circle rooms`);
  } catch (error) {
    console.error('Error joining user circles:', error);
  }
}

// ==========================================
// EVENT EMITTERS
// ==========================================

export function getIO() {
  return io;
}

export function isSocketInitialized() {
  return io !== null;
}

// Emit to a specific user (all their connected devices)
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

// Emit to all members of a circle
export function emitToCircle(circleId: string, event: string, data: any) {
  if (!io) return;
  io.to(`circle:${circleId}`).emit(event, data);
}

// Emit to all members of a circle except one user
export function emitToCircleExcept(
  circleId: string,
  exceptUserId: string,
  event: string,
  data: any
) {
  if (!io) return;
  io.to(`circle:${circleId}`).except(`user:${exceptUserId}`).emit(event, data);
}

// ==========================================
// CIRCLE EVENTS
// ==========================================

export function emitMemberJoined(
  circleId: string,
  member: {
    userId: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  }
) {
  emitToCircle(circleId, 'circle:member_joined', {
    circleId,
    member,
    timestamp: new Date().toISOString(),
  });
}

export function emitMemberLeft(
  circleId: string,
  userId: string,
  memberName: string | null
) {
  emitToCircle(circleId, 'circle:member_left', {
    circleId,
    userId,
    memberName,
    timestamp: new Date().toISOString(),
  });
}

export function emitCircleUpdated(circleId: string, updates: any) {
  emitToCircle(circleId, 'circle:updated', {
    circleId,
    updates,
    timestamp: new Date().toISOString(),
  });
}

// ==========================================
// ASSIGNMENT EVENTS
// ==========================================

export function emitAssignmentCreated(
  circleId: string,
  assigneeId: string,
  assignment: any
) {
  // Notify the assignee directly
  emitToUser(assigneeId, 'assignment:new', {
    assignment,
    timestamp: new Date().toISOString(),
  });

  // Notify circle (for feed updates)
  emitToCircle(circleId, 'assignment:created', {
    circleId,
    assignment,
    timestamp: new Date().toISOString(),
  });
}

export function emitAssignmentUpdated(
  circleId: string,
  assignment: any,
  action: 'accepted' | 'declined' | 'completed' | 'edited' | 'reason-updated'
) {
  emitToCircle(circleId, 'assignment:updated', {
    circleId,
    assignment,
    action,
    timestamp: new Date().toISOString(),
  });

  // Notify specific user based on action
  if (['accepted', 'declined', 'reason-updated'].includes(action)) {
    // Notify creator when assignee takes action
    emitToUser(assignment.creatorId, `assignment:${action}`, {
      assignment,
      timestamp: new Date().toISOString(),
    });
  } else if (action === 'edited') {
    // Notify assignee when creator edits
    emitToUser(assignment.assigneeId, 'assignment:edited', {
      assignment,
      timestamp: new Date().toISOString(),
    });
  }
}

// ==========================================
// POST EVENTS
// ==========================================

export function emitNewPost(circleId: string, post: any) {
  emitToCircle(circleId, 'post:new', {
    circleId,
    post,
    timestamp: new Date().toISOString(),
  });
}

export function emitPostDeleted(circleId: string, postId: string) {
  emitToCircle(circleId, 'post:deleted', {
    circleId,
    postId,
    timestamp: new Date().toISOString(),
  });
}

export function emitReaction(
  circleId: string,
  postId: string,
  reaction: any,
  action: 'added' | 'removed'
) {
  emitToCircle(circleId, 'post:reaction', {
    circleId,
    postId,
    reaction,
    action,
    timestamp: new Date().toISOString(),
  });
}

// ==========================================
// NOTIFICATION EVENTS
// ==========================================

export function emitNotification(userId: string, notification: any) {
  emitToUser(userId, 'notification:new', {
    notification,
    timestamp: new Date().toISOString(),
  });
}

// ==========================================
// PRESENCE (optional enhancement)
// ==========================================

export function getUserOnlineStatus(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

export function getCircleOnlineMembers(circleId: string): string[] {
  if (!io) return [];
  
  const room = io.sockets.adapter.rooms.get(`circle:${circleId}`);
  if (!room) return [];

  const onlineUserIds: string[] = [];
  room.forEach((socketId) => {
    const socket = io!.sockets.sockets.get(socketId);
    if (socket?.data.userId) {
      onlineUserIds.push(socket.data.userId);
    }
  });

  return [...new Set(onlineUserIds)];
}
