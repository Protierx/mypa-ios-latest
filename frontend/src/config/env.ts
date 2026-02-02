/**
 * Environment Configuration
 * Centralized config that works across dev/staging/production
 */

import Constants from 'expo-constants';

// Get environment from Expo config or default based on build type
const ENV =
  Constants.expoConfig?.extra?.environment ||
  (typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production');

// Environment-specific configurations
const environments = {
  development: {
    apiUrl: 'http://192.168.1.165:3000', // Your local network IP
    socketUrl: 'http://192.168.1.165:3000',
    environment: 'development',
    enableLogging: true,
  },
  staging: {
    apiUrl: 'https://staging-api.mypa.app',
    socketUrl: 'https://staging-api.mypa.app',
    environment: 'staging',
    enableLogging: true,
  },
  production: {
    apiUrl: 'https://api.mypa.app',
    socketUrl: 'https://api.mypa.app',
    environment: 'production',
    enableLogging: false,
  },
};

// Export current environment config
export const config = environments[ENV as keyof typeof environments] || environments.development;

// Helper to check environment
export const isDevelopment = ENV === 'development';
export const isStaging = ENV === 'staging';
export const isProduction = ENV === 'production';

// Log current config in development
if (isDevelopment) {
  console.log('🔧 Environment:', ENV);
  console.log('🌐 API URL:', config.apiUrl);
}
