import { Command } from 'commander';
import fs from 'fs';
import type { Stats } from 'fs';
import path from 'path';
import {
  showRedteamProviderLabelMissingWarning,
  doEval,
  evalCommand,
} from '../../src/commands/eval';
import { evaluate } from '../../src/evaluator';
import logger from '../../src/logger';
import * as configLoader from '../../src/util/config/load';

jest.mock('fs');
jest.mock('path');
jest.mock('../../src/logger');
jest.mock('../../src/evaluator', () => ({
  DEFAULT_MAX_CONCURRENCY: 4,
  evaluate: jest.fn(),
}));
jest.mock('../../src/cliState', () => ({
  remote: false,
}));
jest.mock('../../src/util/config/load');

describe('showRedteamProviderLabelMissingWarning', () => {
  const mockLoggerWarn = jest.spyOn(logger, 'warn').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log a warning if a provider is missing a label', () => {
    const testSuite = {
      providers: [{ label: 'provider1' }, {}],
    };

    showRedteamProviderLabelMissingWarning(testSuite as any);

    expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('Warning'));
  });

  it('should not log a warning if all providers have labels', () => {
    const testSuite = {
      providers: [{ label: 'provider1' }, { label: 'provider2' }],
    };

    showRedteamProviderLabelMissingWarning(testSuite as any);

    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });
});

describe('doEval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const mockStats: Stats = {
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      size: 0,
      blksize: 0,
      blocks: 0,
      atimeMs: 0,
      mtimeMs: 0,
      ctimeMs: 0,
      birthtimeMs: 0,
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      birthtime: new Date(),
    };

    jest.mocked(fs.existsSync).mockReturnValue(true);
    jest.mocked(fs.statSync).mockReturnValue(mockStats);
    jest.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        prompts: [],
        providers: [],
        tests: [],
      }),
    );
    jest.mocked(path.parse).mockReturnValue({ ext: '.yaml' } as path.ParsedPath);

    jest.mocked(configLoader.resolveConfigs).mockResolvedValue({
      testSuite: {
        prompts: [],
        providers: [],
        tests: [],
      },
      config: {},
      basePath: '/',
    });
  });

  it('should call the evaluation process with correct parameters', async () => {
    const mockCmdObj = {
      verbose: true,
      cache: false,
      write: true,
      config: ['config.yaml'],
    };
    const mockDefaultConfig = {};
    const mockEvaluateOptions = {};

    const mockEvalResult = {
      prompts: [
        {
          metrics: {
            testPassCount: 1,
            testFailCount: 0,
            testErrorCount: 0,
            tokenUsage: { total: 100 },
          },
        },
      ],
    };
    jest.mocked(evaluate).mockResolvedValue(mockEvalResult as any);

    const result = await doEval(mockCmdObj, mockDefaultConfig, 'config.yaml', mockEvaluateOptions);

    expect(result).toEqual(mockEvalResult);
    expect(evaluate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        showProgressBar: true,
      }),
    );
  });

  it('should log evaluation results correctly', async () => {
    const mockCmdObj = {
      verbose: true,
      cache: false,
      write: false,
      config: ['config.yaml'],
    };
    const mockDefaultConfig = {};
    const mockEvaluateOptions = {};

    const mockEvalResult = {
      prompts: [
        {
          metrics: {
            testPassCount: 3,
            testFailCount: 1,
            testErrorCount: 0,
            tokenUsage: { total: 100 },
          },
        },
      ],
    };
    jest.mocked(evaluate).mockResolvedValue(mockEvalResult as any);

    const mockLoggerInfo = jest.spyOn(logger, 'info').mockImplementation();

    await doEval(mockCmdObj, mockDefaultConfig, 'config.yaml', mockEvaluateOptions);

    expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Successes: 3'));
    expect(mockLoggerInfo).toHaveBeenCalledWith(expect.stringContaining('Failures: 1'));
  });
});

describe('evalCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    jest.clearAllMocks();
  });

  it('should correctly setup the eval command', () => {
    const cmd = evalCommand(program, {}, undefined);

    expect(cmd.name()).toBe('eval');
    expect(cmd.description()).toBe('Evaluate prompts');
  });

  it('should setup command with correct options', () => {
    const cmd = evalCommand(program, {}, undefined);
    const options = cmd.options;

    expect(options.some((opt) => opt.long === '--config')).toBe(true);
    expect(options.some((opt) => opt.long === '--verbose')).toBe(true);
    expect(options.some((opt) => opt.long === '--no-write')).toBe(true);
  });

  it('should handle default configuration', () => {
    const defaultConfig = {
      commandLineOptions: {
        verbose: true,
        write: true,
      },
    };

    const cmd = evalCommand(program, defaultConfig, '/path/to/config');
    expect(cmd).toBeDefined();
  });
});
