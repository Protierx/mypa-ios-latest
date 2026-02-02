import React from 'react';
import { Alert } from 'react-native';

/**
 * Comprehensive error handling utilities
 * Provides user-friendly error messages and logging
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  statusCode?: number;
  originalError?: Error;
}

// Error message mappings
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
  'TIMEOUT_ERROR': 'The request took too long. Please try again.',
  'SERVER_ERROR': 'Server error. Please try again later.',
  'FORBIDDEN': 'You don\'t have permission to access this resource.',
  'NOT_FOUND': 'The requested resource was not found.',
  'UNAUTHORIZED': 'Your session has expired. Please log in again.',
  'BAD_REQUEST': 'Invalid request. Please check your input.',
  
  // Auth errors
  'INVALID_CREDENTIALS': 'Invalid email or password.',
  'USER_NOT_FOUND': 'User account not found.',
  'EMAIL_TAKEN': 'This email is already registered.',
  'WEAK_PASSWORD': 'Password must be at least 8 characters with numbers and symbols.',
  
  // Task errors
  'TASK_NOT_FOUND': 'Task not found.',
  'INVALID_TASK': 'Invalid task data.',
  
  // Circle errors
  'CIRCLE_NOT_FOUND': 'Circle not found.',
  'INVALID_INVITE_CODE': 'Invalid or expired invite code.',
  
  // Challenge errors
  'CHALLENGE_NOT_FOUND': 'Challenge not found.',
  'CHALLENGE_FULL': 'This challenge is full.',
  
  // Generic errors
  'UNKNOWN_ERROR': 'Something went wrong. Please try again.',
  'OPERATION_FAILED': 'Operation failed. Please try again.',
};

/**
 * Parse API errors into user-friendly messages
 */
export function parseError(error: any): AppError {
  // Handle network errors
  if (!error.response) {
    if (error.message === 'Network Error') {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: ERROR_MESSAGES.NETWORK_ERROR,
      };
    }
    if (error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: error.message,
        userMessage: ERROR_MESSAGES.TIMEOUT_ERROR,
      };
    }
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Handle HTTP status codes
  switch (status) {
    case 400:
      return {
        code: 'BAD_REQUEST',
        message: error.message,
        userMessage: data?.message || ERROR_MESSAGES.BAD_REQUEST,
        statusCode: status,
        originalError: error,
      };
    case 401:
      return {
        code: 'UNAUTHORIZED',
        message: error.message,
        userMessage: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: status,
        originalError: error,
      };
    case 403:
      return {
        code: 'FORBIDDEN',
        message: error.message,
        userMessage: ERROR_MESSAGES.FORBIDDEN,
        statusCode: status,
        originalError: error,
      };
    case 404:
      return {
        code: 'NOT_FOUND',
        message: error.message,
        userMessage: ERROR_MESSAGES.NOT_FOUND,
        statusCode: status,
        originalError: error,
      };
    case 500:
    case 502:
    case 503:
      return {
        code: 'SERVER_ERROR',
        message: error.message,
        userMessage: ERROR_MESSAGES.SERVER_ERROR,
        statusCode: status,
        originalError: error,
      };
    default:
      // Check for specific error codes in response
      const errorCode = data?.code || data?.error;
      if (errorCode && ERROR_MESSAGES[errorCode]) {
        return {
          code: errorCode,
          message: error.message,
          userMessage: ERROR_MESSAGES[errorCode],
          statusCode: status,
          originalError: error,
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: data?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        statusCode: status,
        originalError: error,
      };
  }
}

/**
 * Show error to user via Alert
 */
export function showError(error: any, title: string = 'Error') {
  const parsed = typeof error === 'string' ? { userMessage: error } : parseError(error);
  
  Alert.alert(
    title,
    parsed.userMessage,
    [{ text: 'OK', onPress: () => {} }]
  );
}

/**
 * Show error with retry option
 */
export function showErrorWithRetry(
  error: any,
  onRetry: () => void,
  title: string = 'Error'
) {
  const parsed = typeof error === 'string' ? { userMessage: error } : parseError(error);
  
  Alert.alert(
    title,
    parsed.userMessage,
    [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      { text: 'Retry', onPress: onRetry },
    ]
  );
}

/**
 * Log error safely (without sensitive data)
 */
export function logError(error: any, context?: string) {
  if (__DEV__) {
    console.error(`[${context || 'ERROR'}]`, error);
  } else {
    // In production, send to error tracking service (Sentry, etc.)
    console.error(`[${context || 'ERROR'}]`, error.message);
  }
}

/**
 * Handle API error with logging and user feedback
 */
export function handleApiError(
  error: any,
  context: string,
  showAlert: boolean = true,
  onRetry?: () => void
) {
  logError(error, context);
  
  if (showAlert) {
    if (onRetry) {
      showErrorWithRetry(error, onRetry, context);
    } else {
      showError(error, context);
    }
  }
  
  return parseError(error);
}
