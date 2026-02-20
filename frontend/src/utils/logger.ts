/**
 * Development-only logging utility.
 * All logs are silenced in production builds.
 * Uses React Native's __DEV__ global (true in dev, false in release).
 */

type LogLevel = 'log' | 'warn' | 'error';

function createLogger(level: LogLevel) {
  return (...args: unknown[]) => {
    if (__DEV__) {
      console[level](...args);
    }
  };
}

export const devLog = createLogger('log');
export const devWarn = createLogger('warn');
export const devError = createLogger('error');
