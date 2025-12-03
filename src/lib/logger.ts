/**
 * Logger Utility
 * Provides structured logging for the WHOIS service
 */

import winston from 'winston';

// Create custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create JSON format for production/file logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || 'info';

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: jsonFormat,
  defaultMeta: { service: 'whois-service' },
  transports: [
    // Console transport with colored output
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    }),
  ],
});

// Export logger methods for convenience
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
};

export default logger;
