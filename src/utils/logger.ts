/**
 * 日志工具
 * 在开发环境输出日志，生产环境自动禁用
 */

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 日志配置
interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
  prefix?: string;
}

class Logger {
  private config: LogConfig = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
    enableInProduction: false,
    prefix: '[Game]'
  };

  /**
   * 配置日志
   */
  configure(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === 'production' && !this.config.enableInProduction) {
      return false;
    }
    return level >= this.config.level;
  }

  /**
   * 格式化消息
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.config.prefix} [${timestamp}] [${level}] ${message}`;
  }

  /**
   * Debug 日志（仅开发环境）
   */
  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Info 日志
   */
  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  /**
   * Warning 日志
   */
  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  /**
   * Error 日志
   */
  error(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  /**
   * 创建一个带特定前缀的子日志器
   */
  createChild(prefix: string): Logger {
    const child = new Logger();
    child.configure({
      ...this.config,
      prefix: `${this.config.prefix} [${prefix}]`
    });
    return child;
  }
}

// 导出默认日志实例
export const logger = new Logger();

// 导出便捷函数
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

// 导出 Logger 类以便创建特定模块的日志器
export default Logger;