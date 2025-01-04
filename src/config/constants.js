const path = require('path');

const STORAGE_CONFIG = {
  UPLOAD_DIR: path.join(__dirname, '../../uploads'),
  PROCESSED_DIR: path.join(__dirname, '../../processed'),
  ALLOWED_TYPES: ['.mp4', '.avi', '.mov'],
  MAX_VIDEO_SIZE: 25 * 1024 * 1024,
  MIN_VIDEO_DURATION: 4,
  MAX_VIDEO_DURATION: 300
};

module.exports = { STORAGE_CONFIG };