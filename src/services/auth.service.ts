import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { env } from '../config/env.js';
import { TokenPair, JwtPayload, UserPublic } from '../types/index.js';
import { AppError } from '../middleware/error.js';
import { calculateLevel, getDefaultSettings } from '../utils/xp.js';

const SALT_ROUNDS = 10;

// Parse duration string to seconds for JWT
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)(m|h|d)$/);
  if (!match) return 15 * 60; // Default 15 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 15 * 60;
  }
}

// Parse duration string to milliseconds for Date calculations
function parseDuration(duration: string): number {
  return parseDurationToSeconds(duration) * 1000;
}

function generateAccessToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    sub: userId,
    email,
    type: 'access',
  };
  
  const options: SignOptions = {
    expiresIn: parseDurationToSeconds(env.ACCESS_TOKEN_EXPIRY),
  };
  
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

function generateRefreshToken(userId: string, email: string): string {
  const payload: JwtPayload = {
    sub: userId,
    email,
    type: 'refresh',
  };
  
  const options: SignOptions = {
    expiresIn: parseDurationToSeconds(env.REFRESH_TOKEN_EXPIRY),
  };
  
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<{ user: UserPublic; tokens: TokenPair }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Create user with settings
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name?.trim() || null,
      settings: {
        create: getDefaultSettings(),
      },
    },
  });
  
  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);
  
  // Store refresh token
  const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });
  
  return {
    user: formatUserPublic(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: UserPublic; tokens: TokenPair }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!validPassword) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);
  
  // Store refresh token
  const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });
  
  return {
    user: formatUserPublic(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // Verify the refresh token
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
  
  if (payload.type !== 'refresh') {
    throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
  }
  
  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  
  if (!storedToken) {
    throw new AppError('Refresh token not found', 401, 'TOKEN_NOT_FOUND');
  }
  
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');
  }
  
  // Delete old refresh token (rotation)
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  
  // Generate new tokens
  const newAccessToken = generateAccessToken(storedToken.user.id, storedToken.user.email);
  const newRefreshToken = generateRefreshToken(storedToken.user.id, storedToken.user.email);
  
  // Store new refresh token
  const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt,
    },
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Helper to format user for public response
function formatUserPublic(user: any): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    tasksCompleted: user.tasksCompleted,
    focusMinutes: user.focusMinutes,
    challengesWon: user.challengesWon,
    totalTimeSaved: user.totalTimeSaved,
    isOnboarded: user.isOnboarded,
    createdAt: user.createdAt,
  };
}

export { formatUserPublic };
