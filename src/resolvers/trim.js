const path = require('path');

module.exports = (context) => ({
    auth: true,
    route: '/trim',
    method: 'post',
    resolver: async (req, res) => {
      try {
        const { videoId, startTime, endTime } = req.body;
        
        if (!videoId || typeof startTime !== 'number' || typeof endTime !== 'number') {
          return res.status(400).json({ error: 'Invalid parameters. Required: videoId, startTime, endTime' });
        }
  
        if (startTime < 0 || endTime <= startTime) {
          return res.status(400).json({ error: 'Invalid time range' });
        }
  
        const video = await context.dal.get(
          'SELECT filename, duration FROM videos WHERE id = ?', 
          [videoId]
        );
        
        if (!video || !video.filename) {
          return res.status(404).json({ error: 'Video not found' });
        }
  
        if (endTime > video.duration) {
          return res.status(400).json({ error: 'End time exceeds video duration' });
        }
        
        const inputPath = path.join(context.VideoService.config.UPLOAD_DIR, video.filename);
        const outputPath = path.join(
          context.VideoService.config.PROCESSED_DIR, 
          `trimmed-${Date.now()}-${video.filename}`
        );
  
        const result = await context.VideoService.trimVideo(inputPath, outputPath, startTime, endTime);
        res.json({
          ...result,
          originalVideo: videoId,
          duration: endTime - startTime
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  });