import * as Sentry from '@sentry/nextjs';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log metadata interface
 */
export interface LogMetadata {
  [key: string]: unknown;
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: Error | string;
}

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  environment: string;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level based on environment
    this.minLevel = this.getMinLogLevel();
  }

  /**
   * Get minimum log level based on environment
   */
  private getMinLogLevel(): LogLevel {
    const env = process.env.NODE_ENV;
    const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();

    if (configuredLevel) {
      return configuredLevel as LogLevel;
    }

    // Default levels by environment
    switch (env) {
      case 'production':
        return LogLevel.INFO;
      case 'test':
        return LogLevel.ERROR;
      default:
        return LogLevel.DEBUG;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Format log entry
   */
  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Output log entry
   */
  private output(logEntry: LogEntry): void {
    const { level, message, metadata } = logEntry;

    if (process.env.NODE_ENV === 'production') {
      // Structured JSON logging for production
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable logging for development
      const emoji = {
        [LogLevel.DEBUG]: '🔍',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console.log('  Metadata:', metadata);
      }
    }

    // Send errors and warnings to Sentry
    if (level === LogLevel.ERROR && metadata?.error) {
      const error = metadata.error instanceof Error 
        ? metadata.error 
        : new Error(String(metadata.error));
      
      Sentry.captureException(error, {
        contexts: {
          custom: metadata,
        },
        level: 'error',
      });
    } else if (level === LogLevel.WARN) {
      Sentry.captureMessage(message, {
        contexts: {
          custom: metadata,
        },
        level: 'warning',
      });
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const logEntry = this.formatLog(LogLevel.DEBUG, message, metadata);
    this.output(logEntry);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const logEntry = this.formatLog(LogLevel.INFO, message, metadata);
    this.output(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const logEntry = this.formatLog(LogLevel.WARN, message, metadata);
    this.output(logEntry);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const logEntry = this.formatLog(LogLevel.ERROR, message, {
      ...metadata,
      error,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
    
    this.output(logEntry);
  }

  /**
   * Create a child logger with default metadata
   */
  child(defaultMetadata: LogMetadata): Logger {
    const childLogger = new Logger();
    
    // Override methods to include default metadata
    const originalDebug = childLogger.debug.bind(childLogger);
    const originalInfo = childLogger.info.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);

    childLogger.debug = (message: string, metadata?: LogMetadata) => {
      originalDebug(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.info = (message: string, metadata?: LogMetadata) => {
      originalInfo(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.warn = (message: string, metadata?: LogMetadata) => {
      originalWarn(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.error = (message: string, error?: Error, metadata?: LogMetadata) => {
      originalError(message, error, { ...defaultMetadata, ...metadata });
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger for a specific context
 */
export function createLogger(context: string, metadata?: LogMetadata): Logger {
  return logger.child({
    context,
    ...metadata,
  });
}
