const { v4: uuidv4 } = require('uuid');
const path = require('path');

module.exports = (context) => ({
  auth: true,
  route: '/merge',
  method: 'post',
  resolver: async (req, res) => {
    try {
      const { videoIds } = req.body;
      
      if (!Array.isArray(videoIds) || videoIds.length < 2) {
        return res.status(400).json({ 
          error: 'At least two video IDs are required for merging' 
        });
      }

      const placeholders = videoIds.map(() => '?').join(',');

      const videos = await context.dal.all(
        `SELECT id, filename, duration FROM videos WHERE id IN (${placeholders})`,
        videoIds
      );

      if (videos.some(v => !v || !v.filename)) {
        return res.status(404).json({ error: 'One or more videos not found' });
      }

      const inputPaths = videos.map(v => 
        path.join(context.VideoService.config.UPLOAD_DIR, v.filename)
      );

      const outputFileName = `merged-${Date.now()}-${uuidv4()}.mp4`;
      const outputPath = path.join(
        context.VideoService.config.PROCESSED_DIR, 
        outputFileName
      );
      
      const result = await context.VideoService.mergeVideos(inputPaths, outputPath);
      
      const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);

      res.json({
        ...result,
        sourceVideos: videoIds,
        totalDuration,
        filename: outputFileName
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
});