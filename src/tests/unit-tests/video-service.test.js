const VideoService = require('../../services/video');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs/promises');
const fs1 = require('fs');
const path = require('path');
const which = require('which');

jest.mock('fluent-ffmpeg');
jest.mock('which');
jest.mock('fs/promises');
jest.mock('path');

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    createReadStream: jest.fn(),
    promises: {
      access: jest.fn()
    }
  }));

describe('VideoService', () => {
  let videoService;
  const mockLimits = {
    maxDuration: 300,
    maxSize: 1024 * 1024 * 100,
    minDuration: 1
  };
  const mockConfig = {
    UPLOAD_DIR: '/upload',
    TEMP_DIR: '/temp',
    PROCESSED_DIR: '/processed'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    which.sync.mockImplementation((cmd) => {
        const isWindows = process.platform === 'win32';
        const binExt = isWindows ? '.exe' : '';
        const cmdWithExt = `${cmd}${binExt}`;
        
        const paths = {
          win32: {
            ffmpeg: 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            ffprobe: 'C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe'
          },
          unix: {
            ffmpeg: '/usr/bin/ffmpeg',
            ffprobe: '/usr/bin/ffprobe'
          }
        };
  
        const platformPaths = paths[isWindows ? 'win32' : 'unix'];
        const path = platformPaths[cmd];
  
        if (path) {
          return path;
        }
  
        throw new Error(`Command not found: ${cmdWithExt}`);
      });

    videoService = new VideoService(mockLimits, mockConfig);
  });

  describe('constructor and setup', () => {
    it('should initialize with correct limits and config', () => {
      expect(videoService.maxDuration).toBe(mockLimits.maxDuration);
      expect(videoService.maxSize).toBe(mockLimits.maxSize);
      expect(videoService.minDuration).toBe(mockLimits.minDuration);
      expect(videoService.config).toEqual(mockConfig);
    });

    it('should handle ffmpeg not found in PATH but found in common locations', () => {
      which.sync.mockImplementation(() => { throw new Error('not found'); });
      fs1.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && (filePath.includes('ffmpeg') || filePath.includes('ffprobe'));
      });
      
      expect(ffmpeg.setFfmpegPath).toHaveBeenCalled();
      expect(ffmpeg.setFfprobePath).toHaveBeenCalled();
    });

    it('should throw error when ffmpeg is not found anywhere', () => {
      which.sync.mockImplementation(() => { throw new Error('not found'); });
      fs1.existsSync.mockImplementation(() => false);
      
      expect(() => new VideoService(mockLimits, mockConfig)).toThrow('FFmpeg binaries not found');
    });
  });

  describe('initialize', () => {
    it('should create necessary directories', async () => {
      await videoService.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledTimes(2);
      expect(fs.mkdir).toHaveBeenCalledWith(mockConfig.UPLOAD_DIR, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(mockConfig.PROCESSED_DIR, { recursive: true });
    });
  });

  describe('validateVideo', () => {
    it('should validate video within limits', async () => {
      const mockMetadata = {
        format: {
          duration: 100,
          size: 1024 * 1024
        }
      };

      ffmpeg.ffprobe.mockImplementation((path, callback) => {
        callback(null, mockMetadata);
      });

      const result = await videoService.validateVideo('test.mp4');
      expect(result).toEqual({
        duration: mockMetadata.format.duration,
        size: mockMetadata.format.size
      });
    });

    it('should reject if video exceeds size limit', async () => {
      const mockMetadata = {
        format: {
          duration: 100,
          size: mockLimits.maxSize + 1
        }
      };

      ffmpeg.ffprobe.mockImplementation((path, callback) => {
        callback(null, mockMetadata);
      });

      await expect(videoService.validateVideo('test.mp4'))
        .rejects
        .toThrow('Video exceeds maximum size limit');
    });

    it('should reject if video duration is outside limits', async () => {
      const mockMetadata = {
        format: {
          duration: mockLimits.maxDuration + 1,
          size: 1024
        }
      };

      ffmpeg.ffprobe.mockImplementation((path, callback) => {
        callback(null, mockMetadata);
      });

      await expect(videoService.validateVideo('test.mp4'))
        .rejects
        .toThrow('Video duration must be between');
    });
  });

  describe('trimVideo', () => {
    it('should trim video successfully', async () => {
      const mockFFmpeg = {
        setStartTime: jest.fn().mockReturnThis(),
        setDuration: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        run: jest.fn().mockImplementation(() => {
          const endCallback = mockFFmpeg.on.mock.calls.find(call => call[0] === 'end')[1];
          endCallback();
        })
      };

      ffmpeg.mockReturnValue(mockFFmpeg);

      const result = await videoService.trimVideo('input.mp4', 'output.mp4', 0, 10);
      expect(result).toEqual({ path: 'output.mp4' });
    });

    it('should reject if start time is greater than end time', async () => {
      await expect(videoService.trimVideo('input.mp4', 'output.mp4', 10, 5))
        .rejects
        .toThrow('Start time must be less than end time');
    });
  });

  describe('mergeVideos', () => {
    it('should merge videos successfully', async () => {
      const mockFFmpeg = {
        input: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        mergeToFile: jest.fn().mockImplementation(() => {
          const endCallback = mockFFmpeg.on.mock.calls.find(call => call[0] === 'end')[1];
          endCallback();
        })
      };

      ffmpeg.mockReturnValue(mockFFmpeg);
      fs.access.mockResolvedValue(true);

      const result = await videoService.mergeVideos(['input1.mp4', 'input2.mp4'], 'output.mp4');
      expect(result).toEqual({ path: 'output.mp4' });
    });

    it('should reject if less than two input paths provided', async () => {
      await expect(videoService.mergeVideos(['input1.mp4'], 'output.mp4'))
        .rejects
        .toThrow('At least two input paths are required');
    });

    it('should reject if any input file is missing', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));

      await expect(videoService.mergeVideos(['input1.mp4', 'input2.mp4'], 'output.mp4'))
        .rejects
        .toThrow('Input file not found');
    });
  });

  describe('streamFile', () => {
    it('should create readable stream for existing file', async () => {
      const mockStream = { pipe: jest.fn() };
      fs1.promises.access.mockResolvedValue(undefined);
      fs1.createReadStream.mockReturnValue(mockStream);

      const result = await videoService.streamFile('test.mp4');
      expect(result).toBe(mockStream);
    });

    it('should throw error for non-existent file', async () => {
      fs1.promises.access.mockRejectedValue(new Error('File not found'));

      await expect(videoService.streamFile('nonexistent.mp4'))
        .rejects
        .toThrow('Error streaming file');
    });
  });

  describe('updateLimits', () => {
    it('should update specified limits only', () => {
      const newLimits = {
        maxDuration: 600,
        maxSize: 2048
      };

      const result = videoService.updateLimits(newLimits);
      
      expect(result.maxDuration).toBe(newLimits.maxDuration);
      expect(result.maxSize).toBe(newLimits.maxSize);
      expect(result.minDuration).toBe(mockLimits.minDuration);
    });

    it('should return current limits when no updates provided', () => {
      const result = videoService.updateLimits({});
      
      expect(result).toEqual(mockLimits);
    });
  });
});