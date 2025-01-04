const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs/promises');
const fs1 = require('fs');
const path = require('path');
const which = require('which');

class VideoService {
  constructor(limits, config) {
    this.maxDuration = limits.maxDuration;
    this.maxSize = limits.maxSize;
    this.minDuration = limits.minDuration;
    this.config = config;
    this.setupFFmpeg();
  }

  setupFFmpeg() {
    try {
      const ffmpegPath = which.sync('ffmpeg');
      const ffprobePath = which.sync('ffprobe');
      
      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);
    } catch (error) {
      const commonPaths = [
        // Windows paths
        'C:\\Program Files\\ffmpeg\\bin',
        'C:\\ffmpeg\\bin',
        // Unix-like paths
        '/usr/bin',
        '/usr/local/bin',
        '/opt/homebrew/bin',
        path.join(process.env.HOME || '', 'ffmpeg/bin')
      ];

      let found = false;
      for (const basePath of commonPaths) {
        const ffmpegExe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
        const ffprobeExe = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
        
        const ffmpegPath = path.join(basePath, ffmpegExe);
        const ffprobePath = path.join(basePath, ffprobeExe);

        if (fs1.existsSync(ffmpegPath) && fs1.existsSync(ffprobePath)) {
          ffmpeg.setFfmpegPath(ffmpegPath);
          ffmpeg.setFfprobePath(ffprobePath);
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error('FFmpeg binaries not found. Please ensure FFmpeg is installed and accessible.');
      }
    }
  }

  getLimits() {
    return {
      maxDuration: this.maxDuration,
      maxSize: this.maxSize,
      minDuration: this.minDuration
    };
  }

  async initialize() {
    await Promise.all([
      fs.mkdir(this.config.UPLOAD_DIR, { recursive: true }),
      fs.mkdir(this.config.PROCESSED_DIR, { recursive: true })
    ]);
  }

  async saveFile(file) {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.config.UPLOAD_DIR, filename);
    await fs.copyFile(file.path, filepath);
    await fs.unlink(file.path);
    return { filename, filepath };
  }

  updateLimits(limits) {
    Object.assign(this, {
      maxDuration: limits.maxDuration ?? this.maxDuration,
      minDuration: limits.minDuration ?? this.minDuration,
      maxSize: limits.maxSize ?? this.maxSize
    });

    return this.getLimits();
  }

  async validateVideo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(new Error('Failed to probe video file: ' + err.message));
        }
        
        const duration = metadata.format.duration;
        const size = metadata.format.size;
        
        if (size > this.maxSize) {
          return reject(new Error(`Video exceeds maximum size limit of ${this.maxSize} bytes`));
        }
        
        if (duration < this.minDuration || duration > this.maxDuration) {
          return reject(new Error(
            `Video duration must be between ${this.minDuration} and ${this.maxDuration} seconds`
          ));
        }
        
        resolve({ duration, size });
      });
    });
  }
  
  async trimVideo(inputPath, outputPath, startTime, endTime) {
    if (startTime >= endTime) {
      throw new Error('Start time must be less than end time');
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => resolve({ path: outputPath }))
        .on('error', (err) => reject(new Error('Error trimming video: ' + err.message)))
        .run();
    });
  }
  
  async mergeVideos(inputPaths, outputPath) {
    if (!Array.isArray(inputPaths) || inputPaths.length < 2) {
      throw new Error('At least two input paths are required for merging');
    }

    await Promise.all(
      inputPaths.map(async (path) => {
        if (!await fs.access(path).then(() => true).catch(() => false)) {
          throw new Error(`Input file not found: ${path}`);
        }
      })
    );

    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      inputPaths.forEach(path => {
        command.input(path);
      });
      
      command
        .on('end', () => resolve({ path: outputPath }))
        .on('error', (err) => reject(new Error('Error merging videos: ' + err.message)))
        .mergeToFile(outputPath);
    });
  }

  async streamFile(filePath) {
    try {
      await fs1.promises.access(filePath);
      const stream = fs1.createReadStream(filePath);

      return stream;
    } catch (error) {
      console.error(`Error in streamFile: ${error.message}`);
      throw new Error(`Error streaming file: ${filePath}. ${error.message}`);
    }
  }
}

module.exports = VideoService;