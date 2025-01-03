const path = require('path');

module.exports = (context) => ({
  auth: false,
  route: '/view/:shareId',
  method: 'get',
  resolver: async (req, res) => {
    try {
      const { shareId } = req.params;

      const sharedLink = await context.dal.get(
        'SELECT video_id, expires_at FROM shared_links WHERE id = ?',
        [shareId]
      );

      if (!sharedLink) {
        return res.status(404).json({ error: 'Shared link not found' });
      }

      const expiresAt = new Date(sharedLink.expires_at);
      const now = new Date();

      if (now > expiresAt) {
        await context.dal.run('DELETE FROM shared_links WHERE id = ?', [shareId]);
        return res.status(410).json({ error: 'Shared link has expired' });
      }

      const video = await context.dal.get(
        'SELECT id, filename, duration FROM videos WHERE id = ?',
        [sharedLink.video_id]
      );

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const videoPath = path.join(context.VideoService.config.UPLOAD_DIR, video.filename);
      
      try {
        const stream = await context.VideoService.streamFile(videoPath);

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `inline; filename="${video.filename}"`);
        
        return stream.pipe(res);
      } catch (streamError) {
        console.error('Error streaming video:', streamError);
        return res.status(500).json({ error: 'Failed to stream video' });
      }
    } catch (error) {
      console.error('Route error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
});