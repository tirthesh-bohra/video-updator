const ffmpeg = require('fluent-ffmpeg');

class VideoService {
  static async validateVideo(filePath, limits) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        
        const duration = metadata.format.duration;
        const size = metadata.format.size;
        
        if (size > limits.maxSize) {
          reject(new Error('Video exceeds maximum size limit'));
        }
        
        if (duration < limits.minDuration || duration > limits.maxDuration) {
          reject(new Error('Video duration is outside allowed range'));
        }
        
        resolve({ duration, size });
      });
    });
  }
  
  static async trimVideo(inputPath, outputPath, startTime, endTime) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
  
  static async mergeVideos(inputPaths, outputPath) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      inputPaths.forEach(path => {
        command.input(path);
      });
      
      command
        .on('end', resolve)
        .on('error', reject)
        .mergeToFile(outputPath);
    });
  }
};

module.exports = VideoService;