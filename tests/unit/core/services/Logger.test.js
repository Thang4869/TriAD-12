import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggerService, Logger } from '../../../../src/core/services/Logger.js';

describe('LoggerService', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
    };
    localStorage.removeItem('debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem('debug');
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    });
  });

  it('should set default level to INFO (unless debug enabled)', () => {
    expect(logger.level).toBe(1);
  });

  it('should enable debug level if localStorage debug=true', () => {
    localStorage.setItem('debug', 'true');
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(0);
  });

  it('should enable debug level if URL param debug=true', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?debug=true' },
      writable: true,
      configurable: true,
    });
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(0);
  });

  it('should not enable debug when no flags', () => {
    localStorage.removeItem('debug');
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    });
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(1);
  });

  it('should handle localStorage throwing error gracefully', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(1);
    localStorage.getItem = originalGetItem;
  });

  it('should setLevel change log level', () => {
    logger.setLevel(3);
    expect(logger.level).toBe(3);
  });

  describe('log methods with multiple arguments', () => {
    beforeEach(() => {
      logger.setLevel(0);
    });

    it('should log debug with multiple args', () => {
      logger.debug('msg', 'extra', 123);
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'msg', 'extra', 123);
    });

    it('should log info with multiple args', () => {
      logger.info('msg', 456, true);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'msg', 456, true);
    });

    it('should log warn with multiple args', () => {
      logger.warn('msg', { key: 'value' });
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'msg', { key: 'value' });
    });

    it('should log error with multiple args', () => {
      logger.error('msg', new Error('test'));
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'msg', new Error('test'));
    });
  });

  describe('log level filtering', () => {
    it('should log debug only if level <= DEBUG', () => {
      logger.setLevel(0);
      logger.debug('debug msg');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'debug msg');

      logger.setLevel(1);
      logger.debug('should not log');
      expect(consoleSpy.debug).toHaveBeenCalledTimes(1);
    });

    it('should log info only if level <= INFO', () => {
      logger.setLevel(1);
      logger.info('info msg');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'info msg');

      logger.setLevel(2);
      logger.info('should not log');
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    });

    it('should log warn only if level <= WARN', () => {
      logger.setLevel(2);
      logger.warn('warn msg');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'warn msg');

      logger.setLevel(3);
      logger.warn('should not log');
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    });

    it('should log error only if level <= ERROR', () => {
      logger.setLevel(3);
      logger.error('error msg');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'error msg');

      logger.setLevel(4);
      logger.error('should not log');
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('group', () => {
    it('should call group only in debug mode', () => {
      logger.setLevel(0);
      const fn = vi.fn();
      logger.group('test', fn);
      expect(consoleSpy.group).toHaveBeenCalledWith('test');
      expect(fn).toHaveBeenCalled();
      expect(consoleSpy.groupEnd).toHaveBeenCalled();

      logger.setLevel(1);
      consoleSpy.group.mockClear();
      fn.mockClear();
      logger.group('test', fn);
      expect(consoleSpy.group).not.toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
    });

    it('should not call group if level > DEBUG', () => {
      logger.setLevel(2);
      const fn = vi.fn();
      logger.group('test', fn);
      expect(consoleSpy.group).not.toHaveBeenCalled();
      expect(fn).not.toHaveBeenCalled();
      expect(consoleSpy.groupEnd).not.toHaveBeenCalled();
    });
  });
});

describe('LoggerService without window', () => {
  it('should not enable debug and return false for isDebugEnabled when window undefined', async () => {
    const originalWindow = global.window;
    vi.stubGlobal('window', undefined);
    vi.resetModules();
    const { LoggerService } = await import('../../../../src/core/services/Logger.js');
    const logger = new LoggerService();
    expect(logger.level).toBe(1);
    vi.unstubAllGlobals();
    vi.resetModules();
    await import('../../../../src/core/services/Logger.js');
  });
});

describe('Exported Logger instance', () => {
  it('should be an instance of LoggerService', () => {
    expect(Logger).toBeInstanceOf(LoggerService);
  });

  it('should have default level based on environment', () => {
    expect(Logger.level).toBeDefined();
  });
});

