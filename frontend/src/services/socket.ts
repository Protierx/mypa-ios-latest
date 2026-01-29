/**
 * Socket Service - Real-time communication with backend
 */
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://172.20.10.3:3000';
const TOKEN_KEY = 'mypa_access_token';

// Socket events that the frontend can listen to
export type SocketEvent = 
  // Circle events
  | 'circle:member_joined'
  | 'circle:member_left'
  | 'circle:updated'
  // Assignment events
  | 'assignment:new'
  | 'assignment:created'
  | 'assignment:updated'
  | 'assignment:accepted'
  | 'assignment:declined'
  | 'assignment:completed'
  // Post events
  | 'post:new'
  | 'post:deleted'
  | 'post:reaction'
  // Notification events
  | 'notification:new';

// Event data types
export interface MemberJoinedData {
  circleId: string;
  member: {
    userId: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  timestamp: string;
}

export interface MemberLeftData {
  circleId: string;
  userId: string;
  memberName: string | null;
  timestamp: string;
}

export interface AssignmentData {
  assignment: any;
  timestamp: string;
}

export interface AssignmentUpdatedData {
  circleId: string;
  assignment: any;
  action: 'accepted' | 'declined' | 'completed';
  timestamp: string;
}

export interface PostData {
  circleId: string;
  post: any;
  timestamp: string;
}

export interface ReactionData {
  circleId: string;
  postId: string;
  reaction: any;
  action: 'added' | 'removed';
  timestamp: string;
}

export interface NotificationData {
  notification: any;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  // Connect to socket server
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return true;
    }

    if (this.isConnecting) {
      console.log('Socket connection in progress...');
      return false;
    }

    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        console.log('No token available for socket connection');
        this.isConnecting = false;
        return false;
      }

      this.socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
      });

      // Set up connection event handlers
      this.socket.on('connect', () => {
        console.log('🔌 Socket connected:', this.socket?.id);
        this.isConnecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error.message);
        this.isConnecting = false;
      });

      // Set up all event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('Socket connection failed:', error);
      this.isConnecting = false;
      return false;
    }
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Join a circle room (to receive circle-specific events)
  joinCircle(circleId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join:circle', circleId);
      console.log('Joined circle room:', circleId);
    }
  }

  // Leave a circle room
  leaveCircle(circleId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave:circle', circleId);
      console.log('Left circle room:', circleId);
    }
  }

  // Subscribe to an event
  on(event: SocketEvent, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Unsubscribe from an event
  off(event: SocketEvent, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  // Set up internal event listeners that forward to registered callbacks
  private setupEventListeners() {
    if (!this.socket) return;

    const events: SocketEvent[] = [
      'circle:member_joined',
      'circle:member_left',
      'circle:updated',
      'assignment:new',
      'assignment:created',
      'assignment:updated',
      'assignment:accepted',
      'assignment:declined',
      'assignment:completed',
      'post:new',
      'post:deleted',
      'post:reaction',
      'notification:new',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        console.log(`📨 Socket event: ${event}`, data);
        this.listeners.get(event)?.forEach((callback) => callback(data));
      });
    });
  }
}

// Export singleton instance
export const socketService = new SocketService();

// React hook for using socket in components
import { useEffect, useCallback, useRef } from 'react';

export function useSocket() {
  const connect = useCallback(async () => {
    return socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const joinCircle = useCallback((circleId: string) => {
    socketService.joinCircle(circleId);
  }, []);

  const leaveCircle = useCallback((circleId: string) => {
    socketService.leaveCircle(circleId);
  }, []);

  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  return {
    connect,
    disconnect,
    joinCircle,
    leaveCircle,
    isConnected,
  };
}

// Hook to subscribe to a specific socket event
export function useSocketEvent<T = any>(
  event: SocketEvent,
  callback: (data: T) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = socketService.on(event, (data: T) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [event, ...deps]);
}
