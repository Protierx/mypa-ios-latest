import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../styles';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Log to crash reporting service (Sentry)
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <AlertCircle size={64} color={colors.destructive} strokeWidth={1.5} />
            </View>
            
            <Text style={styles.title}>Oops! Something Went Wrong</Text>
            
            <Text style={styles.message}>
              We're sorry for the inconvenience. Our team has been notified of this issue.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.secondaryForeground,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.destructive,
    maxHeight: 150,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.destructive,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 11,
    color: colors.secondaryForeground,
    fontFamily: 'Courier',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