describe('isDebugEnabled with edge cases', () => {
  it('should return false when localStorage throws error in isDebugEnabled', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(1);
    localStorage.getItem = originalGetItem;
  });

  it('should call groupEnd when group is called in debug mode', () => {
    const logger = new LoggerService();
    logger.setLevel(0);
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const fn = vi.fn();
    logger.group('test', fn);
    expect(groupEndSpy).toHaveBeenCalled();
    groupEndSpy.mockRestore();
  });

  it('should not call groupEnd when group is called but level > DEBUG', () => {
    const logger = new LoggerService();
    logger.setLevel(2);
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const fn = vi.fn();
    logger.group('test', fn);
    expect(groupEndSpy).not.toHaveBeenCalled();
    groupEndSpy.mockRestore();
  });
});

describe('Logger - additional coverage', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
    };
    localStorage.removeItem('debug');
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem('debug');
  });

  it('isDebugEnabled should return true when localStorage contains debug=true', () => {
    localStorage.setItem('debug', 'true');
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(0);
  });

  it('isDebugEnabled should return true when URL param ?debug=true', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?debug=true' },
      writable: true,
      configurable: true,
    });
    const newLogger = new LoggerService();
    expect(newLogger.level).toBe(0);
  });

  it('setLevel should change log level correctly', () => {
    logger.setLevel(3);
    expect(logger.level).toBe(3);
    logger.setLevel(0);
    expect(logger.level).toBe(0);
  });

  it('debug() should only log when level <= DEBUG', () => {
    logger.setLevel(1);
    logger.debug('should not log');
    expect(consoleSpy.debug).not.toHaveBeenCalled();

    logger.setLevel(0);
    logger.debug('should log');
    expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'should log');
  });

  it('info() should only log when level <= INFO', () => {
    logger.setLevel(2);
    logger.info('should not log');
    expect(consoleSpy.info).not.toHaveBeenCalled();

    logger.setLevel(1);
    logger.info('should log');
    expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'should log');
  });

  it('warn() should only log when level <= WARN', () => {
    logger.setLevel(3);
    logger.warn('should not log');
    expect(consoleSpy.warn).not.toHaveBeenCalled();

    logger.setLevel(2);
    logger.warn('should log');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'should log');
  });

  it('error() should only log when level <= ERROR', () => {
    logger.setLevel(4);
    logger.error('should not log');
    expect(consoleSpy.error).not.toHaveBeenCalled();

    logger.setLevel(3);
    logger.error('should log');
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'should log');
  });

  it('group() should only execute when in debug mode', () => {
    const fn = vi.fn();
    logger.setLevel(1);
    logger.group('test', fn);
    expect(consoleSpy.group).not.toHaveBeenCalled();
    expect(fn).not.toHaveBeenCalled();

    logger.setLevel(0);
    logger.group('test', fn);
    expect(consoleSpy.group).toHaveBeenCalledWith('test');
    expect(fn).toHaveBeenCalled();
    expect(consoleSpy.groupEnd).toHaveBeenCalled();
  });

  it('should mock console methods and verify call frequency', () => {
    logger.setLevel(0);
    const debugSpy = vi.spyOn(console, 'debug');
    logger.debug('msg1');
    logger.debug('msg2');
    expect(debugSpy).toHaveBeenCalledTimes(2);
    debugSpy.mockRestore();
  });

  it('should not log debug when level > DEBUG', () => {
    logger.setLevel(1);
    logger.debug('debug');
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it('should call group only when level <= DEBUG', () => {
    logger.setLevel(0);
    const fn = vi.fn();
    logger.group('group', fn);
    expect(consoleSpy.group).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
    expect(consoleSpy.groupEnd).toHaveBeenCalled();
  });

  it('should not call group when level > DEBUG', () => {
    logger.setLevel(1);
    const fn = vi.fn();
    logger.group('test', fn);
    expect(console.group).not.toHaveBeenCalled();
  });

  it('isDebugEnabled should return false when localStorage throws', () => {
  });
});