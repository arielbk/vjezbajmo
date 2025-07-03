// Client-side logger for browser environments
// Uses console in development with structured format, silent in production unless needed

interface LogData {
  [key: string]: unknown;
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: string, message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    
    if (data && Object.keys(data).length > 0) {
      return `${prefix} ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      if (data) {
        console.log(this.formatMessage('debug', message), data);
      } else {
        console.log(this.formatMessage('debug', message));
      }
    }
  }

  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      if (data) {
        console.info(this.formatMessage('info', message), data);
      } else {
        console.info(this.formatMessage('info', message));
      }
    }
  }

  warn(message: string, data?: LogData) {
    if (data) {
      console.warn(this.formatMessage('warn', message), data);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  error(message: string, error?: Error | unknown) {
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message), error);
    } else if (error) {
      console.error(this.formatMessage('error', message), error);
    } else {
      console.error(this.formatMessage('error', message));
    }
  }

  // Exercise-specific logging for client components
  exercise = {
    start: (exerciseType: string, data?: LogData) => 
      this.info('Exercise started', { exerciseType, ...data }),
    
    complete: (exerciseType: string, score?: number, data?: LogData) => 
      this.info('Exercise completed', { exerciseType, score, ...data }),
    
    error: (exerciseType: string, error: Error | string, data?: LogData) => 
      this.error('Exercise error', { exerciseType, error, ...data }),
    
    generateStart: (exerciseType: string) => 
      this.debug('Auto-generating exercises', { exerciseType }),
    
    generateError: (exerciseType: string, error: Error | string) => 
      this.error('Failed to auto-generate exercises', { exerciseType, error }),
  };

  // User interaction logging
  user = {
    answerSubmitted: (questionId: string, correct: boolean, data?: LogData) => 
      this.debug('Answer submitted', { questionId, correct, ...data }),
    
    settingChanged: (setting: string, value: unknown) => 
      this.info('Setting changed', { setting, value }),
    
    navigationAttempt: (from: string, to: string) => 
      this.debug('Navigation attempt', { from, to }),
  };
}

export const clientLogger = new ClientLogger();