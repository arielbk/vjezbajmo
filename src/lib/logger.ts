import pino from 'pino';

// Create the logger with environment-specific configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Pretty print in development, structured in production
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      singleLine: false,
    },
  } : undefined,
  // Add base fields for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'vjezbajmo',
  },
  // Custom serializers for better log output
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Format timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions for common logging patterns
export const exerciseLogger = {
  debug: (msg: string, data?: Record<string, unknown>) => logger.debug(data, msg),
  info: (msg: string, data?: Record<string, unknown>) => logger.info(data, msg),
  warn: (msg: string, data?: Record<string, unknown>) => logger.warn(data, msg),
  error: (msg: string, error?: Error | unknown) => {
    if (error instanceof Error) {
      logger.error({ error }, msg);
    } else {
      logger.error(error, msg);
    }
  },
  
  // Exercise-specific logging helpers
  exerciseGeneration: {
    start: (exerciseType: string, cefrLevel: string, provider: string, theme?: string) => 
      logger.info({
        exerciseType,
        cefrLevel,
        provider,
        theme,
        action: 'exercise_generation_start'
      }, 'Starting exercise generation'),
    
    success: (exerciseType: string, cefrLevel: string, provider: string, exerciseId: string) => 
      logger.info({
        exerciseType,
        cefrLevel,
        provider,
        exerciseId,
        action: 'exercise_generation_success'
      }, 'Exercise generation completed successfully'),
    
    error: (exerciseType: string, cefrLevel: string, provider: string, error: Error) => 
      logger.error({
        exerciseType,
        cefrLevel,
        provider,
        error,
        action: 'exercise_generation_error'
      }, 'Exercise generation failed'),
  },
  
  cache: {
    hit: (cacheKey: string, availableCount: number) => 
      logger.info({
        cacheKey,
        availableCount,
        action: 'cache_hit'
      }, 'Serving exercise from cache'),
    
    miss: (cacheKey: string, reason: string) => 
      logger.info({
        cacheKey,
        reason,
        action: 'cache_miss'
      }, 'Cache miss, generating new exercise'),
    
    store: (cacheKey: string, exerciseId: string) => 
      logger.info({
        cacheKey,
        exerciseId,
        action: 'cache_store'
      }, 'Exercise cached successfully'),
  },
  
  api: {
    request: (method: string, path: string, data?: Record<string, unknown>) => 
      logger.info({
        method,
        path,
        data,
        action: 'api_request'
      }, 'API request received'),
    
    response: (method: string, path: string, status: number, duration?: number) => 
      logger.info({
        method,
        path,
        status,
        duration,
        action: 'api_response'
      }, 'API response sent'),
  },
  
  user: {
    exerciseCompleted: (exerciseType: string, cefrLevel: string, exerciseId: string, score?: number) => 
      logger.info({
        exerciseType,
        cefrLevel,
        exerciseId,
        score,
        action: 'exercise_completed'
      }, 'User completed exercise'),
    
    settingsChanged: (setting: string, value: unknown) => 
      logger.info({
        setting,
        value,
        action: 'settings_changed'
      }, 'User settings changed'),
  },
};

export default logger;